
import { Page, Locator } from '@playwright/test';

export class LoginPage {

    readonly page: Page;
    readonly username: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly flashMessage: Locator;

    constructor(page: Page) {

        this.page = page;

        this.username = page.locator('#username');

        this.password = page.locator('#password');

        this.loginButton = page.locator('button[type="submit"]');

        this.flashMessage = page.locator('#flash');
    }

    async navigate() {
        await this.page.goto(
            'https://the-internet.herokuapp.com/login'
        );
    }

    async enterUsername(username: string) {
        await this.username.fill(username);
    }

    async enterPassword(password: string) {
        await this.password.fill(password);
    }

    async clickLogin() {
        await this.loginButton.click();
    }

    async login(username: string, password: string) {

        await this.enterUsername(username);

        await this.enterPassword(password);

        await this.clickLogin();
    }
}
