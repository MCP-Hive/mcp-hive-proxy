import type { Tool } from './serverDescriptor.ts'

/**
 * @deprecated Shape of the removed `mode=category`/`mode=keyword` responses.
 * `discoverServers` returns {@link MCPHiveDiscoveryDesc} — a `rankedActions`
 * list — and never this. Retained only so existing compiles do not break.
 */
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

/**
 * @deprecated Shape of the removed `mode=category`/`mode=keyword` responses.
 * See {@link DiscoveryToolStats}.
 */
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
 * One ready-to-invoke action from `discoverServers`, shaped to feed `callServer`
 * directly: pass `server`, `tool` and `args` straight through.
 *
 * Mirrors `MCPServerAction` in the hub (src/discovery/types.ts). Highest `score`
 * first, though `score` is lane-relative and is not comparable between tool
 * actions and article actions.
 */
export interface MCPServerAction {
    /** Provider name — `callServer`'s `server`. */
    server: string
    /** Tool name — `callServer`'s `tool`. */
    tool: string
    /** Pre-bound args (e.g. `{ url }` for an article); `{}` when the caller fills them. */
    args: Record<string, unknown>
    /**
     * The assembled invocation — pass straight to `callServer`, copying `args`
     * verbatim. Duplicates `server`/`tool`/`args` so the call never has to be
     * reconstructed from the entry's other fields.
     */
    callServer: {
        server: string
        tool: string
        args: Record<string, unknown>
    }
    /** Full tool definition, so the caller can complete `args`. */
    toolSchema: Tool
    /** Cost to invoke, in USD. */
    pricePerCall: number
    verified: boolean
    score: number
    /** Why a tool the prompt could not have named was surfaced. */
    bridgeReason?: string
    /** Observed quality, when the analyzer has measured this tool. */
    stats?: {
        calls: number
        latencyP90Usec: number
        /** Ratio, 0-1. */
        errors: number
    }
    /** Present for article actions: human-facing metadata. */
    display?: {
        title: string
        publisher: string
        author?: string
        publishedDate?: string
    }
}

/** The `discoverServers` response. One mode, one shape. */
export interface MCPHiveDiscoveryDesc {
    /**
     * How to invoke the entries below. Carried in `structuredContent` because a
     * client holding both channels forwards the structured payload and drops
     * the text one.
     */
    usage: string
    rankedActions: MCPServerAction[]
}
