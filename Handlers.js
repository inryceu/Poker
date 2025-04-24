import {
  createNewPlayer,
  loadPlayerFromDB,
  addFriend,
  deleteFriend,
  updatePlayerProperty,
  checkPassword,
} from "./Repositories/PlayerRepository.js";

import { createSession } from "./Repositories/SessionRepository.js";

import { AppError } from "./AppError.js";

const handlers = {
  create: async (ctx, data) => {
    const player = await createNewPlayer(data.login, data.password);
    if (!player) throw new AppError("Такий логін вже зареєстровано");

    ctx[data.login] = player;
    return { player };
  },

  auth: async (ctx, data) => {
    if (!ctx[data.login]) {
      const player = await loadPlayerFromDB(data.login);
      ctx[data.login] = player;
    }

    const isValidPassword = await checkPassword(
      ctx[data.login].password,
      data.password
    );

    if (!isValidPassword) throw new AppError("Неправильний логін або пароль");

    const player = await loadPlayerFromDB(data.login);
    ctx[data.login] = player;
    return { player };
  },

  addFriend: async (ctx, data) => {
    const player = ctx[data.login];
    if (!player) throw new AppError("Неавторизований доступ");

    const result = await addFriend(player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const playerUpdated = await loadPlayerFromDB(player.login);
    ctx[data.login] = playerUpdated;

    return { player: playerUpdated };
  },

  deleteFriend: async (ctx, data) => {
    const player = ctx[data.login];
    if (!player) throw new AppError("Неавторизований доступ");

    const result = await deleteFriend(player.login, data.friendLogin);
    if (!result) throw new AppError("Такого користувача не існує");

    const playerUpdated = await loadPlayerFromDB(player.login);
    ctx[data.login] = playerUpdated;

    return { player: playerUpdated };
  },

  createSession: async (ctx, data) => {
    const player = ctx[data.login];
    if (!player) throw new AppError("Неавторизований доступ");

    const session = await createSession(
      data.admin,
      data.startBalance,
      data.minBet,
      data.maxBet,
      data.roundTime
    );

    await updatePlayerProperty(player.login, "session", session.id);

    return { session };
  },
};

export default handlers;
