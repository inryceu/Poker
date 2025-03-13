"use strict";

const bcrypt = require("bcrypt");
const db = require("../DB/db");

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
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT COUNT(*) AS count FROM Player WHERE loggin = ?",
      [loggin],
      (err, row) => {
        if (err) {
          console.error(err);
          reject(false);
        } else {
          resolve(row.count > 0);
        }
      }
    );
  });
}

function hashPassword(password) {
  return new Promise((res, rej) => {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        rej("Помилка хешування паролю");
      } else {
        res(hash);
      }
    });
  });
}

function checkPassword(storedPassword, enteredPassword) {
  return new Promise((resolve, reject) => {
    bcrypt.compare(enteredPassword, storedPassword, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}

async function addFriend(loggin, friendLoggin) {
  const existsLoggin = await checkIfPlayerExists(loggin);
  const existsFriendLoggin = await checkIfPlayerExists(friendLoggin);
  if (!existsLoggin || !existsFriendLoggin) return;

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT friends FROM Player WHERE loggin = ?",
      [loggin],
      (err, row) => {
        if (err) {
          console.error(err);
          reject();
        }

        let friendsList = [];
        try {
          if (row && row.friends) {
            friendsList = JSON.parse(row.friends);
          }
        } catch (parseError) {
          friendsList = [];
        }

        if (!friendsList.includes(friendLoggin) && loggin !== friendLoggin) {
          friendsList.push(friendLoggin);
        }

        db.run(
          "UPDATE Player SET friends = ? WHERE loggin = ?",
          [JSON.stringify(friendsList), loggin],
          (err) => {
            if (err) {
              console.error(err);
              reject();
            } else {
              resolve();
            }
          }
        );
      }
    );
  });
}

async function deleteFriend(loggin, friendLoggin) {
  const existsLoggin = await checkIfPlayerExists(loggin);
  const existsFriendLoggin = await checkIfPlayerExists(friendLoggin);
  if (!existsLoggin || !existsFriendLoggin) return;

  return new Promise((resolve, reject) => {
    db.get(
      "SELECT friends FROM Player WHERE loggin = ?",
      [loggin],
      (err, row) => {
        if (err) {
          console.error(err);
          reject();
        }

        let friendsList = [];
        try {
          if (row && row.friends) {
            friendsList = JSON.parse(row.friends);
          }
        } catch (parseError) {
          friendsList = [];
        }

        const newFriendsList = friendsList.filter(
          (friend) => friend !== friendLoggin
        );

        db.run(
          "UPDATE Player SET friends = ? WHERE loggin = ?",
          [JSON.stringify(newFriendsList), loggin],
          (err) => {
            if (err) {
              console.error("Помилка при видаленні друга:", err);
              reject();
            } else {
              resolve();
            }
          }
        );
      }
    );
  });
}

async function updatePlayerProperty(loggin, property, newValue) {
  const exists = await checkIfPlayerExists(loggin);
  if (!exists) return;

  return new Promise((resolve, reject) => {
    db.run(
      `UPDATE Player SET ${property} = ? WHERE loggin = ?`,
      [newValue, loggin],
      (err) => {
        if (err) {
          console.error(err);
          reject();
        } else {
          resolve();
        }
      }
    );
  });
}

async function loadPropertyFromDB(loggin, property) {
  return new Promise((resolve, reject) => {
    db.get(
      `SELECT ${property} FROM Player WHERE loggin = ?`,
      [loggin],
      (err, row) => {
        if (err) {
          console.error(err);
          reject(null);
        } else {
          resolve(row ? row[property] : null);
        }
      }
    );
  });
}

async function loadPlayerFromDB(loggin, password) {
  try {
    const hashedPassword = await loadPropertyFromDB(loggin, "password");
    const exists = await checkPassword(hashedPassword, password);
    if (!exists) return null;
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
    cards: new Set(),
    friends: new Set(),
  };

  for (const property of PROPERTIES) {
    player[property] = await loadPropertyFromDB(loggin, property);
  }

  return player;
}

async function deleteAccount(loggin) {
  const exists = await checkIfPlayerExists(loggin);
  if (!exists) return;

  return new Promise((resolve, reject) => {
    db.run("DELETE FROM Player WHERE loggin = ?", [loggin], (err) => {
      if (err) {
        console.error(err);
        reject();
      } else {
        resolve();
      }
    });
  });
}

async function createNewPlayer(loggin, password) {
  const exists = await checkIfPlayerExists(loggin);
  if (exists) {
    console.log("Гравець з таким логіном вже існує");
    return;
  }

  return new Promise((resolve, reject) => {
    hashPassword(password)
      .then((hashedPassword) => {
        const values = [
          loggin,
          hashedPassword,
          0, // balance
          0, // stack
          0, // biggestGain
          0, // biggestLose
          JSON.stringify([]), // friends
        ];

        db.run(
          `INSERT INTO Player (loggin, password, balance, stack, biggestGain, biggestLose, friends) 
               VALUES (?, ?, ?, ?, ?, ?, ?)`,
          values,
          (err) => {
            if (err) {
              console.error(err);
              reject();
            } else {
              console.log("Гравця успішно додано");
              resolve();
            }
          }
        );
      })
      .catch((err) => {
        console.error(err);
        reject();
      });
  });
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
