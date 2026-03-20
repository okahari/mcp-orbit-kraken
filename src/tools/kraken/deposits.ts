/**
 * Kraken Deposit Tools
 *
 * Tools for managing cryptocurrency deposits
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// GET DEPOSIT METHODS
// ============================================================================

const GetDepositMethodsInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to retrieve available deposit methods"),
});

const GetDepositMethodsOutputSchema = z
  .array(
    z.object({
      method: z.string().describe("Deposit method name"),
      limit: z.union([z.string(), z.boolean()]).optional().describe("Deposit limit or false if no limit"),
      fee: z.string().optional().describe("Deposit fee"),
      "address-setup-fee": z.string().optional().describe("Address setup fee"),
    }),
  )
  .describe("Array of available deposit methods");

export const getDepositMethods = createKrakenTool({
  name: "kraken_get_deposit_methods",
  description: "Retrieve available deposit methods for a specific asset",
  inputSchema: GetDepositMethodsInputSchema,
  outputSchema: GetDepositMethodsOutputSchema,
  endpoint: "/0/private/DepositMethods",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "deposits"],
});

// ============================================================================
// GET DEPOSIT ADDRESSES
// ============================================================================

const GetDepositAddressesInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) for the deposit address request"),
  method: z.number().optional().describe("Optional deposit method ID from the deposit methods list"),
  new: z.boolean().optional().describe("Set true to generate a new deposit address"),
});

const GetDepositAddressesOutputSchema = z
  .array(
    z.object({
      address: z.string().describe("Deposit address"),
      expiretm: z.string().optional().describe("Expiration time"),
      new: z.boolean().optional().describe("Whether address is newly generated"),
    }),
  )
  .describe("Array of deposit addresses");

export const getDepositAddresses = createKrakenTool({
  name: "kraken_get_deposit_addresses",
  description: "Get deposit addresses for an asset using a selected method",
  inputSchema: GetDepositAddressesInputSchema,
  outputSchema: GetDepositAddressesOutputSchema,
  endpoint: "/0/private/DepositAddresses",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "deposits"],
});

// ============================================================================
// GET DEPOSIT STATUS
// ============================================================================

const GetDepositStatusInputSchema = z.object({
  asset: z.string().describe("Specify the asset (e.g., XBT, ETH) to check deposit status"),
  method: z.string().optional().describe("Filter by deposit method name (matches Kraken configuration)"),
});

const GetDepositStatusOutputSchema = z
  .array(
    z.object({
      method: z.string().describe("Deposit method"),
      aclass: z.string().describe("Asset class"),
      asset: z.string().describe("Asset"),
      refid: z.string().describe("Reference ID"),
      txid: z.string().describe("Transaction ID"),
      info: z.string().describe("Deposit information"),
      amount: z.string().describe("Amount deposited"),
      fee: z.string().optional().describe("Deposit fee"),
      time: z.number().describe("Unix timestamp"),
      status: z.string().describe("Status of deposit"),
    }),
  )
  .describe("Array of deposit status records");

export const getDepositStatus = createKrakenTool({
  name: "kraken_get_deposit_status",
  description: "Check the status of recent deposit transfers for an asset",
  inputSchema: GetDepositStatusInputSchema,
  outputSchema: GetDepositStatusOutputSchema,
  endpoint: "/0/private/DepositStatus",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto", "deposits"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [getDepositMethods, getDepositAddresses, getDepositStatus];
