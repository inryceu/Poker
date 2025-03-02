"use strict";

const mysql = require("mysql");
const bcrypt = require("bcrypt");
const CONFIG = require("./config");

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
    this._cards = [];

    this._friends = [];

    this.checkIfPlayerExists(loggin, (exists) => {
      if (exists) {
        console.log("Гравець з таким логіном вже існує");
      } else {
        this.addPlayerToDB();
      }
    });
  }

  checkIfPlayerExists(loggin, callback) {
    const connection = mysql.createConnection(CONFIG);
    connection.connect((err) => {
      if (err) {
        console.error(err);
        return;
      }

      const query = "SELECT COUNT(*) AS count FROM Player WHERE loggin = ?";
      connection.query(query, [loggin], (err, results) => {
        if (err) {
          console.error(err);
          return;
        }

        callback(results[0].count > 0);

        connection.end();
      });
    });
  }

  async addPlayerToDB() {
    const connection = mysql.createConnection(CONFIG);

    connection.connect(async (err) => {
      if (err) {
        console.error(err);
        return;
      }

      const query = "SELECT MAX(id) AS lastId FROM Player";
      connection.query(query, async (err, result) => {
        if (err) {
          console.error(err);
          return;
        }

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

        connection.query(queryPlayer, values, (err) => {
          if (err) {
            console.error(err);
          } else {
            console.log("Гравця успішно додано, ID:", this._id);
          }

          connection.end();
        });
      });
    });
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

  addFriend(id) {
    //this.friends.push();
  }
  deleteFriend(id) {
    //
  }
  get friends() {
    return this._friends;
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
}

//USAGE
const p1 = new Player("qwerty123!", "123");
const connection = mysql.createConnection(CONFIG);
const query = "SELECT password FROM Player WHERE loggin = 'qwerty123!'";
connection.query(query, (err, res) => {
  if (err) {
    console.error(err);
  }
  const pass = res[0].password;
  Player.checkPassword(pass, "123").then((response) => {
    console.log(response); //true
  });
  connection.end();
});
