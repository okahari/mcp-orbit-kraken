/**
 * Kraken Public API Tools
 *
 * Tools for accessing public market data (no authentication required)
 */

import {z} from "zod";
import {createKrakenTool} from "./index.js";

// ============================================================================
// GET SERVER TIME
// ============================================================================

const GetServerTimeInputSchema = z.object({});

const GetServerTimeOutputSchema = z.object({
  unixtime: z.number().describe("Unix timestamp (seconds)"),
  rfc1123: z.string().describe("RFC 1123 formatted time"),
});

export const getServerTime = createKrakenTool({
  name: "kraken_get_server_time",
  description: "Fetch the current time according to the Kraken server",
  inputSchema: GetServerTimeInputSchema,
  outputSchema: GetServerTimeOutputSchema,
  endpoint: "/0/public/Time",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto"],
});

// ============================================================================
// GET SYSTEM STATUS
// ============================================================================

const GetSystemStatusInputSchema = z.object({});

const GetSystemStatusOutputSchema = z.object({
  status: z.enum(["online", "maintenance", "cancel_only", "post_only"]).describe("System status"),
  timestamp: z.string().describe("Current server timestamp"),
});

export const getSystemStatus = createKrakenTool({
  name: "kraken_get_system_status",
  description: "Retrieve the current operational status of the Kraken platform",
  inputSchema: GetSystemStatusInputSchema,
  outputSchema: GetSystemStatusOutputSchema,
  endpoint: "/0/public/SystemStatus",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET ASSET INFO
// ============================================================================

const GetAssetInfoInputSchema = z.object({
  asset: z
    .string()
    .optional()
    .describe("Specify a comma-separated list of assets to retrieve details (e.g., XBT, ETH)"),
  aclass: z.enum(["currency", "margin"]).optional().describe("Filter assets by asset class"),
});

const GetAssetInfoOutputSchema = z
  .record(
    z.object({
      aclass: z.string().describe("Asset class"),
      altname: z
        .string()
        .describe(
          'Clean asset name without X/Z prefix (e.g., "BTC", "EUR", "USD", "CHF", "ADA"). Use this for filtering.',
        ),
      decimals: z.number().describe("Decimal places for record keeping"),
      display_decimals: z.number().describe("Decimal places for display"),
    }),
  )
  .describe(
    'Assets keyed by internal code (XXBT for BTC, ZEUR for EUR, ZCHF for CHF, XADA for ADA). Use "altname" field for filtering.',
  );

export const getAssetInfo = createKrakenTool({
  name: "kraken_get_asset_info",
  description: "Get detailed information about supported assets, including precision and margin availability",
  inputSchema: GetAssetInfoInputSchema,
  outputSchema: GetAssetInfoOutputSchema,
  endpoint: "/0/public/Assets",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET TRADABLE ASSET PAIRS
// ============================================================================

const GetTradableAssetPairsInputSchema = z.object({
  pair: z
    .string()
    .optional()
    .describe(
      "Comma-separated asset pairs using Kraken internal names with X/Z prefix, e.g. 'XBTCHF,XETHZEUR'. " +
        "Note: BTC is XBTCHF (not BTCCHF), ETH is XETHZEUR (not ETHEUR). Omit to get all pairs.",
    ),
  info: z
    .enum(["info", "fees", "margin", "leverage"])
    .optional()
    .describe("Data set filter: 'info' (pair details), 'fees' (fee schedule), 'margin', 'leverage'. Omit for default."),
});

const TradingPairSchema = z.object({
  altname: z
    .string()
    .describe('Clean pair name without X/Z prefix (e.g., "BTCEUR", "ADAUSD", "BTCCHF"). Use this for filtering.'),
  wsname: z
    .string()
    .describe('WebSocket name with slash (e.g., "BTC/EUR", "ADA/USD", "BTC/CHF"). Use this for filtering.'),
  base: z.string().describe("Base asset. May have X prefix for crypto (e.g., XXBT, XETH, XADA) or no prefix."),
  quote: z
    .string()
    .describe("Quote asset. Always has prefix: Z for fiat (ZUSD, ZEUR, ZCHF) or X for crypto (XXBT, XETH, XADA)."),
  aclass_base: z.string().describe("Deprecated - use base").optional(),
  aclass_quote: z.string().describe("Deprecated - use quote").optional(),
  lot: z.string().describe("Standard lot size"),
  cost_decimals: z.number().describe("Cost decimal places"),
  pair_decimals: z.number().describe("Pair decimal places"),
  lot_decimals: z.number().describe("Lot decimal places"),
  lot_multiplier: z.number().optional().describe("Lot multiplier"),
  leverage_buy: z.array(z.number()).optional().describe("Buy leverage levels"),
  leverage_sell: z.array(z.number()).optional().describe("Sell leverage levels"),
  fees: z
    .array(z.tuple([z.number(), z.number()]))
    .optional()
    .describe("Fee schedule [volume, fee_percent]"),
  fees_maker: z
    .array(z.tuple([z.number(), z.number()]))
    .optional()
    .describe("Maker fee schedule"),
  fee_volume_currency: z
    .string()
    .optional()
    .describe("Fee volume currency. Has Z prefix for fiat (ZUSD, ZEUR, ZCHF) or X prefix for crypto."),
  margin_call: z.number().optional().describe("Margin call level"),
  margin_stop: z.number().optional().describe("Margin stop level"),
  ordermin: z.string().optional().describe("Minimum order size"),
  costmin: z.string().optional().describe("Minimum order cost"),
  tick_size: z.string().optional().describe("Tick size"),
  status: z.string().optional().describe("Pair status"),
  long_position_limit: z.number().optional().describe("Long position limit"),
  short_position_limit: z.number().optional().describe("Short position limit"),
});

// Output schema for trading pairs
const GetTradableAssetPairsOutputSchema = z
  .record(TradingPairSchema)
  .describe(
    'Pairs keyed by internal name with X/Z prefix (e.g., XXBTZEUR, ADAZCHF). Use "altname" or "wsname" for filtering.',
  );

export const getTradableAssetPairs = createKrakenTool({
  name: "kraken_get_tradable_asset_pairs",
  description:
    'List tradable asset pairs. For filtering cached results, use "altname" (e.g., "BTCEUR") or "wsname" (e.g., "BTC/EUR") fields.',
  inputSchema: GetTradableAssetPairsInputSchema,
  outputSchema: GetTradableAssetPairsOutputSchema,
  endpoint: "/0/public/AssetPairs",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET TICKER INFO
// ============================================================================

const GetTickerInfoInputSchema = z.object({
  pair: z.string().describe("Specify the asset pair (e.g., XBTUSD, ETHUSD) to retrieve ticker information"),
});

const GetTickerInfoOutputSchema = z
  .record(
    z.object({
      a: z.tuple([z.string(), z.string(), z.string()]).describe("Ask [price, whole lot volume, lot volume]"),
      b: z.tuple([z.string(), z.string(), z.string()]).describe("Bid [price, whole lot volume, lot volume]"),
      c: z.tuple([z.string(), z.string()]).describe("Last trade [price, lot volume]"),
      v: z.tuple([z.string(), z.string()]).describe("Volume [today, last 24h]"),
      p: z.tuple([z.string(), z.string()]).describe("VWAP [today, last 24h]"),
      t: z.tuple([z.number(), z.number()]).describe("Number of trades [today, last 24h]"),
      l: z.tuple([z.string(), z.string()]).describe("Low [today, last 24h]"),
      h: z.tuple([z.string(), z.string()]).describe("High [today, last 24h]"),
      o: z.string().describe("Opening price today"),
    }),
  )
  .describe("Ticker info keyed by internal pair name (may have X/Z prefix)");

export const getTickerInfo = createKrakenTool({
  name: "kraken_get_ticker_info",
  description: "Retrieve ticker information including bid/ask, last trade, and volume data",
  inputSchema: GetTickerInfoInputSchema,
  outputSchema: GetTickerInfoOutputSchema,
  endpoint: "/0/public/Ticker",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET OHLC DATA
// ============================================================================

const GetOhlcDataInputSchema = z.object({
  pair: z.string().describe("Identify the asset pair (e.g., XBTUSD) for the OHLC data"),
  interval: z
    .number()
    .int()
    .optional()
    .describe("Set the time interval in minutes (default 1, valid: 1, 5, 15, 30, 60, 240, 1440, 10080, 21600)"),
  since: z.string().optional().describe("Return data since the given ID (pagination cursor from previous calls)"),
});

const GetOhlcDataOutputSchema = z.object({
  pair: z.array(
    z.tuple([
      z.number().describe("Time"),
      z.string().describe("Open"),
      z.string().describe("High"),
      z.string().describe("Low"),
      z.string().describe("Close"),
      z.string().describe("VWAP"),
      z.string().describe("Volume"),
      z.number().describe("Count"),
    ]),
  ),
  last: z.number().describe("Last timestamp"),
});

export const getOhlcData = createKrakenTool({
  name: "kraken_get_ohlc_data",
  description: "Obtain open, high, low, close (OHLC) candlestick data for a specific asset pair",
  inputSchema: GetOhlcDataInputSchema,
  outputSchema: GetOhlcDataOutputSchema,
  endpoint: "/0/public/OHLC",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET ORDER BOOK
// ============================================================================

const GetOrderBookInputSchema = z.object({
  pair: z.string().describe("Provide the asset pair (e.g., XBTUSD) to fetch the order book"),
  count: z.number().int().optional().describe("Limit the number of bid/ask entries (default 100, max 500)"),
});

const GetOrderBookOutputSchema = z
  .record(
    z.object({
      asks: z.array(z.tuple([z.string(), z.string(), z.number()])).describe("Ask side [price, volume, timestamp]"),
      bids: z.array(z.tuple([z.string(), z.string(), z.number()])).describe("Bid side [price, volume, timestamp]"),
    }),
  )
  .describe("Order book keyed by pair name");

export const getOrderBook = createKrakenTool({
  name: "kraken_get_order_book",
  description: "Fetch the current order book depth for an asset pair",
  inputSchema: GetOrderBookInputSchema,
  outputSchema: GetOrderBookOutputSchema,
  endpoint: "/0/public/Depth",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET RECENT TRADES
// ============================================================================

const GetRecentTradesInputSchema = z.object({
  pair: z.string().describe("Specify the asset pair (e.g., XBTUSD, ETHUSD) to retrieve recent trades for"),
  since: z.string().optional().describe("Return trade data since the given ID (pagination cursor from previous calls)"),
});

const GetRecentTradesOutputSchema = z
  .record(
    z.array(
      z.tuple([
        z.string().describe("Price"),
        z.string().describe("Volume"),
        z.number().describe("Time"),
        z.string().describe("Buy/Sell"),
        z.string().describe("Market/Limit"),
        z.string().describe("Miscellaneous"),
      ]),
    ),
  )
  .describe("Recent trades keyed by pair name");

export const getRecentTrades = createKrakenTool({
  name: "kraken_get_recent_trades",
  description: "Retrieve the most recent public trades for an asset pair",
  inputSchema: GetRecentTradesInputSchema,
  outputSchema: GetRecentTradesOutputSchema,
  endpoint: "/0/public/Trades",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// GET RECENT SPREADS
// ============================================================================

const GetRecentSpreadsInputSchema = z.object({
  pair: z.string().describe("Specify the asset pair (e.g., XBTUSD) to retrieve recent bid-ask spreads"),
  since: z
    .string()
    .optional()
    .describe("Return spread data since the given ID (pagination cursor from previous calls)"),
});

const GetRecentSpreadsOutputSchema = z
  .record(z.array(z.tuple([z.number().describe("Time"), z.string().describe("Bid"), z.string().describe("Ask")])))
  .describe("Recent spreads keyed by pair name");

export const getRecentSpreads = createKrakenTool({
  name: "kraken_get_recent_spreads",
  description: "List recent bid-ask spreads for an asset pair to analyze market depth",
  inputSchema: GetRecentSpreadsInputSchema,
  outputSchema: GetRecentSpreadsOutputSchema,
  endpoint: "/0/public/Spread",
  method: "GET",
  isPrivate: false,
  tags: ["financial", "crypto", "market-data"],
  });

// ============================================================================
// EXPORT
// ============================================================================

export const krakenTools = [
  getServerTime,
  getSystemStatus,
  getAssetInfo,
  getTradableAssetPairs,
  getTickerInfo,
  getOhlcData,
  getOrderBook,
  getRecentTrades,
  getRecentSpreads,
];
