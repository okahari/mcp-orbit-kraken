/**
 * Config Resource
 *
 * Static resource exposing Kraken plugin configuration as context.
 * Read-only — useful for debugging, settings display, etc.
 */

import type {ResourceProvider, ResourceContent} from "mcp-orbit";

/**
 * Server Configuration Resource
 */
export const configResource: ResourceProvider = {
  uri: "config://kraken",
  name: "Kraken Plugin Configuration",
  description: "Current Kraken plugin configuration and environment status",
  mimeType: "application/json",

  async read(): Promise<ResourceContent> {
    const config = {
      plugin: {
        name: "mcp-plugin-kraken",
        version: "0.1.0",
      },
      environment: {
        hasKrakenKeys: !!(process.env.KRAKEN_API_KEY && process.env.KRAKEN_PRIVATE_KEY),
        hasGridWebhookSecret: !!process.env.GRID_WEBHOOK_SECRET,
        gridDbPath: process.env.KRAKEN_DB_PATH ?? "data/grids.db",
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
