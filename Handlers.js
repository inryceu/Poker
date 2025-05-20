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

import { AppError } from "./AppError.js";

const handlers = {
  create: async (ctx, data, ws) => {
    const player = await createNewPlayer(data.login, data.password);
    if (!player) throw new AppError("Такий логін вже зареєстровано");

    ctx.set(data.login, { player, ws, session: null });
    return { player };
  },

  auth: async (ctx, data, ws) => {
    let entry = ctx.get(data.login);
    let player = entry?.player;

    if (!player) {
      player = await loadPlayerFromDB(data.login);
      if (!player) throw new AppError("Користувача не знайдено");
      entry = { player, ws, session: null };
      ctx.set(data.login, entry);
    }

    const isValidPassword = await checkPassword(player.password, data.password);
    if (!isValidPassword) throw new AppError("Неправильний логін або пароль");

    const updatedPlayer = await loadPlayerFromDB(data.login);
    ctx.set(data.login, { ...entry, player: updatedPlayer });

    return { player: updatedPlayer };
  },

  logout: async (ctx, data) => {
    ctx.delete(data.login);
  },

  addFriend: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ");

    const result = await addFriend(entry.player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, { ...entry, player: updatedPlayer });

    return { player: updatedPlayer };
  },

  deleteFriend: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ");

    const result = await deleteFriend(entry.player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, { ...entry, player: updatedPlayer });

    return { player: updatedPlayer };
  },

  createSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ");

    const session = await createSession(
      data.admin,
      data.startBalance,
      data.minBet,
      data.maxBet,
      data.roundTime
    );

    await updatePlayerProperty(entry.player.login, "session", session.id);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, { ...entry, player: updatedPlayer, session });

    return { player: updatedPlayer, session };
  },

  joinSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ");

    const players = await joinSession(data.login, data.id);

    const session = {
      ...(await getSessionById(data.id)),
      players,
    };

    if (!session.admin)
      throw new AppError(
        "Такої сесії не існує, або до неї неможливо доєднатися"
      );

    await updatePlayerProperty(entry.player.login, "session", session.id);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);

    ctx.set(data.login, { ...entry, player: updatedPlayer, session });

    const logins = players.filter((player) => player !== data.login);
    await broadcast(ctx, logins, { players });

    return { player: updatedPlayer, session };
  },

  leaveSession: async (ctx, data) => {
    const entry = ctx.get(data.login);
    if (!entry) throw new AppError("Неавторизований доступ");

    const players = await leaveSession(entry.player.login, data.id);

    await updatePlayerProperty(entry.player.login, "session", null);
    const updatedPlayer = await loadPlayerFromDB(entry.player.login);
    ctx.set(data.login, { ...entry, player: updatedPlayer, session: null });

    if (players) broadcast(ctx, players, { players });
    return { player: updatedPlayer, session: null };
  },
};

const broadcast = async (ctx, logins, data) => {
  const validKeys = [
    "players",
    "admin",
    "name",
    "roundTime",
    "minBet",
    "maxBet",
  ];

  for (let login of logins) {
    const entry = ctx.get(login);
    if (!entry) continue;

    const session = entry.session;
    const ws = entry.ws;

    if (!session || !ws) continue;

    for (let [key, value] of Object.entries(data)) {
      if (validKeys.includes(key)) {
        session[key] = value;
      }
    }

    ws.send(JSON.stringify({ session }));
  }
};

export default handlers;
