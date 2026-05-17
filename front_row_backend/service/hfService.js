/**
 * hfService.js
 *
 * Uses the official @huggingface/inference SDK so the correct API format
 * is always used — no manual URL construction that can break when HF
 * updates their endpoints.
 *
 * classifyToxicity(text)
 *   Zero-shot classification against ["toxic and harmful", "safe and appropriate"].
 *   Returns { label: 'toxic'|'non-toxic', score: 0-1 } or null.
 *
 * generateBehaviorNarrative(recentLogs, detectedReason)
 *   Zero-shot classification of the attack pattern against a set of
 *   descriptive labels.  The top result is formatted into a readable sentence.
 *   Returns a string or null on failure.
 *
 * Both functions are async and return null on any error — callers must
 * never block a request on them.
 */

const { HfInference } = require('@huggingface/inference')

// Client is created once at module load; safe to reuse across requests.
let _client = null
function getClient() {
    const token = process.env.HF_API_TOKEN
    if (!token) return null
    if (!_client) _client = new HfInference(token)
    return _client
}

// Model used for both features — large NLI model, reliably served on free tier.
const ZSC_MODEL = 'facebook/bart-large-mnli'

// ── Concurrency lock ──────────────────────────────────────────────────────────
// HuggingFace free tier throttles concurrent requests, so we serialise all
// zero-shot calls.  The lock is a promise-chain: each call waits for the
// previous one to finish before starting.
let _lastCall = Promise.resolve()

// ── shared zero-shot helper ───────────────────────────────────────────────────

async function zeroShot(text, candidateLabels, timeoutMs = 30_000) {
    const client = getClient()
    if (!client) {
        console.warn('[HF] HF_API_TOKEN not set — skipping AI call')
        return null
    }

    // Serialise via the concurrency lock
    return new Promise((resolve) => {
        _lastCall = _lastCall.then(async () => {
            try {
                const promise = client.zeroShotClassification({
                    model:  ZSC_MODEL,
                    inputs: text,
                    parameters: { candidate_labels: candidateLabels }
                })

                // Race against a timeout so a slow/cold model never blocks the server
                const result = await Promise.race([
                    promise,
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('HF timeout')), timeoutMs)
                    )
                ])

                // Normalise SDK response to { labels: string[], scores: number[] }
                //   SDK v4 returns     [{ label, score }, ...]
                //   Older versions return [{ labels: [...], scores: [...] }]
                const normalised = normaliseResult(result)
                if (!normalised) {
                    resolve(null)
                    return
                }
                resolve(normalised)
            } catch (err) {
                console.warn('[HF] zeroShot error:', err.message)
                resolve(null)
            }
        })
    })
}

/**
 * Normalise the HF zero-shot response to { labels: string[], scores: number[] }.
 * Handles both old and new SDK response shapes.
 */
function normaliseResult(result) {
    if (!Array.isArray(result) || result.length === 0) return null

    // Old format: [{ labels: [...], scores: [...] }, ...]
    if (Array.isArray(result[0]?.labels) && Array.isArray(result[0]?.scores)) {
        return { labels: result[0].labels, scores: result[0].scores }
    }

    // New format (SDK v4): [{ label, score }, ...]
    if (typeof result[0]?.label === 'string' && typeof result[0]?.score === 'number') {
        return {
            labels: result.map(r => r.label),
            scores: result.map(r => r.score)
        }
    }

    return null
}

// ── public API ────────────────────────────────────────────────────────────────

/**
 * Classify whether text is toxic.
 * Returns { label: 'toxic'|'non-toxic', score: 0-1 } or null on failure.
 */
async function classifyToxicity(text) {
    const result = await zeroShot(text, ['toxic and harmful', 'safe and appropriate'])
    if (!result) return null

    const toxicIdx  = result.labels.indexOf('toxic and harmful')
    const topLabel  = result.labels[0]
    const topScore  = result.scores[0]
    const isToxic   = topLabel === 'toxic and harmful'
    const toxicScore = toxicIdx >= 0 ? result.scores[toxicIdx] : (isToxic ? topScore : 1 - topScore)

    return { label: isToxic ? 'toxic' : 'non-toxic', score: toxicScore }
}

/**
 * Classify the suspicious behaviour pattern and return a readable narrative.
 * Called asynchronously — never blocks a request.
 * Returns a string or null on failure.
 */
async function generateBehaviorNarrative(recentLogs, detectedReason) {
    const pathSummary = recentLogs
        .slice(-10)
        .map(l => `${l.method} ${l.path}`)
        .join(', ')

    const inputText =
        `Suspicious user behaviour detected. ` +
        `Rule triggered: "${detectedReason}". ` +
        `Recent API calls: ${pathSummary || 'unknown'}.`

    const attackTypes = [
        'automated bot flooding the API with excessive requests',
        'non-admin user attempting to access admin-only resources',
        'user probing the system for security vulnerabilities',
        'credential stuffing or brute-force login attempt',
        'unusual data harvesting or scraping behaviour'
    ]

    const result = await zeroShot(inputText, attackTypes)
    if (!result) return null

    const topLabel   = result.labels[0]
    const confidence = Math.round(result.scores[0] * 100)
    return `AI (${confidence}% confidence): This user appears to be ${topLabel}.`
}

module.exports = { classifyToxicity, generateBehaviorNarrative }
