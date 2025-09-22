import {
  createNewPlayer,
  loadPlayerFromDB,
  addFriend,
  deleteFriend,
  updatePlayerProperty,
  checkPassword,
} from "./Repositories/PlayerRepository.js";

import {
  createSession,
  getSessionById,
  joinSession,
  leaveSession,
} from "./Repositories/SessionRepository.js";

import { AppError as AE } from "./AppError.js";
import { startRound, handleAction } from "./gameLogic.js";

import createLoggingProxy from "./proxyLogger.js";
const AppError = createLoggingProxy(AE, { logErrorsOnly: true });

const handlers = {
  create: async (ctx, data, ws) => {
    const player = await createNewPlayer(data.login, data.password);
    if (!player) throw new AppError("Такий логін вже зареєстровано");

    ctx.set(data.login, { player, ws, session: null, action: Date.now() });
    return { player };
  },

  auth: async (ctx, data, ws) => {
    let entry = ctx.get(data.login);
    let player = entry?.player;

    if (!player) {
      player = await loadPlayerFromDB(data.login);
      if (!player) throw new AppError("Користувача не знайдено");
      entry = { player, ws, session: null, action: Date.now() };
      ctx.set(data.login, entry);
    }

    const isValidPassword = await checkPassword(player.password, data.password);
    if (!isValidPassword) throw new AppError("Неправильний логін або пароль");

    const updatedPlayer = await loadPlayerFromDB(data.login);
    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      action: Date.now(),
    });

    return { player: updatedPlayer };
  },

  logout: async (ctx, data) => {
    ctx.delete(data.login);
  },

  addFriend: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const result = await addFriend(entry.player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      action: Date.now(),
    });

    return { player: updatedPlayer };
  },

  deleteFriend: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const result = await deleteFriend(entry.player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      action: Date.now(),
    });

    return { player: updatedPlayer };
  },

  createSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const session = await createSession(
      data.admin,
      data.startBalance,
      data.minBet,
      data.maxBet,
      data.roundTime
    );

    await updatePlayerProperty(entry.player.login, "session", session.id);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      session,
      action: Date.now(),
    });

    return { player: updatedPlayer, session };
  },

  joinSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const players = await joinSession(data.login, data.id);
    const session = await getSessionById(data.id);

    if (!session?.admin)
      throw new AppError(
        "Такої сесії не існує, або до неї неможливо доєднатися"
      );

    session.players = players;

    await updatePlayerProperty(entry.player.login, "session", session.id);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);

    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      session,
      action: Date.now(),
    });

    const logins = players.filter((p) => p !== data.login);
    await broadcast(ctx, logins, { players });

    return { player: updatedPlayer, session };
  },

  leaveSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const players = await leaveSession(entry.player.login, data.id);

    await updatePlayerProperty(entry.player.login, "session", null);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);

    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      session: null,
      action: Date.now(),
    });

    if (players) await broadcast(ctx, players, { players });
    return { player: updatedPlayer, session: null };
  },

  deposit: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const newBalance = entry.player.balance + data.value;
    await updatePlayerProperty(entry.player.login, "balance", newBalance);
    const updatedPlayer = { ...entry.player, balance: newBalance };

    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      action: Date.now(),
    });

    return { player: updatedPlayer };
  },

  withdraw: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    const newBalance = entry.player.balance - data.value;
    await updatePlayerProperty(entry.player.login, "balance", newBalance);
    const updatedPlayer = { ...entry.player, balance: newBalance };

    ctx.set(data.login, {
      ...entry,
      player: updatedPlayer,
      action: Date.now(),
    });

    return { player: updatedPlayer };
  },

  action: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ", "unauth error");

    if (data.action === "start_game") {
      await startRound(ctx, data.sessionId);
      ctx.set(data.login, {
        ...entry,
        action: Date.now(),
      });
      return;
    }

    await handleAction(ctx, data, data.sessionId);
    ctx.set(data.login, {
      ...entry,
      action: Date.now(),
    });
  },
};

const broadcast = async (ctx, logins, data) => {
  for (const login of logins) {
    const entry = ctx.get(login);
    if (!entry?.ws) continue;

    entry.ws.send(JSON.stringify(data));
  }
};

export default handlers;
