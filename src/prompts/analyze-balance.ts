/**
 * Analyze Balance Prompt
 *
 * Beispiel für ein PROMPT:
 * - Guided workflow für Balance-Analyse
 * - Template mit Variablen
 * - Gibt Messages zurück (conversation starter)
 */

import {z} from "zod";
import {createAndRegisterPrompt} from "mcp-orbit";
import type {PromptProvider, PromptMessage} from "mcp-orbit";

/**
 * Arguments Schema für Prompt
 */
const AnalyzeBalanceArgsSchema = z.object({
  focusAsset: z.string().optional().describe("Specific asset to focus on (e.g., BTC, ETH)"),
  compareToUSD: z.boolean().optional().default(true).describe("Compare values to USD"),
});

/**
 * Analyze Balance Prompt
 *
 * Workflow:
 * 1. User ruft Prompt auf
 * 2. Prompt gibt Messages zurück
 * 3. LLM führt entsprechende Tools aus
 */
const analyzeBalancePrompt: PromptProvider = {
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

    // Build prompt messages
    const messages: PromptMessage[] = [
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

    return messages;
  },
};

/**
 * Helper: Baut den Prompt-Text
 */
function buildPromptText(params: z.infer<typeof AnalyzeBalanceArgsSchema>): string {
  const prompt = `Please analyze my Kraken account balance and provide:

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

  return prompt;
}

// ✨ Auto-Registration
export const prompt = createAndRegisterPrompt(analyzeBalancePrompt);

/**
 * USAGE durch User:
 *
 * 1. User wählt Prompt in UI: "Analyze Balance"
 * 2. Optional: Füllt focusAsset aus: "BTC"
 * 3. Client ruft prompts/get auf
 * 4. Bekommt Messages zurück
 * 5. Startet Conversation mit diesen Messages
 * 6. LLM führt kraken_get_account_balance Tool aus
 * 7. LLM gibt strukturierte Analyse
 *
 * Das ist wie ein "Workflow Template" für häufige Aufgaben!
 */
