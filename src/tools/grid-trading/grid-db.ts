import Database from "better-sqlite3";
import {logger} from "mcp-orbit";
import {resolve, dirname} from "node:path";
import {mkdirSync} from "node:fs";

const gridDbLogger = logger.child("grid-db");
let gridDb: Database.Database | null = null;
const initializedDbs = new WeakSet<Database.Database>();

export function ensureGridTradingSchema(db: Database.Database): void {
  if (initializedDbs.has(db)) return;

  db.exec(`
    CREATE TABLE IF NOT EXISTS grids (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grid_id TEXT UNIQUE NOT NULL,
      data JSON NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_grids_grid_id ON grids(grid_id);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS grid_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      grid_id TEXT NOT NULL,
      event TEXT NOT NULL,
      data JSON,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_grid_log_grid_id ON grid_log(grid_id);
  `);

  initializedDbs.add(db);
}

export function getGridDatabase(): Database.Database {
  if (!gridDb) {
    const dbPath = process.env.KRAKEN_DB_PATH ?? resolve("data", "grids.db");
    mkdirSync(dirname(dbPath), {recursive: true});
    gridDbLogger.info(`Opening grid database: ${dbPath}`);
    gridDb = new Database(dbPath);
    gridDb.pragma("journal_mode = WAL");
  }

  const db = gridDb;
  ensureGridTradingSchema(db);
  return db;
}

export function closeGridDatabase(): void {
  if (gridDb) {
    gridDb.close();
    gridDb = null;
  }
}
