
import type { APIRequestContext, APIResponse } from '@playwright/test';

function sanitizeUrl(url: string): string {
    return url.replace(
        /\/services\/bank\/login\/[^/?]+\/[^/?]+/i,
        '/services/bank/login/[REDACTED]/[REDACTED]'
    );
}

export function withApiLogging(
    api: APIRequestContext
): APIRequestContext {

    const methods = [
        'get',
        'post',
        'put',
        'patch',
        'delete',
        'head',
        'fetch'
    ];

    return new Proxy(api, {
        get(target, property) {
            const original = Reflect.get(target, property, target);

            if (
                typeof property !== 'string' ||
                !methods.includes(property) ||
                typeof original !== 'function'
            ) {
                return typeof original === 'function'
                    ? original.bind(target)
                    : original;
            }

            return async (...args: unknown[]): Promise<APIResponse> => {
                const url = String(args[0]);
                const method = property.toUpperCase();
                const startTime = Date.now();

                // Log API request
                console.log(
                    `[API REQUEST] ${method} ${sanitizeUrl(url)}`
                );

                try {
                    const response: APIResponse =
                        await original.apply(target, args);

                    const responseTime = Date.now() - startTime;

                    // Log API response
                    console.log(
                        `[API RESPONSE] ${method} ${sanitizeUrl(url)} | ` +
                        `Status: ${response.status()} | ` +
                        `Duration: ${responseTime} ms`
                    );

                    return response;

                } catch (error) {
                    const responseTime = Date.now() - startTime;

                    // Log API error
                    console.error(
                        `[API ERROR] ${method} ${sanitizeUrl(url)} | ` +
                        `Duration: ${responseTime} ms | ${String(error)}`
                    );

                    throw error;
                }
            };
        }
    }) as APIRequestContext;
}
