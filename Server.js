import { WebSocketServer } from "ws";
import http from "http";
import handlers from "./Handlers.js";
import createLoggingProxy from "./proxyLogger.js";
import { AppError as AE } from "./AppError.js";

const server = http.createServer();
const wss = new WebSocketServer({ server });

const AppError = createLoggingProxy(AE, { logErrorsOnly: true });
const INTERVAL = 1000 * 60 * 5;
const ctx = new Map();

server.listen(8080, () => {
  console.log("WebSocket сервер працює на ws://localhost:8080");
});

setInterval(() => {
  for (const [key, player] of ctx.entries()) {
    if (Date.now() - player.action > INTERVAL) {
      const response = {
        status: "unauth error",
        message: "Ви занадто довго були неактивні",
      };
      player.ws.send(JSON.stringify(response));
      ctx.delete(key);
    }
  }
}, INTERVAL);

wss.on("connection", (ws) => {
  console.log("Новий гравець підключився");

  ws.on("message", async (message) => {
    let response;
    try {
      const data = JSON.parse(message);

      const handler = createLoggingProxy(handlers[data.type], {
        logErrorsOnly: true,
      });

      if (!handler) {
        throw new AppError("Невідомий тип запиту");
      }

      response = await handler(ctx, data, ws);
    } catch (error) {
      response = {
        status: error.status || "error",
        message: error.message || "Сталася невідома помилка",
      };
    } finally {
      if (response) ws.send(JSON.stringify(response));
    }
  });

  ws.on("close", () => {
    console.log("Гравець відключився");
  });
});
