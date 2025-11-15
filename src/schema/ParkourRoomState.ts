import { Schema, type, MapSchema } from "@colyseus/schema";
import { PlayerState } from "./PlayerState";

export class ParkourRoomState extends Schema {
    @type({ map: PlayerState })
    players = new MapSchema<PlayerState>();

    @type("float32") raceStartTime: number = 0;
    @type("boolean") raceStarted: boolean = false;
    @type("string") gameState: string = "waiting";
    @type("uint8") countdownValue: number = 0;
    @type("uint8") playerCount: number = 0;
    @type("string") roomCode: string = "";
}
