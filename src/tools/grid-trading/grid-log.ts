import {z} from "zod";
import {zodToMcpJsonSchema} from "mcp-orbit";
import type {Tool, MCPToolResult} from "mcp-orbit";
import {getGridDatabase} from "./grid-db.js";

// ============================================================================
// SCHEMA
// ============================================================================

const GridLogInputSchema = z.object({
  action: z.enum(["append", "read"]),
  gridId: z.string(),
  event: z.string().optional(),
  data: z.record(z.any()).optional(),
});

// ============================================================================
// TOOL
// ============================================================================

const gridLogTool: Tool = {
  definition: {
    name: "grid_log",
    description:
      "Append-only audit log for grid events. " +
      "append: Write a new log entry (event + optional data). " +
      "read: Retrieve all log entries for a grid in chronological order.",
    inputSchema: zodToMcpJsonSchema(GridLogInputSchema, {target: "jsonSchema7", $refStrategy: "none"}) as any,
    tags: ["grid-trading"],
  },
  runtimeInputSchema: GridLogInputSchema,
  async execute(args: unknown): Promise<MCPToolResult> {
    const input = GridLogInputSchema.parse(args);
    const db = getGridDatabase();

    switch (input.action) {
      case "append": {
        if (!input.event) {
          return {isError: true, content: [{type: "text", text: "grid_log append: event is required"}]};
        }
        const stmt = db.prepare("INSERT INTO grid_log (grid_id, event, data) VALUES (?, ?, ?)");
        const res = stmt.run(input.gridId, input.event, input.data ? JSON.stringify(input.data) : null);
        const result = {action: "appended", gridId: input.gridId, event: input.event, logId: Number(res.lastInsertRowid)};
        return {
          content: [{type: "text", text: JSON.stringify(result)}],
          structuredContent: result,
        };
      }

      case "read": {
        const rows = db.prepare(
          "SELECT id, grid_id, event, data, timestamp FROM grid_log WHERE grid_id = ? ORDER BY id ASC",
        ).all(input.gridId) as any[];
        const entries = rows.map((row: any) => ({
          id: row.id,
          gridId: row.grid_id,
          event: row.event,
          data: row.data ? JSON.parse(row.data) : null,
          timestamp: row.timestamp,
        }));
        const result = {action: "read", gridId: input.gridId, count: entries.length, entries};
        return {
          content: [{type: "text", text: JSON.stringify(result, null, 2)}],
          structuredContent: result,
        };
      }
    }
  },
};

export const gridLogTools = [gridLogTool];
