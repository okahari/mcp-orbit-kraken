#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({quiet: true});

import {startServer, parseArgs} from "mcp-orbit";
import type {MCPPlugin} from "mcp-orbit";

// ── Tools ─────────────────────────────────────────────────────────────────────
import {krakenTools as krakenTradingTools} from "./tools/kraken/trading.js";
import {krakenTools as krakenPublicTools} from "./tools/kraken/public.js";
import {krakenTools as krakenBalanceTools} from "./tools/kraken/balance.js";
import {krakenTools as krakenDepositTools} from "./tools/kraken/deposits.js";
import {krakenTools as krakenWithdrawalTools} from "./tools/kraken/withdrawals.js";
import {krakenTools as krakenMiscTools} from "./tools/kraken/misc.js";
import {gridPlanTools} from "./tools/grid-trading/grid-plan.js";
import {gridStateTools} from "./tools/grid-trading/grid-state.js";
import {gridLogTools} from "./tools/grid-trading/grid-log.js";

// ── Resources ─────────────────────────────────────────────────────────────────
import {configResource} from "./resources/config-content.js";

// ── Plugin ────────────────────────────────────────────────────────────────────

export const krakenPlugin: MCPPlugin = {
  name: "kraken",
  version: "0.1.0",
  description: "Kraken exchange integration — trading, balances, deposits, withdrawals, grid planning",
  tools: [
    ...krakenTradingTools,
    ...krakenPublicTools,
    ...krakenBalanceTools,
    ...krakenDepositTools,
    ...krakenWithdrawalTools,
    ...krakenMiscTools,
    ...gridPlanTools,
    ...gridStateTools,
    ...gridLogTools,
  ],
  resources: [configResource],
};

// ── Standalone server ─────────────────────────────────────────────────────────

const isMain = import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.endsWith("mcp-plugin-kraken");

if (isMain) {
  const config = parseArgs();
  startServer({
    ...config,
    plugins: [krakenPlugin],
    serverName: "mcp-plugin-kraken",
    serverVersion: "0.1.0",
  }).catch((err: unknown) => {
    console.error("Server failed to start:", err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
