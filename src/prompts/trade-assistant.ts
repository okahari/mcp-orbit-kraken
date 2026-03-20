/**
 * Trade Assistant Prompt
 *
 * Beispiel für ein INTERAKTIVES PROMPT:
 * - Guided workflow für Trading
 * - Multi-turn conversation starter
 * - Mit Safety Checks
 */

import {z} from "zod";
import {createAndRegisterPrompt} from "mcp-orbit";
import type {PromptProvider, PromptMessage} from "mcp-orbit";

/**
 * Arguments Schema
 */
const TradeAssistantArgsSchema = z.object({
  tradeType: z.enum(["buy", "sell"]).describe("Type of trade to execute"),
  asset: z.string().describe("Asset to trade (e.g., BTC, ETH)"),
  safetyMode: z.boolean().optional().default(true).describe("Enable safety confirmations"),
});

/**
 * Trade Assistant Prompt
 *
 * Interaktiver Trading-Workflow mit Safety Checks
 */
const tradeAssistantPrompt: PromptProvider = {
  name: "trade_assistant",
  description: "Interactive trading assistant with safety checks and market analysis",
  arguments: [
    {
      name: "tradeType",
      description: "Whether to buy or sell",
      required: true,
    },
    {
      name: "asset",
      description: "The cryptocurrency asset to trade",
      required: true,
    },
    {
      name: "safetyMode",
      description: "Enable safety confirmations and risk warnings",
      required: false,
    },
  ],

  argumentsSchema: TradeAssistantArgsSchema,

  async render(args?: Record<string, any>): Promise<PromptMessage[]> {
    const params = TradeAssistantArgsSchema.parse(args);

    const messages: PromptMessage[] = [
      {
        role: "user",
        content: {
          type: "text",
          text: buildTradePrompt(params),
        },
      },
      {
        role: "assistant",
        content: {
          type: "text",
          text: buildAssistantResponse(params),
        },
      },
    ];

    return messages;
  },
};

/**
 * Helper: Baut User Prompt
 */
function buildTradePrompt(params: z.infer<typeof TradeAssistantArgsSchema>): string {
  const action = params.tradeType === "buy" ? "purchase" : "sell";

  return `I want to ${action} ${params.asset}. ${params.safetyMode ? "Please guide me through this safely." : "Execute the trade."}

Please help me with:
1. Current market price and trends
2. My current balance and available funds
3. Recommended order size
4. Suggested order type (market/limit)
${params.safetyMode ? "5. Risk assessment and confirmation" : ""}

${params.safetyMode ? "\n⚠️ IMPORTANT: I want to review all details before executing any trade." : ""}`;
}

/**
 * Helper: Baut Assistant Response
 */
function buildAssistantResponse(params: z.infer<typeof TradeAssistantArgsSchema>): string {
  const action = params.tradeType === "buy" ? "buying" : "selling";

  return `I'll help you with ${action} ${params.asset}. Let me gather the necessary information:

1. Checking current ${params.asset} market price...
2. Reviewing your account balance...
3. Analyzing recent market trends...

${
  params.safetyMode
    ? "\n🔒 Safety Mode is ENABLED - I will ask for your confirmation before executing any trades."
    : "\n⚡ Quick Mode - I will suggest optimal parameters for immediate execution."
}

Let me fetch the data using the available tools.`;
}

// ✨ Auto-Registration
export const prompt = createAndRegisterPrompt(tradeAssistantPrompt);

/**
 * USAGE Scenario:
 *
 * User: "I want to buy some Bitcoin"
 * → Client suggests prompt: "trade_assistant"
 * → User selects, fills: { tradeType: 'buy', asset: 'BTC', safetyMode: true }
 * → Prompt gibt guided conversation zurück
 * → LLM führt aus:
 *   - kraken_get_ticker_info (BTC price)
 *   - kraken_get_account_balance (available funds)
 *   - Analysiert und gibt Empfehlung
 *   - (Mit safetyMode) Wartet auf User-Bestätigung
 *   - kraken_add_order (nur nach Bestätigung!)
 *
 * Das ist ein kompletter Workflow, gepackt in ein Template!
 */
