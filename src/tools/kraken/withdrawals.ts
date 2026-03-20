/**
 * Kraken Withdrawal Tools
 *
 * Tools for managing cryptocurrency withdrawals
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// GET WITHDRAWAL METHODS
// ============================================================================

const GetWithdrawalMethodsInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to retrieve withdrawal methods"),
});

const GetWithdrawalMethodsOutputSchema = z
  .array(
    z.object({
      method: z.string().describe("Withdrawal method name"),
      limit: z.union([z.string(), z.boolean()]).optional().describe("Withdrawal limit or false if no limit"),
      fee: z.string().optional().describe("Withdrawal fee"),
    }),
  )
  .describe("Array of available withdrawal methods");

export const getWithdrawalMethods = createKrakenTool({
  name: "kraken_get_withdrawal_methods",
  description: "Retrieve available withdrawal methods for a specific asset",
  inputSchema: GetWithdrawalMethodsInputSchema,
  outputSchema: GetWithdrawalMethodsOutputSchema,
  endpoint: "/0/private/WithdrawMethods",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// WITHDRAW FUNDS
// ============================================================================

const WithdrawFundsInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to withdraw"),
  key: z.string().describe("Provide the withdrawal key name configured in Kraken withdrawal settings"),
  amount: z.string().describe("Define the amount of the asset to withdraw"),
});

const WithdrawFundsOutputSchema = z.object({
  refid: z.string().describe("Reference ID for the withdrawal"),
});

export const withdrawFunds = createKrakenTool({
  name: "kraken_withdraw_funds",
  description: "Initiate a withdrawal of funds to a preconfigured address",
  inputSchema: WithdrawFundsInputSchema,
  outputSchema: WithdrawFundsOutputSchema,
  endpoint: "/0/private/Withdraw",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// GET WITHDRAWAL ADDRESSES
// ============================================================================

const GetWithdrawalAddressesInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to list withdrawal addresses"),
  method: z.string().describe("Define the withdrawal method (matching Kraken settings)"),
});

const GetWithdrawalAddressesOutputSchema = z
  .array(
    z.object({
      address: z.string().describe("Withdrawal address"),
      verified: z.boolean().describe("Whether address is verified"),
    }),
  )
  .describe("Array of withdrawal addresses");

export const getWithdrawalAddresses = createKrakenTool({
  name: "kraken_get_withdrawal_addresses",
  description: "List configured withdrawal addresses for a given asset and method",
  inputSchema: GetWithdrawalAddressesInputSchema,
  outputSchema: GetWithdrawalAddressesOutputSchema,
  endpoint: "/0/private/WithdrawAddresses",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// GET WITHDRAWAL INFO
// ============================================================================

const GetWithdrawalInfoInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to estimate withdrawal fees"),
  key: z.string().describe("Provide the withdrawal key name stored in Kraken"),
  amount: z.string().describe("Indicate the amount being withdrawn for fee calculation"),
});

const GetWithdrawalInfoOutputSchema = z.object({
  method: z.string().describe("Withdrawal method"),
  limit: z.string().describe("Withdrawal limit"),
  amount: z.string().describe("Withdrawal amount"),
  fee: z.string().describe("Withdrawal fee"),
});

export const getWithdrawalInfo = createKrakenTool({
  name: "kraken_get_withdrawal_info",
  description: "Get withdrawal fee and limit information for a requested transfer",
  inputSchema: GetWithdrawalInfoInputSchema,
  outputSchema: GetWithdrawalInfoOutputSchema,
  endpoint: "/0/private/WithdrawInfo",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// GET WITHDRAWAL STATUS
// ============================================================================

const GetWithdrawalStatusInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to check withdrawal status"),
  method: z.string().optional().describe("Optional withdrawal method filter matching Kraken configuration"),
});

const GetWithdrawalStatusOutputSchema = z
  .array(
    z.object({
      method: z.string().describe("Withdrawal method"),
      aclass: z.string().describe("Asset class"),
      asset: z.string().describe("Asset"),
      refid: z.string().describe("Reference ID"),
      txid: z.string().describe("Transaction ID"),
      info: z.string().describe("Withdrawal information"),
      amount: z.string().describe("Amount withdrawn"),
      fee: z.string().optional().describe("Withdrawal fee"),
      time: z.number().describe("Unix timestamp"),
      status: z.string().describe("Status of withdrawal"),
    }),
  )
  .describe("Array of withdrawal status records");

export const getWithdrawalStatus = createKrakenTool({
  name: "kraken_get_withdrawal_status",
  description: "Check the status of recent withdrawals for a specific asset",
  inputSchema: GetWithdrawalStatusInputSchema,
  outputSchema: GetWithdrawalStatusOutputSchema,
  endpoint: "/0/private/WithdrawStatus",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// CANCEL WITHDRAWAL
// ============================================================================

const CancelWithdrawalInputSchema = z.object({
  asset: z.string().optional().describe("Optionally specify the asset (e.g., XBT) for which to cancel withdrawals"),
  refid: z.string().describe("Provide the reference ID of the withdrawal to cancel"),
});

const CancelWithdrawalOutputSchema = z.object({
  result: z.boolean().describe("Whether cancellation was successful"),
});

export const cancelWithdrawal = createKrakenTool({
  name: "kraken_cancel_withdrawal",
  description: "Cancel a pending withdrawal using its reference ID",
  inputSchema: CancelWithdrawalInputSchema,
  outputSchema: CancelWithdrawalOutputSchema,
  endpoint: "/0/private/WithdrawCancel",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "withdrawals"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [
  getWithdrawalMethods,
  withdrawFunds,
  getWithdrawalAddresses,
  getWithdrawalInfo,
  getWithdrawalStatus,
  cancelWithdrawal,
];
