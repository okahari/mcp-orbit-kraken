import {z} from "zod";
import {zodToMcpJsonSchema} from "mcp-orbit";
import type {Tool, MCPToolResult} from "mcp-orbit";
import {getGridDatabase} from "./grid-db.js";

// ============================================================================
// SCHEMA
// ============================================================================

const GridStateInputSchema = z.object({
  action: z.enum(["save", "get", "list", "delete"]),
  gridId: z.string().optional().describe("Unique grid identifier (required for save, get, delete)"),
  data: z
    .record(z.any())
    .optional()
    .describe("Grid configuration JSON document (required for save)."),
});

// ============================================================================
// GRID CHECK WEBHOOK CONFIG
// ============================================================================

const GRID_CHECK_BASE_URL = process.env.GRID_CHECK_WEBHOOK_URL ?? "http://localhost:3001";
const GRID_CHECK_SECRET = process.env.GREMBEL_API_KEY ?? "";
const GRID_CHECK_DEFAULT_PATTERN = "*/5 * * * *";

function buildSchedulingHint(gridId: string) {
  return {
    ready: true,
    params: {
      name: `grid-monitor-${gridId}`,
      pattern: GRID_CHECK_DEFAULT_PATTERN,
      webhookCommand: {
        type: "webhook" as const,
        url: `${GRID_CHECK_BASE_URL}/webhooks/grid-check?gridId=${encodeURIComponent(gridId)}`,
        method: "POST" as const,
        headers: GRID_CHECK_SECRET ? {"x-webhook-secret": GRID_CHECK_SECRET} : undefined,
      },
    },
  };
}

// ============================================================================
// TOOL
// ============================================================================

const gridStateTool: Tool = {
  definition: {
    name: "grid_state",
    description:
      "CRUD store for grid configurations. " +
      "Actions: save (upsert), get (load one), list (all summaries), delete.",
    inputSchema: zodToMcpJsonSchema(GridStateInputSchema, {target: "jsonSchema7", $refStrategy: "none"}) as any,
    tags: ["grid-trading"],
  },
  runtimeInputSchema: GridStateInputSchema,
  async execute(args: unknown): Promise<MCPToolResult> {
    const input = GridStateInputSchema.parse(args);
    const db = getGridDatabase();

    switch (input.action) {
      case "save": {
        if (!input.gridId) {
          return {isError: true, content: [{type: "text", text: "grid_state save: gridId is required"}]};
        }
        if (!input.data) {
          return {isError: true, content: [{type: "text", text: "grid_state save: data is required"}]};
        }
        const json = JSON.stringify(input.data);
        db.prepare(`
          INSERT INTO grids (grid_id, data)
          VALUES (?, ?)
          ON CONFLICT(grid_id) DO UPDATE SET
            data = excluded.data,
            updated_at = CURRENT_TIMESTAMP
        `).run(input.gridId, json);

        const status = input.data.status;
        const result: Record<string, unknown> = {action: "saved", gridId: input.gridId};

        if (status === "active") {
          result.scheduling = buildSchedulingHint(input.gridId);
        }

        return {
          content: [{type: "text", text: JSON.stringify(result)}],
          structuredContent: result,
        };
      }

      case "get": {
        if (!input.gridId) {
          return {isError: true, content: [{type: "text", text: "grid_state get: gridId is required"}]};
        }
        const row = db.prepare("SELECT grid_id, data, created_at, updated_at FROM grids WHERE grid_id = ?").get(input.gridId) as any;
        if (!row) {
          return {
            content: [{type: "text", text: JSON.stringify({action: "get", gridId: input.gridId, found: false})}],
          };
        }
        const result = {
          action: "get",
          gridId: row.grid_id,
          data: JSON.parse(row.data),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        };
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}],
          structuredContent: result,
        };
      }

      case "list": {
        const rows = db.prepare("SELECT grid_id, data, created_at, updated_at FROM grids ORDER BY updated_at DESC").all() as any[];
        const grids = rows.map((row: any) => {
          const data = JSON.parse(row.data);
          return {
            gridId: row.grid_id,
            status: data.status ?? null,
            symbol: data.symbol ?? null,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          };
        });
        const result = {action: "list", count: grids.length, grids};
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}],
          structuredContent: result,
        };
      }

      case "delete": {
        if (!input.gridId) {
          return {isError: true, content: [{type: "text", text: "grid_state delete: gridId is required"}]};
        }
        const changes = db.prepare("DELETE FROM grids WHERE grid_id = ?").run(input.gridId);
        const result = {action: "deleted", gridId: input.gridId, deleted: changes.changes > 0};
        return {
          content: [{type: "text", text: JSON.stringify(result)}],
          structuredContent: result,
        };
      }
    }
  },
};

export const gridStateTools = [gridStateTool];
