"use strict";

const mysql = require("mysql");
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

    this.addPlayerToDB();
  }

  addPlayerToDB() {
    const connection = mysql.createConnection(CONFIG);

    connection.connect((err) => {
      if (err) {
        console.error(err);
        return;
      }

      const query = "SELECT MAX(id) AS lastId FROM Player";
      connection.query(query, (err, results) => {
        if (err) {
          console.error(err);
          return;
        }

        this._id = results[0].lastId ? results[0].lastId + 1 : 1;

        const queryPlayer = `INSERT INTO Player (id, loggin, password, balance, stack, biggestGain, biggestLose) 
                             VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const values = [
          this._id,
          this._loggin,
          this._password,
          this._balance,
          this._stack,
          this._biggestGain,
          this._biggestLose,
        ];

        connection.query(queryPlayer, values, (err) => {
          if (err) {
            console.error(err);
          }

          connection.end();
        });
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
const p1 = new Player("qwerty", "123");
