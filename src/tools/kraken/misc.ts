/**
 * Kraken Miscellaneous Tools
 *
 * Additional tools for trades history, websockets, and wallet transfers
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// GET TRADES HISTORY
// ============================================================================

const GetTradesHistoryInputSchema = z.object({
  type: z
    .enum(["all", "any position", "closed position", "closing position", "no position"])
    .optional()
    .describe("Specify the category of trades to retrieve based on position status"),
  trades: z.boolean().optional().describe("Include trades associated with positions in the output"),
  start: z.number().optional().describe("Define the starting point using a unix timestamp or trade transaction ID"),
  end: z.number().optional().describe("Set the endpoint using a unix timestamp or trade transaction ID"),
  ofs: z.number().optional().describe("Control pagination by specifying the result offset"),
});

const GetTradesHistoryOutputSchema = z.object({
  trades: z
    .record(
      z.object({
        ordertxid: z.string().describe("Order transaction ID"),
        postxid: z.string().describe("Position transaction ID"),
        pair: z.string().describe("Asset pair"),
        time: z.number().describe("Unix timestamp"),
        type: z.enum(["buy", "sell"]).describe("Trade type"),
        ordertype: z.string().describe("Order type"),
        price: z.string().describe("Price"),
        cost: z.string().describe("Total cost"),
        fee: z.string().describe("Total fee"),
        vol: z.string().describe("Volume"),
        margin: z.string().optional().describe("Initial margin"),
        misc: z.string().optional().describe("Miscellaneous"),
      }),
    )
    .describe("Map of trade info keyed by transaction ID"),
  count: z.number().describe("Number of trades returned"),
});

export const getTradesHistory = createKrakenTool({
  name: "kraken_get_trades_history",
  description: "Retrieve the history of trades and executed orders for analysis or reporting",
  inputSchema: GetTradesHistoryInputSchema,
  outputSchema: GetTradesHistoryOutputSchema,
  endpoint: "/0/private/TradesHistory",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// GET WEBSOCKETS TOKEN
// ============================================================================

const GetWebsocketsTokenInputSchema = z.object({});

const GetWebsocketsTokenOutputSchema = z.object({
  token: z.string().describe("WebSockets authentication token"),
  expires: z.number().describe("Token expiration time (Unix timestamp)"),
});

export const getWebsocketsToken = createKrakenTool({
  name: "kraken_get_websockets_token",
  description: "Retrieve a token for accessing the Websockets API to enable real-time data streams",
  inputSchema: GetWebsocketsTokenInputSchema,
  outputSchema: GetWebsocketsTokenOutputSchema,
  endpoint: "/0/private/GetWebSocketsToken",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// WALLET TRANSFER
// ============================================================================

const WalletTransferInputSchema = z.object({
  asset: z.string().describe("Specify the asset to transfer using its ID or altname (e.g., XBT)"),
  from: z.enum(["Spot Wallet"]).describe("Indicate the source wallet for the transfer"),
  to: z.enum(["Futures Wallet"]).describe("Indicate the destination wallet for the transfer"),
  amount: z.string().describe("Define the amount of the asset to transfer"),
});

const WalletTransferOutputSchema = z.object({
  refid: z.string().describe("Reference ID for the transfer"),
});

export const walletTransfer = createKrakenTool({
  name: "kraken_wallet_transfer",
  description: "Initiate a transfer of funds between Kraken wallets (e.g., spot to futures)",
  inputSchema: WalletTransferInputSchema,
  outputSchema: WalletTransferOutputSchema,
  endpoint: "/0/private/WalletTransfer",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "transfers"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [getTradesHistory, getWebsocketsToken, walletTransfer];
