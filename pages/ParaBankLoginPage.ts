
import { Page, Locator, expect } from '@playwright/test';

export class ParaBankLoginPage {

    readonly page: Page;
    readonly username: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly welcomeMessage: Locator;

    constructor(page: Page) {

        this.page = page;

        this.username = page.locator('input[name="username"]');
        this.password = page.locator('input[name="password"]');

        this.loginButton = page.locator(
            'input[type="submit"][value="Log In"]'
        );

        this.welcomeMessage = page.locator('#rightPanel');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/parabank/index.htm');
    }

    async login(
        username: string,
        password: string
    ): Promise<void> {

        await this.username.fill(username);
        await this.password.fill(password);
        await this.loginButton.click();

        await expect(this.welcomeMessage).toContainText(
            'Accounts Overview'
        );
    }
}
