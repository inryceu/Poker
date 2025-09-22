import { AppError as AE } from "./AppError.js";
import createLoggingProxy from "./proxyLogger.js";
import { getSessionById } from "./Repositories/SessionRepository.js";
import { createDeck, dealToPlayers, dealCommunityCards } from "./Deck/Deck.js";
import { findWinners, distributePot } from "./HandEvaluator.js";

const AppError = createLoggingProxy(AE, { logErrorsOnly: true });

const ACTIONS = Object.freeze({
  CHECK: "check",
  CALL: "call",
  RAISE: "raise",
  FOLD: "fold",
});

const PHASES = ["preflop", "flop", "turn", "river", "showdown"];

const gameState = new Map();

const getGame = (sessionId) => {
  if (!gameState.has(sessionId)) {
    gameState.set(sessionId, {
      pot: 0,
      currentBet: 0,
      currentPlayerIndex: 0,
      players: [],
      stacks: {},
      bets: {},
      cards: {},
      timer: null,
      deck: [],
      communityCards: [],
      phase: "preflop",
      smallBlindPosition: 0,
      bigBlindPosition: 0,
      lastRaiser: null,
      playersActed: new Set(),
      foldedPlayers: new Set(),
      allInPlayers: new Set(),
      sidePots: [],
    });
  }

  return gameState.get(sessionId);
};

const startRound = async (ctx, sessionId) => {
  const session = await getSessionById(sessionId);
  const game = getGame(sessionId);

  const activePlayers = session.players.filter(
    (login) => game.stacks[login] > 0 || !game.stacks[login]
  );

  if (activePlayers.length < 2) {
    throw new AppError("Недостатньо гравців для початку раунду");
  }

  game.smallBlindPosition =
    (game.smallBlindPosition + 1) % activePlayers.length;
  game.bigBlindPosition = (game.smallBlindPosition + 2) % activePlayers.length;

  Object.assign(game, {
    pot: 0,
    currentBet: session.bigBlind || session.minBet * 2,
    players: [...activePlayers],
    bets: {},
    cards: {},
    deck: createDeck(),
    communityCards: [],
    phase: "preflop",
    lastRaiser: null,
    playersActed: new Set(),
    foldedPlayers: new Set(),
    allInPlayers: new Set(),
    sidePots: [],
  });

  for (const login of activePlayers) {
    game.bets[login] = 0;
    if (!game.stacks[login]) {
      game.stacks[login] = session.startBalance;
    }
  }

  const smallBlind = session.smallBlind || session.minBet;
  const bigBlind = session.bigBlind || session.minBet * 2;

  const smallBlindPlayer = game.players[game.smallBlindPosition];
  const bigBlindPlayer = game.players[game.bigBlindPosition];

  const sbAmount = Math.min(smallBlind, game.stacks[smallBlindPlayer]);
  game.stacks[smallBlindPlayer] -= sbAmount;
  game.bets[smallBlindPlayer] = sbAmount;
  game.pot += sbAmount;

  if (game.stacks[smallBlindPlayer] === 0) {
    game.allInPlayers.add(smallBlindPlayer);
  }

  const bbAmount = Math.min(bigBlind, game.stacks[bigBlindPlayer]);
  game.stacks[bigBlindPlayer] -= bbAmount;
  game.bets[bigBlindPlayer] = bbAmount;
  game.pot += bbAmount;
  game.currentBet = bbAmount;

  if (game.stacks[bigBlindPlayer] === 0) {
    game.allInPlayers.add(bigBlindPlayer);
  }

  game.cards = dealToPlayers(game.deck, game.players);

  for (const login of game.players) {
    const entry = ctx.get(login);
    if (entry?.ws?.readyState === entry.ws.OPEN) {
      entry.ws.send(
        JSON.stringify({ type: "player_cards", playerCards: game.cards[login] })
      );
    }
  }

  game.currentPlayerIndex = (game.bigBlindPosition + 1) % game.players.length;

  broadcast(ctx, sessionId, {
    type: "start_round",
    players: game.players,
    stacks: game.stacks,
    phase: game.phase,
    pot: game.pot,
    currentBet: game.currentBet,
    blinds: {
      small: { player: smallBlindPlayer, amount: sbAmount },
      big: { player: bigBlindPlayer, amount: bbAmount },
    },
  });

  await nextTurn(ctx, sessionId);
};

const nextTurn = async (ctx, sessionId) => {
  const game = getGame(sessionId);
  if (game.timer) clearTimeout(game.timer);

  const activePlayers = getActivePlayers(game);
  if (activePlayers.length <= 1) {
    await endRound(ctx, sessionId);
    return;
  }

  let attempts = 0;
  while (attempts < game.players.length) {
    const currentPlayer = game.players[game.currentPlayerIndex];

    if (
      !game.foldedPlayers.has(currentPlayer) &&
      !game.allInPlayers.has(currentPlayer)
    ) {
      const entry = ctx.get(currentPlayer);

      if (!entry || entry.ws.readyState !== entry.ws.OPEN) {
        await handleAction(
          ctx,
          { login: currentPlayer, action: ACTIONS.FOLD },
          sessionId
        );
        return;
      }

      const availableActions = getAvailableActions(game, currentPlayer);

      entry.ws.send(
        JSON.stringify({
          type: "your_turn",
          currentBet: game.currentBet,
          yourBet: game.bets[currentPlayer],
          pot: game.pot,
          stack: game.stacks[currentPlayer],
          phase: game.phase,
          availableActions,
          communityCards: game.communityCards,
        })
      );

      game.timer = setTimeout(async () => {
        await handleAction(
          ctx,
          { login: currentPlayer, action: ACTIONS.FOLD },
          sessionId
        );
      }, entry.session.roundTime * 1000);

      return;
    }

    game.currentPlayerIndex =
      (game.currentPlayerIndex + 1) % game.players.length;
    attempts++;
  }

  await proceedToNextPhase(ctx, sessionId);
};

const getAvailableActions = (game, login) => {
  const playerBet = game.bets[login];
  const playerStack = game.stacks[login];
  const callAmount = game.currentBet - playerBet;

  const actions = [ACTIONS.FOLD];

  if (callAmount === 0) {
    actions.push(ACTIONS.CHECK);
  } else if (playerStack >= callAmount) {
    actions.push(ACTIONS.CALL);
  }

  if (playerStack > callAmount) {
    actions.push(ACTIONS.RAISE);
  }

  return actions;
};

const handleAction = async (ctx, { login, action, amount }, sessionId) => {
  const game = getGame(sessionId);

  if (!game.players.includes(login)) {
    throw new AppError("Гравець не у грі");
  }

  if (login !== game.players[game.currentPlayerIndex]) {
    throw new AppError("Не ваш хід");
  }

  if (game.foldedPlayers.has(login) || game.allInPlayers.has(login)) {
    throw new AppError("Ви не можете діяти");
  }

  const playerStack = game.stacks[login];
  const playerBet = game.bets[login];
  const callAmount = game.currentBet - playerBet;

  game.playersActed.add(login);

  let minRaise = 0,
    totalBet = 0,
    toPay = 0;
  switch (action) {
    case ACTIONS.FOLD:
      game.foldedPlayers.add(login);
      break;

    case ACTIONS.CHECK:
      if (callAmount !== 0) {
        throw new AppError("Неможливо зробити чек, потрібно зрівняти ставку");
      }
      break;

    case ACTIONS.CALL:
      if (callAmount > playerStack) {
        const allInAmount = playerStack;
        game.stacks[login] = 0;
        game.bets[login] += allInAmount;
        game.pot += allInAmount;
        game.allInPlayers.add(login);
      } else {
        game.stacks[login] -= callAmount;
        game.bets[login] += callAmount;
        game.pot += callAmount;
      }
      break;

    case ACTIONS.RAISE:
      if (!amount || amount <= 0) {
        throw new AppError("Некоректна сума підняття");
      }

      minRaise = game.currentBet * 2 - playerBet;
      totalBet = game.currentBet + amount;
      toPay = totalBet - playerBet;

      if (toPay > playerStack) {
        const allInAmount = playerStack;
        game.currentBet = playerBet + allInAmount;
        game.stacks[login] = 0;
        game.bets[login] += allInAmount;
        game.pot += allInAmount;
        game.allInPlayers.add(login);
        game.lastRaiser = login;
        game.playersActed.clear();
        game.playersActed.add(login);
      } else if (totalBet < minRaise && playerStack > toPay) {
        throw new AppError(`Мінімальне підняття: ${minRaise - playerBet}`);
      } else {
        game.currentBet = totalBet;
        game.bets[login] = totalBet;
        game.stacks[login] -= toPay;
        game.pot += toPay;
        game.lastRaiser = login;
        game.playersActed.clear();
        game.playersActed.add(login);
      }
      break;

    default:
      throw new AppError("Невідома дія");
  }

  broadcast(ctx, sessionId, {
    type: "game_state",
    login,
    action,
    amount: amount ?? null,
    stacks: game.stacks,
    pot: game.pot,
    bets: game.bets,
    currentBet: game.currentBet,
  });

  const activePlayers = getActivePlayers(game);
  if (activePlayers.length === 1) {
    await endRound(ctx, sessionId);
    return;
  }

  game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;

  if (isBettingRoundComplete(game)) {
    await proceedToNextPhase(ctx, sessionId);
  } else {
    await nextTurn(ctx, sessionId);
  }
};

const getActivePlayers = (game) => {
  return game.players.filter((login) => !game.foldedPlayers.has(login));
};

const isBettingRoundComplete = (game) => {
  const activePlayers = getActivePlayers(game);

  if (activePlayers.length <= 1) return true;

  for (const login of activePlayers) {
    if (!game.playersActed.has(login) && !game.allInPlayers.has(login)) {
      return false;
    }

    const playerBet = game.bets[login];
    if (playerBet < game.currentBet && !game.allInPlayers.has(login)) {
      return false;
    }
  }

  return true;
};

const proceedToNextPhase = async (ctx, sessionId) => {
  const game = getGame(sessionId);
  const currentPhaseIndex = PHASES.indexOf(game.phase);

  if (currentPhaseIndex < PHASES.length - 2) {
    game.phase = PHASES[currentPhaseIndex + 1];

    for (const login of game.players) game.bets[login] = 0;

    game.currentBet = 0;
    game.lastRaiser = null;
    game.playersActed.clear();

    game.currentPlayerIndex = getFirstPlayerForPhase(game);

    if (game.phase === "flop") {
      game.communityCards = dealCommunityCards(game.deck, 3);
    } else if (game.phase === "turn" || game.phase === "river") {
      game.communityCards.push(...dealCommunityCards(game.deck, 1));
    }

    broadcast(ctx, sessionId, {
      type: "game_state",
      phase: game.phase,
      communityCards: game.communityCards,
      pot: game.pot,
      currentBet: game.currentBet,
    });

    await nextTurn(ctx, sessionId);
  } else {
    await showdown(ctx, sessionId);
  }
};

const getFirstPlayerForPhase = (game) => {
  let startIndex = game.smallBlindPosition;

  for (let i = 0; i < game.players.length; i++) {
    const playerIndex = (startIndex + i) % game.players.length;
    const player = game.players[playerIndex];

    if (!game.foldedPlayers.has(player) && !game.allInPlayers.has(player)) {
      return playerIndex;
    }
  }

  return 0;
};

const showdown = async (ctx, sessionId) => {
  const game = getGame(sessionId);
  game.phase = "showdown";

  const activePlayers = getActivePlayers(game);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    game.stacks[winner] += game.pot;

    broadcast(ctx, sessionId, {
      type: "game_state",
      winners: [{ login: winner, amount: game.pot }],
      pot: game.pot,
      stacks: game.stacks,
      communityCards: game.communityCards,
      cards: game.cards,
      singleWinner: true,
    });

    gameState.delete(sessionId);
  } else {
    const playersForEvaluation = activePlayers.map((login) => ({
      login,
      cards: game.cards[login] || [],
    }));

    try {
      const winners = findWinners(playersForEvaluation, game.communityCards);

      if (winners.length === 0) {
        throw new Error("Не вдалося визначити переможця");
      }

      const potDistribution = distributePot(winners, game.pot);

      const winnerResults = [];
      for (const winner of winners) {
        const winAmount = potDistribution[winner.login];
        game.stacks[winner.login] += winAmount;
        winnerResults.push({
          login: winner.login,
          amount: winAmount,
          hand: winner.hand,
        });
      }

      broadcast(ctx, sessionId, {
        type: "game_state",
        winners: winnerResults,
        pot: game.pot,
        stacks: game.stacks,
        communityCards: game.communityCards,
        cards: game.cards,
        showCards: true,
        handEvaluations: winners.map((w) => ({
          login: w.login,
          handDescription: w.hand.description,
          handCards: w.hand.cards,
        })),
      });

      gameState.delete(sessionId);
    } catch (error) {
      console.error("Помилка при оцінці рук:", error);

      const winAmount = Math.floor(game.pot / activePlayers.length);
      const remainder = game.pot % activePlayers.length;

      const fallbackResults = activePlayers.map((login, index) => {
        const amount = winAmount + (index < remainder ? 1 : 0);
        game.stacks[login] += amount;
        return { login, amount };
      });

      broadcast(ctx, sessionId, {
        type: "game_state",
        winners: fallbackResults,
        pot: game.pot,
        stacks: game.stacks,
        communityCards: game.communityCards,
        cards: game.cards,
        showCards: true,
        error: "Помилка оцінки рук, банк розділено порівну",
      });

      gameState.delete(sessionId);
    }
  }
};

const endRound = async (ctx, sessionId) => {
  const game = getGame(sessionId);
  const activePlayers = getActivePlayers(game);

  if (activePlayers.length === 1) {
    const winner = activePlayers[0];
    game.stacks[winner] += game.pot;

    broadcast(ctx, sessionId, {
      type: "end_round",
      winner,
      stacks: game.stacks,
      pot: game.pot,
    });
  }

  gameState.delete(sessionId);
};

const broadcast = (ctx, sessionId, data) => {
  const game = getGame(sessionId);
  for (const login of game.players) {
    const entry = ctx.get(login);
    if (entry?.ws?.readyState === entry.ws.OPEN) {
      entry.ws.send(JSON.stringify(data));
    }
  }
};

export { startRound, handleAction };
