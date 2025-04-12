"use strict";

import bcrypt from "bcrypt";
import dbPromise from "../DB/db.js";

const PROPERTIES = [
  "login",
  "password",
  "balance",
  "stack",
  "biggestGain",
  "biggestLose",
  "session",
  "cards",
  "friends",
];

async function checkIfPlayerExists(login) {
  const db = await dbPromise;
  const result = await db.get("SELECT 1 FROM Player WHERE login = ?", [login]);
  return result !== undefined && result !== null;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function checkPassword(storedPassword, enteredPassword) {
  return bcrypt.compare(enteredPassword, storedPassword);
}

async function addFriend(login, friendLogin) {
  const existsLogin = await checkIfPlayerExists(login);
  const existsFriendLogin = await checkIfPlayerExists(friendLogin);
  if (!existsLogin || !existsFriendLogin) return;

  const db = await dbPromise;
  const row = await db.get("SELECT friends FROM Player WHERE login = ?", login);
  let friendsList = row ? JSON.parse(row.friends) : [];

  if (!friendsList.includes(friendLogin) && login !== friendLogin) {
    friendsList.push(friendLogin);
  }

  await db.run(
    "UPDATE Player SET friends = ? WHERE login = ?",
    JSON.stringify(friendsList),
    login
  );
}

async function deleteFriend(login, friendLogin) {
  const existsLogin = await checkIfPlayerExists(login);
  const existsFriendLogin = await checkIfPlayerExists(friendLogin);
  if (!existsLogin || !existsFriendLogin) return;

  const db = await dbPromise;
  const row = await db.get("SELECT friends FROM Player WHERE login = ?", login);
  let friendsList = row ? JSON.parse(row.friends) : [];

  friendsList = friendsList.filter((friend) => friend !== friendLogin);

  await db.run(
    "UPDATE Player SET friends = ? WHERE login = ?",
    JSON.stringify(friendsList),
    login
  );
}

async function updatePlayerProperty(login, property, newValue) {
  const exists = await checkIfPlayerExists(login);
  if (!exists) return;

  const db = await dbPromise;
  await db.run(
    `UPDATE Player SET ${property} = ? WHERE login = ?`,
    newValue,
    login
  );
}

async function loadPropertyFromDB(login, property) {
  const db = await dbPromise;
  const row = await db.get(
    `SELECT ${property} FROM Player WHERE login = ?`,
    login
  );
  return row ? row[property] : null;
}

async function loadPlayerFromDB(login, password) {
  try {
    const hashedPassword = await loadPropertyFromDB(login, "password");
    const isValidPassword = await checkPassword(hashedPassword, password);
    if (!isValidPassword) return null;
  } catch (err) {
    if (err) return null;
  }

  const player = {
    login,
    password,
    balance: 0,
    stack: 0,
    biggestGain: 0,
    biggestLose: 0,
    session: null,
    cards: [],
    friends: [],
  };

  for (const property of PROPERTIES) {
    player[property] = await loadPropertyFromDB(login, property);
  }

  return player;
}

async function deleteAccount(login) {
  const exists = await checkIfPlayerExists(login);
  if (!exists) return;

  const db = await dbPromise;
  await db.run("DELETE FROM Player WHERE login = ?", login);
}

async function createNewPlayer(login, password) {
  if (await checkIfPlayerExists(login)) {
    console.log("Гравець з таким логіном вже існує");
    return false;
  }

  const hashedPassword = await hashPassword(password);
  const values = [login, hashedPassword, 0, 0, 0, 0, "[]"];

  const db = await dbPromise;
  await db.run(
    `INSERT INTO Player (login, password, balance, stack, biggestGain, biggestLose, friends) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    values
  );

  console.log("Гравця успішно додано");
  return true;
}

export {
  checkIfPlayerExists,
  hashPassword,
  checkPassword,
  addFriend,
  deleteFriend,
  updatePlayerProperty,
  loadPlayerFromDB,
  loadPropertyFromDB,
  deleteAccount,
  createNewPlayer,
};
