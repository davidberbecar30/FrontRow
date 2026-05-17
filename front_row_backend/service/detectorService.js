const RATE_WINDOW_MS = 10_000   
const RATE_THRESHOLD = 30  

// Patterns of routes that only admins should be hitting.
// If a non-admin matches one, it's privilege probing.
const ADMIN_PATTERNS = [
    { method: 'POST',   regex: /^\/events\/?$/                  },   // create event
    { method: 'PUT',    regex: /^\/events\/\d+\/?$/             },   // update event
    { method: 'DELETE', regex: /^\/events\/\d+\/?$/             },   // delete event
    { method: 'POST',   regex: /^\/events\/\d+\/tickets\/?$/    },   // add ticket
    { method: 'PUT',    regex: /^\/tickets\/\d+\/?$/            },   // update ticket
    { method: 'DELETE', regex: /^\/tickets\/\d+\/?$/            }    // delete ticket
]

function isAdminEndpoint(method, path) {
    return ADMIN_PATTERNS.some(p => p.method === method && p.regex.test(path))
}



function detectRateSpike(req, recentLogs) {
    const cutoff = Date.now() - RATE_WINDOW_MS
    const count = recentLogs.filter(l => new Date(l.createdAt).getTime() > cutoff).length
    if (count > RATE_THRESHOLD) {
        return `Excessive request rate (${count} actions in ${RATE_WINDOW_MS / 1000}s)`
    }
    return null
}

function detectPrivilegeProbe(req, recentLogs) {
    if (req.user.role === 'admin') return null
    if (isAdminEndpoint(req.method, req.path)) {
        return `Privilege probing: ${req.method} ${req.path} (admin-only) by role "${req.user.role}"`
    }
    return null
}

const DETECTORS = [detectRateSpike, detectPrivilegeProbe]



function runDetectors(req, recentLogs) {
    const reasons = []
    for (const detect of DETECTORS) {
        const reason = detect(req, recentLogs)
        if (reason) reasons.push(reason)
    }
    return reasons
}

module.exports = { runDetectors, isAdminEndpoint }
