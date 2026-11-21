
import { randomBytes } from 'crypto';

export interface RegistrationData {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    phoneNumber: string;
    ssn: string;
    username: string;
    password: string;
}

export class TestDataFactory {

    static generateUser() {

        const uniqueId = randomBytes(9).toString('hex');

        return {
            firstName: 'QA',
            lastName: 'Automation',
            address: '100 Test Street',
            city: 'New York',
            state: 'NY',
            zipCode: '10001',
            phoneNumber: '5551234567',
            ssn: '123456789',

            // Exactly 20 characters
            username: `qa${uniqueId}`,

            password: 'QaTest@123'
        };
    }
}