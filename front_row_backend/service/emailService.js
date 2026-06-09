const https = require('https')

/**
 * emailService.js — Brevo (formerly Sendinblue) HTTP API
 *
 * Uses HTTPS (port 443) instead of SMTP, so it works on all cloud
 * platforms (Render, Railway, Heroku, etc.) that block outbound SMTP.
 *
 * Required env vars:
 *   BREVO_API_KEY      — from brevo.com → SMTP & API → API Keys
 *   BREVO_SENDER_EMAIL — verified sender address on Brevo
 */

function brevoRequest(body) {
    const apiKey = process.env.BREVO_API_KEY
    const payload = JSON.stringify(body)

    return new Promise((resolve, reject) => {
        const req = https.request(
            {
                hostname: 'api.brevo.com',
                path:     '/v3/smtp/email',
                method:   'POST',
                headers: {
                    'accept':         'application/json',
                    'api-key':        apiKey,
                    'content-type':   'application/json',
                    'content-length': Buffer.byteLength(payload)
                },
                timeout: 12_000
            },
            (res) => {
                let data = ''
                res.on('data', chunk => { data += chunk })
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(JSON.parse(data || '{}'))
                    } else {
                        reject(new Error(`Brevo error ${res.statusCode}: ${data}`))
                    }
                })
            }
        )
        req.on('error',   reject)
        req.on('timeout', () => { req.destroy(); reject(new Error('Brevo request timed out')) })
        req.write(payload)
        req.end()
    })
}

// Gmail fallback for local dev (Nodemailer)
let _gmailTransporter = null
function getGmailTransporter() {
    if (_gmailTransporter) return _gmailTransporter
    const user = process.env.GMAIL_EMAIL
    const pass = process.env.GMAIL_PASSWORD
    if (!user || !pass) return null
    const nodemailer = require('nodemailer')
    _gmailTransporter = nodemailer.createTransport({
        host: 'smtp.gmail.com', port: 587, secure: false,
        auth: { user, pass },
        connectionTimeout: 8_000, greetingTimeout: 8_000, socketTimeout: 10_000
    })
    return _gmailTransporter
}

async function sendEmail({ to, subject, text, html }) {
    const brevoKey    = process.env.BREVO_API_KEY
    const brevoSender = process.env.BREVO_SENDER_EMAIL

    // ── Production: Brevo HTTPS API ──────────────────────────────────────────
    if (brevoKey && brevoSender) {
        const result = await brevoRequest({
            sender:      { name: 'FrontRow', email: brevoSender },
            to:          [{ email: to }],
            subject,
            textContent: text,
            htmlContent: html
        })
        console.log(`[emailService] Brevo → ${to} (${result.messageId})`)
        return true
    }

    // ── Local dev: Gmail SMTP ─────────────────────────────────────────────────
    const gmail = getGmailTransporter()
    if (gmail) {
        const sendPromise  = gmail.sendMail({ from: `"FrontRow" <${process.env.GMAIL_EMAIL}>`, to, subject, text, html })
        const timeoutPromise = new Promise((_, rej) => setTimeout(() => rej(new Error('Gmail timed out')), 12_000))
        const info = await Promise.race([sendPromise, timeoutPromise])
        console.log(`[emailService] Gmail → ${to} (${info.messageId})`)
        return true
    }

    // ── No credentials — log to console ──────────────────────────────────────
    console.log(`\n[EMAIL — no credentials] To: ${to} | Subject: ${subject}\n${text}`)
    return true
}

async function sendLoginCode(email, code) {
    const subject = 'Your FrontRow Login Code'
    const text = [
        `Hello,`, ``,
        `Your FrontRow login verification code is:`, ``,
        `   ${code}`, ``,
        `This code expires in 5 minutes.`, ``,
        `If you did not attempt to log in, please ignore this email.`, ``
    ].join('\n')

    const html = [
        `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">`,
        `  <h2 style="color: #333;">FrontRow Login Code</h2>`,
        `  <p style="color: #555; font-size: 15px;">Your login verification code is:</p>`,
        `  <div style="text-align: center; margin: 24px 0;">`,
        `    <span style="display: inline-block; font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 12px 24px; background: #6C5CE7; color: #fff; border-radius: 6px;">${code}</span>`,
        `  </div>`,
        `  <p style="color: #888; font-size: 13px;">This code expires in 5 minutes.</p>`,
        `  <hr style="border: none; border-top: 1px solid #ddd;" />`,
        `  <p style="color: #aaa; font-size: 12px;">If you did not attempt to log in, please ignore this email.</p>`,
        `</div>`
    ].join('\n')

    return sendEmail({ to: email, subject, text, html })
}

async function sendPasswordResetEmail(email, resetLink) {
    const subject = 'Reset Your FrontRow Password'
    const text = [
        `Hello,`, ``,
        `A password reset was requested for your FrontRow account.`, ``,
        `Click the link below to reset your password:`, ``,
        `   ${resetLink}`, ``,
        `This link expires in 60 minutes.`, ``,
        `If you did not request a password reset, please ignore this email.`, ``
    ].join('\n')

    const html = [
        `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">`,
        `  <h2 style="color: #333;">Reset Your FrontRow Password</h2>`,
        `  <p style="color: #555; font-size: 15px;">A password reset was requested for your account.</p>`,
        `  <p style="color: #555; font-size: 15px;">Click the button below to set a new password:</p>`,
        `  <div style="text-align: center; margin: 24px 0;">`,
        `    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: #6C5CE7; color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;">Reset Password</a>`,
        `  </div>`,
        `  <p style="color: #888; font-size: 13px;">This link expires in 60 minutes.</p>`,
        `  <hr style="border: none; border-top: 1px solid #ddd;" />`,
        `  <p style="color: #aaa; font-size: 12px;">If you did not request this, please ignore this email.</p>`,
        `</div>`
    ].join('\n')

    return sendEmail({ to: email, subject, text, html })
}

module.exports = { sendEmail, sendLoginCode, sendPasswordResetEmail }
