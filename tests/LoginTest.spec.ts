
import { test, expect } from '../fixtures/baseTest';
import { ExcelUtils } from '../utils/ExcelUtils';

test.describe('Login Functionality', () => {
    const filePath = './test-data/LoginTestData.xlsx';
    const sheetName = 'Login';
    test.beforeEach(async ({ loginPage }) => {
        console.log('Starting Login Test');
        await loginPage.navigate();
    });

    test.afterEach(async ({ page }) => {
        console.log('Login Test Completed');
        console.log('Final URL:', page.url());
    });

    test('Verify successful login', async ({ page, loginPage }) => {
          const data = await ExcelUtils.getRowData(
            filePath,
            sheetName,
            1
        );

        await loginPage.login(data.Username,data.Password);
        // await loginPage.login('tomsmith', 'SuperSecretPassword!');

        await expect(page).toHaveURL(/secure/);
        await expect(page.locator('h2')).toHaveText('Secure Area');

    });

    test('Verify invalid username login', async ({ loginPage }) => {

        await loginPage.login('wronguser', 'SuperSecretPassword!');

        await expect(loginPage.flashMessage)
            .toContainText('Your username is invalid!');

    });

    test('Verify invalid password login', async ({ loginPage }) => {

        await loginPage.login('tomsmith', 'wrongpassword');

        await expect(loginPage.flashMessage)
            .toContainText('Your password is invalid!');

    });

});
