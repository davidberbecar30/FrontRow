/**
 * qrService.js
 *
 * Generates QR codes as base64 PNG data URLs.
 * Uses the 'qrcode' npm package — run: npm install qrcode
 */

const QRCode = require('qrcode')

/**
 * Generate a QR code for a check-in code.
 * Returns a base64 data URL: "data:image/png;base64,..."
 */
async function generateQRDataURL(checkInCode) {
    return QRCode.toDataURL(checkInCode, {
        width: 300,
        margin: 2,
        color: {
            dark:  '#000000',
            light: '#ffffff'
        }
    })
}

/**
 * Generate a QR code as a raw Buffer (PNG bytes).
 * Useful for email inline attachments.
 */
async function generateQRBuffer(checkInCode) {
    return QRCode.toBuffer(checkInCode, {
        width: 300,
        margin: 2
    })
}

module.exports = { generateQRDataURL, generateQRBuffer }
