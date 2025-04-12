import { WebSocketServer } from "ws";
import http from "http";
import handlers from "./Handlers.js";

const server = http.createServer();
const wss = new WebSocketServer({ server });

server.listen(8080, () => {
  console.log("WebSocket сервер працює на ws://localhost:8080");
});

wss.on("connection", (ws) => {
  console.log("Новий гравець підключився");

  ws.on("message", async (message) => {
    try {
      const data = JSON.parse(message);
      console.log("Отримано повідомлення:", data);

      const handler = handlers[data.type];
      if (handler) {
        await handler(data, ws);
      } else {
        ws.send(JSON.stringify({ status: "error", message: "Unknown type" }));
      }
    } catch (error) {
      console.error("Помилка обробки повідомлення:", error);
      ws.send(JSON.stringify({ status: "error", message: "Invalid message" }));
    }
  });

  ws.on("close", () => {
    console.log("Гравець відключився");
  });
});
