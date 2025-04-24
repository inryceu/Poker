import { WebSocketServer } from "ws";
import http from "http";
import handlers from "./Handlers.js";
import { AppError } from "./AppError.js";

const server = http.createServer();
const wss = new WebSocketServer({ server });

server.listen(8080, () => {
  console.log("WebSocket сервер працює на ws://localhost:8080");
});

wss.on("connection", (ws) => {
  const ctx = {};
  console.log("Новий гравець підключився");

  ws.on("message", async (message) => {
    let response;
    try {
      const data = JSON.parse(message);
      console.log("Отримано повідомлення:", data);

      const handler = handlers[data.type];
      if (!handler) {
        throw new AppError("Невідомий тип запиту");
      }

      response = await handler(ctx, data);
    } catch (error) {
      console.log("Помилка обробки повідомлення:", error.message);

      response = {
        status: error.status || "error",
        message: error.message || "Сталася невідома помилка",
      };
    } finally {
      ws.send(JSON.stringify(response));
    }
  });

  ws.on("close", () => {
    console.log("Гравець відключився");
  });
});
