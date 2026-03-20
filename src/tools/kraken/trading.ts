/**
 * Kraken Trading Tools
 *
 * Tools for order management and trading operations
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// ADD ORDER
// ============================================================================

const AddOrderInputSchema = z.object({
  ordertype: z
    .enum([
      "market",
      "limit",
      "iceberg",
      "stop-loss",
      "take-profit",
      "stop-loss-limit",
      "take-profit-limit",
      "trailing-stop",
      "trailing-stop-limit",
      "settle-position",
    ])
    .describe("Specify the order execution model"),
  type: z.enum(["buy", "sell"]).describe("Indicate the direction of the order (buy or sell)"),
  volume: z.string().describe("Define the quantity of the base asset to order"),
  pair: z.string().describe("Identify the asset pair (e.g., XBTUSD, ETHUSD)"),
  price: z.string().optional().describe("Set the price for limit orders or the trigger price for stop orders"),
  price2: z.string().optional().describe("Provide a secondary price for stop-loss-limit and take-profit-limit orders"),
  leverage: z.string().optional().describe("Specify the desired leverage amount (default is none)"),
  oflags: z.string().optional().describe("Order flags as comma-separated string: viqc, post, fcib, fciq, nompp"),
  timeinforce: z.enum(["GTC", "IOC", "GTD"]).optional().describe("Determine the order time-in-force policy"),
  userref: z.number().optional().describe("Optionally specify a user reference ID"),
  validate: z.boolean().optional().describe("Set to true to validate inputs without placing the order"),
});

const AddOrderOutputSchema = z.object({
  descr: z
    .object({
      order: z.string().describe("Order description"),
      close: z.string().optional().describe("Close order description"),
    })
    .describe("Order description info"),
  txid: z.array(z.string()).optional().describe("Array of transaction IDs (present when order is actually placed)"),
});

export const addOrder = createKrakenTool({
  name: "kraken_add_order",
  description: "Execute a buy or sell order for cryptocurrency on the Kraken exchange",
  inputSchema: AddOrderInputSchema,
  outputSchema: AddOrderOutputSchema,
  endpoint: "/0/private/AddOrder",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// CANCEL ORDER
// ============================================================================

const CancelOrderInputSchema = z.object({
  txid: z.string().optional().describe("Specify the Kraken order ID (txid) or user-defined reference (userref)"),
  cl_ord_id: z
    .string()
    .optional()
    .describe("Optional client order id used during order placement (reuse the exact same unique value)."),
});

const CancelOrderOutputSchema = z.object({
  count: z.number().describe("Number of orders cancelled"),
  pending: z.boolean().optional().describe("Whether cancellation is pending"),
});

export const cancelOrder = createKrakenTool({
  name: "kraken_cancel_order",
  description: "Cancel an active order on Kraken using its unique identifier",
  inputSchema: CancelOrderInputSchema,
  outputSchema: CancelOrderOutputSchema,
  endpoint: "/0/private/CancelOrder",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// CANCEL ALL ORDERS
// ============================================================================

const CancelAllOrdersInputSchema = z.object({});

const CancelAllOrdersOutputSchema = z.object({
  count: z.number().describe("Number of orders cancelled"),
});

export const cancelAllOrders = createKrakenTool({
  name: "kraken_cancel_all_orders",
  description: "Execute a command to cancel all open orders in the trading account",
  inputSchema: CancelAllOrdersInputSchema,
  outputSchema: CancelAllOrdersOutputSchema,
  endpoint: "/0/private/CancelAll",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// QUERY ORDERS
// ============================================================================

const QueryOrdersInputSchema = z.object({
  txid: z.string().describe("Specify a comma-separated list of up to 50 transaction IDs to retrieve order details"),
  trades: z.boolean().optional().describe("Include related trades in the response"),
});

const QueryOrdersOutputSchema = z
  .record(
    z.object({
      refid: z.string().nullable().optional(),
      userref: z.number().nullable().optional(),
      cl_ord_id: z.string().nullable().optional(),
      status: z.enum(["pending", "open", "closed", "canceled", "expired"]),
      opentm: z.number().describe("Unix timestamp of order opening"),
      starttm: z.number().optional(),
      expiretm: z.number().optional(),
      descr: z.object({
        pair: z.string(),
        type: z.enum(["buy", "sell"]),
        ordertype: z.string(),
        price: z.string(),
        price2: z.string().optional(),
        leverage: z.string().optional(),
        order: z.string(),
        close: z.string().optional(),
      }),
      vol: z.string().describe("Volume of order"),
      vol_exec: z.string().describe("Volume executed"),
      cost: z.string().describe("Total cost"),
      fee: z.string().describe("Total fee"),
      price: z.string().describe("Average price"),
      stopprice: z.string().optional(),
      limitprice: z.string().optional(),
      misc: z.string().optional(),
      oflags: z.string().optional(),
      reason: z.string().nullable().optional(),
      sender_sub_id: z.string().nullable().optional(),
      trades: z.array(z.string()).optional().describe("Array of trade IDs"),
    }),
  )
  .describe("Map of order info keyed by transaction ID");

export const queryOrders = createKrakenTool({
  name: "kraken_query_orders",
  description: "Retrieve detailed information about specific orders, including their execution status",
  inputSchema: QueryOrdersInputSchema,
  outputSchema: QueryOrdersOutputSchema,
  endpoint: "/0/private/QueryOrders",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// EDIT ORDER
// ============================================================================

const EditOrderInputSchema = z.object({
  txid: z.string().describe("Specify the transaction ID of the order you want to modify"),
  pair: z.string().optional().describe("Provide the trading pair (e.g., XBTUSD) for the order update"),
  volume: z.string().optional().describe("Optionally set a new volume for the order"),
  price: z.string().optional().describe("Define the new limit price or trigger price"),
  price2: z.string().optional().describe("Set a secondary price for stop-loss-limit or take-profit-limit orders"),
  oflags: z
    .string()
    .optional()
    .describe("Comma-separated list of order flags (viqc, post, fcib, fciq, nompp, reduce-only)"),
  userref: z.number().optional().describe("Specify the user reference ID to target a specific order"),
  validate: z.boolean().optional().describe("Set to true to validate inputs without modifying the order"),
});

const EditOrderOutputSchema = z.object({
  descr: z.object({
    order: z.string().describe("Order description"),
  }),
  txid: z.string().describe("Transaction ID of edited order"),
  originaltxid: z.string().optional().describe("Original transaction ID if order was replaced"),
});

export const editOrder = createKrakenTool({
  name: "kraken_edit_order",
  description: "Modify an existing order by updating price, volume, or other execution parameters",
  inputSchema: EditOrderInputSchema,
  outputSchema: EditOrderOutputSchema,
  endpoint: "/0/private/EditOrder",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// CANCEL ALL ORDERS AFTER
// ============================================================================

const CancelAllOrdersAfterInputSchema = z.object({
  timeout: z
    .number()
    .int()
    .min(0)
    .describe("Define the timeout in seconds after which all open orders will be cancelled"),
});

const CancelAllOrdersAfterOutputSchema = z.object({
  currentTime: z.string().describe("Current server time"),
  triggerTime: z.string().describe("Time when cancellation will trigger"),
});

export const cancelAllOrdersAfter = createKrakenTool({
  name: "kraken_cancel_all_orders_after",
  description: "Schedule a time window after which all open orders will be cancelled automatically",
  inputSchema: CancelAllOrdersAfterInputSchema,
  outputSchema: CancelAllOrdersAfterOutputSchema,
  endpoint: "/0/private/CancelAllOrdersAfter",
  method: "POST",
  isPrivate: true,
  tags: ["financial", "crypto"],
});

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [addOrder, cancelOrder, cancelAllOrders, queryOrders, editOrder, cancelAllOrdersAfter];
