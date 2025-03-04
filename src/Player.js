"use strict";

const mysql = require("mysql2/promise");
const bcrypt = require("bcrypt");
const CONFIG = require("./config");

const PROPERTIES = [
  "loggin",
  "password",
  "id",
  "balance",
  "stack",
  "biggestGain",
  "biggestLose",
  "session",
  "cards",
  "friends",
];

class Player {
  constructor(loggin, password) {
    this._loggin = loggin;
    this._password = password;
    this._id;

    this._balance = 0;
    this._stack = 0;
    this._biggestGain = 0;
    this._biggestLose = 0;

    this._session = null;
    this._cards = new Set();

    this._friends = new Set();
  }

  static async checkIfPlayerExists(loggin) {
    const connection = await mysql.createConnection(CONFIG);
    try {
      const [result] = await connection.execute(
        "SELECT COUNT(*) AS count FROM Player WHERE loggin = ?",
        [loggin]
      );
      await connection.end();
      return result[0].count > 0;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  hashPassword(password) {
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

  static checkPassword(storedPassword, enteredPassword) {
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

  get loggin() {
    return this._loggin;
  }
  set loggin(newLoggin) {
    this._loggin = newLoggin;
  }

  get id() {
    return this._id;
  }
  set id(newId) {
    this._id = newId;
  }

  get balance() {
    return this._balance;
  }
  set balance(newBalance) {
    this._balance = newBalance;
  }

  get stack() {
    return this._stack;
  }
  set stack(newStack) {
    if (newStack <= this._balance) {
      this._balance -= newStack;
      this._stack = newStack;
    }
  }

  get biggestGain() {
    return this._biggestGain;
  }
  set biggestGain(newBiggestGain) {
    this._biggestGain = newBiggestGain;
  }

  get biggestLose() {
    return this._biggestLose;
  }
  set biggestLose(newBiggestLose) {
    this._biggestLose = newBiggestLose;
  }

  async addFriend(loggin) {
    const exists = await Player.checkIfPlayerExists(loggin);
    if (!exists) return;

    const connection = await mysql.createConnection(CONFIG);
    try {
      const [result] = await connection.execute(
        "SELECT friends FROM Player WHERE loggin = ?",
        [this._loggin]
      );
      let friendsList = [];
      if (result.length > 0 && result[0].friends) {
        try {
          friendsList = JSON.parse(result[0].friends);
        } catch (parseError) {
          friendsList = [];
        }
      }

      if (!friendsList.includes(loggin) && this._loggin !== loggin) {
        friendsList.push(loggin);
      }

      this._friends = new Set(friendsList);
      await connection.execute(
        "UPDATE Player SET friends = ? WHERE loggin = ?",
        [JSON.stringify([...this._friends]), this._loggin]
      );
    } catch (err) {
      console.error(err);
    } finally {
      await connection.end();
    }
  }

  async deleteFriend(loggin) {
    const exists = await Player.checkIfPlayerExists(loggin);
    if (!exists) return;

    const connection = await mysql.createConnection(CONFIG);
    try {
      const [result] = await connection.execute(
        "SELECT friends FROM Player WHERE loggin = ?",
        [this._loggin]
      );
      let friendsList = [];
      if (result.length > 0 && result[0].friends) {
        try {
          friendsList = JSON.parse(result[0].friends);
        } catch (parseError) {
          friendsList = [];
        }
      }

      const newFriendsList = friendsList.filter((friend) => friend !== loggin);
      this._friends = new Set(newFriendsList);

      await connection.execute(
        "UPDATE Player SET friends = ? WHERE loggin = ?",
        [JSON.stringify([...this._friends]), this._loggin]
      );
    } catch (err) {
      console.error("Помилка при видаленні друга:", err);
    } finally {
      await connection.end();
    }
  }

  get friends() {
    return this._friends;
  }
  set friends(newFriends) {
    this._friends = newFriends;
  }

  startNewSession() {
    //
  }
  connectToSession(sessionId) {
    //
  }
  leaveSession(sessionId) {
    this._session = null;
  }

  receiveCard(card) {
    this._cards.push(card);
  }
  clearCards() {
    this._cards = [];
  }

  pass() {
    this.clearCards();
  }
  check() {
    return true;
  }
  call(amount) {
    if (this._stack >= amount) {
      this._stack -= amount;
      return true;
    } else {
      this.pass();
      return false;
    }
  }
  raise(amount) {
    if (this._stack >= amount) {
      this._stack -= amount;
      return true;
    }
  }
  allIn() {
    this._stack = 0;
  }

  static async loadPropertyToBD(loggin, whatToSearch, newValue) {
    const exists = await Player.checkIfPlayerExists(loggin);
    if (!exists) return;

    const connection = await mysql.createConnection(CONFIG);
    try {
      await connection.execute(
        `UPDATE Player SET ${whatToSearch} = ? WHERE loggin = ?`,
        [newValue, loggin]
      );
    } catch (err) {
      console.error(err);
    } finally {
      await connection.end();
    }
  }
  async loadPlayerToBD() {
    const exists = await Player.checkIfPlayerExists(this._loggin);
    if (exists) {
      console.log("Гравець з таким логіном вже існує");
      return;
    }

    const connection = await mysql.createConnection(CONFIG);
    try {
      const [result] = await connection.execute(
        "SELECT MAX(id) AS lastId FROM Player"
      );
      this._id = result[0].lastId !== null ? result[0].lastId + 1 : 1;

      if (!this._password) {
        throw new Error("Пароль не може бути undefined!");
      }
      const hashedPassword = await this.hashPassword(this._password);

      const values = [
        this._id,
        this._loggin,
        hashedPassword,
        this._balance ?? 0,
        this._stack ?? 0,
        this._biggestGain ?? 0,
        this._biggestLose ?? 0,
        JSON.stringify([...(this._friends || [])]),
      ];

      const queryPlayer = `INSERT INTO Player (id, loggin, password, balance, stack, biggestGain, biggestLose, friends) 
                           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;

      await connection.execute(queryPlayer, values);
      console.log("Гравця успішно додано, ID:", this._id);
    } catch (err) {
      console.error(err);
    } finally {
      await connection.end();
    }
  }
  static async loadPropertyFromDB(loggin, whatToSearch) {
    const connection = await mysql.createConnection(CONFIG);
    try {
      const [result] = await connection.execute(
        `SELECT ${whatToSearch} FROM Player WHERE loggin = ?`,
        [loggin]
      );
      await connection.end();
      return result.length > 0 ? result[0][whatToSearch] : null;
    } catch (err) {
      console.error(err);
      return null;
    }
  }
  static async loadPlayerFromBD(loggin, password) {
    try {
      const hashedPassword = await Player.loadPropertyFromDB(
        loggin,
        "password"
      );
      const exists = await Player.checkPassword(hashedPassword, password);
      if (!exists) return null;
    } catch (err) {
      return null;
    }

    const player = new Player(loggin, password);

    for (const property of PROPERTIES) {
      player[property] = await Player.loadPropertyFromDB(loggin, property);
    }

    return player;
  }
  async deleteAccount() {
    const exists = await Player.checkIfPlayerExists(this._loggin);
    if (!exists) return;

    const connection = await mysql.createConnection(CONFIG);
    try {
      connection.execute("DELETE FROM Player WHERE loggin = ?", [this._loggin]);
    } catch (err) {
      console.error(err);
    } finally {
      await connection.end();
    }
  }
}
//USAGE

async function createNewPlayer() {
  const newPlayer = new Player("john_doe", "securePassword123");
  const newPlayer2 = new Player("jane_smith", "securePassword123");
  await newPlayer.loadPlayerToBD();
  await newPlayer2.loadPlayerToBD();
}

// Перевірка, чи існує гравець
async function checkPlayerExistence() {
  const exists = await Player.checkIfPlayerExists("john_doe");
  console.log("Гравець існує:", exists);
}

// Завантаження гравця з бази даних
async function loadExistingPlayer() {
  const player = await Player.loadPlayerFromBD("john_doe", "securePassword123");
  console.log(`Гравця завантажено:`, player);
}

// Додавання друга
async function addFriendExample() {
  const player = await Player.loadPlayerFromBD("john_doe", "securePassword123");
  await player.addFriend("jane_smith");
  console.log(`Друг "jane_smith" доданий`);
}

// Видалення друга
async function removeFriendExample() {
  const player = await Player.loadPlayerFromBD("john_doe", "securePassword123");
  await player.deleteFriend("jane_smith");
  console.log(`Друг "jane_smith" видалений`);
}

// Поповнення балансу
async function updateBalanceExample() {
  const player = await Player.loadPlayerFromBD("john_doe", "securePassword123");
  player.balance = 1000;
  await Player.loadPropertyToBD(player.loggin, "balance", player.balance);
  console.log(`Баланс оновлено на ${player.balance}`);
}

// Видалення акаунта
async function deleteAccountExample() {
  const player = await Player.loadPlayerFromBD("john_doe", "securePassword123");
  await player.deleteAccount();
  console.log(`Акаунт "john_doe" видалено`);
}

// Виклик функцій
async function usage() {
  await createNewPlayer();
  await checkPlayerExistence();
  await loadExistingPlayer();
  await addFriendExample();
  await removeFriendExample();
  await updateBalanceExample();
  await deleteAccountExample();
}

usage();
