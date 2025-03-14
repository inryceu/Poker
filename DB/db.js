const sqlite = require("sqlite");
const sqlite3 = require("sqlite3");

async function initDB() {
  const db = await sqlite.open({
    filename: "./DB/database.db",
    driver: sqlite3.Database, // Важливо: Вказуємо драйвер для node:sqlite
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Player (
      loggin TEXT PRIMARY KEY,
      password TEXT NOT NULL,
      balance INTEGER DEFAULT 0,
      stack INTEGER DEFAULT 0,
      biggestGain INTEGER DEFAULT 0,
      biggestLose INTEGER DEFAULT 0,
      session TEXT DEFAULT NULL,
      cards TEXT DEFAULT '[]',
      friends TEXT DEFAULT '[]'
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin TEXT NOT NULL,
      startBalance INTEGER NOT NULL,
      minBet INTEGER NOT NULL,
      maxBet INTEGER NOT NULL,
      curentBet INTEGER NOT NULL,
      raiseValue INTEGER NOT NULL,
      roundTime INTEGER NOT NULL
    )
  `);

  return db;
}

const dbPromise = initDB();
module.exports = dbPromise;
