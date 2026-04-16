import {test,expect} from '@playwright/test';

test("should have title", async ({page}) => {
    await page.goto('http://localhost:5173/')
    await expect(page).toHaveTitle(/FrontRow/)
})

test("from card to detail", async ({ page }) => {
    await page.goto('/events')
    await page.getByText('Drake Tour').first().click()
    await expect(page).toHaveURL('/events/1')
})

test("add button",async({page})=>{
    await page.goto('/events')
    await page.getByAltText("Add").click()
    await expect(page).toHaveURL('/events/add')
    await expect(page.getByText('Add Event')).toBeVisible()
})

test("fill add form", async({page})=>{
    await page.goto('/events/add')
    await page.getByPlaceholder('Enter event\'s name').fill('Test Event')
    await page.getByPlaceholder('Enter event\'s description').fill('Test Description')
    await page.getByPlaceholder('(Location;Venue;Date) one per line\nEg: London;Wembley Stadium;2026-08-08').fill('London;Wembley Stadium;2026-08-08')
    await page.getByPlaceholder('Eg: 100').fill('100')
    await page.getByPlaceholder('Eg: 50').fill('50')
    await page.getByPlaceholder('Eg: Concert, Sports, Magic').fill('Concert')
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page).toHaveURL('/events')
})

test('shows validation errors for invalid input', async ({ page }) => {

    await page.goto('/events/add')
    await page.click('text=Finish')
    await expect(page.locator('text=Event name is required')).toBeVisible()
    await expect(page.locator('text=Description is required')).toBeVisible()
    await expect(page.locator('text=At least one location and date is required')).toBeVisible()
    await expect(page.locator('text=Enter a valid number of tickets')).toBeVisible()
    await expect(page.locator('text=Enter a valid price')).toBeVisible()
})

test("ticket quantity error", async ({ page }) => {
    await page.goto('/events/add')
    await page.getByPlaceholder('Enter event\'s name').fill('Test Event')
    await page.getByPlaceholder('Enter event\'s description').fill('Test Description')
    await page.getByPlaceholder('(Location;Venue;Date) one per line\nEg: London;Wembley Stadium;2026-08-08').fill('London;Wembley Stadium 2026-08-08')
    await page.getByPlaceholder('Eg: 100').fill('100')
    await page.getByPlaceholder('Eg: 50').fill('50')
    await page.getByPlaceholder('Eg: Concert, Sports, Magic').fill('Concert')
    await page.getByRole('button', { name: 'Finish' }).click()
    await expect(page.locator('text=Each line must be: Location;Venue;YYYY-MM-DD')).toBeVisible()
    }
)

test("search bar", async ({ page }) => {
    await page.goto('/events')
    await page.getByPlaceholder('Artist, Event, Category').fill('sa')
    await expect(page.getByRole('heading', { name: 'Sacramento Kings vs LA Lakers' })).toBeVisible()
})