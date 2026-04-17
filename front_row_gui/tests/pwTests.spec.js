import { test, expect } from '@playwright/test'

// ─── Scenario 1: Browse events from presentation page ─────
test('user can navigate from presentation to events page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('text=FrontRow')).toBeVisible()
    await page.click('text=Browse events')
    await expect(page).toHaveURL('/events')
})

test('presentation page renders all buttons', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Browse events')).toBeVisible()
    await expect(page.getByText('Log In')).toBeVisible()
    await expect(page.getByText('Register')).toBeVisible()
})

test('presentation page navigates to login', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Log In')
    await expect(page).toHaveURL('/login')
})

test('presentation page navigates to register', async ({ page }) => {
    await page.goto('/')
    await page.click('text=Register')
    await expect(page).toHaveURL('/register')
})

// ─── Scenario 2: Browse and search events ─────────────────
test('events page loads and shows cards', async ({ page }) => {
    await page.goto('/events')
    await expect(page.getByText('FrontRow')).toBeVisible()
    await expect(page.getByText('🎭 Picked for you')).toBeVisible()
})

test('user can search for an event', async ({ page }) => {
    await page.goto('/events')
    await page.getByPlaceholder('Artist, Event, Category').fill('Drake')
    await expect(page.getByRole('heading', { name: 'Drake Tour' })).toBeVisible()
})

test('search bar filters out non matching events', async ({ page }) => {
    await page.goto('/events')
    await page.getByPlaceholder('Artist, Event, Category').fill('Drake')
    await expect(page.getByRole('heading', { name: 'Bruno Mars' })).not.toBeVisible()
})

test('user can search for sacramento', async ({ page }) => {
    await page.goto('/events')
    await page.getByPlaceholder('Artist, Event, Category').fill('sa')
    await expect(page.getByRole('heading', { name: 'Sacramento Kings vs LA Lakers' })).toBeVisible()
})

// ─── Scenario 3: Navigate from card to detail ─────────────
test('user can click event card and go to detail page', async ({ page }) => {
    await page.goto('/events')
    await page.getByRole('heading', { name: 'Drake Tour' }).first().click()
    await expect(page).toHaveURL(/\/events\/\d+/)
})

test('detail page shows event info', async ({ page }) => {
    await page.goto('/events')
    await page.getByRole('heading', { name: 'Drake Tour' }).first().click()
    await expect(page.getByText('Experience Drake performing hits live.')).toBeVisible()
    await expect(page.getByText('BUY NOW!').first()).toBeVisible()
})

test('detail page increment and decrement quantity', async ({ page }) => {
    await page.goto('/events')
    await page.getByRole('heading', { name: 'Drake Tour' }).first().click()
    await page.getByText('+').first().click()
    await page.getByText('+').first().click()
    await page.getByText('−').first().click()
    await expect(page.getByText('2').first()).toBeVisible()
})

// ─── Scenario 4: Add a new event ──────────────────────────
test('user can navigate to add event page', async ({ page }) => {
    await page.goto('/events')
    await page.getByAltText('Add').click()
    await expect(page).toHaveURL('/events/add')
})

test('add event form shows validation errors', async ({ page }) => {
    await page.goto('/events/add')
    await page.click('text=Finish')
    await expect(page.locator('text=Event name is required')).toBeVisible()
    await expect(page.locator('text=Description is required')).toBeVisible()
    await expect(page.locator('text=At least one location and date is required')).toBeVisible()
    await expect(page.locator('text=Enter a valid number of tickets')).toBeVisible()
    await expect(page.locator('text=Enter a valid price')).toBeVisible()
})

test('user can add a new event and search for it', async ({ page }) => {
    await page.goto('/events/add')
    await page.fill('input[placeholder="Enter event\'s name"]', 'Test Concert')
    await page.fill('textarea[placeholder="Enter event\'s description"]', 'A great show')
    await page.fill('textarea[placeholder*="Location;Venue;Date"]', 'London;Wembley;2026-08-08')
    await page.fill('input[placeholder="Eg: 100"]', '100')
    await page.fill('input[placeholder="Eg: 50"]', '50')
    await page.fill('input[placeholder="Eg: Concert, Sports, Magic"]', 'Concert')
    await page.click('text=Finish')
    await expect(page).toHaveURL('/events')
    await page.getByPlaceholder('Artist, Event, Category').fill('Test Concert')
    await expect(page.getByRole('heading', { name: 'Test Concert' })).toBeVisible()
})

test('add event shows error for invalid date format', async ({ page }) => {
    await page.goto('/events/add')
    await page.fill('input[placeholder="Enter event\'s name"]', 'Test')
    await page.fill('textarea[placeholder="Enter event\'s description"]', 'Test')
    await page.fill('textarea[placeholder*="Location;Venue;Date"]', 'London;Wembley;bad-date')
    await page.fill('input[placeholder="Eg: 100"]', '100')
    await page.fill('input[placeholder="Eg: 50"]', '50')
    await page.click('text=Finish')
    await expect(page.locator('text=Each line must be: Location;Venue;YYYY-MM-DD')).toBeVisible()
})

// ─── Scenario 5: Delete an event ──────────────────────────
test('user can delete an event', async ({ page }) => {
    // first add one to delete
    await page.goto('/events/add')
    await page.fill('input[placeholder="Enter event\'s name"]', 'To Delete')
    await page.fill('textarea[placeholder="Enter event\'s description"]', 'Will be deleted')
    await page.fill('textarea[placeholder*="Location;Venue;Date"]', 'London;Wembley;2026-08-08')
    await page.fill('input[placeholder="Eg: 100"]', '100')
    await page.fill('input[placeholder="Eg: 50"]', '50')
    await page.fill('input[placeholder="Eg: Concert, Sports, Magic"]', 'Concert')
    await page.click('text=Finish')
    await expect(page).toHaveURL('/events')

    // search for it and click it
    await page.getByPlaceholder('Artist, Event, Category').fill('To Delete')
    await page.getByRole('heading', { name: 'To Delete' }).first().click()

    // delete it
    await page.click('text=[Delete]')
    await expect(page).toHaveURL('/events')

    // verify it's gone
    await page.getByPlaceholder('Artist, Event, Category').fill('To Delete')
    await expect(page.getByRole('heading', { name: 'To Delete' })).not.toBeVisible()
})

// ─── Scenario 6: Favorites ────────────────────────────────
test('user can toggle favorite on event card', async ({ page }) => {
    await page.goto('/events')
    const heartBtn = page.getByRole('button', { name: /❤️|🤍/ }).first()
    await heartBtn.click()
})

test('favorites page loads', async ({ page }) => {
    await page.goto('/favorites')
    await expect(page.getByText('MY FAVORITES')).toBeVisible()
})

// ─── Scenario 7: Statistics ───────────────────────────────
test('statistics page loads', async ({ page }) => {
    await page.goto('/statistics')
    await expect(page.getByText("What's happening")).toBeVisible()
    await expect(page.getByText('Trending right now')).toBeVisible()
    await expect(page.getByText('Tickets still available')).toBeVisible()
})

// ─── Scenario 8: Header navigation ───────────────────────
test('header favorites button navigates to favorites', async ({ page }) => {
    await page.goto('/events')
    await page.getByAltText('Favorites').click()
    await expect(page).toHaveURL('/favorites')
})

test('header logo navigates to events', async ({ page }) => {
    await page.goto('/favorites')
    await page.getByAltText('FrontRow').click()
    await expect(page).toHaveURL('/events')
})

// ─── Scenario 9: Login and Register ──────────────────────
test('login page renders correctly', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByText('Log In')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your email')).toBeVisible()
    await expect(page.getByPlaceholder('Enter your password')).toBeVisible()
})

test('login shows validation errors', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Log In')
    await expect(page.locator('text=Email is required')).toBeVisible()
    await expect(page.locator('text=Password is required')).toBeVisible()
})

test('login shows invalid email error', async ({ page }) => {
    await page.goto('/login')
    await page.fill('input[type="email"]', 'notanemail')
    await page.fill('input[type="password"]', '123456')
    await page.click('text=Log In')
    await expect(page.locator('text=Enter a valid email')).toBeVisible()
})

test('register page renders correctly', async ({ page }) => {
    await page.goto('/register')
    await expect(page.getByText('Register')).toBeVisible()
    await expect(page.getByPlaceholder('John')).toBeVisible()
    await expect(page.getByPlaceholder('Doe')).toBeVisible()
})

test('register navigates to login', async ({ page }) => {
    await page.goto('/register')
    await page.click('text=Log In')
    await expect(page).toHaveURL('/login')
})

test('login navigates to register', async ({ page }) => {
    await page.goto('/login')
    await page.click('text=Sign up')
    await expect(page).toHaveURL('/register')
})