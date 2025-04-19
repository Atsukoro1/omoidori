import "dotenv/config";
import { websocketServer } from "./lib/websocketServer";
import { logger } from "./lib/logger";
import { aiProcess } from "./lib/ai";
import type WebSocket from "ws";
import { express } from "./lib/express";
import { env } from "./lib/env";
import expressServer from 'express';
import path from 'node:path';

export let socket: WebSocket | null = null;

/**
 * Websocket server for communication with the unity client
 */
websocketServer.on("connection", (ws) => {
  logger.info("New connection estabilished on websocket");

  socket = ws;

  ws.on("error", (error) => logger.error(error, "Error happened on websocket"));

  ws.on("message", async function message(content) {
    const messageContent = content.toString();

    logger.info({ content: messageContent }, "Incoming message from user");

    try {
      const aiResponse = await aiProcess({
        prompt: messageContent,
        useMemory: true,
        includeMessages: true,
        useVoiceGeneration: false
      });

      const socketResponse: SocketResponse = {
        type: 'message',
        data: aiResponse,
      };
      // TODO: Remove, this is only for testing
      const socketResponse2: SocketResponse = {
        type: 'new_audio',
        data: `http://localhost:${env.HTTP_SERVER_PORT}/audio/latest.mp3`
      };

      ws.send(JSON.stringify(socketResponse));
      ws.send(JSON.stringify(socketResponse2));
    } catch (error) {
      logger.error(error, "Message handling failed");
    }
  });

  ws.on("close", (code) => {
    logger.info({ code }, "Connection with socket closed with code");
  });
});

/**
 * Http server for serving static mp3 files for the unity client to download
 */
const AUDIO_DIR = path.join(__dirname, '../data');

express.listen(env.HTTP_SERVER_PORT, () => {
  logger.info({
    port: env.HTTP_SERVER_PORT,
    accessPath: AUDIO_DIR,
    exampleUrl: `http://localhost:${env.HTTP_SERVER_PORT}/audio/latest.mp3`
  }, "HTTP server for serving static files started");
});

express.use('/audio', expressServer.static(AUDIO_DIR));