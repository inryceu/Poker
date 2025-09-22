const HAND_RANKINGS = {
  HIGH_CARD: 1,
  PAIR: 2,
  TWO_PAIR: 3,
  THREE_OF_A_KIND: 4,
  STRAIGHT: 5,
  FLUSH: 6,
  FULL_HOUSE: 7,
  FOUR_OF_A_KIND: 8,
  STRAIGHT_FLUSH: 9,
  ROYAL_FLUSH: 10,
};

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

/**
 * Конвертує карту з формату {suit, rank} в числове значення
 */
const parseCard = (card) => {
  const rankMap = {
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    J: 11,
    Q: 12,
    K: 13,
    A: 14,
  };

  return {
    rank: typeof card.rank === "string" ? rankMap[card.rank] : card.rank,
    suit: card.suit,
  };
};

/**
 * Сортує карти за рангом (від старшої до молодшої)
 */
const sortCards = (cards) => {
  return cards.sort((a, b) => b.rank - a.rank);
};

/**
 * Перевіряє чи є комбінація флеш
 */
const isFlush = (cards) => {
  const suits = {};
  cards.forEach((card) => {
    suits[card.suit] = (suits[card.suit] || 0) + 1;
  });

  const flushSuit = Object.keys(suits).find((suit) => suits[suit] >= 5);
  if (flushSuit) {
    return cards.filter((card) => card.suit === flushSuit).slice(0, 5);
  }
  return null;
};

/**
 * Перевіряє чи є комбінація стрейт
 */
const isStraight = (cards) => {
  const sortedCards = sortCards([...cards]);
  const uniqueRanks = [...new Set(sortedCards.map((card) => card.rank))];

  // Перевіряємо звичайний стрейт
  for (let i = 0; i <= uniqueRanks.length - 5; i++) {
    let consecutive = true;
    for (let j = 1; j < 5; j++) {
      if (uniqueRanks[i + j] !== uniqueRanks[i] - j) {
        consecutive = false;
        break;
      }
    }
    if (consecutive) {
      const straightCards = [];
      for (let j = 0; j < 5; j++) {
        straightCards.push(
          sortedCards.find((card) => card.rank === uniqueRanks[i + j]),
        );
      }
      return straightCards;
    }
  }

  // Перевіряємо A-2-3-4-5 стрейт (колесо)
  if (
    uniqueRanks.includes(14) &&
    uniqueRanks.includes(5) &&
    uniqueRanks.includes(4) &&
    uniqueRanks.includes(3) &&
    uniqueRanks.includes(2)
  ) {
    return [2, 3, 4, 5, 14].map((rank) =>
      sortedCards.find((card) => card.rank === rank),
    );
  }

  return null;
};

/**
 * Групує карти за рангом
 */
const groupCardsByRank = (cards) => {
  const groups = {};
  cards.forEach((card) => {
    if (!groups[card.rank]) {
      groups[card.rank] = [];
    }
    groups[card.rank].push(card);
  });

  return Object.values(groups).sort((a, b) => {
    if (a.length !== b.length) {
      return b.length - a.length; // Спочатку більші групи
    }
    return b[0].rank - a[0].rank; // Потім старші ранги
  });
};

/**
 * Оцінює руку та повертає її силу
 */
const evaluateHand = (playerCards, communityCards) => {
  const allCards = [...playerCards, ...communityCards].map(parseCard);
  const sortedCards = sortCards(allCards);

  const flush = isFlush(allCards);
  const straight = isStraight(allCards);
  const groups = groupCardsByRank(allCards);

  // Royal Flush (A-K-Q-J-10 одної масті)
  if (flush && straight && straight[0].rank === 14 && straight[4].rank === 10) {
    return {
      ranking: HAND_RANKINGS.ROYAL_FLUSH,
      cards: straight,
      description: "Royal Flush",
      kickers: [],
    };
  }

  // Straight Flush
  if (flush && straight) {
    const straightFlushCards = straight.filter((card) =>
      flush.some(
        (flushCard) =>
          flushCard.rank === card.rank && flushCard.suit === card.suit,
      ),
    );
    if (straightFlushCards.length === 5) {
      return {
        ranking: HAND_RANKINGS.STRAIGHT_FLUSH,
        cards: straightFlushCards,
        description: "Straight Flush",
        highCard: straightFlushCards[0].rank,
        kickers: [],
      };
    }
  }

  // Four of a Kind
  if (groups[0].length === 4) {
    return {
      ranking: HAND_RANKINGS.FOUR_OF_A_KIND,
      cards: groups[0],
      description: "Four of a Kind",
      quadRank: groups[0][0].rank,
      kickers: [groups[1][0].rank],
    };
  }

  // Full House
  if (groups[0].length === 3 && groups[1].length >= 2) {
    return {
      ranking: HAND_RANKINGS.FULL_HOUSE,
      cards: [...groups[0], ...groups[1].slice(0, 2)],
      description: "Full House",
      tripRank: groups[0][0].rank,
      pairRank: groups[1][0].rank,
      kickers: [],
    };
  }

  // Flush
  if (flush) {
    return {
      ranking: HAND_RANKINGS.FLUSH,
      cards: flush,
      description: "Flush",
      kickers: flush.map((card) => card.rank),
    };
  }

  // Straight
  if (straight) {
    return {
      ranking: HAND_RANKINGS.STRAIGHT,
      cards: straight,
      description: "Straight",
      highCard:
        straight[0].rank === 14 && straight[4].rank === 2
          ? 5
          : straight[0].rank,
      kickers: [],
    };
  }

  // Three of a Kind
  if (groups[0].length === 3) {
    const kickers = groups
      .slice(1)
      .flat()
      .slice(0, 2)
      .map((card) => card.rank);
    return {
      ranking: HAND_RANKINGS.THREE_OF_A_KIND,
      cards: groups[0],
      description: "Three of a Kind",
      tripRank: groups[0][0].rank,
      kickers,
    };
  }

  // Two Pair
  if (groups[0].length === 2 && groups[1].length === 2) {
    const kickers = groups
      .slice(2)
      .flat()
      .slice(0, 1)
      .map((card) => card.rank);
    return {
      ranking: HAND_RANKINGS.TWO_PAIR,
      cards: [...groups[0], ...groups[1]],
      description: "Two Pair",
      highPair: Math.max(groups[0][0].rank, groups[1][0].rank),
      lowPair: Math.min(groups[0][0].rank, groups[1][0].rank),
      kickers,
    };
  }

  // One Pair
  if (groups[0].length === 2) {
    const kickers = groups
      .slice(1)
      .flat()
      .slice(0, 3)
      .map((card) => card.rank);
    return {
      ranking: HAND_RANKINGS.PAIR,
      cards: groups[0],
      description: "Pair",
      pairRank: groups[0][0].rank,
      kickers,
    };
  }

  // High Card
  const kickers = sortedCards.slice(0, 5).map((card) => card.rank);
  return {
    ranking: HAND_RANKINGS.HIGH_CARD,
    cards: sortedCards.slice(0, 5),
    description: "High Card",
    kickers,
  };
};

/**
 * Порівнює дві руки та визначає переможця
 * Повертає: 1 якщо hand1 кращий, -1 якщо hand2 кращий, 0 якщо нічия
 */
const compareHands = (hand1, hand2) => {
  // Спочатку порівнюємо ранги комбінацій
  if (hand1.ranking !== hand2.ranking) {
    return hand1.ranking - hand2.ranking;
  }

  // Якщо ранги однакові, порівнюємо специфічні значення
  switch (hand1.ranking) {
    case HAND_RANKINGS.STRAIGHT_FLUSH:
    case HAND_RANKINGS.STRAIGHT:
      return hand1.highCard - hand2.highCard;

    case HAND_RANKINGS.FOUR_OF_A_KIND:
      if (hand1.quadRank !== hand2.quadRank) {
        return hand1.quadRank - hand2.quadRank;
      }
      return hand1.kickers[0] - hand2.kickers[0];

    case HAND_RANKINGS.FULL_HOUSE:
      if (hand1.tripRank !== hand2.tripRank) {
        return hand1.tripRank - hand2.tripRank;
      }
      return hand1.pairRank - hand2.pairRank;

    case HAND_RANKINGS.THREE_OF_A_KIND:
      if (hand1.tripRank !== hand2.tripRank) {
        return hand1.tripRank - hand2.tripRank;
      }
      break;

    case HAND_RANKINGS.TWO_PAIR:
      if (hand1.highPair !== hand2.highPair) {
        return hand1.highPair - hand2.highPair;
      }
      if (hand1.lowPair !== hand2.lowPair) {
        return hand1.lowPair - hand2.lowPair;
      }
      break;

    case HAND_RANKINGS.PAIR:
      if (hand1.pairRank !== hand2.pairRank) {
        return hand1.pairRank - hand2.pairRank;
      }
      break;
  }

  // Порівнюємо кікери
  for (
    let i = 0;
    i < Math.max(hand1.kickers.length, hand2.kickers.length);
    i++
  ) {
    const kicker1 = hand1.kickers[i] || 0;
    const kicker2 = hand2.kickers[i] || 0;
    if (kicker1 !== kicker2) {
      return kicker1 - kicker2;
    }
  }

  return 0; // Нічия
};

/**
 * Знаходить переможців серед гравців
 */
const findWinners = (players, communityCards) => {
  const playerHands = players.map((player) => ({
    player,
    hand: evaluateHand(player.cards, communityCards),
  }));

  // Сортуємо руки від найкращої до найгіршої
  playerHands.sort((a, b) => compareHands(b.hand, a.hand));

  // Знаходимо всіх гравців з найкращою рукою
  const bestHand = playerHands[0].hand;
  const winners = playerHands.filter(
    (playerHand) => compareHands(playerHand.hand, bestHand) === 0,
  );

  return winners.map((winner) => ({
    ...winner.player,
    hand: winner.hand,
  }));
};

/**
 * Розподіляє виграш між переможцями
 */
const distributePot = (winners, pot) => {
  const winAmount = Math.floor(pot / winners.length);
  const remainder = pot % winners.length;

  const distribution = {};
  winners.forEach((winner, index) => {
    distribution[winner.login] = winAmount + (index < remainder ? 1 : 0);
  });

  return distribution;
};

export {
  evaluateHand,
  compareHands,
  findWinners,
  distributePot,
  HAND_RANKINGS,
};
