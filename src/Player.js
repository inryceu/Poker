"use strict";

const mysql = require("mysql");
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
    const connection = mysql.createConnection(CONFIG);
    try {
      await connection.connect();
      const query = "SELECT COUNT(*) AS count FROM Player WHERE loggin = ?";
      const [result] = await connection.query(query, [loggin]);
      return result[0].count > 0;
    } catch (err) {
      console.error(err);
    } finally {
      connection.end();
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
          reject("Помилка порівняння паролю");
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

  addFriend(loggin) {
    Player.checkIfPlayerExists(loggin, (result) => {
      if (result) {
        const connection = mysql.createConnection(CONFIG);

        const queryPlayer = "SELECT friends FROM Player WHERE loggin = ?";
        connection.query(queryPlayer, [this._loggin], (err, result) => {
          if (err) {
            console.error(err);
            connection.end();
            return;
          }

          let friendsList = [];
          if (result.length > 0 && result[0].friends) {
            try {
              friendsList = JSON.parse(result[0].friends);
            } catch (parseErr) {
              console.error(parseErr);
            }
          }

          if (!friendsList.includes(loggin) && this._loggin !== loggin) {
            friendsList.push(loggin);
          }

          this._friends = new Set(friendsList);

          const queryUpdate = "UPDATE Player SET friends = ? WHERE loggin = ?";
          connection.query(
            queryUpdate,
            [JSON.stringify([...this._friends]), this._loggin],
            (err) => {
              if (err) {
                console.error(err);
              }
              connection.end();
            }
          );
        });
      }
    });
  }

  deleteFriend(loggin) {
    Player.checkIfPlayerExists(loggin, (result) => {
      if (result) {
        const connection = mysql.createConnection(CONFIG);

        const queryPlayer = "SELECT friends FROM Player WHERE loggin = ?";
        connection.query(queryPlayer, [this._loggin], (err, result) => {
          if (err) {
            console.error(err);
            connection.end();
            return;
          }

          let friendsList = [];
          if (result.length > 0 && result[0].friends) {
            try {
              friendsList = JSON.parse(result[0].friends);
            } catch (parseErr) {
              console.error("JSON Parse Error:", parseErr);
            }
          }

          const newFriendsList = friendsList.filter(
            (friend) => friend !== loggin
          );

          this._friends = new Set(newFriendsList);

          const queryUpdate = "UPDATE Player SET friends = ? WHERE loggin = ?";
          connection.query(
            queryUpdate,
            [JSON.stringify([...this._friends]), this._loggin],
            (err) => {
              if (err) {
                console.error(err);
              }
              connection.end();
            }
          );
        });
      }
    });
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

  static loadPropertyToBD(loggin, whatToSearch, newValue) {
    Player.checkIfPlayerExists(loggin, (result) => {
      if (result) {
        const connection = mysql.createConnection(CONFIG);

        const queryPlayer = `UPDATE Player SET ${whatToSearch} = ? WHERE loggin = ?`;
        connection.query(queryPlayer, [newValue, loggin], (err, result) => {
          if (err) {
            console.error(err);
            connection.end();
            return;
          }
        });
      }
    });
  }
  async loadPlayerToBD() {
    const exists = await Player.checkIfPlayerExists(this._loggin);
    if (exists) {
      console.log("Гравець з таким логіном вже існує");
      return;
    }

    const connection = mysql.createConnection(CONFIG);
    try {
      await connection.connect();
      const query = "SELECT MAX(id) AS lastId FROM Player";
      const [result] = await connection.query(query);
      this._id = result[0].lastId ? result[0].lastId + 1 : 1;

      const hashedPassword = await this.hashPassword(this._password);

      const queryPlayer = `INSERT INTO Player (id, loggin, password, balance, stack, biggestGain, biggestLose) 
                           VALUES (?, ?, ?, ?, ?, ?, ?)`;
      const values = [
        this._id,
        this._loggin,
        hashedPassword,
        this._balance,
        this._stack,
        this._biggestGain,
        this._biggestLose,
      ];

      await connection.query(queryPlayer, values);
      console.log("Гравця успішно додано, ID:", this._id);
    } catch (err) {
      console.error(err);
    } finally {
      connection.end();
    }
  }
  static async loadPropertyToBD(loggin, whatToSearch, newValue) {
    const exists = await Player.checkIfPlayerExists(loggin);
    if (exists) {
      const connection = mysql.createConnection(CONFIG);
      try {
        await connection.connect();
        const queryPlayer = `UPDATE Player SET ${whatToSearch} = ? WHERE loggin = ?`;
        await connection.query(queryPlayer, [newValue, loggin]);
      } catch (err) {
        console.error(err);
      } finally {
        connection.end();
      }
    }
  }
  static async loadPlayerFromBD(loggin, password) {
    const player = new Player(loggin, password);

    const propertyPromises = PROPERTIES.map((property) => {
      return Player.loadPropertyFromDB(loggin, property).then((result) => {
        if (result && result[0] && result[0][property] !== undefined) {
          player[property] = result[0][property];
        }
      });
    });

    await Promise.all(propertyPromises);

    return player;
  }
  deleteAccount() {
    Player.checkIfPlayerExists(this._loggin, (result) => {
      if (result) {
        const connection = mysql.createConnection(CONFIG);

        const query = "DELETE FROM Player WHERE loggin = ?";
        connection.query(query, [this._loggin], (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log(`Аккаунт ${this._loggin} видалено`);
          }
          connection.end();
        });
      } else {
        console.log(`Аккаунт ${this._loggin} не існує`);
      }
    });
  }
}

//USAGE
