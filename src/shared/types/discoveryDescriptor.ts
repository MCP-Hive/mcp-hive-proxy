import type { Tool } from './serverDescriptor.ts'

export interface DiscoveryToolStats {
    toolName: string
    stats: {
        calls: number
        latencyUsec: {
            avg: number
            p90: number
            p99: number
            p999: number
        }
        coverage: number
        errors: number
        accuracy: number
    }
    timestamp: string
}

export interface MCPServerDiscoveryResult {
    id: string
    name: string
    description: string
    categories: string[]
    tags: string[]
    pricePerCall: number
    verified?: boolean
    tools: Tool[]
    toolStats: DiscoveryToolStats[]
}

/**
 * A single relevance-ranked (server, tool) result from ServerToolDiscovery
 * (discoverServers mode='prompt'). Highest `score` first.
 */
export interface DiscoveryRankedTool {
    serverId: string
    serverName: string
    toolName: string
    toolDescription: string
    score: number
}

export interface MCPHiveDiscoveryDesc {
    servers: MCPServerDiscoveryResult[]
    // Populated only for mode='prompt': tools ranked by relevance to the prompt.
    // `servers` carries the supporting detail (pricing, stats, full schema) for
    // the providers that own these tools.
    rankedTools?: DiscoveryRankedTool[]
}
