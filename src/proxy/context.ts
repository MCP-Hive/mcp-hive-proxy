import { AsyncLocalStorage } from 'async_hooks'

/**
 * Request context for per-request data in HTTP mode.
 * Used to pass credentials from HTTP headers to the request handlers.
 */
export interface RequestContext {
    credentials: string
}

// AsyncLocalStorage instance for request-scoped context
const asyncLocalStorage = new AsyncLocalStorage<RequestContext>()

/**
 * Get the current request context.
 * Returns undefined if called outside of a request context (e.g., in stdio mode).
 */
export function getRequestContext(): RequestContext | undefined {
    return asyncLocalStorage.getStore()
}

/**
 * Run a function within a request context.
 * Used by the HTTP server to scope credentials to each request.
 */
export function runWithContext<T>(
    context: RequestContext,
    fn: () => T | Promise<T>,
): T | Promise<T> {
    return asyncLocalStorage.run(context, fn)
}
