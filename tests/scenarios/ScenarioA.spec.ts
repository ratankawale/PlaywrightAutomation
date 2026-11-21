
import { test, expect } from '@playwright/test';
import { AdminService } from '../../api/services/AdminService';
import { RegisterPage } from '../../pages/RegisterPage';
import { AccountsPage } from '../../pages/AccountsPage';
import { TestDataFactory } from '../../utils/TestDataFactory';
import { LoanPage } from '../../pages/LoanPage';
import { ScenarioContext } from '../../types/ScenarioContext';
import { ParaBankLoginPage } from '../../pages/ParaBankLoginPage';
import { TransferPage } from '../../pages/TransferPage';

let scenarioContext: ScenarioContext; test.describe.serial('Scenario A and Scenario B', () => {

    test('Register user and open checking account', async ({ page, request }) => {

        // STEP 1: Configure Loan Provider through API
        const adminService = new AdminService(request);

        await adminService.setParameter('loanProvider', 'ws');

        console.log('Loan Provider configured: Web Service');

        // STEP 2: Generate dynamic user
        const user = TestDataFactory.generateUser();

        // STEP 3: Register customer through UI
        const registerPage = new RegisterPage(page);

        await registerPage.navigate();
        await registerPage.registerUser(user);

        const response = page.locator('#rightPanel');

        await expect(response).toContainText(`Welcome ${user.username}`);

        await expect(response).toContainText(
            'Your account was created successfully. You are now logged in.'
        );

        console.log('Customer registered successfully:', user.username);

        // STEP 4: Open Checking Account
        const accountsPage = new AccountsPage(page);

        const accountNumber = await accountsPage.openCheckingAccount();

        console.log('New Checking Account Number:', accountNumber);

        expect(accountNumber).toBeTruthy();

        // STEP 5: Apply for Loan
        const loanPage = new LoanPage(page);

        await loanPage.navigate();

        const loanAccountNumber = await loanPage.applyForLoan(
            '1000',
            '200',
            accountNumber
        );

        expect(loanAccountNumber).toBeTruthy();

        console.log('Checking Account:', accountNumber);
        console.log('Loan Account:', loanAccountNumber);

        // STEP 6: Navigate to loan account activity
        const apiResponses: {
            url: string;
            status: number;
            contentType: string;
            body: string;
            readError: string;
        }[] = [];

        page.on('response', async response => {
            const url = response.url();

            if (
                url.includes('/accounts/') ||
                url.includes('/transactions/')
            ) {
                let body = '';
                let readError = '';
                let contentType = '';

                try {
                    contentType =
                        response.headers()['content-type'] || 'Not available';

                    body = await response.text();
                } catch (error) {
                    readError = String(error);
                }

                apiResponses.push({
                    url,
                    status: response.status(),
                    contentType,
                    body,
                    readError
                });
            }
        });

        await page.goto(`/parabank/activity.htm?id=${loanAccountNumber}`);

        await expect(page.locator('#rightPanel')).toBeVisible();

        await expect.poll(() => apiResponses.length, {
            timeout: 15000
        }).toBeGreaterThanOrEqual(2);

        // Verify loan account details

        const loanAccountResponse = apiResponses.find(
            response => response.url.endsWith(`/accounts/${loanAccountNumber}`)
        );

        expect(loanAccountResponse).toBeDefined();

        const loanAccountData = JSON.parse(loanAccountResponse!.body);

        expect(loanAccountData.id).toBe(Number(loanAccountNumber));
        expect(loanAccountData.type).toBe('LOAN');
        expect(Number(loanAccountData.balance)).toBe(1000);

        console.log('Loan account balance verified: $1000.00');

        // STEP 7: Verify the checking account balance and transactions

        apiResponses.length = 0;

        await page.goto(`/parabank/activity.htm?id=${accountNumber}`);

        await expect(page.locator('#accountDetails')).toContainText(
            accountNumber
        );

        await expect.poll(() => apiResponses.length, {
            timeout: 15000
        }).toBeGreaterThanOrEqual(2);

        // Verify checking account details and down payment transaction

        const checkingAccountResponse = apiResponses.find(
            response => response.url.endsWith(`/accounts/${accountNumber}`)
        );

        const checkingTransactionsResponse = apiResponses.find(
            response => response.url.includes(
                `/accounts/${accountNumber}/transactions/`
            )
        );

        expect(checkingAccountResponse).toBeDefined();
        expect(checkingTransactionsResponse).toBeDefined();

        const checkingAccountData = JSON.parse(
            checkingAccountResponse!.body
        );

        const checkingTransactions = JSON.parse(
            checkingTransactionsResponse!.body
        );

        expect(checkingAccountData.id).toBe(Number(accountNumber));
        expect(checkingAccountData.type).toBe('CHECKING');

        const downPaymentTransaction = checkingTransactions.find(
            (transaction: {
                type: string;
                amount: number;
                description: string;
            }) =>
                transaction.type === 'Debit' &&
                Number(transaction.amount) === 200 &&
                transaction.description.includes(
                    `Loan # ${loanAccountNumber}`
                )
        );

        expect(downPaymentTransaction).toBeDefined();

        console.log('Checking account down payment verified: $200.00');
        // Save Scenario A data for Scenario B
        scenarioContext = {
            user,
            checkingAccountNumber: accountNumber,
            loanAccountNumber
        };
        });

        test('Scenario B - Inspect Transfer Page', async ({ page, request }) => {

            // Login using the customer created in Scenario A
            const loginPage = new ParaBankLoginPage(page);

            await loginPage.navigate();

            await loginPage.login(
                scenarioContext.user.username,
                scenarioContext.user.password
            );

            console.log('Logged in with Scenario A customer');

            // Verify Transfer Funds link after login
            const transferLink = page.locator("//a[contains(text(),'Transfer Funds')]");

            console.log(
                'Transfer link count:',
                await transferLink.count()
            );

            await expect(transferLink).toBeVisible();

            // Navigate to Transfer Funds
            await transferLink.click();

            // Wait until account dropdowns are populated

            const fromAccountOptions = page.locator(
                "//select[@id='fromAccountId']/option"
            );

            const toAccountOptions = page.locator(
                "//select[@id='toAccountId']/option"
            );

            await expect.poll(
                async () => await fromAccountOptions.count(),
                { timeout: 15000 }
            ).toBeGreaterThan(1);

            await expect.poll(
                async () => await toAccountOptions.count(),
                { timeout: 15000 }
            ).toBeGreaterThan(1);




            // Inspect transfer form
            console.log(
                'Amount field:',
                await page.locator("//input[@id='amount']").count()
            );

            // Inspect individual From Account options
            const fromOptions = await page.locator(
                "//select[@id='fromAccountId']/option"
            ).evaluateAll(options =>
                options.map(option => ({
                    text: option.textContent?.trim(),
                    value: (option as HTMLOptionElement).value
                }))
            );

            // Inspect individual To Account options
            const toOptions = await page.locator(
                "//select[@id='toAccountId']/option"
            ).evaluateAll(options =>
                options.map(option => ({
                    text: option.textContent?.trim(),
                    value: (option as HTMLOptionElement).value
                }))
            );

            console.log('From Account Options:', fromOptions);
            console.log('To Account Options:', toOptions);

            // Verify dynamically generated accounts
            expect(
                fromOptions.some(option =>
                    option.value === scenarioContext.checkingAccountNumber
                )
            ).toBeTruthy();

            expect(
                toOptions.some(option =>
                    option.value === scenarioContext.loanAccountNumber
                )
            ).toBeTruthy();

            expect(
                fromOptions.some(option =>
                    option.value === scenarioContext.checkingAccountNumber
                )
            ).toBeTruthy();

            expect(
                toOptions.some(option =>
                    option.value === scenarioContext.loanAccountNumber
                )
            ).toBeTruthy();

            // Inspect balances of all available accounts

            const accountNumbers = [
                ...new Set([
                    ...fromOptions.map(option => option.value),
                    ...toOptions.map(option => option.value)
                ])
            ].filter(Boolean);

            

            type AccountInfo = {
                id: number;
                type: string;
                balance: number;
            };

            const accounts: AccountInfo[] = [];

            for (const accountNumber of accountNumbers) {
                const response = await page.context().request.get(
                    `/parabank/services_proxy/bank/accounts/${accountNumber}`
                );

                expect(response.ok()).toBeTruthy();

                const accountData = await response.json();

                const account: AccountInfo = {
                    id: Number(accountData.id),
                    type: accountData.type,
                    balance: Number(accountData.balance)
                };

                accounts.push(account);

                console.log('Account Information:', account);
            }

            // Total amount required: $184.49
            const requiredAmount = 18449;

            const sourceAccount = accounts
                .filter(account =>
                    account.type === 'CHECKING' &&
                    account.id !== Number(scenarioContext.checkingAccountNumber) &&
                    Math.round(account.balance * 100) >= requiredAmount
                )
                .sort((a, b) => b.balance - a.balance)[0];

            expect(
                sourceAccount,
                'No checking account has sufficient funds for all three transfers'
            ).toBeTruthy();

            const destinationAccount = scenarioContext.checkingAccountNumber;

            console.log('Selected Source Account:', sourceAccount.id);
            console.log('Selected Destination Account:', destinationAccount);
            console.log('Source Account Balance:', sourceAccount.balance);


            const transferPage = new TransferPage(page);

            await transferPage.navigate();

            const sourceBalanceBeforeTransfers = sourceAccount.balance;

            console.log(
                'Source Balance Before Transfers:',
                sourceBalanceBeforeTransfers
            );

            const transferAmounts = ['150', '25.50', '8.99'];

            for (const amount of transferAmounts) {
                console.log(`Transferring $${amount}`);

                await transferPage.transferMoney(
                    amount,
                    String(sourceAccount.id),
                    destinationAccount
                );

                console.log(`Transfer completed: $${amount}`);
            }


            const balanceResponse = await page.context().request.get(
                `/parabank/services_proxy/bank/accounts/${sourceAccount.id}`
            );

            expect(balanceResponse.ok()).toBeTruthy();

            const updatedAccount = await balanceResponse.json();

            const sourceBalanceAfterTransfers = Number(updatedAccount.balance);

            const actualDeductionInCents = Math.round(
                (sourceBalanceBeforeTransfers - sourceBalanceAfterTransfers) * 100
            );

            const expectedDeductionInCents = 18449;

            console.log('Source Balance After Transfers:', sourceBalanceAfterTransfers);
            console.log('Actual Deduction:', actualDeductionInCents / 100);

            expect(actualDeductionInCents).toBe(expectedDeductionInCents);


            // Navigate to Find Transactions
            const findTransactionsLink = page.locator(
                "//a[contains(text(),'Find Transactions')]"
            );

            await findTransactionsLink.click();

            await expect(page.locator('#rightPanel')).toContainText(
                'Find Transactions'
            );

            // Inspect page content
            console.log(
                'Find Transactions Page:',
                await page.locator('#rightPanel').innerText()
            );

            // Inspect available tables
            const tableDetails = await page.locator(
                '#rightPanel table'
            ).evaluateAll(tables =>
                tables.map(table => ({
                    headers: Array.from(
                        table.querySelectorAll('th')
                    ).map(header => header.textContent?.trim()),

                    rows: Array.from(
                        table.querySelectorAll('tr')
                    ).map(row =>
                        Array.from(row.querySelectorAll('td'))
                            .map(cell => cell.textContent?.trim())
                    )
                }))
            );

            console.log(
                'Find Transactions Table Details:',
                JSON.stringify(tableDetails, null, 2)
            );


            // Select the source account
            await page.locator('#accountId').selectOption(
                String(sourceAccount.id)
            );

            // Search transactions using date range
            await page.locator('#fromDate').fill('01-01-2020');
            await page.locator('#toDate').fill('12-31-2030');

            await page.locator('#findByDateRange').click();

            // Wait for transaction results
            const transactionRows = page.locator(
                '#rightPanel table tbody tr'
            );

            await expect.poll(
                async () => await transactionRows.count(),
                { timeout: 15000 }
            ).toBeGreaterThan(0);

            // Print transaction table
            const transactionData = await page.locator(
                '#rightPanel table'
            ).evaluate(table =>
                Array.from(table.querySelectorAll('tbody tr'))
                    .map(row =>
                        Array.from(row.querySelectorAll('td'))
                            .map(cell => cell.textContent?.trim() ?? '')
                    )
            );

            console.log(
                'Source Account Transactions:',
                JSON.stringify(transactionData, null, 2)
            );



            const transferDebitsInCents = transactionData
                .filter(row => row[1] === 'Funds Transfer Sent')
                .map(row =>
                    Math.round(
                        Number(row[2].replace(/[$,]/g, '')) * 100
                    )
                );

            const expectedTransferAmounts = [15000, 2550, 899];

            // Find one actual transaction row for each expected transfer.
            const matchedTransfers: number[] = [];

            for (const expectedAmount of expectedTransferAmounts) {
                const matchingIndex = transferDebitsInCents.indexOf(
                    expectedAmount
                );

                expect(
                    matchingIndex,
                    `Transfer amount ${expectedAmount / 100} was not found`
                ).toBeGreaterThanOrEqual(0);

                matchedTransfers.push(
                    transferDebitsInCents[matchingIndex]
                );
            }

            // Calculate total from actual transaction records.
            const actualTransferTotal = matchedTransfers.reduce(
                (total, amount) => total + amount,
                0
            );

            expect(actualTransferTotal).toBe(18449);

            console.log(
                'Verified transaction table total:',
                `$${(actualTransferTotal / 100).toFixed(2)}`
            );




        });

});
