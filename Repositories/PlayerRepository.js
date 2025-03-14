"use strict";

const bcrypt = require("bcrypt");
const dbPromise = require("../DB/db");

const PROPERTIES = [
  "loggin",
  "password",
  "balance",
  "stack",
  "biggestGain",
  "biggestLose",
  "session",
  "cards",
  "friends",
];

async function checkIfPlayerExists(loggin) {
  const db = await dbPromise;
  const row = await db.get(
    "SELECT COUNT(*) AS count FROM Player WHERE loggin = ?",
    loggin
  );
  return row.count > 0;
}

async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

async function checkPassword(storedPassword, enteredPassword) {
  return bcrypt.compare(enteredPassword, storedPassword);
}

async function addFriend(loggin, friendLoggin) {
  const existsLoggin = await checkIfPlayerExists(loggin);
  const existsFriendLoggin = await checkIfPlayerExists(friendLoggin);
  if (!existsLoggin || !existsFriendLoggin) return;

  const db = await dbPromise;
  const row = await db.get(
    "SELECT friends FROM Player WHERE loggin = ?",
    loggin
  );
  let friendsList = row ? JSON.parse(row.friends) : [];

  if (!friendsList.includes(friendLoggin) && loggin !== friendLoggin) {
    friendsList.push(friendLoggin);
  }

  await db.run(
    "UPDATE Player SET friends = ? WHERE loggin = ?",
    JSON.stringify(friendsList),
    loggin
  );
}

async function deleteFriend(loggin, friendLoggin) {
  const existsLoggin = await checkIfPlayerExists(loggin);
  const existsFriendLoggin = await checkIfPlayerExists(friendLoggin);
  if (!existsLoggin || !existsFriendLoggin) return;

  const db = await dbPromise;
  const row = await db.get(
    "SELECT friends FROM Player WHERE loggin = ?",
    loggin
  );
  let friendsList = row ? JSON.parse(row.friends) : [];

  friendsList = friendsList.filter((friend) => friend !== friendLoggin);

  await db.run(
    "UPDATE Player SET friends = ? WHERE loggin = ?",
    JSON.stringify(friendsList),
    loggin
  );
}

async function updatePlayerProperty(loggin, property, newValue) {
  const exists = await checkIfPlayerExists(loggin);
  if (!exists) return;

  const db = await dbPromise;
  await db.run(
    `UPDATE Player SET ${property} = ? WHERE loggin = ?`,
    newValue,
    loggin
  );
}

async function loadPropertyFromDB(loggin, property) {
  const db = await dbPromise;
  const row = await db.get(
    `SELECT ${property} FROM Player WHERE loggin = ?`,
    loggin
  );
  return row ? row[property] : null;
}

async function loadPlayerFromDB(loggin, password) {
  try {
    const hashedPassword = await loadPropertyFromDB(loggin, "password");
    const isValidPassword = await checkPassword(hashedPassword, password);
    if (!isValidPassword) return null;
  } catch (err) {
    return null;
  }

  const player = {
    loggin,
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
    player[property] = await loadPropertyFromDB(loggin, property);
  }

  return player;
}

async function deleteAccount(loggin) {
  const exists = await checkIfPlayerExists(loggin);
  if (!exists) return;

  const db = await dbPromise;
  await db.run("DELETE FROM Player WHERE loggin = ?", loggin);
}

async function createNewPlayer(loggin, password) {
  const exists = await checkIfPlayerExists(loggin);
  if (exists) {
    console.log("Гравець з таким логіном вже існує");
    return;
  }

  const hashedPassword = await hashPassword(password);
  const values = [loggin, hashedPassword, 0, 0, 0, 0, "[]"];

  const db = await dbPromise;
  await db.run(
    `INSERT INTO Player (loggin, password, balance, stack, biggestGain, biggestLose, friends) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    values
  );

  console.log("Гравця успішно додано");
}

//USAGE

async function usage() {
  await createNewPlayer("john_doe", "securePassword123");
  await createNewPlayer("jane_smith", "securePassword123");

  const exists = await checkIfPlayerExists("john_doe");
  console.log("Гравець існує:", exists);

  const player = await loadPlayerFromDB("john_doe", "securePassword123");
  console.log(`Гравця завантажено:`, player);

  await addFriend("john_doe", "jane_smith");
  console.log(`Друг "jane_smith" доданий`);

  await deleteFriend("john_doe", "jane_smith");
  console.log(`Друг "jane_smith" видалений`);

  await updatePlayerProperty("john_doe", "balance", 1000);
  console.log(`Баланс оновлено на 1000`);

  await deleteAccount("john_doe");
  console.log(`Акаунт "john_doe" видалено`);
}

usage();
