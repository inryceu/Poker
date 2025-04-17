import {
  addFriend,
  createNewPlayer,
  checkPassword,
  loadPlayerFromDB,
  loadPropertyFromDB,
} from "./Repositories/PlayerRepository.js";

const handlers = {
  create: async (data, ws) => {
    const player = await createNewPlayer(data.login, data.password);
    const response =
      player !== null
        ? { status: "success", player }
        : {
            status: "error",
            message: "Такий логін вже зареєстровано",
            player: null,
          };

    ws.send(JSON.stringify(response));
  },

  auth: async (data, ws) => {
    try {
      const hashedPassword = await loadPropertyFromDB(data.login, "password");
      const isValidPassword = await checkPassword(
        hashedPassword,
        data.password
      );
      if (!isValidPassword) return false;
    } catch (err) {
      if (err) return false;
    }

    const player = await loadPlayerFromDB(data.login);

    const response =
      player !== null
        ? { status: "success", player }
        : {
            status: "error",
            message: "Неправильний логін або пароль",
            player: null,
          };

    ws.send(JSON.stringify(response));
  },

  addFriend: async (data, ws) => {
    const result = await addFriend(data.login, data.friendLogin);
    const player = await loadPlayerFromDB(data.login);
    const response = result
      ? { status: "success", player }
      : {
          status: "error",
          message: "Такого користувача не існує",
        };

    ws.send(JSON.stringify(response));
  },
};

export default handlers;
