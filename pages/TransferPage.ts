
import { Page, Locator, expect } from '@playwright/test';

export class TransferPage {

    readonly page: Page;
    readonly amount: Locator;
    readonly fromAccount: Locator;
    readonly toAccount: Locator;
    readonly transferButton: Locator;
    readonly transferResult: Locator;

    constructor(page: Page) {

        this.page = page;

        this.amount = page.locator('#amount');
        this.fromAccount = page.locator('#fromAccountId');
        this.toAccount = page.locator('#toAccountId');

        this.transferButton = page.locator(
            'input[type="submit"][value="Transfer"]'
        );

        this.transferResult = page.locator('#showResult');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/parabank/transfer.htm');
    }

    
    async transferMoney(
        amount: string,
        fromAccountNumber: string,
        toAccountNumber: string
    ): Promise<void> {

        // Return to the Transfer Funds form before every transfer.
        await this.navigate();

        await this.amount.fill(amount);
        await this.fromAccount.selectOption(fromAccountNumber);
        await this.toAccount.selectOption(toAccountNumber);

        await this.transferButton.click();

        await expect(this.transferResult).toBeVisible();
        await expect(this.transferResult).toContainText(
            'Transfer Complete!'
        );

        console.log(`Transfer successful: $${amount}`);
    }

}
