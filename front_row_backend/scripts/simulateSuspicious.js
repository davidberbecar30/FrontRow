#!/usr/bin/env node
/**
 * simulateSuspicious.js
 *
 * Simulates three kinds of suspicious behaviour against a running FrontRow
 * backend so you can demonstrate the detection + AI narrative pipeline live
 * during the Gold Challenge presentation.
 *
 * Scenarios
 * ─────────
 *  1. RATE SPIKE        — fires 35 GET /events requests in < 10 s as a
 *                         regular user, triggering the rate-spike detector
 *                         (threshold: 30 / 10 s).
 *
 *  2. PRIVILEGE PROBE   — the same regular user attempts POST /events and
 *                         DELETE /events/1, both admin-only operations,
 *                         triggering the privilege-probe detector.
 *
 *  3. TOXIC CHAT        — sends a message that the AI toxicity classifier
 *                         should flag and block, then a safe message that
 *                         should pass through.
 *
 * Usage
 * ─────
 *   node scripts/simulateSuspicious.js [baseUrl] [email] [password]
 *
 *   Defaults:
 *     baseUrl  = https://localhost:3000
 *     email    = sim-bot@frontrow.dev
 *     password = SimBot123!
 *
 * The script auto-registers the bot user if it does not exist yet.
 * After running, open Admin → Observations to see the flagged entries and
 * (a few seconds later) the AI-generated narratives.
 */

// Node 18+ has fetch built-in; older versions need node-fetch.
const https = require('https')

const BASE    = process.argv[2] || 'https://localhost:3000'
const EMAIL   = process.argv[3] || 'sim-bot@frontrow.dev'
const PASS    = process.argv[4] || 'SimBot123!'

// Trust self-signed certs in dev
const agent = new https.Agent({ rejectUnauthorized: false })

// ── helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
    return new Promise(res => setTimeout(res, ms))
}

async function api(path, options = {}, token = null) {
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) }
    if (token) headers['Authorization'] = `Bearer ${token}`

    const res = await fetch(`${BASE}${path}`, {
        ...options,
        headers,
        dispatcher: undefined,   // node-fetch compat
        // Attach the custom https.Agent to bypass self-signed cert errors
        ...(BASE.startsWith('https') ? { agent } : {})
    })

    let body
    try { body = await res.json() } catch { body = {} }
    return { status: res.status, ok: res.ok, body }
}

function ok(label, status) {
    console.log(`  ✅  ${label} — HTTP ${status}`)
}
function blocked(label, status, msg) {
    console.log(`  🚫  ${label} — HTTP ${status} (${msg?.slice(0, 80)})`)
}
function flagged(label) {
    console.log(`  🚨  ${label}`)
}
function info(msg) {
    console.log(`  ℹ️   ${msg}`)
}

// ── 0. Register + log in ──────────────────────────────────────────────────────

async function getToken() {
    // Try logging in first
    let r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: EMAIL, password: PASS })
    })

    if (r.ok) {
        info(`Logged in as ${EMAIL}`)
        return r.body.token
    }

    // Not found → register
    r = await api('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
            firstName: 'Sim',
            lastName:  'Bot',
            email:     EMAIL,
            password:  PASS,
            dateOfBirth: '2000-01-01'
        })
    })

    if (!r.ok) {
        console.error('❌  Could not register bot user:', r.body)
        process.exit(1)
    }
    info(`Registered new bot user: ${EMAIL}`)

    // Now log in
    r = await api('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: EMAIL, password: PASS })
    })

    if (!r.ok) {
        console.error('❌  Login failed after registration:', r.body)
        process.exit(1)
    }

    info(`Logged in as ${EMAIL}`)
    return r.body.token
}

// ── scenario 1: rate spike ────────────────────────────────────────────────────

async function runRateSpike(token) {
    console.log('\n📈  SCENARIO 1 — Rate Spike')
    console.log('    Firing 35 × GET /events in rapid succession…')

    const requests = []
    for (let i = 0; i < 35; i++) {
        requests.push(api('/events', {}, token))
    }
    const results = await Promise.all(requests)

    const successes = results.filter(r => r.ok).length
    info(`${successes}/35 requests succeeded`)
    flagged('Rate-spike detector should fire (35 > 30 threshold in 10 s)')
}

// ── scenario 2: privilege probe ───────────────────────────────────────────────

async function runPrivilegeProbe(token) {
    console.log('\n🔐  SCENARIO 2 — Privilege Probe')

    // POST /events — create event (requires events.create, admin/moderator only)
    let r = await api('/events', {
        method: 'POST',
        body: JSON.stringify({
            title: 'Hacked Event', description: 'Bot injection', category: 'Test',
            price: 0, availableTickets: 1
        })
    }, token)
    if (r.ok) ok('POST /events (should have been blocked)', r.status)
    else blocked('POST /events', r.status, r.body.error)

    // DELETE /events/1 — admin-only
    r = await api('/events/1', { method: 'DELETE' }, token)
    if (r.ok) ok('DELETE /events/1 (should have been blocked)', r.status)
    else blocked('DELETE /events/1', r.status, r.body.error)

    // PUT /events/1 — admin/moderator only
    r = await api('/events/1', {
        method: 'PUT',
        body: JSON.stringify({ title: 'Tampered' })
    }, token)
    if (r.ok) ok('PUT /events/1 (should have been blocked)', r.status)
    else blocked('PUT /events/1', r.status, r.body.error)

    flagged('Privilege-probe detector should fire for each attempt above')
}

// ── scenario 3: toxic chat ────────────────────────────────────────────────────

async function runToxicChat(token) {
    console.log('\n💬  SCENARIO 3 — AI Chat Moderation')

    const toxicMessages = [
        'I hate you, you are disgusting and I hope you die.',
        'You are a worthless piece of garbage, go kill yourself.',
    ]
    const safeMessages = [
        'Has anyone been to the Drake concert before? Was it good?',
        'Looking forward to the game on Friday!',
    ]

    console.log('    Sending toxic messages (expect 400 blocks):')
    for (const text of toxicMessages) {
        const r = await api('/chat', {
            method: 'POST',
            body: JSON.stringify({ from: EMAIL, fromName: 'Sim Bot', text, room: 'lobby' })
        }, token)
        if (r.ok) {
            ok(`  PASSED (unexpected) — "${text.slice(0, 40)}…"`, r.status)
        } else {
            blocked(`  BLOCKED — "${text.slice(0, 40)}…"`, r.status, r.body.error)
        }
    }

    console.log('    Sending safe messages (expect 201 success):')
    for (const text of safeMessages) {
        const r = await api('/chat', {
            method: 'POST',
            body: JSON.stringify({ from: EMAIL, fromName: 'Sim Bot', text, room: 'lobby' })
        }, token)
        if (r.ok) {
            ok(`  ALLOWED — "${text.slice(0, 50)}"`, r.status)
        } else {
            blocked(`  BLOCKED (unexpected) — "${text.slice(0, 50)}"`, r.status, r.body.error)
        }
    }
}

// ── main ──────────────────────────────────────────────────────────────────────

async function main() {
    console.log('╔══════════════════════════════════════════════════╗')
    console.log('║   FrontRow — Suspicious Behaviour Simulator      ║')
    console.log('╚══════════════════════════════════════════════════╝')
    console.log(`Target: ${BASE}`)
    console.log(`Bot:    ${EMAIL}\n`)

    const token = await getToken()

    await runRateSpike(token)
    await sleep(500)   // brief pause between scenarios

    await runPrivilegeProbe(token)
    await sleep(500)

    await runToxicChat(token)

    console.log('\n✅  Simulation complete.')
    console.log('   Open Admin → 👁 Observations to see the flagged entries.')
    console.log('   Wait ~5 s then Refresh to see AI-generated narratives.\n')
}

main().catch(err => {
    console.error('Fatal error:', err)
    process.exit(1)
})
