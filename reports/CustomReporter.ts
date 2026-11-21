import type {
    FullConfig,
    FullResult,
    Reporter,
    Suite,
    TestCase,
    TestResult,
    TestStep
} from '@playwright/test/reporter';

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

interface TestRecord {
    title: string;
    file: string;
    status: string;
    duration: number;
    error: string;
    steps: StepRecord[];
    logs: string[];
}

interface StepRecord {
    title: string;
    duration: number;
    status: string;
    error: string;
}

interface ApiCallRecord {
    method: string;
    endpoint: string;
    status: string;
    duration: string;
}

export default class CustomReporter implements Reporter {
    private readonly results = new Map<string, TestRecord>();
    private startTime = 0;

    private getRecord(test: TestCase): TestRecord {
        let record = this.results.get(test.id);

        if (!record) {
            record = {
                title: test.titlePath().join(' › '),
                file: test.location.file,
                status: 'running',
                duration: 0,
                error: '',
                steps: [],
                logs: []
            };

            this.results.set(test.id, record);
        }

        return record;
    }

    onStepEnd(test: TestCase, result: TestResult, step: TestStep): void {
        const record = this.getRecord(test);

        // Keep meaningful test steps, not internal Playwright hooks.
        if (step.category !== 'test.step') {
            return;
        }

        record.steps.push({
            title: step.title,
            duration: step.duration,
            status: step.error ? 'failed' : 'passed',
            error: step.error?.message ?? ''
        });
    }

    onStdOut(chunk: string | Buffer, test?: TestCase): void {
        if (test) {
            this.getRecord(test).logs.push(String(chunk));
        }
    }

    onStdErr(chunk: string | Buffer, test?: TestCase): void {
        if (test) {
            this.getRecord(test).logs.push(String(chunk));
        }
    }

    onBegin(_config: FullConfig, suite: Suite): void {
        this.startTime = Date.now();
        console.log(`Starting test execution: ${suite.allTests().length} tests`);
    }

    onTestEnd(test: TestCase, result: TestResult): void {
    const record = this.getRecord(test);
    record.status = result.status;
    record.duration = result.duration;
    record.error = result.error?.message ?? '';
}

    async onEnd(result: FullResult): Promise<void> {
        const records = Array.from(this.results.values());

        const passed = records.filter(r => r.status === 'passed').length;
        const failed = records.filter(
            r => ['failed', 'timedOut', 'interrupted'].includes(r.status)
        ).length;
        const skipped = records.filter(r => r.status === 'skipped').length;

        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);

        const html = this.generateHtml(
            records,
            passed,
            failed,
            skipped,
            duration,
            result.status
        );

        const reportDirectory = path.join(process.cwd(), 'reports');

        await mkdir(reportDirectory, { recursive: true });

        const reportPath = path.join(
            reportDirectory,
            'automation-report.html'
        );

        await writeFile(reportPath, html, 'utf-8');

        console.log(`Custom HTML report generated: ${reportPath}`);
    }

    private escapeHtml(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private extractApiCalls(logs: string[]): ApiCallRecord[] {
    const lines = logs.join('').split(/\r?\n/);
    const apiCalls: ApiCallRecord[] = [];

    for (const line of lines) {
        const requestMatch = line.match(
            /\[API REQUEST\]\s+(\w+)\s+(.+)/
        );

        if (requestMatch) {
            apiCalls.push({
                method: requestMatch[1],
                endpoint: requestMatch[2],
                status: 'Pending',
                duration: '—'
            });
            continue;
        }

        const responseMatch = line.match(
            /\[API RESPONSE\]\s+(\w+)\s+(.+?)\s+\|\s+Status:\s+(\d+)\s+\|\s+Duration:\s+(\d+)\s+ms/
        );

        if (responseMatch) {
            const [, method, endpoint, status, duration] = responseMatch;

            const pendingCall = [...apiCalls].reverse().find(call =>
                call.method === method &&
                call.endpoint === endpoint &&
                call.status === 'Pending'
            );

            if (pendingCall) {
                pendingCall.status = status;
                pendingCall.duration = `${duration} ms`;
            }

            continue;
        }

        const errorMatch = line.match(
            /\[API ERROR\]\s+(\w+)\s+(.+?)\s+\|\s+Duration:\s+(\d+)\s+ms/
        );

        if (errorMatch) {
            const [, method, endpoint, duration] = errorMatch;

            const pendingCall = [...apiCalls].reverse().find(call =>
                call.method === method &&
                call.endpoint === endpoint &&
                call.status === 'Pending'
            );

            if (pendingCall) {
                pendingCall.status = 'ERROR';
                pendingCall.duration = `${duration} ms`;
            } else {
                apiCalls.push({
                    method,
                    endpoint,
                    status: 'ERROR',
                    duration: `${duration} ms`
                });
            }
        }
    }

    return apiCalls;
}

    private generateHtml(
        records: TestRecord[],
        passed: number,
        failed: number,
        skipped: number,
        duration: string,
        runStatus: string
    ): string {
        const total = records.length;

        const passedPercent = total ? (passed / total) * 100 : 0;
        const failedPercent = total ? (failed / total) * 100 : 0;
        const skippedPercent = total ? (skipped / total) * 100 : 0;

  const testRows = records.map(record => {
    const category =
        record.status === 'passed' ? 'passed' :
        record.status === 'skipped' ? 'skipped' : 'failed';

    const stepsHtml = record.steps.map((step, index) => `
        <div class="step-item">
            <span>${index + 1}. ${this.escapeHtml(step.title)}</span>
            <span class="${step.status}">
                ${step.status.toUpperCase()}
            </span>
            <span>${(step.duration / 1000).toFixed(2)}s</span>
            ${step.error
                ? `<pre>${this.escapeHtml(step.error)}</pre>`
                : ''}
        </div>
    `).join('');

        const apiCalls = this.extractApiCalls(record.logs);

    const apiCallsHtml = apiCalls.map(api => `
        <tr>
            <td>${this.escapeHtml(api.method)}</td>
            <td class="api-endpoint">${this.escapeHtml(api.endpoint)}</td>
            <td class="${api.status === 'ERROR' ? 'failed' : 'passed'}">
                ${this.escapeHtml(api.status)}
            </td>
            <td>${this.escapeHtml(api.duration)}</td>
        </tr>
    `).join('');

    const apiHtml = `
        <details>
            <summary>View API Calls (${apiCalls.length})</summary>
            <div class="api-table-container">
                <table class="api-table">
                    <thead>
                        <tr>
                            <th>Method</th>
                            <th>Endpoint</th>
                            <th>HTTP Status</th>
                            <th>Response Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${apiCallsHtml || `
                            <tr><td colspan="4">No API calls captured</td></tr>
                        `}
                    </tbody>
                </table>
            </div>
        </details>
    `;            


    const logsHtml = record.logs.map(log => `
        <div class="log-line">${this.escapeHtml(log)}</div>
    `).join('');

    return `
        <tr data-status="${category}"
            data-search="${this.escapeHtml(
                `${record.title} ${record.file}`.toLowerCase()
            )}">
            <td>${this.escapeHtml(record.title)}</td>
            <td class="file-cell">${this.escapeHtml(record.file)}</td>
            <td>
                <span class="status ${category}">
                    ${this.escapeHtml(record.status.toUpperCase())}
                </span>
            </td>
            <td>${(record.duration / 1000).toFixed(2)}s</td>
            <td>
                <details>
                    <summary>View Steps (${record.steps.length})</summary>
                    ${stepsHtml || '<p>No steps recorded</p>'}
                </details>
                 ${apiHtml}

                <details>
                    <summary>View Logs (${record.logs.length})</summary>
                    <div class="log-container">
                        ${logsHtml || '<p>No logs captured</p>'}
                    </div>
                </details>

                ${record.error
                    ? `<details>
                           <summary>View Test Error</summary>
                           <pre>${this.escapeHtml(record.error)}</pre>
                       </details>`
                    : ''}
            </td>
        </tr>
    `;
}).join('');

        return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParaBank Automation Dashboard</title>

    <style>
        * {
            box-sizing: border-box;
        }

        body {
            margin: 0;
            padding: 35px;
            font-family: Arial, sans-serif;
            color: #f5f5f5;
            background: linear-gradient(135deg, #101827, #26364d);
        }

        .container {
            max-width: 1450px;
            margin: auto;
        }

        header {
            margin-bottom: 30px;
            border-left: 5px solid #F48031;
            padding-left: 18px;
        }

        header h1 {
            color: #F48031;
            margin-bottom: 8px;
        }

        header p {
            color: #cbd5e1;
        }

        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(170px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }

        .card, .panel {
            padding: 24px;
            border-radius: 16px;
            background: rgba(255, 255, 255, 0.10);
            border: 1px solid rgba(255, 255, 255, 0.18);
            backdrop-filter: blur(12px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
        }

        .card h3 {
            margin: 0 0 12px;
            color: #d1d5db;
            font-size: 15px;
        }

        .number {
            font-size: 32px;
            font-weight: bold;
            color: #F48031;
        }

        .passed {
            color: #F48031;
        }

        .failed {
            color: #ff6868;
        }

        .skipped {
            color: #facc15;
        }

        .analytics {
            display: grid;
            grid-template-columns: minmax(220px, 0.8fr) 1.2fr;
            gap: 20px;
            margin-bottom: 30px;
        }

        .chart-area {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 28px;
            flex-wrap: wrap;
            padding: 15px 0;
        }

        .chart {
            width: 175px;
            height: 175px;
            border-radius: 50%;
            background: conic-gradient(
                #F48031 0% ${passedPercent}%,
                #ff6868 ${passedPercent}% ${passedPercent + failedPercent}%,
                #facc15 ${passedPercent + failedPercent}% 100%
            );
            position: relative;
        }

        .chart::after {
            content: "${total}";
            position: absolute;
            inset: 28px;
            border-radius: 50%;
            background: #1b293d;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 30px;
            font-weight: bold;
        }

        .legend {
            display: grid;
            gap: 14px;
        }

        .legend-item {
            display: flex;
            align-items: center;
            gap: 10px;
            color: #e5e7eb;
        }

        .dot {
            width: 11px;
            height: 11px;
            border-radius: 50%;
        }

        .dot.passed { background: #F48031; }
        .dot.failed { background: #ff6868; }
        .dot.skipped { background: #facc15; }

        .filters {
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            margin: 20px 0;
        }

        .filter-btn {
            padding: 10px 18px;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            color: #fff;
            cursor: pointer;
        }

        .filter-btn:hover,
        .filter-btn.active {
            background: #F48031;
            border-color: #F48031;
            color: #111827;
            font-weight: bold;
        }

        .search-box {
            width: 100%;
            max-width: 420px;
            padding: 12px 15px;
            border: 1px solid rgba(255,255,255,0.2);
            border-radius: 8px;
            background: rgba(255,255,255,0.08);
            color: white;
            font-size: 14px;
        }

        .search-box::placeholder {
            color: #cbd5e1;
        }

        .table-container {
            overflow-x: auto;
            border-radius: 14px;
            background: rgba(255, 255, 255, 0.08);
            padding: 20px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            min-width: 900px;
        }

        th, td {
            padding: 14px;
            text-align: left;
            vertical-align: top;
            border-bottom: 1px solid rgba(255, 255, 255, 0.12);
        }

        th {
            color: #F48031;
            background: rgba(255, 255, 255, 0.06);
        }

        .status {
            font-weight: bold;
        }

        .error-details summary {
            color: #ff9999;
            cursor: pointer;
        }

        .error-details pre {
            white-space: pre-wrap;
            overflow-wrap: anywhere;
            max-width: 450px;
            color: #ffb4b4;
            font-size: 12px;
        }

        .no-error {
            color: #9ca3af;
        }

        .file-cell {
            overflow-wrap: anywhere;
        }

        #emptyMessage {
            display: none;
            padding: 20px;
            text-align: center;
            color: #cbd5e1;
        }

        @media (max-width: 750px) {
            body {
                padding: 16px;
            }

            .analytics {
                grid-template-columns: 1fr;
            }
                .step-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    padding: 10px;
    margin: 6px 0;
    background: rgba(255,255,255,0.06);
    border-radius: 6px;
    font-size: 13px;
}

.step-item pre,
details pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    color: #ffb4b4;
}

details {
    margin: 8px 0;
}

summary {
    cursor: pointer;
    color: #F48031;
    font-weight: bold;
    padding: 6px 0;
}

.log-container {
    max-height: 300px;
    overflow: auto;
    padding: 12px;
    background: rgba(0,0,0,0.25);
    border-radius: 8px;
}
    .api-table-container {
    overflow-x: auto;
    margin: 10px 0;
}

.api-table {
    width: 100%;
    min-width: 600px;
    border-collapse: collapse;
    font-size: 12px;
}

.api-table th,
.api-table td {
    padding: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.12);
    text-align: left;
}

.api-table th {
    color: #F48031;
    background: rgba(255,255,255,0.06);
}

.api-endpoint {
    overflow-wrap: anywhere;
    font-family: Consolas, monospace;
}

.log-line {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    font-family: Consolas, monospace;
    font-size: 12px;
    padding: 3px 0;
    color: #d1d5db;
}
        }
    </style>
</head>

<body>
    <main class="container">
        <header>
            <h1>Playwright Automation Dashboard</h1>
            <p>ParaBank Test Execution Report</p>
            <p>Execution status: ${this.escapeHtml(runStatus.toUpperCase())}</p>
            <p>Generated: ${this.escapeHtml(new Date().toLocaleString())}</p>
        </header>

        <section class="summary">
            <div class="card">
                <h3>Total Tests</h3>
                <div class="number">${total}</div>
            </div>

            <div class="card">
                <h3>Passed</h3>
                <div class="number passed">${passed}</div>
            </div>

            <div class="card">
                <h3>Failed</h3>
                <div class="number failed">${failed}</div>
            </div>

            <div class="card">
                <h3>Skipped</h3>
                <div class="number skipped">${skipped}</div>
            </div>

            <div class="card">
                <h3>Duration</h3>
                <div class="number">${duration}s</div>
            </div>
        </section>

        <section class="analytics">
            <div class="panel">
                <h2>Execution Distribution</h2>
                <div class="chart-area">
                    <div class="chart" role="img"
                         aria-label="Test execution distribution"></div>

                    <div class="legend">
                        <div class="legend-item">
                            <span class="dot passed"></span>
                            Passed: ${passed}
                        </div>
                        <div class="legend-item">
                            <span class="dot failed"></span>
                            Failed: ${failed}
                        </div>
                        <div class="legend-item">
                            <span class="dot skipped"></span>
                            Skipped: ${skipped}
                        </div>
                    </div>
                </div>
            </div>

            <div class="panel">
                <h2>Test Result Filters</h2>

                <div class="filters">
                    <button class="filter-btn active" data-filter="all">
                        All (${total})
                    </button>
                    <button class="filter-btn" data-filter="passed">
                        Passed (${passed})
                    </button>
                    <button class="filter-btn" data-filter="failed">
                        Failed (${failed})
                    </button>
                    <button class="filter-btn" data-filter="skipped">
                        Skipped (${skipped})
                    </button>
                </div>

                <input
                    id="searchInput"
                    class="search-box"
                    type="search"
                    placeholder="Search test name or file..."
                />

                <p id="visibleCount">Showing ${total} of ${total} tests</p>
            </div>
        </section>

        <section class="table-container">
            <h2>Test Execution Details</h2>

            <table>
                <thead>
                    <tr>
                        <th>Test Name</th>
                        <th>File</th>
                        <th>Status</th>
                        <th>Duration</th>
                        <th>Steps & Execution Logs</th>
                    </tr>
                </thead>

                <tbody id="testTableBody">
                    ${testRows}
                </tbody>
            </table>

            <div id="emptyMessage">No matching tests found.</div>
        </section>
    </main>

    <script>
        const rows = Array.from(
            document.querySelectorAll('#testTableBody tr')
        );

        const filterButtons = document.querySelectorAll('.filter-btn');
        const searchInput = document.getElementById('searchInput');
        const visibleCount = document.getElementById('visibleCount');
        const emptyMessage = document.getElementById('emptyMessage');

        let activeFilter = 'all';

        function applyFilters() {
            const searchText = searchInput.value.trim().toLowerCase();
            let visibleRows = 0;

            rows.forEach(row => {
                const statusMatch =
                    activeFilter === 'all' ||
                    row.dataset.status === activeFilter;

                const searchMatch =
                    row.dataset.search.includes(searchText);

                const shouldShow = statusMatch && searchMatch;

                row.hidden = !shouldShow;

                if (shouldShow) {
                    visibleRows++;
                }
            });

            visibleCount.textContent =
                'Showing ' + visibleRows + ' of ' + rows.length + ' tests';

            emptyMessage.style.display =
                visibleRows === 0 ? 'block' : 'none';
        }

        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                filterButtons.forEach(item =>
                    item.classList.remove('active')
                );

                button.classList.add('active');
                activeFilter = button.dataset.filter;

                applyFilters();
            });
        });

        searchInput.addEventListener('input', applyFilters);
    </script>
</body>
</html>
        `;
    }
}