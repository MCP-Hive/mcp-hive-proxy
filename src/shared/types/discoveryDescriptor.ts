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
    toolCount: number
    toolStats: DiscoveryToolStats[]
}

export interface MCPHubDiscoveryDesc {
    servers: MCPServerDiscoveryResult[]
    totalCount: number
}

// Type guard for MCPHubDiscoveryDesc
export function isMCPHubDiscoveryDesc(
    obj: unknown,
): obj is MCPHubDiscoveryDesc {
    if (
        obj !== null &&
        typeof obj === 'object' &&
        'servers' in obj &&
        Array.isArray((obj as MCPHubDiscoveryDesc).servers) &&
        'totalCount' in obj &&
        typeof (obj as MCPHubDiscoveryDesc).totalCount === 'number'
    ) {
        return true
    }
    return false
}
