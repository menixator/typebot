import dgram from "dgram";
import { AddressInfo } from "net";

enum SHIPTYPE {
  BATTLESHIP = "0",
  FRIGATE = "1",
  SUBMARINE = "2"
}

//const IP_ADDRESS_SERVER = "127.0.0.1";
const IP_ADDRESS_SERVER =  "192.168.100.13"

const PORT_SEND = 1924;
const PORT_RECEIVE = 1925;

const MAX_BUFFER_SIZE = 500;
const MAX_SHIPS = 200;
const FIRING_RANGE = 100;
const MAX_HEALTH = 10;
const MAX_COORD = 995;

enum MOVEMENT {
  LEFT = -1,
  RIGHT = 1,
  UP = 1,
  DOWN = -1,
  FAST = 2,
  SLOW = 1
}
const BUFFER_SIZE = 4096;


const allies:Array<string> = ["S1800083"];

function int(str: string) {
  let parsed = parseInt(str, 10);
  if (Number.isNaN(parsed)) {
    throw new Error("not a number");
  }
  return parsed;
}

function avg(...coords: Coordinates[]) {
  let hSum = 0;
  let vSum = 0;

  for (let i = 0; i < coords.length; i++) {
    hSum += coords[i].x;
    vSum += coords[i].y;
  }

  return new Coordinates(
    Math.ceil(hSum / coords.length),
    Math.ceil(vSum / coords.length)
  );
}

class Directions {
  public x: number;
  public y: number;

  static ALL: Directions[] = [-2, -1, 0, 1, 2]
    .map((n: number) => {
      return [
        new Directions(n, -2),
        new Directions(n, -1),
        new Directions(n, 0),
        new Directions(n, 1),
        new Directions(n, 2)
      ];
    })
    .reduce((p: Directions[], c) => {
      p.push(...c);
      return p;
    }, []);

  constructor(x: number, y: number) {
    this.x = Math.min(Math.max(x, -2), 2);
    this.y = Math.min(Math.max(y, -2), 2);
  }

  toString() {
    return `<${this.getStringifiedX()}, ${this.getStringifiedY()}>`;
  }

  public slow() {
    this.x = Math.min(Math.max(this.x, -1), 1);
    this.y = Math.min(Math.max(this.y, -1), 1);
    return this;
  }
  private getStringifiedX() {
    switch (this.x) {
      case -2:
        return "FAST_LEFT";
      case -1:
        return "SLOW_LEFT";
      case 0:
        return "NO-OP";
      case 1:
        return "SLOW_RIGHT";
      case 2:
        return "FAST_RIGHT";
    }
  }

  private getStringifiedY() {
    switch (this.y) {
      case -2:
        return "FAST_DOWN";
      case -1:
        return "SLOW_DOWN";
      case 0:
        return "NO-OP";
      case 1:
        return "SLOW_UP";
      case 2:
        return "FAST_UP";
    }
  }
}

class Coordinates {
  public x: number;
  public y: number;

  static NULL_COORDS = new Coordinates(-1, -1);

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
  }

  directionsTo(target: Coordinates | Ship): Directions {
    if (target instanceof Ship) return this.directionsTo(target.coordinates);
    return new Directions(target.x - this.x, target.y - this.y);
  }

  distanceTo(target: Coordinates | Ship): number {
    if (target instanceof Ship) return this.distanceTo(target.coordinates);
    return Math.sqrt(
      Math.pow(target.x - this.x, 2) + Math.pow(target.y - this.y, 2)
    );
  }

  toString() {
    return `(${this.x}, ${this.y})`;
  }

  clone() {
    return new Coordinates(this.x, this.y);
  }

  add(vector: Directions | Coordinates) {
    let clone = this.clone();
    clone.x += vector.x;
    clone.y += vector.y;
    return clone;
  }
}

class Ship {
  public coordinates: Coordinates;
  public type: SHIPTYPE;
  public flag: number;
  public health: number;

  constructor(
    coordinates: Coordinates,
    type: SHIPTYPE,
    health: number,
    flag: number
  ) {
    this.coordinates = coordinates;
    this.type = type;
    this.flag = flag;
    this.health = health;
  }

  distanceTo(target: Ship | Coordinates) {
    return this.coordinates.distanceTo(target);
  }

  directionsTo(target: Ship | Coordinates) {
    return this.coordinates.directionsTo(target);
  }

  toString() {
    return `[Ship coords=${this.coordinates} type=${this.type} health=${
      this.health
    } flag=${this.flag}]`;
  }
}

class MyShip extends Ship {
  static getRandomCoords(): Coordinates {
    return new Coordinates(
      Math.floor(Math.random() * 995),
      Math.floor(Math.random() * 995)
    );
  }

  private target: Coordinates = MyShip.getRandomCoords();

  constructor(private sock: dgram.Socket, public profile: Profile) {
    super(Coordinates.NULL_COORDS, profile.shipType, MAX_HEALTH, profile.flag);
  }

  register() {
    this.send(
      `Register  ${STUDENT_NUMBER},${STUDENT_FIRSTNAME},${STUDENT_FAMILYNAME},${MY_SHIP}`
    );
  }

  public fire(coords: Coordinates) {
    this.send(`Fire ${this.profile.studentNumber},${coords.x},${coords.y}`);
  }

  public move(direction: Directions) {
    this.send(
      `Move ${this.profile.studentNumber},${direction.x},${direction.y}`
    );
  }

  public setFlag(flag: number) {
    this.send(`Flag ${this.profile.studentNumber},${flag}`);
  }

  public message(dest: string, source: string, msg: string) {
    this.send(
      `Message ${this.profile.studentNumber},${dest},${source},${msg}`
    );
  }

  public merge(ship: Ship) {
    this.coordinates = ship.coordinates;
    this.flag = ship.flag;
    this.health = ship.health;
  }

  private send(str: string) {
    console.log("WRITE", str);
    this.sock.send(Buffer.from(str + "\0"), PORT_SEND, IP_ADDRESS_SERVER);
  }

  public willMovingInThisDirectionBringMeCloserTo(
    directions: Directions,
    target: Coordinates | Ship
  ): boolean {
    if (target instanceof Ship)
      return this.willMovingInThisDirectionBringMeCloserTo(
        directions,
        target.coordinates
      );
    return (
      this.coordinates.add(directions).distanceTo(target) >
      this.coordinates.distanceTo(target)
    );
  }

  public tick(others: Ship[]) {
    // There are no other ships!
    if (others.length == 0) {
      //console.log("no other ships. just moving.");
      while (this.distanceTo(this.target) < 20) {
        //console.log("too close to random target");
        this.target = MyShip.getRandomCoords();
      }
      this.move(this.coordinates.directionsTo(this.target));
    }
    // There are other ships.
    let closest = -1;
    for (let i = 0; i < others.length; i++) {
      if (
        closest == -1 ||
        (others[i].distanceTo(this) < others[closest].distanceTo(this) &&
          others[i].health < others[closest].health)
      ) {
        // If it doesnt have my flag.
        if (true || others[i].flag !== this.profile.flag) {
          closest = i;
          //console.log("new closest ship selected");
        } else {
        }
      }
    }
    if (closest != -1) {
      if (others[closest].distanceTo(this) <= FIRING_RANGE) {
        this.fire(others[closest].coordinates);
      }
     
      let directions = me.directionsTo(others[closest]);
      this.move(directions);

      } else {
        this.move(this.directionsTo(this.target));
      }

      console.log("HERE!");
      this.message("S1800083","S1700804", `${this.coordinates.x} ${this.coordinates.y}`);
  }
}

class Profile {
  constructor(
    public studentNumber: string,
    public firstName: string,
    public familyName: string,
    public shipType: SHIPTYPE,
    public flag: number
  ) {}
}

const STUDENT_NUMBER = "S1700804";
const STUDENT_FIRSTNAME = "Ahmed";
const STUDENT_FAMILYNAME = "Miljau";
const MY_SHIP = SHIPTYPE.BATTLESHIP;

const listenSock: dgram.Socket = dgram.createSocket("udp4");
const sendSock: dgram.Socket = dgram.createSocket("udp4");
const me: MyShip = new MyShip(
  sendSock,
  new Profile(
    STUDENT_NUMBER,
    STUDENT_FIRSTNAME,
    STUDENT_FAMILYNAME,
    MY_SHIP,
    67678
  )
);

let ports: Set<number> = new Set();

listenSock.on("message", (msg: Buffer, rinfo: AddressInfo) => {
  // TODO: check ip
  // //console.log(`Recieved message of size: ${msg.byteLength}`);
  // //console.log(`Message was from: ${rinfo.address}:${rinfo.port}`);
  ports.add(rinfo.port);
  if (msg[0] == "M".charCodeAt(0)) {
    console.log(msg.toString("utf8"));
    let m = msg.toString("utf8").trim().match(/.+?(\d+)\s*(\d+).?$/);
    console.log(m);
    me.move(me.directionsTo(new Coordinates(int(m[1]), int(m[2]))));
  } else {
    let i = 0;
    let finished = false;
    let chr: number;
    let lastSlicePos = 0;
    let scanBuffer: Buffer;
    let ships: Ship[] = [];

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
            //console.log(`doesnt match!`);
            continue;
          }
          // x,y,health, flag, type
          let coords = new Coordinates(int(msgMatch[1]), int(msgMatch[2]));
          let health = int(msgMatch[3]);
          let flag = int(msgMatch[4]);
          let type: SHIPTYPE = <SHIPTYPE>(msgMatch[5] ? msgMatch[5] : MY_SHIP);
          let ship = new Ship(coords, type, health, flag);
          ships.push(ship);
          break;

        default:
          break;
      }
      i++;
    }
    me.merge(ships[0]);
    me.tick(ships.slice(1));
  }
});

sendSock.bind();
listenSock.bind(PORT_RECEIVE);

me.register();
me.setFlag(67678);
