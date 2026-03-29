# mcp-orbit-kraken

Kraken exchange plugin for [mcp-orbit](https://github.com/okahari/mcp-orbit). Provides 32 MCP tools for trading, account management, and grid trading automation.

## Usage

### As a plugin (in an existing mcp-orbit server)

```typescript
import { registerPlugin, startServer } from "mcp-orbit";
import { krakenPlugin } from "mcp-orbit-kraken";

await registerPlugin(krakenPlugin);
startServer({ mode: "stdio", plugins: [krakenPlugin] });
```

### Standalone server

```bash
# stdio mode (for Claude Desktop, etc.)
npx mcp-orbit-kraken --stdio

# HTTP mode
npx mcp-orbit-kraken --http --port 3333
```

### Claude Desktop configuration

```json
{
  "mcpServers": {
    "kraken": {
      "command": "node",
      "args": ["/path/to/mcp-orbit-kraken/dist/index.js", "--stdio"],
      "env": {
        "KRAKEN_API_KEY": "your-api-key",
        "KRAKEN_PRIVATE_KEY": "your-private-key"
      }
    }
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `KRAKEN_API_KEY` | Yes (for private endpoints) | Kraken API key |
| `KRAKEN_PRIVATE_KEY` | Yes (for private endpoints) | Kraken API private key |
| `KRAKEN_DB_PATH` | No | SQLite database path for grid trading (default: `data/grids.db`) |
| `GRID_CHECK_WEBHOOK_URL` | No | Webhook URL for grid monitoring (default: `http://localhost:3001`) |
| `GRID_WEBHOOK_SECRET` | No | Secret for grid check webhook authentication |

## Tools

### Public Market Data (no API key required)

| Tool | Description |
|------|-------------|
| `kraken_get_server_time` | Get Kraken server time |
| `kraken_get_system_status` | Get system status |
| `kraken_get_asset_info` | Get asset information |
| `kraken_get_tradable_asset_pairs` | Get tradable asset pairs |
| `kraken_get_ticker_info` | Get ticker information |
| `kraken_get_ohlc_data` | Get OHLC candlestick data |
| `kraken_get_order_book` | Get order book depth |
| `kraken_get_recent_trades` | Get recent trades |
| `kraken_get_recent_spreads` | Get recent bid/ask spreads |

### Account Balance

| Tool | Description |
|------|-------------|
| `kraken_get_account_balance` | Get account balances |
| `kraken_get_extended_balance` | Get extended balance info |

### Trading

| Tool | Description |
|------|-------------|
| `kraken_add_order` | Place a new order |
| `kraken_edit_order` | Edit an existing order |
| `kraken_cancel_order` | Cancel a specific order |
| `kraken_cancel_all_orders` | Cancel all open orders |
| `kraken_cancel_all_orders_after` | Dead man's switch — cancel all orders after timeout |
| `kraken_query_orders` | Query order status |

### Deposits

| Tool | Description |
|------|-------------|
| `kraken_get_deposit_methods` | Get available deposit methods |
| `kraken_get_deposit_addresses` | Get deposit addresses |
| `kraken_get_deposit_status` | Get deposit status |

### Withdrawals

| Tool | Description |
|------|-------------|
| `kraken_get_withdrawal_methods` | Get withdrawal methods |
| `kraken_get_withdrawal_addresses` | Get withdrawal addresses |
| `kraken_get_withdrawal_info` | Get withdrawal fee and limit info |
| `kraken_withdraw_funds` | Execute a withdrawal |
| `kraken_get_withdrawal_status` | Get withdrawal status |
| `kraken_cancel_withdrawal` | Cancel a pending withdrawal |

### Misc

| Tool | Description |
|------|-------------|
| `kraken_get_trades_history` | Get trade history |
| `kraken_get_websockets_token` | Get WebSocket authentication token |
| `kraken_wallet_transfer` | Transfer between Kraken wallets |

### Grid Trading

| Tool | Description |
|------|-------------|
| `grid_plan` | Calculate a grid trading plan |
| `grid_state` | CRUD store for grid configurations (save/get/list/delete) |
| `grid_log` | Log and query grid trading events |

## Development

```bash
npm install
npm run build
npm run start:stdio
```

## License

MIT
