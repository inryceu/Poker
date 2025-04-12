import {
  createNewPlayer,
  loadPlayerFromDB,
} from "./Repositories/PlayerRepository.js";

const handlers = {
  create: async (data, ws) => {
    await createNewPlayer(data.login, data.password);
    const player = await loadPlayerFromDB(data.login, data.password);

    const response = player
      ? { status: "success", player }
      : { status: "error", player: null };

    ws.send(JSON.stringify(response));
  },

  auth: async (data, ws) => {
    const player = await loadPlayerFromDB(data.login, data.password);

    const response = player
      ? { status: "success", player }
      : { status: "error", player: null };

    ws.send(JSON.stringify(response));
  },
};

export default handlers;
