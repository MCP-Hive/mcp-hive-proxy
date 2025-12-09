import {
    MCPHUB_SERVER,
    METHOD_TOOLS_CALL,
    MCPHUB_TOOL_LIST_RESOURCES,
} from '../../shared/constants.ts'
import type { McpResult } from '../../shared/types/request.ts'
import type { MCPHubResourcesDesc } from '../../shared/types/resourceDescriptor.ts'
import { isMCPHubResourcesDesc } from '../../shared/types/resourceDescriptor.ts'
import { MCPHubProxyRequest } from './mcpHubProxyRequest.ts'

export class ListResourcesProxy {
    /**
     * Forward the ListResources meta-tool to the server. This helps fulfill a client-local
     * call to listResources.
     *
     * @param server the MCP server that is being proxy'd
     *
     * @returns a structure which contains listResources information, including a list of resources
     * and their metadata
     */
    public static async exec(server: string): Promise<MCPHubResourcesDesc> {
        const result = await MCPHubProxyRequest.sendMCPHubRequest<McpResult>(
            MCPHUB_SERVER,
            METHOD_TOOLS_CALL,
            MCPHUB_TOOL_LIST_RESOURCES,
            { server },
        )
        if (result && isMCPHubResourcesDesc(result.structuredContent)) {
            return result.structuredContent
        } else {
            throw new Error('Invalid response format from MCP-HUB')
        }
    }
}
