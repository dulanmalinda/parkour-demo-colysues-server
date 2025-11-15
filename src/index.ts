import { Server, matchMaker } from "@colyseus/core";
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

gameServer.define("parkour", ParkourRoom)
    .filterBy(['roomCode']);

app.get("/api/find-room/:code", async (req, res) => {
    try {
        const roomCode = req.params.code.toUpperCase();
        const rooms = await matchMaker.query({
            name: "parkour",
            private: false
        });

        const targetRoom = rooms.find((r: any) => r.metadata?.roomCode === roomCode);

        if (targetRoom && targetRoom.clients < targetRoom.maxClients) {
            res.json({
                roomId: targetRoom.roomId,
                players: targetRoom.clients,
                maxPlayers: targetRoom.maxClients
            });
        } else if (targetRoom) {
            res.status(400).json({ error: "Room is full" });
        } else {
            res.status(404).json({ error: "Room not found" });
        }
    } catch (error) {
        res.status(500).json({ error: "Server error" });
    }
});

gameServer.listen(port);

console.log(`Colyseus server listening on ws://localhost:${port}`);
