/**
 * Kraken Balance Tools
 *
 * Tools for retrieving account balance information
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// GET ACCOUNT BALANCE
// ============================================================================

const GetAccountBalanceInputSchema = z.object({});

const GetAccountBalanceOutputSchema = z
  .record(z.string())
  .describe("Map of asset balances keyed by asset name WITH prefix (e.g., XXBT, ZEUR, ZUSD)");

export const getAccountBalance = createKrakenTool({
  name: "kraken_get_account_balance",
  description: "Get the current account balance for all assets on Kraken exchange",
  inputSchema: GetAccountBalanceInputSchema,
  outputSchema: GetAccountBalanceOutputSchema,
  endpoint: "/0/private/Balance",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// GET EXTENDED BALANCE
// ============================================================================

const GetExtendedBalanceInputSchema = z.object({
  asset: z.string().optional().describe("Filter the response to a specific asset, provided as its ID or altname"),
});

const GetExtendedBalanceOutputSchema = z
  .record(
    z.object({
      balance: z.string().describe("Available balance"),
      hold_trade: z.string().optional().describe("Amount on hold for open orders"),
    }),
  )
  .describe("Extended balance information keyed by asset name WITH prefix (e.g., XXBT, ZEUR, ZUSD)");

export const getExtendedBalance = createKrakenTool({
  name: "kraken_get_extended_balance",
  description: "Retrieve extended balance information, including credit and hold details",
  inputSchema: GetExtendedBalanceInputSchema,
  outputSchema: GetExtendedBalanceOutputSchema,
  endpoint: "/0/private/BalanceEx",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [getAccountBalance, getExtendedBalance];
