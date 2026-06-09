const nodemailer = require('nodemailer')

// Gmail SMTP transporter — uses the App Password from .env
// (Generate one at: myaccount.google.com → Security → App passwords)
let _transporter = null

function getTransporter() {
    if (_transporter) return _transporter
    const user = process.env.GMAIL_EMAIL
    const pass = process.env.GMAIL_PASSWORD
    if (!user || !pass) return null

    _transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user, pass },
        connectionTimeout: 8_000,   // fail fast if Gmail is unreachable
        greetingTimeout:   8_000,
        socketTimeout:     10_000
    })
    return _transporter
}

const EMAIL_TIMEOUT_MS = 12_000   // hard cap — login must not hang longer than this

async function sendEmail({ to, subject, text, html }) {
    const transporter = getTransporter()

    if (!transporter) {
        console.log(`\n[EMAIL — no credentials] To: ${to} | Subject: ${subject}`)
        console.log(text)
        return true
    }

    // Race the send against a hard timeout so the caller never hangs
    const sendPromise = transporter.sendMail({
        from: `"FrontRow" <${process.env.GMAIL_EMAIL}>`,
        to,
        subject,
        text,
        html
    })

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Email send timed out after 12s')), EMAIL_TIMEOUT_MS)
    )

    const info = await Promise.race([sendPromise, timeoutPromise])
    console.log(`[emailService] Sent to ${to} — messageId: ${info.messageId}`)
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
