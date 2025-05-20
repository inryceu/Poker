import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function initDB() {
  const db = await open({
    filename: "./DB/database.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS Player (
      login TEXT PRIMARY KEY,
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
    CREATE TABLE IF NOT EXISTS Session (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      admin TEXT NOT NULL,
      players TEXT DEFAULT '[]',
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
export default dbPromise;
