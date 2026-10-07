import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { ListToolsResult } from '@modelcontextprotocol/sdk/types.js'

type RequestHandler = (request: unknown, extra: unknown) => Promise<unknown>

/**
 * The SDK converts our Zod (v3) tool schemas to JSON Schema via zod-to-json-schema, which stamps every
 * schema with "$schema": "http://json-schema.org/draft-07/schema#". MCP clients whose validators only
 * support JSON Schema 2020-12 (the MCP default dialect) then reject the tool outright, e.g.
 * "Tool 'discoverServers' has an invalid outputSchema: JSON Schema declares an unsupported dialect".
 *
 * The schemas we emit use only keywords whose meaning is identical in draft-07 and 2020-12, so we drop
 * the dialect declaration and let clients apply the default.
 */
export class SchemaDialect {
    /**
     * Wrap the server's tools/list handler so that the "$schema" key is removed from every tool's
     * inputSchema and outputSchema. Must be called after the first registerTool(), which is when the
     * SDK installs its tools/list handler. A no-op if no tools were registered.
     *
     * Relies on the SDK's private Protocol._requestHandlers map; covered by SchemaDialect.test.ts so an
     * SDK upgrade that changes it fails loudly.
     */
    public static stripFromToolsList(mcpServer: McpServer): void {
        const handlers = (
            mcpServer.server as unknown as {
                _requestHandlers: Map<string, RequestHandler>
            }
        )._requestHandlers
        const listTools = handlers.get('tools/list')
        if (!listTools) {
            return
        }
        handlers.set('tools/list', async (request, extra) => {
            const result = (await listTools(request, extra)) as ListToolsResult
            for (const tool of result.tools) {
                delete tool.inputSchema.$schema
                if (tool.outputSchema) {
                    delete tool.outputSchema.$schema
                }
            }
            return result
        })
    }
}
