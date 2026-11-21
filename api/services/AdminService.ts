
import { APIRequestContext, expect } from '@playwright/test';

export class AdminService {

    private readonly api: APIRequestContext;

    private readonly adminUrl = '/parabank/admin.htm';

    private readonly apiUrl = '/parabank/services/bank';

    constructor(api: APIRequestContext) {
        this.api = api;
    }

    // Verify that ParaBank is reachable
    async verifyApplicationAvailability(): Promise<void> {

        const response = await this.api.get(this.adminUrl);

        expect(
            response.status(),
            'ParaBank administration page should be reachable'
        ).toBe(200);

        console.log('ParaBank is reachable');
    }

    // Protect the shared database from accidental resets
    private ensureResetIsEnabled(): void {

        if (process.env.RESET_DATABASE !== 'true') {
            throw new Error(
                'Database reset blocked. Set RESET_DATABASE=true explicitly.'
            );
        }
    }

    // Clean database
    async cleanDatabase(): Promise<void> {

        this.ensureResetIsEnabled();

        const response = await this.api.post(
            `${this.apiUrl}/cleanDB`
        );

        expect(
            response.ok(),
            'Database cleaning should succeed'
        ).toBeTruthy();

        console.log('ParaBank database cleaned successfully');
    }

    // Initialize database
    async initializeDatabase(): Promise<void> {

        this.ensureResetIsEnabled();

        const response = await this.api.post(
            `${this.apiUrl}/initializeDB`
        );

        expect(
            response.ok(),
            'Database initialization should succeed'
        ).toBeTruthy();

        console.log('ParaBank database initialized successfully');
    }

    // Generic configuration method
    async setParameter(
        parameterName: string,
        parameterValue: string
    ): Promise<void> {

        const response = await this.api.post(
            `${this.apiUrl}/setParameter/` +
            `${encodeURIComponent(parameterName)}/` +
            `${encodeURIComponent(parameterValue)}`
        );

        expect(
            response.ok(),
            `Configuration update failed for ${parameterName}`
        ).toBeTruthy();

        console.log(
            `ParaBank parameter updated: ${parameterName}`
        );
    }
}
