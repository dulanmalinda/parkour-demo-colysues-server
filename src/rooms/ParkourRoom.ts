import { Room, Client } from "@colyseus/core";
import { ParkourRoomState } from "../schema/ParkourRoomState";
import { PlayerState } from "../schema/PlayerState";

export class ParkourRoom extends Room<ParkourRoomState> {
    maxClients = 8;
    private readonly MIN_PLAYERS = 2;
    private readonly COUNTDOWN_SECONDS = 3;
    private countdownInterval?: NodeJS.Timeout;

    private spawnPoints = [
        { x: -6, y: 1, z: 0 },
        { x: -3, y: 1, z: 0 },
        { x: 0, y: 1, z: 0 },
        { x: 3, y: 1, z: 0 },
        { x: 6, y: 1, z: 0 },
        { x: -6, y: 1, z: 4 },
        { x: -3, y: 1, z: 4 },
        { x: 0, y: 1, z: 4 },
    ];

    private nextSpawnIndex = 0;

    onCreate(options: any) {
        this.setState(new ParkourRoomState());
        this.state.gameState = "waiting";
        this.setPatchRate(33);

        console.log("ParkourRoom created with options:", options);

        this.onMessage("updatePosition", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.x = message.x;
                player.y = message.y;
                player.z = message.z;
                player.rotY = message.rotY;
                player.movementState = message.movementState;
                player.isGrounded = message.isGrounded;
            }
        });

        this.onMessage("checkpointReached", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.lastCheckpoint = message.checkpointId;
                console.log(`Player ${client.sessionId} reached checkpoint ${message.checkpointId}`);
            }
        });

        this.onMessage("selectSkin", (client, message) => {
            const player = this.state.players.get(client.sessionId);
            if (player) {
                player.skinId = message.skinId;
                console.log(`Player ${client.sessionId} selected skin ${message.skinId}`);
            }
        });
    }

    onJoin(client: Client, options: any) {
        console.log(client.sessionId, "joined!");

        const player = new PlayerState();
        player.id = client.sessionId;
        player.name = options.playerName || "Player";
        player.skinId = options.skinId || 0;

        const spawnPoint = this.spawnPoints[this.nextSpawnIndex % this.spawnPoints.length];
        this.nextSpawnIndex++;

        player.x = spawnPoint.x;
        player.y = spawnPoint.y;
        player.z = spawnPoint.z;

        console.log(`Player ${client.sessionId} spawned at index ${this.nextSpawnIndex - 1}: (${player.x}, ${player.y}, ${player.z}), skinId: ${player.skinId}`);

        this.state.players.set(client.sessionId, player);

        this.state.playerCount = this.state.players.size;
        this.checkGameStart();
    }

    onLeave(client: Client, consented: boolean) {
        console.log(client.sessionId, "left!");
        this.state.players.delete(client.sessionId);

        this.state.playerCount = this.state.players.size;

        if (this.state.gameState === "countdown" && this.state.playerCount < this.MIN_PLAYERS) {
            this.cancelCountdown();
        }
    }

    onDispose() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
        }
        console.log("ParkourRoom disposed");
    }

    private checkGameStart() {
        if (this.state.playerCount >= this.MIN_PLAYERS && this.state.gameState === "waiting") {
            this.startCountdown();
        }
    }

    private startCountdown() {
        this.state.gameState = "countdown";
        this.state.countdownValue = this.COUNTDOWN_SECONDS;
        console.log(`Countdown started: ${this.state.countdownValue} seconds`);

        this.countdownInterval = setInterval(() => {
            this.state.countdownValue--;
            console.log(`Countdown: ${this.state.countdownValue}`);

            if (this.state.countdownValue <= 0) {
                this.startGame();
            }
        }, 1000);
    }

    private cancelCountdown() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
        }
        this.state.gameState = "waiting";
        this.state.countdownValue = 0;
        console.log("Countdown cancelled - not enough players");
    }

    private startGame() {
        if (this.countdownInterval) {
            clearInterval(this.countdownInterval);
            this.countdownInterval = undefined;
        }

        this.state.gameState = "playing";
        this.state.countdownValue = 0;
        this.state.raceStarted = true;
        this.state.raceStartTime = Date.now();

        console.log("Game started!");
    }
}
