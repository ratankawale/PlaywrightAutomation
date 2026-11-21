
import { test, expect } from '@playwright/test';
import { TestDataFactory } from '../../utils/TestDataFactory';

test('Verify dynamic user generation', async () => {

    const user1 = TestDataFactory.generateUser();
    const user2 = TestDataFactory.generateUser();

    console.log('Generated User 1:', user1.username);
    console.log('Generated User 2:', user2.username);

    expect(user1.username).not.toBe(user2.username);

    expect(user1.username).toContain('qa');

    expect(user1.password).toBeTruthy();

});
