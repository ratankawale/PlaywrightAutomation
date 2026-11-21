
import { test, expect } from '@playwright/test';
import { CustomerService } from '../../api/services/CustomerService';
import { AccountService } from '../../api/services/AccountService';
import { TransactionService } from '../../api/services/TransactionService';
import { TestDataFactory } from '../../utils/TestDataFactory';
import { Account } from '../../types/Account';
import { Transaction } from '../../types/Transaction';
import { Customer } from '../../types/Customer';
import { withApiLogging } from '../../utils/ApiRequestLogger';

function validateCustomerSchema(customer: unknown): asserts customer is Customer {
    const data = customer as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.firstName).toBe('string');
    expect(typeof data.lastName).toBe('string');
    expect(typeof data.phoneNumber).toBe('string');
    expect(typeof data.ssn).toBe('string');

    expect(typeof data.address).toBe('object');
    expect(data.address).not.toBeNull();

    const address = data.address as Record<string, unknown>;

    expect(typeof address.street).toBe('string');
    expect(typeof address.city).toBe('string');
    expect(typeof address.state).toBe('string');
    expect(typeof address.zipCode).toBe('string');
}

function validateAccountSchema(account: unknown): asserts account is Account {
    const data = account as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.customerId).toBe('number');
    expect(typeof data.type).toBe('string');
    expect(typeof data.balance).toBe('number');
}

function validateTransactionSchema(
    transaction: unknown
): asserts transaction is Transaction {
    const data = transaction as Record<string, unknown>;

    expect(typeof data.id).toBe('number');
    expect(typeof data.accountId).toBe('number');
    expect(typeof data.type).toBe('string');
    expect(typeof data.date).toBe('number');
    expect(typeof data.amount).toBe('number');
    expect(typeof data.description).toBe('string');
}

test(
    'Scenario C - Create Customer, Deposit Funds and Verify Transactions through API',
    async ({ request }) => {

    const loggedApi = withApiLogging(request);

    const customerService = new CustomerService(loggedApi);
    const accountService = new AccountService(loggedApi);
    const transactionService = new TransactionService(loggedApi);

        const generatedUser = TestDataFactory.generateUser();

        const customerData = {
            firstName: generatedUser.firstName,
            lastName: generatedUser.lastName,
            address: {
                street: generatedUser.address,
                city: generatedUser.city,
                state: generatedUser.state,
                zipCode: generatedUser.zipCode
            },
            phoneNumber: generatedUser.phoneNumber,
            ssn: generatedUser.ssn,
            username: generatedUser.username,
            password: generatedUser.password
        };

        // STEP 1: Create customer through API
        const customer = await test.step(
            'Create customer through API and validate response',
            async () => {
                const createdCustomer =
                    await customerService.createCustomer(customerData);

                validateCustomerSchema(createdCustomer);
                expect(createdCustomer.id).toBeGreaterThan(0);

                console.log('Customer created:', generatedUser.username);
                console.log('Customer ID:', createdCustomer.id);

                return createdCustomer;
            }
        );

        // STEP 2: Retrieve customer accounts
        const accounts = await test.step(
            'Retrieve customer accounts',
            async () => {
                const customerAccounts =
                    await accountService.getAccounts(customer.id);

                expect(customerAccounts.length).toBeGreaterThan(0);

                for (const item of customerAccounts) {
                    validateAccountSchema(item);
                }

                console.log('Accounts retrieved:', customerAccounts.length);

                return customerAccounts;
            }
        );

        const account = accounts[0];

        // STEP 3: Validate account details
        await test.step('Validate checking account details', async () => {
            validateAccountSchema(account);

            console.log('Account retrieved:', account.id);
            console.log('Account Type:', account.type);
            console.log('Initial Balance:', account.balance);
        });

        // STEP 4: Deposit funds
        const depositAmount = 100;

        await test.step('Deposit $100 into customer account', async () => {
            await accountService.depositFunds(
                account.id,
                depositAmount
            );

            console.log('Deposit completed successfully');
        });

        // STEP 5: Verify updated account balance
        const updatedAccount = await test.step(
            'Verify updated account balance',
            async () => {
                const result =
                    await accountService.getAccount(account.id);

                validateAccountSchema(result);

                const expectedBalanceInCents =
                    Math.round(account.balance * 100) +
                    Math.round(depositAmount * 100);

                const actualBalanceInCents =
                    Math.round(result.balance * 100);

                expect(actualBalanceInCents).toBe(expectedBalanceInCents);

                console.log(
                    'Updated Account Balance:',
                    `$${result.balance.toFixed(2)}`
                );

                return result;
            }
        );

        // STEP 6: Retrieve transaction history
        const transactions = await test.step(
            'Retrieve account transaction history',
            async () => {
                const result =
                    await transactionService.getTransactions(account.id);

                expect(result.length).toBeGreaterThan(0);

                console.log(
                    'Actual Transaction API Response:',
                    JSON.stringify(result, null, 2)
                );

                return result;
            }
        );

        // STEP 7: Validate transaction schema
        await test.step(
            'Validate transaction response schema',
            async () => {
                for (const transaction of transactions) {
                    validateTransactionSchema(transaction);
                }

                console.log('All transaction schemas validated');
            }
        );

        // STEP 8: Verify deposit transaction
        await test.step(
            'Verify deposit transaction in transaction history',
            async () => {
                const depositTransaction = transactions.find(
                    transaction =>
                        transaction.type === 'Credit' &&
                        Math.round(transaction.amount * 100) ===
                            Math.round(depositAmount * 100)
                );

                expect(
                    depositTransaction,
                    'Deposit transaction was not found in transaction history'
                ).toBeDefined();

                console.log(
                    'Deposit transaction verified:',
                    depositTransaction
                );

                console.log(
                    'Final account balance:',
                    `$${updatedAccount.balance.toFixed(2)}`
                );
            }
        );

        console.log('Scenario C API test completed successfully');
    }
);
