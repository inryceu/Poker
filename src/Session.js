"use strict";

class Session {
  constructor(startBalance, minBet, maxBet, raiseValue, roundTime, admin) {
    this._id = 0;
    this._players = [];
    this._admin = admin;
    this._inGame.push(admin);
    this._curentPlayer = admin;
    this._bigBlind = null;
    this._smallBlind = null;

    this._startBalance = startBalance;
    this._minBet = minBet;
    this._maxBet = maxBet;
    this._curentBet = minBet;
    this._raiseValue = raiseValue;

    this._roundTime = roundTime;
    this._bank = 0;
  }

  get id() {
    return this._id;
  }
  get players() {
    return this._players;
  }
  get curentPlayer() {
    return this._curentPlayer;
  }
  get bigBlind() {
    return this._bigBlind;
  }
  get smallBlind() {
    return this._smallBlind;
  }

  addPlayer(id) {
    //this.players.push()
  }
  deletePlayer(id) {
    //
  }

  deleteFromRound(id) {
    //
  }
  refillPlayers() {
    this.inGame = [];
    for (let player of this.players) {
      this.inGame.push(player);
    }
  }

  get minBet() {
    return this._minBet;
  }
  get maxBet() {
    return this._maxBet;
  }
  get curentBet() {
    return this._curentBet;
  }
  set curentBet(newCurrentBet) {
    this._curentBet = newCurrentBet;
  }
  get raiseValue() {
    return this._raiseValue;
  }

  get roundTime() {
    return this._roundTime;
  }

  get bank() {
    return this._bank;
  }
  set bank(newBank) {
    this._bank = newBank;
  }
}
