
import { test, expect } from '@playwright/test';
import { AdminService } from '../../api/services/AdminService';

test('Verify Loan Provider API configuration', async ({ request, page }) => {

    const adminService = new AdminService(request);

    // Set Loan Provider to Web Service through API
    await adminService.setParameter('loanProvider', 'ws');

    // Verify the configuration in the UI
    await page.goto('/parabank/admin.htm');

    await expect(page.locator('#loanProvider')).toHaveValue('ws');

    console.log('Loan Provider successfully configured as Web Service');
});
