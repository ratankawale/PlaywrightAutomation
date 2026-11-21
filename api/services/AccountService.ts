
import { APIRequestContext, expect } from '@playwright/test';

export interface AccountData {
    id: number;
    customerId: number;
    type: string;
    balance: number;
}

export class AccountService {

    private readonly api: APIRequestContext;
    private readonly basePath = '/parabank/services/bank';
    constructor(api: APIRequestContext) {
        this.api = api;
    }

    async getAccounts(customerId: number): Promise<AccountData[]> {

        const response = await this.api.get(
            `${this.basePath}/customers/${customerId}/accounts`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        expect(
            response.ok(),
            `Get accounts failed: ${response.status()} ${await response.text()}`
        ).toBeTruthy();

        const accounts: AccountData[] = await response.json();

        return accounts;
    }

    async getAccount(accountId: number): Promise<AccountData> {

        const response = await this.api.get(
            `${this.basePath}/accounts/${accountId}`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        expect(
            response.ok(),
            `Get account failed: ${response.status()} ${await response.text()}`
        ).toBeTruthy();

        const account: AccountData = await response.json();

        return account;
    }

    
async depositFunds(
    accountId: number,
    amount: number
): Promise<void> {

    const response = await this.api.post(
    `${this.basePath}/deposit`,
    {
        params: {
            accountId: accountId.toString(),
            amount: amount.toFixed(2)
        }
    }
);

    expect(
        response.ok(),
        `Deposit failed: ${response.status()} ${await response.text()}`
    ).toBeTruthy();

    console.log(
        `Deposit successful: $${amount.toFixed(2)} into account ${accountId}`
    );
}

}
