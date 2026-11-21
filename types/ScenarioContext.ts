
import { RegistrationData } from '../utils/TestDataFactory';

export interface ScenarioContext {
    user: RegistrationData;
    checkingAccountNumber: string;
    loanAccountNumber: string;
}
