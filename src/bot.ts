import dgram from "dgram";
import { AddressInfo } from "net";
import { Ship, SHIP_TYPE } from "Ship";
import { MyShip } from "./MyShip";
import { Profile } from "./Profile";
import { Coordinates } from "./Coordinates";
import { Client } from "./Client";

const IP_ADDRESS_SERVER = "127.0.1.1";
// const IP_ADDRESS_SERVER =  "192.168.120.119"

const PORT_SEND = 1924;
const PORT_RECEIVE = 1925;

const BUFFER_SIZE = 4096;

const STUDENT_NUMBER = "S1700804";
const STUDENT_FIRSTNAME = "Ahmed";
const STUDENT_FAMILYNAME = "Miljau";
const MY_SHIP = SHIP_TYPE.BATTLESHIP;
const FLAG = 6654;

const client = new Client(IP_ADDRESS_SERVER, PORT_SEND, PORT_RECEIVE, "127.0.0.1");
const profile = new Profile(
  STUDENT_NUMBER,
  STUDENT_FIRSTNAME,
  STUDENT_FAMILYNAME,
  MY_SHIP,
  FLAG
);
const me: MyShip = new MyShip(profile);

me.setClient(client);
client.setMyShip(me);

client.listen();
me.register();
