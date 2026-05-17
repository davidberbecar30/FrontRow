import { test, expect } from '@playwright/test'

// ─── Helper: generate unique credentials ─────────────────────────
const TEST_PASSWORD = 'Password123!'
const TEST_FIRST_NAME = 'E2E'
const TEST_LAST_NAME = 'User'

function uniqueEmail(prefix = 'e2e') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}@test.com`
}

// ─── Helper: register a fresh user via the UI ────────────────────
async function registerUser(page, { firstName, lastName, email, password } = {}) {
    await page.goto('/register')
    await page.fill('input[placeholder="John"]', firstName || TEST_FIRST_NAME)
    await page.fill('input[placeholder="Doe"]', lastName || TEST_LAST_NAME)
    await page.fill('input[placeholder="Email"]', email || uniqueEmail())
    await page.fill('input[placeholder="Password"]', password || TEST_PASSWORD)
    await page.fill('input[type="date"]', '1990-01-15')
    await page.click('button:has-text("Register")')
    await expect(page).toHaveURL('/events', { timeout: 10000 })
}

// ─── Helper: log in via the UI ───────────────────────────────────
async function loginUser(page, email, password) {
    await page.goto('/login')
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', password)
    // Use button:has-text to avoid ambiguity with the <h2>LOG IN</h2> heading
    await page.click('button:has-text("Log In")')
    await expect(page).toHaveURL(/\/events|\/favorites/, { timeout: 10000 })
}

// ─── Scenario: Full Registration Flow ─────────────────────────────

test('register a new user successfully', async ({ page }) => {
    const email = uniqueEmail()
    await page.goto('/register')

    // Fill in the registration form
    await page.fill('input[placeholder="John"]', TEST_FIRST_NAME)
    await page.fill('input[placeholder="Doe"]', TEST_LAST_NAME)
    await page.fill('input[placeholder="Email"]', email)
    await page.fill('input[placeholder="Password"]', TEST_PASSWORD)
    await page.fill('input[type="date"]', '1990-01-15')

    // Submit
    await page.click('button:has-text("Register")')

    // After successful registration the user should be redirected to /events
    await expect(page).toHaveURL('/events', { timeout: 10000 })

    // Header should show the user's name and role
    await expect(page.getByText(`Hi, ${TEST_FIRST_NAME}`)).toBeVisible()
})

// ─── Scenario: Full Login Flow ────────────────────────────────────

test('login with valid credentials', async ({ page }) => {
    const email = uniqueEmail('login')

    // First register a user so we have credentials to log in with
    await registerUser(page, { email })

    // Logout first
    await page.getByAltText('Logout').click()
    await expect(page).toHaveURL('/login')

    // Now log in again
    await loginUser(page, email, TEST_PASSWORD)

    // Header should show user info
    await expect(page.getByText(`Hi, ${TEST_FIRST_NAME}`)).toBeVisible()
})

test('login with wrong password shows error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'nonexistent@test.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button:has-text("Log In")')

    // Should show an error message from the server.
    // The backend returns: { message: "Invalid credentials" }
    // authAPI.postJSON throws with data.message, and LoginView displays it
    await expect(page.locator('text=Invalid credentials')).toBeVisible({ timeout: 10000 })
})

// ─── Scenario: Logout Flow ────────────────────────────────────────

test('user can log out', async ({ page }) => {
    const email = uniqueEmail('logout')

    // Register and login first
    await registerUser(page, { email, firstName: 'Logout' })

    // Verify logged in state
    await expect(page.getByText('Hi, Logout')).toBeVisible()

    // Click logout
    await page.getByAltText('Logout').click()
    await expect(page).toHaveURL('/login')

    // On the /login page, the LoginView is rendered (Header is not shown on LoginView).
    // Verify we see the login UI (the login form, not the Header buttons)
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
})

// ─── Scenario: Route Protection ───────────────────────────────────

test('protected route redirects unauthenticated user to login', async ({ page }) => {
    // Try to access /favorites without logging in
    await page.goto('/favorites')
    await expect(page).toHaveURL('/login')
})

test('protected chat route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/chat')
    await expect(page).toHaveURL('/login')
})

test('protected add-event route redirects unauthenticated user to login', async ({ page }) => {
    await page.goto('/events/add')
    await expect(page).toHaveURL('/login')
})

// ─── Scenario: Post-Login Redirect ────────────────────────────────

test('after login, user is redirected back to originally requested page', async ({ page }) => {
    const email = uniqueEmail('redirect')

    // Register a user first
    await registerUser(page, { email, firstName: 'Redirect' })

    // Logout
    await page.getByAltText('Logout').click()
    await expect(page).toHaveURL('/login')

    // Try to access /favorites — should redirect to /login
    await page.goto('/favorites')
    await expect(page).toHaveURL('/login')

    // Log in — should be redirected back to /favorites (not /events)
    await page.fill('input[type="email"]', email)
    await page.fill('input[type="password"]', TEST_PASSWORD)
    await page.click('button:has-text("Log In")')
    await expect(page).toHaveURL('/favorites', { timeout: 10000 })
})

// ─── Scenario: Authenticated User Can Access Protected Routes ─────

test('authenticated user can access favorites page', async ({ page }) => {
    const email = uniqueEmail('auth')

    // Register first
    await registerUser(page, { email, firstName: 'Auth' })

    // Navigate to favorites — should work
    await page.getByAltText('Favorites').click()
    await expect(page).toHaveURL('/favorites')
})

// ─── Scenario: Login Form Validation ──────────────────────────────

test('login with empty fields shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.click('button:has-text("Log In")')
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
})

test('login with invalid email shows validation', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', '123456')
    await page.click('button:has-text("Log In")')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
})

// ─── Scenario: Register Form Validation ───────────────────────────

test('register with empty fields shows validation', async ({ page }) => {
    await page.goto('/register')
    await page.click('button:has-text("Register")')
    await expect(page.locator('text=First name is required')).toBeVisible()
    await expect(page.locator('text=Last name is required')).toBeVisible()
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
    await expect(page.locator('text=Date of birth is required')).toBeVisible()
})

test('register with short password shows validation', async ({ page }) => {
    await page.goto('/register')
    await page.fill('input[placeholder="Password"]', '12345')
    await page.click('button:has-text("Register")')
    await expect(page.locator('text=Password must be at least 6 characters')).toBeVisible()
})

// ─── Scenario: Session Timeout / Inactivity ───────────────────────

test('inactivity timeout forces redirect to login', async ({ page }) => {
    const email = uniqueEmail('inactivity')

    // Register and land on /events
    await registerUser(page, { email, firstName: 'Inactive' })
    await expect(page.getByText('Hi, Inactive')).toBeVisible()

    // Manually set lastActivity to 31 minutes ago (past the 30-min SESSION_TIMEOUT_MS)
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000
    await page.evaluate((ts) => {
        localStorage.setItem('lastActivity', ts.toString())
    }, thirtyOneMinutesAgo)

    // The inactivity guard polls every 10 s. Wait for it to fire.
    // We expect the page to redirect to /login after the guard clears the session.
    await expect(page).toHaveURL('/login', { timeout: 15000 })

    // Verify auth storage has been cleared
    const hasUser = await page.evaluate(() => localStorage.getItem('currentUser'))
    expect(hasUser).toBeNull()

    const hasToken = await page.evaluate(() => localStorage.getItem('authToken'))
    expect(hasToken).toBeNull()
})

test('activity timestamp is bumped on user interaction', async ({ page }) => {
    // Verify that interaction events update lastActivity
    await page.goto('/events')

    // Set lastActivity to a known old value
    await page.evaluate(() => {
        localStorage.setItem('lastActivity', '0')
    })

    // Click somewhere on the page to trigger the activity bump
    await page.click('body')

    // Verify lastActivity has been updated (should be > 0 and recent)
    const ts = await page.evaluate(() => {
        const raw = localStorage.getItem('lastActivity')
        return raw ? parseInt(raw, 10) : 0
    })

    expect(ts).toBeGreaterThan(Date.now() - 60_000) // within the last minute
})

test('refreshing the page preserves session for an active user', async ({ page }) => {
    const email = uniqueEmail('refresh')

    // Register
    await registerUser(page, { email, firstName: 'Refresh' })
    await expect(page.getByText('Hi, Refresh')).toBeVisible()

    // Simulate page refresh
    await page.reload()

    // Wait for the verify-session overlay to clear
    await expect(page.getByText('Verifying session…')).not.toBeVisible({ timeout: 10000 })

    // Should still be on /events and authenticated
    await expect(page).toHaveURL('/events')
    await expect(page.getByText('Hi, Refresh')).toBeVisible()
})
