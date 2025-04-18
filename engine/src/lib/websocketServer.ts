import { WebSocketServer } from "ws";
import { env } from "./env";

export const websocketServer = new WebSocketServer({
    host: env.WEBSOCKET_HOST,
    port: Number.parseInt(env.WEBSOCKET_PORT)
});
