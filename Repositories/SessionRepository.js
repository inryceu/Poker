"use strict";

import dbPromise from "../DB/db.js";

async function createSession(admin, startBalance, minBet, maxBet, roundTime) {
  const curentBet = minBet;
  const raiseValue = maxBet;

  const db = await dbPromise;
  const result = await db.run(
    `INSERT INTO Session (admin, startBalance, minBet, maxBet, curentBet, raiseValue, roundTime)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [admin, startBalance, minBet, maxBet, curentBet, raiseValue, roundTime]
  );

  return {
    id: result.lastID,
    admin,
    startBalance,
    minBet,
    maxBet,
    curentBet,
    raiseValue,
    roundTime,
  };
}

async function getSessionById(id) {
  const db = await dbPromise;
  return db.get(`SELECT * FROM Session WHERE id = ?`, id);
}

async function deleteSession(id) {
  const db = await dbPromise;
  await db.run(`DELETE FROM Session WHERE id = ?`, [id]);
}

async function updateSessionProperty(id, property, value) {
  const validProps = ["curentBet", "bank", "bigBlind", "smallBlind"];
  if (!validProps.includes(property)) {
    console.error("Недоступне поле для оновлення");
    return;
  }

  const db = await dbPromise;
  await db.run(`UPDATE Session SET ${property} = ? WHERE id = ?`, [value, id]);
}

export { createSession, getSessionById, deleteSession, updateSessionProperty };
