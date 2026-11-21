import { Page, Locator, expect } from '@playwright/test';

export class AccountsPage {
    readonly page: Page;
    readonly accountType: Locator;
    readonly fromAccount: Locator;
    readonly openAccountButton: Locator;
    readonly newAccountNumber: Locator;

    constructor(page: Page) {
        this.page = page;
        this.accountType = page.locator("//select[@id='type']");
        this.fromAccount = page.locator("//select[@id='fromAccountId']");
        this.openAccountButton = page.locator(
             "//input[@type='button' and @value='Open New Account']"
        );
        this.newAccountNumber = page.locator("//a[@id='newAccountId']");
    }

    
async openCheckingAccount(): Promise<string> {
    await this.page.goto('/parabank/openaccount.htm');
    await this.page.goto('/parabank/openaccount.htm');

    await this.accountType.selectOption({ label: 'CHECKING' });

    const accountNumberAlreadySelected =
        await this.fromAccount.locator('option').first().textContent();

    await this.openAccountButton.click();

    await expect(this.newAccountNumber).toBeVisible();

    const accountNumber = (
        await this.newAccountNumber.innerText()
    ).trim();

    console.log('New Account Number:', accountNumber);

    return accountNumber;
}
}