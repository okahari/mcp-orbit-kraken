/**
 * Analyze Balance Prompt
 *
 * Guided workflow for portfolio analysis.
 * Returns conversation-starter messages that guide the LLM
 * to fetch and analyze account balance data.
 */

import {z} from "zod";
import type {PromptProvider, PromptMessage} from "mcp-orbit";

const AnalyzeBalanceArgsSchema = z.object({
  focusAsset: z.string().optional().describe("Specific asset to focus on (e.g., BTC, ETH)"),
  compareToUSD: z.boolean().optional().default(true).describe("Compare values to USD"),
});

export const analyzeBalancePrompt: PromptProvider = {
  name: "analyze_balance",
  description: "Analyze Kraken account balance with insights and recommendations",
  arguments: [
    {
      name: "focusAsset",
      description: "Specific asset to focus analysis on (optional)",
      required: false,
    },
    {
      name: "compareToUSD",
      description: "Whether to compare values to USD",
      required: false,
    },
  ],

  argumentsSchema: AnalyzeBalanceArgsSchema,

  async render(args?: Record<string, any>): Promise<PromptMessage[]> {
    const params = args ? AnalyzeBalanceArgsSchema.parse(args) : {compareToUSD: true};

    return [
      {
        role: "user",
        content: {
          type: "text",
          text: buildPromptText(params),
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: "I'll analyze your Kraken account balance. Let me fetch the current data...",
        },
      },
    ];
  },
};

function buildPromptText(params: z.infer<typeof AnalyzeBalanceArgsSchema>): string {
  return `Please analyze my Kraken account balance and provide:

1. **Current Holdings Overview**
   - List all assets with their amounts
   ${params.focusAsset ? `- Focus detailed analysis on ${params.focusAsset}` : ""}

2. **Portfolio Distribution**
   - Percentage breakdown by asset
   ${params.compareToUSD ? "- USD equivalent values\n" : ""}
3. **Recommendations**
   - Suggest portfolio rebalancing if needed
   - Identify low-value assets that could be consolidated

4. **Risk Assessment**
   - Concentration risk (if >50% in single asset)
   - Suggest diversification strategies

Please use the kraken_get_account_balance tool to fetch current data.`;
}
