
import { test } from '@playwright/test';

test('Inspect ParaBank Transfer Page', async ({ page }) => {

    await page.goto('/parabank/index.htm');

    // Login with the customer created during Scenario A
    // For now, inspect the login page fields.

    console.log(
        'Username field:',
        await page.locator('input[name="username"]').count()
    );

    console.log(
        'Password field:',
        await page.locator('input[name="password"]').count()
    );

    console.log(
        'Transfer link:',
        await page.locator('a[href*="transfer.htm"]').count()
    );

});
