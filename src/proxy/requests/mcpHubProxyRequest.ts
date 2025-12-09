import crypto from 'crypto'
import { USER_AGENT } from '../../shared/constants.ts'
import { MCPHubProxy } from '../mcpHubProxy.ts'
import type { RequestBody, RequestArgs } from '../../shared/types/request.ts'
import { Logger } from '../../shared/logger.ts'

/**
 * General tool for sending requests to MCP-HUB Server
 */
export class MCPHubProxyRequest {
    /**
     * send one request to the MCP-HUB server
     *
     * @param mcpServer name of server we are proxy'ing
     * @param method which method is being called
     * @param toolName the tool being called
     * @param requestArgs the arguments supplied to the tool
     *
     * @returns result of the tool call
     */
    static async sendMCPHubRequest<T>(
        mcpServer: string,
        method: string,
        toolName: string,
        requestArgs: RequestArgs,
    ): Promise<T | null> {
        // get the system config
        const mcpHubProxyConfig = MCPHubProxy.getInstance().config

        // call headers
        const headers = {
            'User-Agent': USER_AGENT,
            'Content-Type': 'application/json',
        }

        // request body, currently assuming that method is a tool call
        const body: RequestBody = {
            mcpServer,
            credentials: mcpHubProxyConfig.credentials,
            request: {
                id: crypto.randomInt(1, 2 ** 48),
                method,
                params: {
                    name: toolName,
                    arguments: requestArgs,
                },
            },
        }

        try {
            // call the MCP HUB server using `fetch`
            const response = await fetch(mcpHubProxyConfig.MCPHubURL, {
                headers,
                body: JSON.stringify(body),
                method: 'POST',
            })
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
            return (await response.json()) as T
        } catch (error) {
            if (error instanceof TypeError) {
                Logger.error(
                    `Failed to connect to MCP-HUB Server.  Is it running?\nError message is ${error.message}`,
                )
                return null
            }
            Logger.error(
                `Fatal error making MCP-HUB request. Error message is:\n${error as Error}`,
            )
            return null
        }
    }
}
