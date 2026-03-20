/**
 * Config Resource
 *
 * Beispiel für eine STATISCHE RESOURCE:
 * - Stellt Server-Konfiguration als Context bereit
 * - Read-only (könnte auch writeable sein)
 * - Für Debugging, Settings-Display, etc.
 */

import {createAndRegisterResource} from "mcp-orbit";
import type {ResourceProvider, ResourceContent} from "mcp-orbit";

/**
 * Server Configuration Resource
 */
const configResource: ResourceProvider = {
  uri: "config://server",
  name: "Server Configuration",
  description: "Current MCP server configuration and settings",
  mimeType: "application/json",

  async read(): Promise<ResourceContent> {
    const config = {
      server: {
        name: "friyon-mcp-concept",
        version: "2.0.0",
        transport: process.env.MCP_TRANSPORT || "stdio", // stdio or http
      },
      http: {
        enabled: !!process.env.HTTP_ENABLED,
        host: process.env.HTTP_HOST || "127.0.0.1",
        port: parseInt(process.env.HTTP_PORT || "3333", 10),
      },
      security: {
        httpTimeout: parseInt(process.env.HTTP_TIMEOUT || "30000", 10),
        maxResponseSize: parseInt(process.env.MAX_RESPONSE_SIZE || "10485760", 10), // 10 MB
        allowedDomains: process.env.ALLOWED_DOMAINS?.split(",") || [], // Empty = all allowed
      },
      capabilities: {
        tools: {
          listChanged: false,
        },
        resources: {
          subscribe: false,
          listChanged: false, // TODO: Should be true for dynamic cached resources
        },
        prompts: {
          listChanged: false,
        },
      },
      features: {
        tools: true,
        resources: true,
        prompts: true,
        sampling: false,
      },
      environment: {
        hasKrakenKeys: !!(process.env.KRAKEN_API_KEY && process.env.KRAKEN_PRIVATE_KEY),
        hasOpenWeatherKey: !!process.env.OPENWEATHER_API_KEY,
        nodeVersion: process.version,
        platform: process.platform,
        env: process.env.NODE_ENV || "development",
      },
    };

    return {
      text: JSON.stringify(config, null, 2),
    };
  },
};

// ✨ Auto-Registration
export const resource = createAndRegisterResource(configResource);

/**
 * USAGE:
 *
 * - User fragt: "What are your settings?"
 * - LLM liest Resource: resources/read { uri: "config://server" }
 * - Bekommt komplette Config als JSON
 *
 * Alternative Use Cases:
 * - "Do you have Kraken API keys configured?"
 * - "What's your timeout setting?"
 * - "Show me your capabilities"
 */
