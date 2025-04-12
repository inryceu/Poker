"use strict";

export default class Card {
  constructor(suit, value, id) {
    this._suit = suit;
    this._value = value;
    this._id = id;
  }

  get suit() {
    return this._suit;
  }
  set suit(newSuit) {
    this._suit = newSuit;
  }

  get value() {
    return this._value;
  }
  set value(newValue) {
    this._value = newValue;
  }

  get id() {
    return this._id;
  }
  set id(newId) {
    this._id = newId;
  }

  draw() {
    console.log(this);
  }
}
