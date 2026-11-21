
# ParaBank Automation Framework

A modular Playwright automation framework built using TypeScript for UI and API testing of the ParaBank application.

## Tech Stack

- Playwright
- TypeScript
- Node.js
- Page Object Model (POM)
- REST API testing
- Custom HTML Reporter
- ExcelJS
- dotenv

## Project Structure

```text
PlaywrightAutomation/
│
├── api/
│   └── services/
│       ├── CustomerService.ts
│       ├── AccountService.ts
│       └── TransactionService.ts
│
├── pages/
│   ├── RegisterPage.ts
│   ├── AccountsPage.ts
│   ├── LoanPage.ts
│   ├── TransferPage.ts
│   └── ParaBankLoginPage.ts
│
├── reports/
│   └── CustomReporter.ts
│
├── tests/
│   └── scenarios/
│       ├── ScenarioA.spec.ts
│       └── ScenarioC.spec.ts
│
├── types/
│   ├── Customer.ts
│   ├── Account.ts
│   └── Transaction.ts
│   ├── ScenariosContext.ts
│
├── utils/
│   ├── TestDataFactory.ts
│   └── ApiRequestLogger.ts
│   ├── ExcelUtils.ts
│
├── DECISIONS.md
├── README.md
├── playwright.config.ts
├── tsconfig.json
├── package.json
└── .env
```

## Prerequisites

Install the following:

- Node.js
- npm
- Git

## Installation

Clone the repository:

```bash
git clone <YOUR_REPOSITORY_URL>
cd PlaywrightAutomation
```

Install dependencies:

```bash
npm install
```

Install Playwright browsers:

```bash
npx playwright install
```

## Environment Configuration

Create a `.env` file in the project root:

```env
BASE_URL=https://parabank.parasoft.com
RESET_DATABASE=false
```

Database reset is disabled by default because ParaBank uses shared state.

## Execute Tests

Run all tests:

```bash
npx playwright test
```

Run Scenario A and Scenario B:

```bash
npx playwright test tests/scenarios/ScenarioA.spec.ts
```

Run Scenario C:

```bash
npx playwright test tests/scenarios/ScenarioC.spec.ts
```

Run a test with browser visible:

```bash
npx playwright test tests/scenarios/ScenarioA.spec.ts --headed
```

Run TypeScript validation:

```bash
npx tsc --noEmit
```

## Custom HTML Report

The framework generates a custom HTML execution dashboard.

Report location:

```text
reports/automation-report.html
```

The dashboard provides:

- Total, passed, failed, and skipped test counts.
- Execution duration.
- Test execution distribution.
- Test search and status filters.
- Step-level execution details.
- Console execution logs.
- API request and response details.
- HTTP status codes.
- API response timings.

Open the report in Chrome:

```powershell
Start-Process chrome .\reports\automation-report.html
```

Run tests first to generate the latest report.

## Test Scenarios

### Scenario A – Customer Registration, Account Creation and Loan Application

- Generate a unique customer.
- Register through the UI.
- Open a Checking account.
- Apply for a loan using dynamic account details.
- Validate loan approval and loan account information.
- Verify the loan down-payment debit transaction.

### Scenario B – Fund Transfers and Transaction Validation

- Reuse the customer created in Scenario A.
- Transfer $150, $25.50, and $8.99.
- Validate source account deductions.
- Retrieve transaction history.
- Calculate and validate transfer debit totals.

### Scenario C – API-Only Customer and Transaction Validation

- Create a customer through REST API.
- Retrieve customer accounts.
- Deposit $100.
- Validate updated account balance.
- Retrieve transaction history.
- Validate response schemas using TypeScript interfaces.

## Execution Strategy

Tests initially execute with a single worker to reduce conflicts in the shared ParaBank environment.

See [DECISIONS.md](./DECISIONS.md) for architecture and technical decisions.

## Notes

This framework uses the public ParaBank demo environment. Test data and backend state may be shared with other users.
