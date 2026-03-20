/**
 * Kraken API Provider & Tool Factory
 *
 * Complete Kraken integration:
 * - Authentication (API-Key + Signature)
 * - API call execution
 * - Tool factory for creating Kraken tools
 */

import {createHash, createHmac} from "node:crypto";
import type {z} from "zod";
import {httpClient, dynamicResourceManager, logger, zodToMcpJsonSchema} from "mcp-orbit";
import type {JsonSchema, MCPToolResult, Tool} from "mcp-orbit";

const krakenLogger = logger.child("kraken");
const krakenAuthLogger = krakenLogger.child("auth");

// ============================================================================
// KRAKEN AUTHENTICATION
// ============================================================================

export interface KrakenAuthConfig {
  endpoint: string;
  postData: Record<string, any>;
}

export class KrakenAuth {
  /**
   * Generate Kraken API authentication headers
   */
  generateHeaders(config: KrakenAuthConfig): {
    headers: Record<string, string>;
    nonce: string;
  } {
    const rawApiKey = process.env.KRAKEN_API_KEY;
    const apiKey = rawApiKey?.trim();
    const apiSecret = process.env.KRAKEN_PRIVATE_KEY?.trim();

    if (!apiKey || !apiSecret) {
      krakenAuthLogger.error("Missing ENV variables:");
      krakenAuthLogger.error(`  KRAKEN_API_KEY: ${apiKey ? "SET (len=" + apiKey.length + ")" : "MISSING"}`);
      krakenAuthLogger.error(`  KRAKEN_PRIVATE_KEY: ${apiSecret ? "SET (len=" + apiSecret.length + ")" : "MISSING"}`);
      krakenAuthLogger.error(
        `  Available ENV keys: ${Object.keys(process.env)
          .filter((k) => k.includes("KRAKEN"))
          .join(", ")}`,
      );
      throw new Error("KRAKEN_API_KEY and KRAKEN_PRIVATE_KEY must be set in environment");
    }

    const nonce = String(Date.now() * 1000); // Microsecond timestamp
    const dataWithNonce = {...config.postData, nonce};
    const postDataStr = new URLSearchParams(dataWithNonce).toString();

    // Generate signature (Kraken-specific algorithm)
    const encoded = nonce + postDataStr;
    const shaSum = createHash("sha256").update(encoded).digest();

    // Message = path (as Buffer) + shaSum (as Buffer)
    const pathBuffer = Buffer.from(config.endpoint, "utf8");
    const message = Buffer.concat([pathBuffer, shaSum]);

    const secret = Buffer.from(apiSecret, "base64");
    const hmac = createHmac("sha512", secret).update(message).digest("base64");

    return {
      headers: {
        "API-Key": apiKey,
        "API-Sign": hmac,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      nonce,
    };
  }
}

const krakenAuth = new KrakenAuth();

// ============================================================================
// KRAKEN API PROVIDER
// ============================================================================

export interface KrakenAPIConfig {
  endpoint: string;
  method: "GET" | "POST";
  isPrivate: boolean;
}

export interface KrakenCallOptions {
  // Provide known output schema (JSON Schema) for the dataset so the cached resource exposes precise data_schema
  schemaOverride?: Record<string, unknown>;
  toolDefinitionName?: string;
}

export class KrakenAPIProvider {
  name = "kraken";
  private baseUrl = "https://api.kraken.com";
  private pairCache: Map<string, {pair_decimals: number; lot_decimals: number}> | null = null;

  private async loadPairs(): Promise<void> {
    try {
      const res = await httpClient.request({url: `${this.baseUrl}/0/public/AssetPairs`, method: "GET", headers: {}});
      const data = JSON.parse(res.body);
      if (data.error?.length) return;
      this.pairCache = new Map();
      for (const [key, info] of Object.entries(data.result as Record<string, any>)) {
        const p = {pair_decimals: info.pair_decimals, lot_decimals: info.lot_decimals};
        this.pairCache.set(key, p);
        if (info.altname) this.pairCache.set(info.altname, p);
        if (info.wsname) this.pairCache.set(info.wsname, p);
      }
      krakenLogger.info(`Pair precision cache loaded (${this.pairCache.size} keys)`);
    } catch (e) {
      krakenLogger.error("Failed to load pair precision data:", e);
    }
  }

  private async sanitizeParams(params: Record<string, any>): Promise<Record<string, any>> {
    if (!params.pair || (!params.price && !params.price2 && !params.volume)) return params;
    if (!this.pairCache) await this.loadPairs();
    const p = this.pairCache?.get(params.pair);
    if (!p) return params;
    const out = {...params};
    if (out.price)  out.price  = parseFloat(out.price).toFixed(p.pair_decimals);
    if (out.price2) out.price2 = parseFloat(out.price2).toFixed(p.pair_decimals);
    if (out.volume) out.volume = parseFloat(out.volume).toFixed(p.lot_decimals);
    return out;
  }

  /**
   * Execute Kraken API call
   */
  async call(config: KrakenAPIConfig, params?: any, options?: KrakenCallOptions): Promise<MCPToolResult> {
    const {endpoint, method, isPrivate} = config;
    let url = `${this.baseUrl}${endpoint}`;
    let headers: Record<string, string> = {
      "Content-Type": "application/x-www-form-urlencoded",
    };
    let body: string | undefined;

    try {
      // Auto-sanitize price/volume decimals for private endpoints
      if (isPrivate && params) {
        params = await this.sanitizeParams(params);
      }

      // Private endpoints require authentication
      if (isPrivate) {
        const authResult = krakenAuth.generateHeaders({
          endpoint,
          postData: params || {},
        });
        headers = {...headers, ...authResult.headers};
        body = new URLSearchParams({...params, nonce: authResult.nonce}).toString();
      } else {
        // Public endpoints
        if (params && method === "GET") {
          url += "?" + new URLSearchParams(params).toString();
        } else if (params && method === "POST") {
          body = new URLSearchParams(params).toString();
        }
      }

      // Execute HTTP request
      const response = await httpClient.request({
        url,
        method,
        headers,
        body,
      });

      // Parse JSON response
      const data = JSON.parse(response.body);

      // Check for Kraken API errors
      if (data.error && data.error.length > 0) {
        const errorMessages = data.error.join(", ");
        return {
          isError: true,
          content: [
            {
              type: "text",
              text: `Kraken API Error: ${errorMessages}`,
            },
          ],
        };
      }

      // Success - check if result is large, store as resource if needed
      const toolName = this.getToolNameFromEndpoint(endpoint);
      const resourceUri = await dynamicResourceManager.storeIfLarge(toolName, data.result, {
        ttl: 60 * 60 * 1000, // 1 hour TTL
        schema: options?.schemaOverride as any,
        toolDefinitionName: options?.toolDefinitionName,
      });

      if (resourceUri) {
        // Large result - stored as resource
        const metadata = dynamicResourceManager.getPublicMetadata(resourceUri);
        return {
          content: [
            {
              type: "text",
              text: dynamicResourceManager.getChatMessage(resourceUri),
            },
          ],
          structuredContent: data.result,
          _meta: {
            resourceUri,
            cached: true,
            size: metadata?.size,
            cacheExpiry: metadata?.expiresAt,
            toolName,
          },
        };
      } else {
        // Small result - return directly
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(data.result, null, 2),
            },
          ],
          structuredContent: data.result,
          _meta: {
            cached: false,
            size: JSON.stringify(data.result).length,
            toolName,
          },
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return {
        isError: true,
        content: [
          {
            type: "text",
            text: `Kraken API call failed: ${errorMessage}`,
          },
        ],
      };
    }
  }

  /**
   * Convert Kraken API endpoint to friendly tool name (cache key)
   *
   * Automatically derives cache names from endpoint paths:
   * - "/0/private/TradeBalance" → "trade-balance"
   * - "/0/public/AssetPairs" → "asset-pairs"
   */
  private getToolNameFromEndpoint(endpoint: string): string {
    // Extract the last segment and convert CamelCase to kebab-case
    // e.g., "/0/private/TradeBalance" → "TradeBalance" → "trade-balance"
    const segment = endpoint.split("/").pop() || endpoint;
    return segment
      .replace(/([a-z])([A-Z])/g, "$1-$2") // Insert hyphen before capitals
      .toLowerCase();
  }
}

export const krakenProvider = new KrakenAPIProvider();

// ============================================================================
// KRAKEN TOOL FACTORY
// ============================================================================

interface CreateKrakenToolConfig<TInput extends z.ZodType, TOutput extends z.ZodType> {
  name: string;
  description: string;
  inputSchema: TInput;
  outputSchema?: TOutput; // Schema of structuredContent actually returned to MCP client
  cacheDataSchema?: z.ZodType; // Optional: schema of the cached dataset (data_schema) for large results
  endpoint: string;
  method: "GET" | "POST";
  isPrivate: boolean;
  tags?: string[]; // Tool kategorisierung tags (INTERN - nicht fuer LLM, fuer Workflow-Filterung)
}

/**
 * Factory function for creating Kraken tools
 *
 * Creates a complete MCP tool with:
 * - Input/Output schema validation (Zod)
 * - Automatic provider integration
 * - Auto-registration in tool registry
 *
 * @example
 * export const addOrder = createKrakenTool({
 *   name: 'kraken_add_order',
 *   description: 'Execute buy/sell order',
 *   inputSchema: AddOrderInputSchema,
 *   outputSchema: AddOrderOutputSchema,
 *   endpoint: '/0/private/AddOrder',
 *   method: 'POST',
 *   isPrivate: true,
 * });
 */
export function createKrakenTool<TInput extends z.ZodType, TOutput extends z.ZodType = any>(
  config: CreateKrakenToolConfig<TInput, TOutput>,
): Tool {
  const tool: Tool = {
    definition: {
      name: config.name,
      description: config.description,
    inputSchema: zodToMcpJsonSchema(config.inputSchema, {
      target: "jsonSchema7",
      $refStrategy: "none",
      allowedAdditionalProperties: true,
    }) as JsonSchema,
    outputSchema: config.outputSchema
      ? (zodToMcpJsonSchema(config.outputSchema, {
          target: "jsonSchema7",
          $refStrategy: "none",
          allowedAdditionalProperties: true,
        }) as JsonSchema)
      : undefined,
    tags: config.tags,
    },
    runtimeInputSchema: config.inputSchema,
    runtimeOutputSchema: config.outputSchema,
    tags: config.tags,
    async execute(args: unknown) {
      // Validate input with Zod schema
      const params = config.inputSchema.parse(args);
      const hasParams = params && typeof params === "object" && Object.keys(params).length > 0;

      // Execute API call via provider
      const callOptions: KrakenCallOptions = {
        toolDefinitionName: config.name,
      };
      if (config.cacheDataSchema || config.outputSchema) {
        callOptions.schemaOverride = zodToMcpJsonSchema((config.cacheDataSchema || config.outputSchema)!, {
          target: "jsonSchema7",
          $refStrategy: "none",
          allowedAdditionalProperties: true,
        }) as unknown as Record<string, unknown>;
      }

      const result = await krakenProvider.call(
        {
          endpoint: config.endpoint,
          method: config.method,
          isPrivate: config.isPrivate,
        },
        hasParams ? params : undefined,
        callOptions,
      );

      // Validate output schema (structuredContent now always contains actual data)
      if (config.outputSchema && result.structuredContent && !result.isError) {
        try {
          result.structuredContent = config.outputSchema.parse(result.structuredContent);
        } catch (e) {
          const errorMsg = e instanceof Error ? e.message : String(e);
          const validationMessage = `MCP output schema validation error for ${config.name}: ${errorMsg}`;
          krakenLogger.error(validationMessage);

          result.isError = true;
          const additionalContent = {type: "text" as const, text: validationMessage};
          result.content = Array.isArray(result.content) ? [...result.content, additionalContent] : [additionalContent];
        }
      }

      return result;
    },
  };

  return tool;
}
