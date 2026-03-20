#!/usr/bin/env node

import dotenv from "dotenv";
dotenv.config({quiet: true});

import {startServer, parseArgs, applyPreInit} from "mcp-orbit";

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

// ── Resources & Prompts (auto-register on import) ─────────────────────────────
import "./resources/config-content.js";
import "./prompts/analyze-balance.js";
import "./prompts/trade-assistant.js";

// ── Start ─────────────────────────────────────────────────────────────────────
const config = parseArgs();
applyPreInit(config);

const allTools = [
  ...krakenTradingTools,
  ...krakenPublicTools,
  ...krakenBalanceTools,
  ...krakenDepositTools,
  ...krakenWithdrawalTools,
  ...krakenMiscTools,
  ...gridPlanTools,
  ...gridStateTools,
  ...gridLogTools,
];

startServer({...config, tools: allTools}).catch((err: unknown) => {
  console.error("Server failed to start:", err instanceof Error ? err.message : err);
  process.exit(1);
});
