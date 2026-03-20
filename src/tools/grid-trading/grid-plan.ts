import {z} from "zod";
import {zodToMcpJsonSchema} from "mcp-orbit";
import type {Tool, MCPToolResult} from "mcp-orbit";

// ============================================================================
// SCHEMA
// ============================================================================

const GridPlanInputSchema = z.object({
  gridType: z.enum(["LONG", "NEUTRAL", "SHORT"]),
  priceMin: z.number().positive().describe("Lower bound of the grid range (must be < priceMax)"),
  priceMax: z.number().positive().describe("Upper bound of the grid range (must be > priceMin)"),
  levels: z.number().int().min(2).max(100),
  distribution: z.enum(["arithmetic", "geometric"]).default("arithmetic"),
  totalInvestment: z.number().positive(),
  pairDecimals: z.number().int().min(0).max(10),
  currentPrice: z.number().positive(),
}).refine(d => d.priceMax > d.priceMin, {message: "priceMax must be greater than priceMin"});

const GridPlanOutputSchema = z.object({
  levels: z.array(z.object({
    level: z.number().int().min(1),
    price: z.number(),
    side: z.enum(["buy", "sell"]).nullable(),
    volume: z.string().nullable(),
  })),
});

// ============================================================================
// HELPERS
// ============================================================================

function roundPrice(price: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round((price + Number.EPSILON) * factor) / factor;
}

function computeLevelPrice(
  priceMin: number,
  priceMax: number,
  levels: number,
  distribution: "arithmetic" | "geometric",
  index: number,
  pairDecimals: number,
): number {
  if (distribution === "geometric") {
    const ratio = Math.pow(priceMax / priceMin, 1 / (levels - 1));
    return roundPrice(priceMin * Math.pow(ratio, index), pairDecimals);
  }
  const step = (priceMax - priceMin) / (levels - 1);
  return roundPrice(priceMin + step * index, pairDecimals);
}

function getInitialSideForLevel(
  gridType: "LONG" | "NEUTRAL" | "SHORT",
  levelPrice: number,
  currentPrice: number,
): "buy" | "sell" | null {
  if (gridType === "LONG") return levelPrice <= currentPrice ? "buy" : null;
  if (gridType === "SHORT") return levelPrice >= currentPrice ? "sell" : null;
  return levelPrice <= currentPrice ? "buy" : "sell";
}

// ============================================================================
// TOOL
// ============================================================================

const gridPlanTool: Tool = {
  definition: {
    name: "grid_plan",
    description:
      "Pure price-level calculation for a grid. No side-effects, no DB writes. " +
      "Returns computed levels with price, side (buy/sell/null), and volume for each level.",
    inputSchema: zodToMcpJsonSchema(GridPlanInputSchema, {target: "jsonSchema7", $refStrategy: "none"}) as any,
    outputSchema: zodToMcpJsonSchema(GridPlanOutputSchema, {target: "jsonSchema7", $refStrategy: "none"}) as any,
    tags: ["grid-trading"],
  },
  runtimeInputSchema: GridPlanInputSchema,
  runtimeOutputSchema: GridPlanOutputSchema,
  async execute(args: unknown): Promise<MCPToolResult> {
    const input = GridPlanInputSchema.parse(args);

    const perLevelBudget = input.totalInvestment / input.levels;
    const levels: Array<{level: number; price: number; side: "buy" | "sell" | null; volume: string | null}> = [];

    for (let i = 0; i < input.levels; i++) {
      const level = i + 1;
      const price = computeLevelPrice(
        input.priceMin,
        input.priceMax,
        input.levels,
        input.distribution,
        i,
        input.pairDecimals,
      );
      const side = getInitialSideForLevel(input.gridType, price, input.currentPrice);
      const volume = side && price > 0 ? (perLevelBudget / price).toFixed(8) : null;
      levels.push({level, price, side, volume});
    }

    const result = {levels};

    return {
      content: [{type: "text", text: JSON.stringify(result, null, 2)}],
      structuredContent: result,
    };
  },
};

export const gridPlanTools = [gridPlanTool];
