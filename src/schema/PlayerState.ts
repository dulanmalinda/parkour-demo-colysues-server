import { Schema, type } from "@colyseus/schema";

export class PlayerState extends Schema {
    @type("string") id: string = "";
    @type("string") name: string = "Player";

    @type("float32") x: number = 0;
    @type("float32") y: number = 1;
    @type("float32") z: number = 0;
    @type("float32") rotY: number = 0;

    @type("uint8") movementState: number = 0;
    @type("boolean") isGrounded: boolean = true;

    @type("uint8") lastCheckpoint: number = 0;
    @type("uint8") skinId: number = 0;
}
