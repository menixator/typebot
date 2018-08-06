import { MyShip } from "MyShip";
import dgram from "dgram";
import { AddressInfo } from "net";
import { SHIP_TYPE, Ship } from "./Ship";
import { Coordinates } from "./Coordinates";

const BUFFER_SIZE = 4096;

export class Client {
  public me: MyShip = null!;

  static int(str: string) {
    let parsed = parseInt(str, 10);
    if (Number.isNaN(parsed)) {
      throw new Error("not a number");
    }
    return parsed;
  }

  private _listen: dgram.Socket = dgram.createSocket("udp4");
  private _send: dgram.Socket = dgram.createSocket("udp4");

  constructor(
    public serverIp: string,
    public sendPort: number,
    public recievePort: number,
    public bindIp = "127.0.0.1"
  ) {}

  public setMyShip(me: MyShip) {
    this.me = me;
  }

  public getMyShip() {
    if (this.me == null) throw new TypeError("MyShip wasnt set");
    return this.me;
  }

  private _startListening() {
    this._listen.on("message", (msg: Buffer, rinfo: AddressInfo) => {
      // TODO: check ip
      // console.log(`Recieved message of size: ${msg.byteLength}`);
      // console.log(`Message was from: ${rinfo.address}:${rinfo.port}`);
      if (msg[0] == "M".charCodeAt(0)) {
        this.me.onMessage(msg, rinfo);
      } else {
        let i = 0;
        let finished = false;
        let chr: number;
        let lastSlicePos = 0;
        let scanBuffer: Buffer;
        let ships: Ship[] = [];
        console.log(msg.toString("utf8"));

        while (!finished && i < BUFFER_SIZE) {
          chr = msg[i];
          switch (chr) {
            case 0:
              finished = true;
            case "|".charCodeAt(0):
              scanBuffer = msg.slice(lastSlicePos, i);
              lastSlicePos = i + 1;
              let str = scanBuffer.toString("utf8").trim();

              let msgMatch = str.match(
                /^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*(\d+)\s*)?$/
              );
              if (!msgMatch) {
                console.log(`doesnt match!`);
                continue;
              }
              // x,y,health, flag, type
              let coords = new Coordinates(
                Client.int(msgMatch[1]),
                Client.int(msgMatch[2])
              );
              let health = Client.int(msgMatch[3]);
              let flag = Client.int(msgMatch[4]);
              let type: SHIP_TYPE = <SHIP_TYPE>(
                (msgMatch[5] ? msgMatch[5] : this.me.profile.shipType)
              );
              console.log(`flag found: ${flag}, ${ships.length}`);
              let ship = new Ship(ships.length, coords, type, health, flag);
              ships.push(ship);
              break;

            default:
              break;
          }
          i++;
        }
        this.me.merge(ships[0]);
        this.me.tick(
          ships.slice(1).filter(ship => ship.flag !== this.me.flag),
          ships.slice(1).filter(ship => ship.flag == this.me.flag)
        );
      }
    });
  }

  public send(buffer: Buffer) {
    this._send.send(buffer, this.sendPort, this.serverIp);
  }

  public listen() {
    this._startListening();
    this._listen.bind(this.recievePort, this.bindIp, ()=> {
      console.log("BOUND!");
    });
  }
}
