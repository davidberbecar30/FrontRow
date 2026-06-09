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
        service: 'gmail',
        auth: { user, pass }
    })
    return _transporter
}

async function sendEmail({ to, subject, text, html }) {
    const transporter = getTransporter()

    if (!transporter) {
        console.log(`\n┌─────────────────────────────────────────────`)
        console.log(`│ EMAIL (not sent — GMAIL_EMAIL/GMAIL_PASSWORD not set)`)
        console.log(`│ To: ${to}`)
        console.log(`│ Subject: ${subject}`)
        console.log(`│ ───────────────────────────────────────────`)
        console.log(`│ ${text.replace(/\n/g, '\n│ ')}`)
        console.log(`└─────────────────────────────────────────────\n`)
        return true
    }

    try {
        const info = await transporter.sendMail({
            from: `"FrontRow" <${process.env.GMAIL_EMAIL}>`,
            to,
            subject,
            text,
            html
        })
        console.log(`[emailService] Sent to ${to} — messageId: ${info.messageId}`)
        return true
    } catch (err) {
        console.error(`[emailService] Failed to send to ${to}:`, err.message)
        return false
    }
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
