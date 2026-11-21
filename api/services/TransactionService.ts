
import { APIRequestContext, expect } from '@playwright/test';

export interface TransactionData {
    id: number;
    accountId: number;
    type: string;
    date: number;
    amount: number;
    description: string;
}

export class TransactionService {

    private readonly api: APIRequestContext;
    private readonly basePath = '/parabank/services/bank';

    constructor(api: APIRequestContext) {
        this.api = api;
    }

    async getTransactions(
        accountId: number
    ): Promise<TransactionData[]> {

        const response = await this.api.get(
            `${this.basePath}/accounts/${accountId}/transactions`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        expect(
            response.ok(),
            `Get transactions failed: ${response.status()} ${await response.text()}`
        ).toBeTruthy();

        const transactions: TransactionData[] = await response.json();

        console.log(
            `Retrieved ${transactions.length} transactions for account ${accountId}`
        );

        return transactions;
    }
}
