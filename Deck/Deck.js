const SUITS = {
  HEARTS: "hearts",
  DIAMONDS: "diamonds",
  CLUBS: "clubs",
  SPADES: "spades",
};

const RANKS = {
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  JACK: 11,
  QUEEN: 12,
  KING: 13,
  ACE: 14,
};

const createDeck = () => {
  const deck = [];
  const suits = Object.values(SUITS);
  const ranks = Object.values(RANKS);

  for (const suit of suits) {
    for (const rank of ranks) {
      deck.push({ suit, rank });
    }
  }

  return shuffleDeck(deck);
};

const shuffleDeck = (deck) => {
  const shuffled = [...deck];

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  return shuffled;
};

const dealToPlayers = (deck, players) => {
  if (deck.length < players.length * 2) {
    throw new Error(
      `Недостатньо карт у колоді. Потрібно ${players.length * 2}, є ${deck.length}`
    );
  }

  const cards = {};

  for (let round = 0; round < 2; round++) {
    for (const login of players) {
      if (!cards[login]) {
        cards[login] = [];
      }

      const card = deck.pop();
      if (!card) {
        throw new Error("Колода закінчилася під час роздачі");
      }

      cards[login].push(card);
    }
  }

  return cards;
};

const dealCommunityCards = (deck, count) => {
  const communityCards = [];

  for (let i = 0; i < count; i++) {
    const card = deck.pop();
    if (!card) {
      throw new Error("Колода закінчилася під час роздачі спільних карт");
    }
    communityCards.push(card);
  }

  return communityCards;
};

const cardToString = (card) => {
  if (!card || typeof card.suit !== "string" || typeof card.rank !== "number") {
    return "??";
  }

  const suitSymbols = {
    hearts: "♥",
    diamonds: "♦",
    clubs: "♣",
    spades: "♠",
  };

  const rankNames = {
    2: "2",
    3: "3",
    4: "4",
    5: "5",
    6: "6",
    7: "7",
    8: "8",
    9: "9",
    10: "10",
    11: "J",
    12: "Q",
    13: "K",
    14: "A",
  };

  const suitSymbol = suitSymbols[card.suit] || "?";
  const rankName = rankNames[card.rank] || "?";

  return `${rankName}${suitSymbol}`;
};

export {
  createDeck,
  shuffleDeck,
  dealToPlayers,
  dealCommunityCards,
  cardToString,
};
