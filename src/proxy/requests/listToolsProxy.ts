import {
    MCPHUB_SERVER,
    METHOD_TOOLS_CALL,
    MCPHUB_TOOL_LIST_TOOLS,
} from '../../shared/constants.ts'
import type { McpResult } from '../../shared/types/request.ts'
import type { MCPHubServerDesc } from '../../shared/types/serverDescriptor.ts'
import { isMCPHubServerDesc } from '../../shared/types/serverDescriptor.ts'
import { MCPHubProxyRequest } from './mcpHubProxyRequest.ts'

export class ListToolsProxy {
    /**
     * Forward the ListTools meta-tool to the server. This helps fullfill a client-local
     * call to listTools.
     *
     * @param server the MCP server that is being proxy'd
     *
     * @returns a structure which contains listTools information, including a list of tools and
     * their schema
     */
    public static async exec(server: string): Promise<MCPHubServerDesc> {
        const result = await MCPHubProxyRequest.sendMCPHubRequest<McpResult>(
            MCPHUB_SERVER,
            METHOD_TOOLS_CALL,
            MCPHUB_TOOL_LIST_TOOLS,
            { server },
        )
        if (result && isMCPHubServerDesc(result.structuredContent)) {
            return result.structuredContent
        } else {
            throw new Error('Invalid response format from MCP-HUB')
        }
    }
}
