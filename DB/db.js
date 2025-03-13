const sqlite3 = require("sqlite3").verbose();
const path = "./DB/database.db";
const db = new sqlite3.Database(path);

const playerTable = `
  CREATE TABLE IF NOT EXISTS Player (
    loggin TEXT NOT NULL UNIQUE,    
    password TEXT NOT NULL,
    balance INTEGER DEFAULT 0,
    stack INTEGER DEFAULT 0,
    biggestGain INTEGER DEFAULT 0,
    biggestLose INTEGER DEFAULT 0,
    session TEXT,
    cards TEXT,
    friends TEXT
  );
`;

const sessionTable = `
  CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin TEXT NOT NULL,
    startBalance INTEGER NOT NULL,
    minBet INTEGER NOT NULL,
    maxBet INTEGER NOT NULL,
    curentBet INTEGER NOT NULL,
    raiseValue INTEGER NOT NULL,
    roundTime INTEGER NOT NULL,
    bank INTEGER DEFAULT 0,
    bigBlind TEXT DEFAULT '',
    smallBlind TEXT DEFAULT ''
  );
`;

db.serialize(() => {
  db.run(playerTable, (err) => {
    if (err) {
      console.error(err);
    }
  });
  db.run(sessionTable, (err) => {
    if (err) {
      console.error(err);
    }
  });
});

module.exports = db;
