"use strict";

const db = require("../DB/db");

async function createSession(
  admin,
  startBalance,
  minBet,
  maxBet,
  raiseValue,
  roundTime
) {
  const curentBet = minBet;
  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO sessions (admin, startBalance, minBet, maxBet, curentBet, raiseValue, roundTime)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [admin, startBalance, minBet, maxBet, curentBet, raiseValue, roundTime],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

async function getSessionById(id) {
  return new Promise((resolve, reject) => {
    db.get(`SELECT * FROM sessions WHERE id = ?`, [id], (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function deleteSession(id) {
  return new Promise((resolve, reject) => {
    db.run(`DELETE FROM sessions WHERE id = ?`, [id], function (err) {
      if (err) reject(err);
      else resolve();
    });
  });
}

async function updateSessionProperty(id, property, value) {
  const validProps = ["curentBet", "bank", "bigBlind", "smallBlind"];
  if (!validProps.includes(property)) {
    console.error("Недоступне поле для оновлення");
    return;
  }

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE sessions SET ${property} = ? WHERE id = ?`,
      [value, id],
      function (err) {
        if (err) reject(err);
        else resolve();
      }
    );
  });
}

//Usage

async function usage() {
  console.log("\n*** Створення нової сесії ***");
  const session = await createSession("admin123", 1000, 10, 100, 5, 30);
  console.log("Створена сесія:", session);

  console.log("\n*** Отримання сесії за ID ***");
  const loadedSession = await getSessionById(session.id);
  console.log("Завантажена сесія:", loadedSession);

  console.log("\n*** Оновлення поточної ставки ***");
  await updateSessionProperty(session.id, "curentBet", 50);
  console.log("Поточну ставку оновленно");

  console.log("\n*** Отримання сесії після оновлення ***");
  const updatedSession = await getSessionById(session.id);
  console.log("Сесія після оновлення:", updatedSession);

  console.log("\n*** Видалення сесії ***");
  await deleteSession(session.id);
  console.log("Сесію видалено");
}

usage();
