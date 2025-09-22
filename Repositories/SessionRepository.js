"use strict";

import dbPromise from "../DB/db.js";

async function createSession(admin, startBalance, minBet, maxBet, roundTime) {
  const currentBet = minBet;
  const raiseValue = minBet;
  const players = [admin];

  const db = await dbPromise;
  const result = await db.run(
    `INSERT INTO Session (admin, players, startBalance, minBet, maxBet, currentBet, raiseValue, roundTime)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      admin,
      JSON.stringify(players),
      startBalance,
      minBet,
      maxBet,
      currentBet,
      raiseValue,
      roundTime,
    ]
  );

  return {
    id: result.lastID,
    admin,
    players,
    startBalance,
    minBet,
    maxBet,
    currentBet,
    raiseValue,
    roundTime,
  };
}

async function getSessionById(id) {
  const db = await dbPromise;
  const row = await db.get(`SELECT * FROM Session WHERE id = ?`, [id]);
  if (!row) return null;

  row.players = row.players ? JSON.parse(row.players) : [];

  return row;
}

async function joinSession(login, id) {
  const db = await dbPromise;
  const row = await db.get(`SELECT players FROM Session WHERE id = ?`, [id]);
  let players = row ? JSON.parse(row.players) : [];

  if (!players.includes(login)) {
    players = [...players, login];
    await updateSessionProperty(id, "players", players);
  }

  return players;
}

async function leaveSession(login, id) {
  const db = await dbPromise;
  const row = await db.get(`SELECT players FROM Session WHERE id = ?`, [id]);
  let players = row ? JSON.parse(row.players) : [];

  if (!players.includes(login)) return [];

  players = players.filter((player) => player != login);
  if (players.length === 0) {
    await deleteSession(id);
    return [];
  }
  await updateSessionProperty(id, "players", players);
  return players;
}

async function deleteSession(id) {
  const db = await dbPromise;
  await db.run(`DELETE FROM Session WHERE id = ?`, [id]);
}

async function updateSessionProperty(id, property, value) {
  const validProps = [
    "players",
    "currentBet",
    "bank",
    "bigBlind",
    "smallBlind",
  ];
  if (!validProps.includes(property)) return null;

  const db = await dbPromise;
  const serialized =
    Array.isArray(value) || typeof value === "object"
      ? JSON.stringify(value)
      : value;

  await db.run(`UPDATE Session SET ${property} = ? WHERE id = ?`, [
    serialized,
    id,
  ]);
}

export {
  createSession,
  getSessionById,
  deleteSession,
  leaveSession,
  joinSession,
  updateSessionProperty,
};
