import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { ParkourRoom } from "./rooms/ParkourRoom";

const port = Number(process.env.PORT || 2567);
const app = express();

app.use(cors());
app.use(express.json());

const httpServer = createServer(app);

const gameServer = new Server({
    transport: new WebSocketTransport({
        server: httpServer
    })
});

gameServer.define("parkour", ParkourRoom);

gameServer.listen(port);

console.log(`Colyseus server listening on ws://localhost:${port}`);
