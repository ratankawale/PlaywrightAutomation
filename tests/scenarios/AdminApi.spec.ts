
import { test } from '@playwright/test';
import { AdminService } from '../../api/services/AdminService';

test.describe('ParaBank Admin API', () => {

    test('Verify ParaBank application availability', async ({ request }) => {

        const adminService = new AdminService(request);

        await adminService.verifyApplicationAvailability();

    });

});
