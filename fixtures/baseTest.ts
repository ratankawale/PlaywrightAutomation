
import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';

// Declare custom fixtures
type MyFixtures = {
    loginPage: LoginPage;
};

// Create Base Test
export const test = base.extend<MyFixtures>({

    loginPage: async ({ page }, use) => {

        const loginPage = new LoginPage(page);

        await use(loginPage);

    }

});

export { expect };
