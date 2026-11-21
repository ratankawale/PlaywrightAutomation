
import { Page, Locator } from '@playwright/test';
import { RegistrationData } from '../utils/TestDataFactory';

export class RegisterPage {

    readonly page: Page;
    readonly firstName: Locator;
    readonly lastName: Locator;
    readonly address: Locator;
    readonly city: Locator;
    readonly state: Locator;
    readonly zipCode: Locator;
    readonly phoneNumber: Locator;
    readonly ssn: Locator;
    readonly username: Locator;
    readonly password: Locator;
    readonly confirmPassword: Locator;
    readonly registerButton: Locator;

    constructor(page: Page) {

        this.page = page;

        this.firstName = page.locator('[name="customer.firstName"]');
        this.lastName = page.locator('[name="customer.lastName"]');
        this.address = page.locator('[name="customer.address.street"]');
        this.city = page.locator('[name="customer.address.city"]');
        this.state = page.locator('[name="customer.address.state"]');
        this.zipCode = page.locator('[name="customer.address.zipCode"]');
        this.phoneNumber = page.locator('[name="customer.phoneNumber"]');
        this.ssn = page.locator('[name="customer.ssn"]');
        this.username = page.locator('[name="customer.username"]');
        this.password = page.locator('[name="customer.password"]');
        this.confirmPassword = page.locator('[name="repeatedPassword"]');

        this.registerButton = page.locator(
            'input[type="submit"][value="Register"]'
        );
    }

    async navigate(): Promise<void> {
        await this.page.goto('/parabank/register.htm');
    }

    async registerUser(user: RegistrationData): Promise<void> {

        await this.firstName.fill(user.firstName);
        await this.lastName.fill(user.lastName);
        await this.address.fill(user.address);
        await this.city.fill(user.city);
        await this.state.fill(user.state);
        await this.zipCode.fill(user.zipCode);
        await this.phoneNumber.fill(user.phoneNumber);
        await this.ssn.fill(user.ssn);
        await this.username.fill(user.username);
        await this.password.fill(user.password);
        await this.confirmPassword.fill(user.password);

        await this.registerButton.click();
    }
}
