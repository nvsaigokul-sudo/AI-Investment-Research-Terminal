import { Pool } from 'pg';
import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';
import { config } from '../config';

interface DatabaseClient {
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<void>;
  close(): Promise<void>;
}

class PostgresClient implements DatabaseClient {
  private pool: Pool;

  constructor(connectionString: string) {
    console.log('Database: Using PostgreSQL database connection.');
    this.pool = new Pool({
      connectionString,
      ssl: config.isProduction ? { rejectUnauthorized: false } : undefined,
    });
  }

  async query<T = any>(sql: string, params?: any[]): Promise<T[]> {
    const res = await this.pool.query(sql, params);
    return res.rows;
  }

  async execute(sql: string, params?: any[]): Promise<void> {
    await this.pool.query(sql, params);
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}

class SQLiteClient implements DatabaseClient {
  private db: sqlite3.Database;

  constructor(dbPath: string) {
    console.log(`Database: Using SQLite database at: ${dbPath}`);
    this.db = new sqlite3.Database(dbPath);
  }

  // Helper to convert Postgres parameterized query ($1, $2) to SQLite format (?, ?)
  private convertSql(sql: string): string {
    return sql.replace(/\$\d+/g, '?');
  }

  query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const converted = this.convertSql(sql);
    return new Promise((resolve, reject) => {
      this.db.all(converted, params, (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows as T[]);
        }
      });
    });
  }

  execute(sql: string, params: any[] = []): Promise<void> {
    const converted = this.convertSql(sql);
    return new Promise((resolve, reject) => {
      // For schema setup with multiple statements, SQLite's db.exec is needed
      if (params.length === 0 && (sql.includes('CREATE TABLE') || sql.includes(';'))) {
        this.db.exec(sql, (err) => {
          if (err) reject(err);
          else resolve();
        });
      } else {
        this.db.run(converted, params, (err) => {
          if (err) reject(err);
          else resolve();
        });
      }
    });
  }

  close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }
}

let db: DatabaseClient;

export function getDb(): DatabaseClient {
  if (!db) {
    if (config.databaseUrl) {
      db = new PostgresClient(config.databaseUrl);
    } else {
      const sqlitePath = path.join(__dirname, '../../dev.db');
      db = new SQLiteClient(sqlitePath);
    }
  }
  return db;
}

export async function initDb(): Promise<void> {
  const client = getDb();
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await client.execute(schemaSql);
    console.log('Database schema successfully initialized.');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}
