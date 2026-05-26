
const nodemailer = require('nodemailer')

let transporter = null


const FORWARD_TO = process.env.GMAIL_EMAIL || 'berbecardavid681@gmail.com'


function getTransporter() {
    if (transporter) return transporter

    const gmailUser = process.env.GMAIL_EMAIL
    const gmailPass = process.env.GMAIL_PASSWORD

    if (!gmailUser || !gmailPass) {
        console.warn('[emailService] GMAIL_EMAIL / GMAIL_PASSWORD not set — emails will only be logged to console')
        return null
    }

    transporter = nodemailer.createTransport({
        host: 'smtp-relay.brevo.com',
        port: 587,
        secure: false,
        auth: {
            user: gmailUser,
            pass: gmailPass
        }
    })


    transporter.verify()
        .then(() => console.log('[emailService] Connected to Gmail SMTP'))
        .catch(err => console.warn('[emailService] Gmail SMTP verify failed:', err.message))

    return transporter
}

/**
 * Send an email.
 *
 * @param {Object} opts
 * @param {string} opts.to       - Original intended recipient (logged / included in body)
 * @param {string} opts.subject  - Email subject line
 * @param {string} opts.text     - Plain-text body (required)
 * @param {string} [opts.html]   - Optional HTML body
 * @returns {Promise<boolean>}   - true if sent (or logged), false on failure
 */
async function sendEmail({ to, subject, text, html }) {
    const t = getTransporter()

    if (!t) {
        // Fallback: just log to console (handy for dev / testing)
        console.log(`\n┌─────────────────────────────────────────────`)
        console.log(`│ 📧 EMAIL (not sent — no SMTP credentials)`)
        console.log(`│ Intended for: ${to}`)
        console.log(`│ Subject: ${subject}`)
        console.log(`│ ───────────────────────────────────────────`)
        console.log(`│ ${text.replace(/\n/g, '\n│ ')}`)
        console.log(`└─────────────────────────────────────────────\n`)
        return true
    }

    try {

        const forwardedSubject = `[FrontRow — for ${to}] ${subject}`
        const forwardedText    = ` Originally intended for: ${to}\n\n${text}`
        const forwardedHtml    = html.replace(
            '<div style="font-family:',
            `<p style="color:#888;font-size:13px;"><strong> Originally intended for:</strong> ${to}</p><div style="font-family:`
        )

        const info = await t.sendMail({
            from: `"FrontRow" <${process.env.GMAIL_EMAIL}>`,
            to: FORWARD_TO,
            subject: forwardedSubject,
            text: forwardedText,
            html: forwardedHtml
        })
        console.log(`[emailService] Forwarded to ${FORWARD_TO} (intended: ${to}) — id: ${info.messageId}`)
        return true
    } catch (err) {
        console.error(`[emailService] Failed to forward to ${FORWARD_TO}:`, err.message)
        return false
    }
}

/**
 * Send a 2FA login code.
 */
async function sendLoginCode(email, code) {
    const subject = 'Your FrontRow Login Code'
    const text = [
        `Hello,`,
        ``,
        `Your FrontRow login verification code is:`,
        ``,
        `   ${code}`,
        ``,
        `This code expires in 5 minutes.`,
        ``,
        `If you did not attempt to log in, please ignore this email.`,
        ``
    ].join('\n')

    const html = [
        `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">`,
        `  <h2 style="color: #333;">FrontRow Login Code</h2>`,
        `  <p style="color: #555; font-size: 15px;">Your login verification code is:</p>`,
        `  <div style="text-align: center; margin: 24px 0;">`,
        `    <span style="display: inline-block; font-size: 32px; font-weight: bold; `,
        `                 letter-spacing: 8px; padding: 12px 24px; background: #000; `,
        `                 color: #fff; border-radius: 6px;">${code}</span>`,
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
        `Hello,`,
        ``,
        `A password reset was requested for your FrontRow account.`,
        ``,
        `Click the link below to reset your password:`,
        ``,
        `   ${resetLink}`,
        ``,
        `This link expires in 60 minutes.`,
        ``,
        `If you did not request a password reset, please ignore this email.`,
        ``
    ].join('\n')

    const html = [
        `<div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 24px; background: #f9f9f9; border-radius: 8px;">`,
        `  <h2 style="color: #333;">Reset Your FrontRow Password</h2>`,
        `  <p style="color: #555; font-size: 15px;">A password reset was requested for your account.</p>`,
        `  <p style="color: #555; font-size: 15px;">Click the button below to set a new password:</p>`,
        `  <div style="text-align: center; margin: 24px 0;">`,
        `    <a href="${resetLink}" style="display: inline-block; padding: 14px 32px; background: #000; `,
        `       color: #fff; text-decoration: none; border-radius: 6px; font-size: 16px;">`,
        `      Reset Password`,
        `    </a>`,
        `  </div>`,
        `  <p style="color: #888; font-size: 13px;">This link expires in 60 minutes.</p>`,
        `  <hr style="border: none; border-top: 1px solid #ddd;" />`,
        `  <p style="color: #aaa; font-size: 12px;">If you did not request this, please ignore this email.</p>`,
        `</div>`
    ].join('\n')

    return sendEmail({ to: email, subject, text, html })
}

module.exports = {
    sendEmail,
    sendLoginCode,
    sendPasswordResetEmail
}
