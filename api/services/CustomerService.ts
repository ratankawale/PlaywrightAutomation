
import { APIRequestContext, expect } from '@playwright/test';
import { Customer } from '../../types/Customer';

export interface CustomerData {
    firstName: string;
    lastName: string;
    address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
    };
    phoneNumber: string;
    ssn: string;
    username: string;
    password: string;
}

export class CustomerService {

    private readonly api: APIRequestContext;

    constructor(api: APIRequestContext) {
        this.api = api;
    }

    async createCustomer(data: CustomerData): Promise<Customer> {

        // Establish a session before registration.
        const pageResponse = await this.api.get('/parabank/register.htm');
        expect(pageResponse.ok()).toBeTruthy();

        // Submit registration through HTTP without opening a browser.
        const response = await this.api.post('/parabank/register.htm', {
            form: {
                'customer.firstName': data.firstName,
                'customer.lastName': data.lastName,
                'customer.address.street': data.address.street,
                'customer.address.city': data.address.city,
                'customer.address.state': data.address.state,
                'customer.address.zipCode': data.address.zipCode,
                'customer.phoneNumber': data.phoneNumber,
                'customer.ssn': data.ssn,
                'customer.username': data.username,
                'customer.password': data.password,
                repeatedPassword: data.password
            }
        });

        expect(
            response.ok(),
            `Registration failed: ${response.status()}`
        ).toBeTruthy();

        // Retrieve the newly registered customer and its ID.
        const loginResponse = await this.api.get(
            `/parabank/services/bank/login/${encodeURIComponent(data.username)}/${encodeURIComponent(data.password)}`,
            {
                headers: {
                    Accept: 'application/json'
                }
            }
        );

        expect(
            loginResponse.ok(),
            `Customer lookup failed: ${loginResponse.status()}`
        ).toBeTruthy();

        const responseBody = await loginResponse.text();

        console.log('Customer API Response:', responseBody);

        const customer: Customer = JSON.parse(responseBody);

        expect(customer.id).toBeTruthy();

        console.log('Customer ID:', customer.id);

        return customer;
    }
}
