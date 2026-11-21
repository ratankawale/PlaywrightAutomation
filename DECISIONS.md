
# Technical Decisions – ParaBank Automation Framework

## 1. Handling Shared State and CI Worker Contention

### Problem
ParaBank is a shared, stateful application. Parallel test execution can cause data conflicts when multiple workers create customers, accounts, or perform transactions simultaneously.

### Decision
- Configure Playwright with `workers: 1` initially.
- Set `fullyParallel: false`.
- Generate unique usernames for every test execution.
- Reuse Scenario A customer data in Scenario B through shared scenario context.
- Keep database reset disabled by default.
- Allow database reset only through an explicit environment configuration.

### Reason
Running database cleanup during every test execution can affect other users because ParaBank uses shared backend data.

For reliable parallel CI execution, a dedicated isolated ParaBank environment or database is recommended.

---

## 2. Handling Currency Precision

### Problem
JavaScript floating-point calculations can introduce precision errors when comparing currency values.

For example:
`0.1 + 0.2` may produce `0.30000000000000004`.

### Decision
Perform currency comparisons using integer cents.

Example:

```typescript
const toCents = (amount: number): number =>
    Math.round(amount * 100);

const actual = toCents(184.49);
const expected = toCents(150 + 25.50 + 8.99);

expect(actual).toBe(expected);
```

### Reason
Integer-based comparisons avoid floating-point precision issues during financial transaction validation.

---

## 3. API and UI Testing Boundaries

### Decision

Use API automation for:
- Customer creation in Scenario C.
- Account retrieval.
- Depositing funds.
- Retrieving transaction history.
- Validating backend response schemas.
- Application configuration and preconditions.

Use UI automation for:
- Customer registration in Scenario A.
- Checking account creation.
- Loan application.
- Money transfers.
- Transaction page validation.

### Reason
API testing provides faster backend validation, while UI testing verifies actual user workflows and application behavior.

Scenario C is intentionally implemented as a headless API-only test.

---

## 4. Framework Architecture

The framework follows a modular Page Object Model architecture.

Responsibilities are separated into:
- Pages: UI interactions and locators.
- API Services: Backend operations.
- Types: TypeScript response interfaces.
- Utilities: Test data generation and API logging.
- Scenarios: Business workflow execution.
- Reporter: Custom HTML execution dashboard.

### Reason
This structure improves maintainability, reusability, readability, and debugging.

---

## 5. Reporting Strategy

### Decision
Implement a custom Playwright reporter instead of relying on the default HTML reporter or Allure.

The dashboard includes:
- Execution summary cards.
- Passed, failed, and skipped test counts.
- Execution distribution chart.
- Test filtering and search.
- Step-level execution details.
- Console execution logs.
- API request and response details.
- HTTP status codes and response timings.

### Reason
A custom dashboard provides a centralized view of UI and API execution information in one report.
