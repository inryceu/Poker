"use strict";

const Card = require("./Card");

const SUITS = ["♥", "♦", "♣", "♠"];
const VALUES = [
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
  "A",
];

class Deck {
  constructor() {
    this._cards = [];

    let cardId = 0;
    for (let suit of SUITS) {
      for (let value of VALUES) {
        let card = new Card(suit, value, cardId);
        cardId++;
        this._cards.push(card);
      }
    }
    this._cards.sort(() => Math.random() - 0.5);
  }

  getCard() {
    let card = this._cards.pop();
    return card;
  }
}
