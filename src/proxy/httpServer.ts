import http from 'http'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { runWithContext } from './context.ts'

/**
 * HTTP Server for MCP Hive Proxy.
 * Provides stateless Streamable HTTP transport for AppRunner deployment.
 */
export class HttpServer {
    private server: http.Server
    private mcpServer: McpServer
    private port: number
    private transport: StreamableHTTPServerTransport | null = null

    constructor(mcpServer: McpServer, port: number) {
        this.mcpServer = mcpServer
        this.port = port
        this.server = http.createServer((req, res) => {
            void this.handleRequest(req, res)
        })
    }

    /**
     * Extract credentials from request headers.
     * Supports Authorization: Bearer <token> or X-MCP-Credentials header.
     */
    private extractCredentials(req: http.IncomingMessage): string {
        // Try Authorization header first
        const authHeader = req.headers.authorization
        if (authHeader?.startsWith('Bearer ')) {
            return authHeader.slice(7)
        }

        // Try X-MCP-Credentials header
        const credHeader = req.headers['x-mcp-credentials']
        if (typeof credHeader === 'string') {
            return credHeader
        }

        return ''
    }

    /**
     * Parse JSON body from request
     */
    private async parseBody(req: http.IncomingMessage): Promise<unknown> {
        return new Promise((resolve, reject) => {
            let data = ''
            req.on('data', (chunk: Buffer) => {
                data += chunk.toString()
            })
            req.on('end', () => {
                try {
                    resolve(data ? JSON.parse(data) : {})
                } catch (e) {
                    reject(e instanceof Error ? e : new Error(String(e)))
                }
            })
            req.on('error', reject)
        })
    }

    /**
     * Send JSON response
     */
    private sendJson(
        res: http.ServerResponse,
        statusCode: number,
        data: unknown,
    ): void {
        const body = JSON.stringify(data)
        res.writeHead(statusCode, {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(body),
        })
        res.end(body)
    }

    /**
     * Handle incoming HTTP request
     */
    private async handleRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse,
    ): Promise<void> {
        const url = req.url || '/'

        // Health check endpoint
        if (url === '/health' && req.method === 'GET') {
            this.sendJson(res, 200, { status: 'healthy' })
            return
        }

        // MCP protocol endpoint
        if (url === '/mcp' && req.method === 'POST') {
            await this.handleMcpRequest(req, res)
            return
        }

        // 404 for other routes
        this.sendJson(res, 404, { error: 'Not found' })
    }

    /**
     * Handle MCP protocol request
     */
    private async handleMcpRequest(
        req: http.IncomingMessage,
        res: http.ServerResponse,
    ): Promise<void> {
        const credentials = this.extractCredentials(req)

        if (!credentials) {
            this.sendJson(res, 401, {
                jsonrpc: '2.0',
                error: {
                    code: -32600,
                    message:
                        'Missing credentials. Provide Authorization: Bearer <token> or X-MCP-Credentials header.',
                },
                id: null,
            })
            return
        }

        // Parse request body
        let body: unknown
        try {
            body = await this.parseBody(req)
        } catch {
            this.sendJson(res, 400, {
                jsonrpc: '2.0',
                error: {
                    code: -32700,
                    message: 'Parse error',
                },
                id: null,
            })
            return
        }

        // Run the MCP request within a context that provides credentials
        await runWithContext({ credentials }, async () => {
            // Initialize transport if not already done
            if (!this.transport) {
                this.transport = new StreamableHTTPServerTransport({
                    sessionIdGenerator: undefined, // Stateless mode
                    enableJsonResponse: true, // JSON-only responses, no SSE
                })
                await this.mcpServer.connect(this.transport)
            }

            // Handle the request through the transport
            try {
                await this.transport.handleRequest(req, res, body)
            } catch (error) {
                console.error(
                    `Error handling MCP request: ${error instanceof Error ? error.message : String(error)}`,
                )

                // Only send error response if not already sent
                if (!res.writableEnded) {
                    this.sendJson(res, 500, {
                        jsonrpc: '2.0',
                        error: {
                            code: -32603,
                            message: 'Internal error',
                        },
                        id: null,
                    })
                }
            }
        })
    }

    /**
     * Start the HTTP server.
     */
    public start(): void {
        this.server.listen(this.port, () => {
            console.log(
                `MCP Hive Proxy HTTP server listening on port ${this.port}`,
            )
        })
    }
}
