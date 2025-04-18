import "dotenv/config";
import { websocketServer } from "./lib/websocketServer";
import { logger } from "./lib/logger";
import { aiProcess } from "./lib/ai";
import { startReminderCron } from "./crons/reminderCron";
import type WebSocket from "ws";

export let socket: WebSocket | null = null;

websocketServer.on("connection", (ws) => {  
  logger.info("New connection estabilished on websocket");

  socket = ws;
  startReminderCron();

  ws.on("error", (error) => logger.error(error, "Error happened on websocket"));

  ws.on("message", async function message(content) {
    const messageContent = content.toString();

    logger.info({ content: messageContent }, "Incoming message from user");

    try {
      const response = await aiProcess({
        prompt: messageContent,
        includeTools: true,
        useMemory: true,
        includeMessages: true,
      });

      ws.send(response);
    } catch (error) {
      logger.error(error, "Message handling failed");
    }
  });
});
