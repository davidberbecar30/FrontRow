/**
 * FrontRow — Product Presentation (12 slides, 16:9, dark brand theme)
 * Run:    npm install pptxgenjs && node frontrow-presentation.js
 * Output: FrontRow-Presentation.pptx
 */

const pptxgen = require('pptxgenjs')
const pres = new pptxgen()
pres.layout = 'LAYOUT_16x9'           // 10 x 5.625 in
pres.title  = 'FrontRow — Product Presentation'
pres.author = 'FrontRow'

// ── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg:       '0D0B1E',
  card:     '1A1535',
  cardMid:  '221D42',
  purple:   '6C5CE7',
  purpleL:  'A29BFE',
  pink:     'E84393',
  text:     'E8E4F9',
  muted:    '8892A4',
  green:    '00B894',
  white:    'FFFFFF',
}
const FONT = 'Calibri'

// Geometry constants — identical on every content slide
const MX = 0.55          // left/right margin
const CW = 10 - 2 * MX   // content width (8.9)

// ── Helpers ──────────────────────────────────────────────────────────────────
function newSlide() {
  const s = pres.addSlide()
  s.background = { color: C.bg }
  return s
}

// Section label + title + purple accent bar (identical placement everywhere)
function header(s, sectionLabel, titleText) {
  s.addText(sectionLabel.toUpperCase(), {
    x: MX, y: 0.30, w: CW, h: 0.26,
    fontFace: FONT, fontSize: 13, bold: true,
    color: C.purpleL, charSpacing: 4, margin: 0,
  })
  s.addText(titleText, {
    x: MX, y: 0.56, w: CW, h: 0.58,
    fontFace: FONT, fontSize: 31, bold: true,
    color: C.white, margin: 0,
  })
  s.addShape(pres.shapes.RECTANGLE, {
    x: MX, y: 1.20, w: 1.15, h: 0.08,
    fill: { color: C.purple }, line: { type: 'none' },
  })
}

function card(s, x, y, w, h, color = C.card) {
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x, y, w, h,
    fill: { color }, line: { color: '2A2050', width: 1 },
    rectRadius: 0.07,
  })
}

function accent(s, x, y, w, color = C.purple) {
  s.addShape(pres.shapes.RECTANGLE, {
    x, y, w, h: 0.06,
    fill: { color }, line: { type: 'none' },
  })
}

function dot(s, x, y, color = C.purple) {
  s.addShape(pres.shapes.OVAL, {
    x, y, w: 0.09, h: 0.09,
    fill: { color }, line: { type: 'none' },
  })
}

// ── Slide 1 — Title ──────────────────────────────────────────────────────────
{
  const s = newSlide()

  // Flat corner accents
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.10, fill: { color: C.purple }, line: { type: 'none' } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.525, w: 10, h: 0.10, fill: { color: C.purple }, line: { type: 'none' } })

  // Wordmark — bold italic, white "Front" + purple "Row"
  s.addText([
    { text: 'Front', options: { color: C.white } },
    { text: 'Row',   options: { color: C.purple } },
  ], {
    x: 0.55, y: 1.35, w: 8.9, h: 1.25,
    fontFace: FONT, fontSize: 66, bold: true, italic: true,
    align: 'center', margin: 0,
  })

  s.addText('Your front row seats to the best events.', {
    x: 0.55, y: 2.70, w: 8.9, h: 0.45,
    fontFace: FONT, fontSize: 20, italic: true,
    color: C.purpleL, align: 'center', margin: 0,
  })

  s.addText('Event discovery & ticketing platform — discover concerts, festivals and live events,\nbook instantly, check in with a QR code.', {
    x: 1.3, y: 3.35, w: 7.4, h: 0.70,
    fontFace: FONT, fontSize: 13,
    color: C.muted, align: 'center', margin: 0,
  })

  // Divider + presenter placeholder
  s.addShape(pres.shapes.LINE, {
    x: 4.4, y: 4.35, w: 1.2, h: 0,
    line: { color: C.purple, width: 1.5 },
  })
  s.addText('[Presenter name]   ·   June 2026', {
    x: 0.55, y: 4.55, w: 8.9, h: 0.32,
    fontFace: FONT, fontSize: 12,
    color: C.muted, align: 'center', margin: 0,
  })
}

// ── Slide 2 — The problem ────────────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'The problem', 'Events Are Easy to Love, Hard to Run')

  const cards = [
    ['Fragmented discovery',  'Events are scattered across sites and feeds — easy to miss, hard to compare.'],
    ['Fraud-prone ticketing', 'Paper tickets and screenshots are forgeable and clunky at the door.'],
    ['Zero guidance after buying', 'What to wear, what is happening — attendees are on their own.'],
    ['Organizers fly blind',  'No live view of sales, revenue or abusive behavior.'],
  ]
  cards.forEach(([t, d], i) => {
    const x = MX + (i % 2) * (4.35 + 0.20)
    const y = 1.50 + Math.floor(i / 2) * (1.82 + 0.20)
    card(s, x, y, 4.35, 1.82)
    accent(s, x + 0.25, y + 0.30, 0.45)
    s.addText(t, {
      x: x + 0.25, y: y + 0.48, w: 3.85, h: 0.34,
      fontFace: FONT, fontSize: 16, bold: true, color: C.purpleL, margin: 0,
    })
    s.addText(d, {
      x: x + 0.25, y: y + 0.88, w: 3.85, h: 0.75,
      fontFace: FONT, fontSize: 11.5, color: C.text, margin: 0,
    })
  })
}

// ── Slide 3 — The solution ───────────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'The solution', 'One Platform for the Whole Event Lifecycle')

  s.addText('FrontRow is a full-stack platform covering the entire journey — for attendees and organizers alike.', {
    x: MX, y: 1.55, w: CW, h: 0.40,
    fontFace: FONT, fontSize: 14, color: C.text, margin: 0,
  })

  const steps = [
    ['Discover', 'search & filters'],
    ['Book',     'instant tickets'],
    ['Prepare',  'outfits & chat'],
    ['Attend',   'QR check-in'],
    ['Analyze',  'revenue & stats'],
  ]
  const bw = 1.54, gap = 0.30
  steps.forEach(([t, d], i) => {
    const x = MX + i * (bw + gap)
    card(s, x, 2.55, bw, 1.55, C.card)
    accent(s, x, 2.55, bw)
    s.addText(String(i + 1), {
      x: x + 0.12, y: 2.72, w: 0.5, h: 0.30,
      fontFace: FONT, fontSize: 13, bold: true, color: C.purple, margin: 0,
    })
    s.addText(t, {
      x: x + 0.05, y: 3.05, w: bw - 0.1, h: 0.32,
      fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: 'center', margin: 0,
    })
    s.addText(d, {
      x: x + 0.05, y: 3.40, w: bw - 0.1, h: 0.45,
      fontFace: FONT, fontSize: 10.5, color: C.muted, align: 'center', margin: 0,
    })
    if (i < steps.length - 1) {
      s.addText('→', {
        x: x + bw - 0.02, y: 3.05, w: gap + 0.06, h: 0.35,
        fontFace: FONT, fontSize: 16, bold: true, color: C.purple, align: 'center', margin: 0,
      })
    }
  })

  s.addText('Every step lives in the same product — one account, one source of truth.', {
    x: MX, y: 4.55, w: CW, h: 0.35,
    fontFace: FONT, fontSize: 12, italic: true, color: C.muted, align: 'center', margin: 0,
  })
}

// ── Slide 4 — Product overview ───────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Product overview', 'Two Sides, One Platform')

  const cols = [
    {
      x: MX, title: 'For attendees',
      items: ['Browse & search events', 'Instant ticket purchase', 'Personal favorites',
              'QR tickets in "My Tickets"', 'AI outfit suggestions', 'Live community chat',
              'Public event statistics'],
    },
    {
      x: MX + 4.55, title: 'For organizers & admins',
      items: ['Event & ticket management', 'QR check-in scanner', 'Revenue dashboard',
              'Security observations & audit log'],
    },
  ]
  cols.forEach(col => {
    card(s, col.x, 1.50, 4.35, 3.72)
    s.addText(col.title, {
      x: col.x + 0.25, y: 1.70, w: 3.85, h: 0.36,
      fontFace: FONT, fontSize: 17, bold: true, color: C.purpleL, margin: 0,
    })
    col.items.forEach((it, i) => {
      const y = 2.22 + i * 0.42
      dot(s, col.x + 0.27, y + 0.07)
      s.addText(it, {
        x: col.x + 0.50, y, w: 3.6, h: 0.34,
        fontFace: FONT, fontSize: 12, color: C.text, margin: 0,
      })
    })
  })
}

// ── Slide 5 — Discovery & booking ────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Feature', 'Discovery & Booking')

  const rows = [
    ['Search & filters',  'title, location, date range'],
    ['Fast pagination',   'next page prefetched in the background'],
    ['Multiple dates',    'independent ticket pools per event date'],
    ['Live availability', 'counts synced from real ticket rows'],
    ['One-click actions', 'instant purchase, personal favorites'],
  ]
  rows.forEach(([t, d], i) => {
    const y = 1.55 + i * 0.74
    accent(s, MX, y + 0.10, 0.30)
    s.addText(t, {
      x: MX + 0.45, y, w: 4.1, h: 0.30,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white, margin: 0,
    })
    s.addText(d, {
      x: MX + 0.45, y: y + 0.30, w: 4.1, h: 0.28,
      fontFace: FONT, fontSize: 11, color: C.muted, margin: 0,
    })
  })

  // Flat event-card mock
  const mx = 5.55, my = 1.55, mw = 3.9, mh = 3.65
  card(s, mx, my, mw, mh, C.cardMid)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: mx + 0.25, y: my + 0.25, w: mw - 0.5, h: 1.05,
    fill: { color: C.purple }, line: { type: 'none' }, rectRadius: 0.05,
  })
  s.addText('CONCERT', {
    x: mx + 0.45, y: my + 0.62, w: 2.0, h: 0.30,
    fontFace: FONT, fontSize: 12, bold: true, color: C.white, charSpacing: 3, margin: 0,
  })
  s.addText('Summer Arena Tour', {
    x: mx + 0.25, y: my + 1.45, w: mw - 0.5, h: 0.32,
    fontFace: FONT, fontSize: 15, bold: true, color: C.white, margin: 0,
  })
  s.addText('Bucharest  ·  Jul 12 — Jul 14  ·  from $89', {
    x: mx + 0.25, y: my + 1.78, w: mw - 0.5, h: 0.28,
    fontFace: FONT, fontSize: 11, color: C.muted, margin: 0,
  })
  s.addText('142 tickets available', {
    x: mx + 0.25, y: my + 2.12, w: mw - 0.5, h: 0.28,
    fontFace: FONT, fontSize: 11, bold: true, color: C.green, margin: 0,
  })
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: mx + 0.25, y: my + 2.65, w: 1.7, h: 0.42,
    fill: { color: C.purple }, line: { type: 'none' }, rectRadius: 0.08,
  })
  s.addText('BUY NOW', {
    x: mx + 0.25, y: my + 2.70, w: 1.7, h: 0.34,
    fontFace: FONT, fontSize: 11, bold: true, color: C.white, align: 'center', margin: 0,
  })
  s.addText('Favorite', {
    x: mx + 2.10, y: my + 2.70, w: 1.4, h: 0.34,
    fontFace: FONT, fontSize: 11, bold: true, color: C.purpleL, margin: 0,
  })
  s.addText('Browsing stays instant — the next page is already cached.', {
    x: mx + 0.25, y: my + 3.22, w: mw - 0.5, h: 0.32,
    fontFace: FONT, fontSize: 9.5, italic: true, color: C.muted, margin: 0,
  })
}

// ── Slide 6 — QR ticketing & check-in ────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Feature', 'QR Ticketing & Door Check-In')

  const steps = [
    ['Purchase confirmed',   'a unique check-in code is generated'],
    ['QR everywhere',        'rendered in "My Tickets" and emailed'],
    ['At the door',          'admin uploads or drags a photo of the QR'],
    ['Robust decoding',      'handles rotation and phone-camera quirks'],
    ['First scan wins',      'double check-in is blocked automatically'],
  ]
  steps.forEach(([t, d], i) => {
    const y = 1.55 + i * 0.74
    s.addShape(pres.shapes.OVAL, {
      x: MX, y, w: 0.36, h: 0.36,
      fill: { color: i === 4 ? C.purple : C.cardMid }, line: { color: C.purple, width: 1 },
    })
    s.addText(String(i + 1), {
      x: MX, y: y + 0.04, w: 0.36, h: 0.30,
      fontFace: FONT, fontSize: 12, bold: true, color: C.white, align: 'center', margin: 0,
    })
    s.addText(t, {
      x: MX + 0.55, y, w: 4.0, h: 0.30,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white, margin: 0,
    })
    s.addText(d, {
      x: MX + 0.55, y: y + 0.30, w: 4.0, h: 0.28,
      fontFace: FONT, fontSize: 11, color: C.muted, margin: 0,
    })
  })

  // Flat QR mock
  const qx = 6.05, qy = 1.65, qs = 1.9
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: qx, y: qy, w: qs, h: qs,
    fill: { color: C.white }, line: { type: 'none' }, rectRadius: 0.05,
  })
  const u = (qs - 0.3) / 7
  const pattern = [
    [0,0],[1,0],[2,0],[4,0],[5,0],[6,0],
    [0,1],[2,1],[4,1],[6,1],
    [0,2],[1,2],[2,2],[4,2],[5,2],[6,2],
    [1,4],[3,4],[5,4],
    [0,5],[2,5],[3,5],[4,5],[6,5],
    [0,6],[1,6],[3,6],[5,6],[6,6],
  ]
  pattern.forEach(([cx, cy]) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: qx + 0.15 + cx * u, y: qy + 0.15 + cy * u,
      w: u - 0.02, h: u - 0.02,
      fill: { color: '111111' }, line: { type: 'none' },
    })
  })
  s.addText('One unique code per purchase', {
    x: 5.55, y: 3.70, w: 2.9, h: 0.30,
    fontFace: FONT, fontSize: 11, color: C.muted, align: 'center', margin: 0,
  })

  // Result badges
  card(s, 5.55, 4.20, 2.9, 0.46, C.card)
  accent(s, 5.55, 4.20, 2.9, C.green)
  s.addText('Valid — checked in', {
    x: 5.75, y: 4.30, w: 2.5, h: 0.28,
    fontFace: FONT, fontSize: 11, bold: true, color: C.green, margin: 0,
  })
  card(s, 5.55, 4.80, 2.9, 0.46, C.card)
  accent(s, 5.55, 4.80, 2.9, C.pink)
  s.addText('Already used — rejected', {
    x: 5.75, y: 4.90, w: 2.5, h: 0.28,
    fontFace: FONT, fontSize: 11, bold: true, color: C.pink, margin: 0,
  })
}

// ── Slide 7 — AI inside the product ──────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Feature', 'AI Inside the Product')

  const cards = [
    ['Outfit suggestions', 'Curated looks per event category and style — top and bottom, with images.', 'Shop links: H&M  ·  Zara  ·  ASOS'],
    ['Chat moderation',    'Every message is classified for toxicity before it reaches the room.', 'Blocked above 80% confidence'],
    ['Behavior narratives', 'Plain-language AI explanations of flagged user activity, for admins.', 'Shown in the observation list'],
  ]
  const cw2 = 2.83, gap = 0.205
  cards.forEach(([t, d, f], i) => {
    const x = MX + i * (cw2 + gap)
    card(s, x, 1.55, cw2, 3.30)
    accent(s, x, 1.55, cw2)
    s.addText(t, {
      x: x + 0.20, y: 1.80, w: cw2 - 0.4, h: 0.58,
      fontFace: FONT, fontSize: 16, bold: true, color: C.purpleL, margin: 0,
    })
    s.addText(d, {
      x: x + 0.20, y: 2.45, w: cw2 - 0.4, h: 1.30,
      fontFace: FONT, fontSize: 11.5, color: C.text, margin: 0,
    })
    s.addText(f, {
      x: x + 0.20, y: 4.25, w: cw2 - 0.4, h: 0.45,
      fontFace: FONT, fontSize: 10.5, bold: true, color: C.purple, margin: 0,
    })
  })

  s.addText('Powered by Hugging Face zero-shot inference — graceful fallback when unavailable.', {
    x: MX, y: 5.05, w: CW, h: 0.30,
    fontFace: FONT, fontSize: 11, italic: true, color: C.muted, align: 'center', margin: 0,
  })
}

// ── Slide 8 — Community & insights ───────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Feature', 'Community & Insights')

  const cw2 = 2.83, gap = 0.205
  const cards = [
    ['Live lobby chat',  'Real-time chat over WebSockets, persisted in MongoDB.'],
    ['Event statistics', 'Public dashboard — pie and bar charts of what is happening.'],
    ['Works offline',    'Events cached locally; actions queued and synced when back online.'],
  ]
  cards.forEach(([t, d], i) => {
    const x = MX + i * (cw2 + gap)
    card(s, x, 1.55, cw2, 3.55)
    accent(s, x, 1.55, cw2)
    s.addText(t, {
      x: x + 0.20, y: 1.80, w: cw2 - 0.4, h: 0.36,
      fontFace: FONT, fontSize: 16, bold: true, color: C.purpleL, margin: 0,
    })
    s.addText(d, {
      x: x + 0.20, y: 2.25, w: cw2 - 0.4, h: 0.95,
      fontFace: FONT, fontSize: 11.5, color: C.text, margin: 0,
    })
  })

  // Card 1 visual — chat bubbles
  let bx = MX + 0.20
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx, y: 3.45, w: 1.7, h: 0.40, fill: { color: C.cardMid }, line: { type: 'none' }, rectRadius: 0.12 })
  s.addText('See you at the show', { x: bx + 0.12, y: 3.51, w: 1.55, h: 0.28, fontFace: FONT, fontSize: 9, color: C.text, margin: 0 })
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, { x: bx + 0.7, y: 3.98, w: 1.7, h: 0.40, fill: { color: C.purple }, line: { type: 'none' }, rectRadius: 0.12 })
  s.addText('Front row, obviously', { x: bx + 0.82, y: 4.04, w: 1.55, h: 0.28, fontFace: FONT, fontSize: 9, color: C.white, margin: 0 })

  // Card 2 visual — mini bar chart
  const cx2 = MX + (cw2 + gap) + 0.35
  const bars = [0.45, 0.85, 0.60, 1.05]
  bars.forEach((h, i) => {
    s.addShape(pres.shapes.RECTANGLE, {
      x: cx2 + i * 0.50, y: 4.55 - h, w: 0.32, h,
      fill: { color: i === 3 ? C.purple : C.cardMid }, line: { type: 'none' },
    })
  })

  // Card 3 visual — queue → sync
  const cx3 = MX + 2 * (cw2 + gap) + 0.20
  s.addText('offline action  →  queued  →  synced', {
    x: cx3, y: 3.85, w: cw2 - 0.4, h: 0.30,
    fontFace: FONT, fontSize: 10, color: C.muted, margin: 0,
  })
  s.addShape(pres.shapes.LINE, { x: cx3, y: 4.30, w: 2.4, h: 0, line: { color: C.purple, width: 1.5, dashType: 'dash' } })
  s.addText('no connection required', {
    x: cx3, y: 4.42, w: cw2 - 0.4, h: 0.28,
    fontFace: FONT, fontSize: 9.5, italic: true, color: C.muted, margin: 0,
  })
}

// ── Slide 9 — Security & trust ───────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Feature', 'Security & Trust')

  const cards = [
    ['JWT sessions',     'sliding window + rotating refresh tokens'],
    ['Email 2FA',        'verification code required on registration'],
    ['OAuth sign-in',    'Google and GitHub via Passport'],
    ['Roles & permissions', 'granular access control per endpoint'],
    ['Threat detection', 'rate spikes and privilege probing auto-flagged'],
    ['Audit log + HTTPS', 'every authenticated action recorded'],
  ]
  const cw2 = 2.83, gap = 0.205
  cards.forEach(([t, d], i) => {
    const x = MX + (i % 3) * (cw2 + gap)
    const y = 1.50 + Math.floor(i / 3) * (1.80 + 0.20)
    card(s, x, y, cw2, 1.80)
    accent(s, x + 0.20, y + 0.26, 0.35)
    s.addText(t, {
      x: x + 0.20, y: y + 0.42, w: cw2 - 0.4, h: 0.32,
      fontFace: FONT, fontSize: 14, bold: true, color: C.white, margin: 0,
    })
    s.addText(d, {
      x: x + 0.20, y: y + 0.80, w: cw2 - 0.4, h: 0.80,
      fontFace: FONT, fontSize: 11, color: C.muted, margin: 0,
    })
  })
}

// ── Slide 10 — Admin & organizer tools ───────────────────────────────────────
{
  const s = newSlide()
  header(s, 'For organizers', 'Admin & Organizer Tools')

  const top = [
    ['Revenue dashboard',  'sales, totals and purchase history at a glance'],
    ['Check-in scanner',   'validate tickets at the door in seconds'],
    ['Observations',       'flagged users with AI-written narratives'],
  ]
  const cw2 = 2.83, gap = 0.205
  top.forEach(([t, d], i) => {
    const x = MX + i * (cw2 + gap)
    card(s, x, 1.50, cw2, 1.75)
    accent(s, x, 1.50, cw2)
    s.addText(t, {
      x: x + 0.20, y: 1.74, w: cw2 - 0.4, h: 0.32,
      fontFace: FONT, fontSize: 14, bold: true, color: C.purpleL, margin: 0,
    })
    s.addText(d, {
      x: x + 0.20, y: 2.12, w: cw2 - 0.4, h: 0.85,
      fontFace: FONT, fontSize: 11, color: C.text, margin: 0,
    })
  })

  const bottom = [
    ['Event & ticket management', 'full create / update / delete with server-side validation'],
    ['Demo simulator',            'trigger suspicious behavior live to showcase detection'],
  ]
  bottom.forEach(([t, d], i) => {
    const x = MX + i * (4.35 + 0.20)
    card(s, x, 3.50, 4.35, 1.55)
    accent(s, x, 3.50, 4.35)
    s.addText(t, {
      x: x + 0.25, y: 3.74, w: 3.85, h: 0.32,
      fontFace: FONT, fontSize: 14, bold: true, color: C.purpleL, margin: 0,
    })
    s.addText(d, {
      x: x + 0.25, y: 4.12, w: 3.85, h: 0.70,
      fontFace: FONT, fontSize: 11, color: C.text, margin: 0,
    })
  })
}

// ── Slide 11 — Tech stack ────────────────────────────────────────────────────
{
  const s = newSlide()
  header(s, 'Under the hood', 'Tech Stack')

  const cols = [
    {
      x: MX, title: 'Frontend',
      items: ['React 19 + Vite', 'React Router 7', 'Chart.js visualizations', 'CSS Modules',
              'Tested: Vitest · Testing Library · Playwright'],
    },
    {
      x: MX + 4.55, title: 'Backend',
      items: ['Node.js + Express 5 — layered: routes / controllers / services / repositories',
              'PostgreSQL (Sequelize) · MongoDB for chat & logs',
              'GraphQL alongside REST · WebSockets',
              'Passport (local + OAuth) · Hugging Face inference',
              'Tested: Jest · Supertest'],
    },
  ]
  cols.forEach(col => {
    card(s, col.x, 1.50, 4.35, 3.72)
    s.addText(col.title, {
      x: col.x + 0.25, y: 1.70, w: 3.85, h: 0.36,
      fontFace: FONT, fontSize: 17, bold: true, color: C.purpleL, margin: 0,
    })
    col.items.forEach((it, i) => {
      const y = 2.25 + i * 0.58
      s.addShape(pres.shapes.RECTANGLE, {
        x: col.x + 0.27, y: y + 0.07, w: 0.18, h: 0.05,
        fill: { color: C.purple }, line: { type: 'none' },
      })
      s.addText(it, {
        x: col.x + 0.58, y, w: 3.55, h: 0.55,
        fontFace: FONT, fontSize: 11, color: C.text, margin: 0,
      })
    })
  })
}

// ── Slide 12 — Closing ───────────────────────────────────────────────────────
{
  const s = newSlide()

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.10, fill: { color: C.purple }, line: { type: 'none' } })
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.525, w: 10, h: 0.10, fill: { color: C.purple }, line: { type: 'none' } })

  s.addText([
    { text: 'Front', options: { color: C.white } },
    { text: 'Row',   options: { color: C.purple } },
  ], {
    x: 0.55, y: 1.30, w: 8.9, h: 1.10,
    fontFace: FONT, fontSize: 56, bold: true, italic: true,
    align: 'center', margin: 0,
  })

  s.addText('Your front row seats to the best events.', {
    x: 0.55, y: 2.50, w: 8.9, h: 0.42,
    fontFace: FONT, fontSize: 18, italic: true,
    color: C.purpleL, align: 'center', margin: 0,
  })

  s.addText('Discovery, ticketing, AI guidance and security — one platform.', {
    x: 0.55, y: 3.15, w: 8.9, h: 0.36,
    fontFace: FONT, fontSize: 14, color: C.text, align: 'center', margin: 0,
  })

  // Live demo CTA (the deck's one pink moment)
  s.addShape(pres.shapes.ROUNDED_RECTANGLE, {
    x: 4.05, y: 3.95, w: 1.9, h: 0.55,
    fill: { color: C.pink }, line: { type: 'none' }, rectRadius: 0.12,
  })
  s.addText('Live demo', {
    x: 4.05, y: 4.05, w: 1.9, h: 0.38,
    fontFace: FONT, fontSize: 15, bold: true, color: C.white, align: 'center', margin: 0,
  })
}

// ── Write ────────────────────────────────────────────────────────────────────
pres.writeFile({ fileName: 'FrontRow-Presentation.pptx' })
  .then(() => console.log('FrontRow-Presentation.pptx created'))
  .catch(err => { console.error('Error:', err); process.exit(1) })
