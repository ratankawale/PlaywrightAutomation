
import { Page, Locator, expect } from '@playwright/test';

export class LoanPage {

    readonly page: Page;
    readonly loanAmount: Locator;
    readonly downPayment: Locator;
    readonly fromAccount: Locator;
    readonly applyButton: Locator;
    readonly loanResult: Locator;
    readonly loanStatus: Locator;
    readonly approvedMessage: Locator;
    readonly newAccountNumber: Locator;

    constructor(page: Page) {

        this.page = page;

        this.loanAmount = page.locator('#amount');
        this.downPayment = page.locator('#downPayment');
        this.fromAccount = page.locator('#fromAccountId');

        this.applyButton = page.locator(
            'input[type="button"][value="Apply Now"]'
        );

        this.loanResult = page.locator('#requestLoanResult');
        this.loanStatus = page.locator('#loanStatus');
        this.approvedMessage = page.locator('#loanRequestApproved');
        this.newAccountNumber = page.locator('#newAccountId');
    }

    async navigate(): Promise<void> {
        await this.page.goto('/parabank/requestloan.htm');
    }

    async applyForLoan(
        amount: string,
        downPayment: string,
        accountNumber: string
    ): Promise<string> {

        await this.loanAmount.fill(amount);
        await this.downPayment.fill(downPayment);
        await this.fromAccount.selectOption(accountNumber);

        await this.applyButton.click();

        // Wait for the asynchronous loan response
        await expect(this.loanResult).toBeVisible();

        // Verify loan approval
        await expect(this.loanStatus).toHaveText('Approved');

        await expect(this.approvedMessage).toBeVisible();

        await expect(this.approvedMessage).toContainText(
            'Congratulations, your loan has been approved.'
        );

        // Extract dynamic loan account number
        await expect(this.newAccountNumber).toBeVisible();

        const loanAccountNumber = (
            await this.newAccountNumber.innerText()
        ).trim();

        console.log('Loan Status: Approved');
        console.log('Loan Account Number:', loanAccountNumber);

        return loanAccountNumber;
    }
}
