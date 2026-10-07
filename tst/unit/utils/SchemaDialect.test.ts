import { describe, it } from 'node:test'
import assert from 'node:assert'
import { z } from 'zod'
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js'
import { SchemaDialect } from '../../../src/proxy/utils/SchemaDialect.ts'

async function listTools(strip: boolean) {
    const server = new McpServer({ name: 'test', version: '1.0.0' })
    server.registerTool(
        'discoverServers',
        {
            title: 'discoverServers',
            description: 'test tool',
            inputSchema: { prompt: z.string() },
            outputSchema: { usage: z.string().optional() },
        },
        () => ({
            content: [],
            structuredContent: { usage: 'u' },
        }),
    )
    if (strip) {
        SchemaDialect.stripFromToolsList(server)
    }

    const [clientTransport, serverTransport] =
        InMemoryTransport.createLinkedPair()
    const client = new Client({ name: 'test-client', version: '1.0.0' })
    await server.connect(serverTransport)
    await client.connect(clientTransport)
    try {
        return (await client.listTools()).tools
    } finally {
        await client.close()
        await server.close()
    }
}

describe('SchemaDialect', () => {
    it('SDK stamps draft-07 $schema on tool schemas (precondition)', async () => {
        // if this starts failing, the SDK no longer emits draft-07 and the workaround may be removable
        const [tool] = await listTools(false)
        assert.strictEqual(
            tool!.outputSchema!['$schema'],
            'http://json-schema.org/draft-07/schema#',
        )
    })

    it('removes $schema from inputSchema and outputSchema', async () => {
        const [tool] = await listTools(true)
        assert.ok(!('$schema' in tool!.inputSchema))
        assert.ok(!('$schema' in tool!.outputSchema!))
        assert.strictEqual(tool!.outputSchema!.type, 'object')
        assert.deepStrictEqual(tool!.inputSchema.required, ['prompt'])
    })

    it('is a no-op when no tools are registered', () => {
        const server = new McpServer({ name: 'test', version: '1.0.0' })
        assert.doesNotThrow(() => SchemaDialect.stripFromToolsList(server))
    })
})
