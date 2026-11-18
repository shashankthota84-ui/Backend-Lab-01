const path = require('path');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');

const dbPath = path.join(__dirname, 'users.db');

let db = null;

/**
 * Initializes SQLite database connection and automatically creates the users table if not exists.
 */
const initializeDB = async () => {
  if (db) {
    return db;
  }

  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    console.log(`[Database] SQLite connected at: ${dbPath}`);

    // Create users table automatically
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        password TEXT NOT NULL
      );
    `);

    console.log('[Database] Users table verified/created successfully.');
    return db;
  } catch (error) {
    console.error('[Database] Failed to connect or initialize SQLite database:', error.message);
    throw error;
  }
};

/**
 * Accessor for the active SQLite database instance.
 */
const getDB = () => {
  if (!db) {
    throw new Error('Database not initialized. Please call initializeDB() first.');
  }
  return db;
};

/**
 * Helper to close database connection when shutting down.
 */
const closeDB = async () => {
  if (db) {
    await db.close();
    db = null;
    console.log('[Database] SQLite connection closed.');
  }
};

module.exports = {
  initializeDB,
  getDB,
  closeDB,
  dbPath,
};
