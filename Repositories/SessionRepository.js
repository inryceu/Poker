"use strict";

import dbPromise from "../DB/db.js";

async function createSession(
  admin,
  startBalance,
  minBet,
  maxBet,
  raiseValue,
  roundTime
) {
  const curentBet = minBet;

  const db = await dbPromise;
  const result = await db.run(
    `INSERT INTO sessions (admin, startBalance, minBet, maxBet, curentBet, raiseValue, roundTime)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    admin,
    startBalance,
    minBet,
    maxBet,
    curentBet,
    raiseValue,
    roundTime
  );

  return { id: result.lastID };
}

async function getSessionById(id) {
  const db = await dbPromise;
  return db.get(`SELECT * FROM sessions WHERE id = ?`, id);
}

async function deleteSession(id) {
  const db = await dbPromise;
  await db.run(`DELETE FROM sessions WHERE id = ?`, id);
}

async function updateSessionProperty(id, property, value) {
  const validProps = ["curentBet", "bank", "bigBlind", "smallBlind"];
  if (!validProps.includes(property)) {
    console.error("Недоступне поле для оновлення");
    return;
  }

  const db = await dbPromise;
  await db.run(`UPDATE sessions SET ${property} = ? WHERE id = ?`, value, id);
}

export { createSession, getSessionById, deleteSession, updateSessionProperty };
