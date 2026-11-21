
import 'dotenv/config';
import { defineConfig } from '@playwright/test';

export default defineConfig({
    testDir: './tests',

    // ParaBank uses shared, stateful data.
    // Start with one worker to avoid test data conflicts.
    fullyParallel: false,
    workers: 1,

    timeout: 60000,
    expect: {
        timeout: 10000
    },

    reporter: [
        ['list'],
        ['./reports/CustomReporter.ts']
    ],

    use: {
        baseURL: process.env.BASE_URL,

        headless: true,

        screenshot: 'only-on-failure',
        video: 'retain-on-failure',
        trace: 'retain-on-failure'
    },

    outputDir: './test-results'
});
