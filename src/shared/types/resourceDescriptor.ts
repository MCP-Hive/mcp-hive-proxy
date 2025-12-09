// Resource descriptor from MCP SDK
export interface Resource {
    uri: string
    name: string
    description?: string | undefined
    mimeType?: string | undefined
}

// Type guard for a resource in a server descriptor
export function isResource(obj: unknown): obj is Resource {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof (obj as Resource).uri === 'string' &&
        typeof (obj as Resource).name === 'string'
    )
}

// Server descriptor with resources
export interface MCPHubResourcesDesc {
    id: string
    server: string
    resources: Resource[]
}

// Type guard for a resources descriptor
export function isMCPHubResourcesDesc(
    obj: unknown,
): obj is MCPHubResourcesDesc {
    if (
        obj !== null &&
        typeof obj === 'object' &&
        typeof (obj as MCPHubResourcesDesc).id === 'string' &&
        typeof (obj as MCPHubResourcesDesc).server === 'string' &&
        typeof (obj as MCPHubResourcesDesc).resources === 'object' &&
        Array.isArray((obj as MCPHubResourcesDesc).resources)
    ) {
        for (const r of (obj as MCPHubResourcesDesc).resources) {
            if (!isResource(r)) {
                return false
            }
        }

        return true
    }
    return false
}

// Resource content returned from read operations
export interface ResourceContent {
    uri: string
    mimeType?: string
    text?: string
    blob?: string // Base64-encoded binary
}

// Type guard for resource content
export function isResourceContent(obj: unknown): obj is ResourceContent {
    return (
        obj !== null &&
        typeof obj === 'object' &&
        typeof (obj as ResourceContent).uri === 'string' &&
        ((obj as ResourceContent).text !== undefined ||
            (obj as ResourceContent).blob !== undefined)
    )
}
