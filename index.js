import * as dotenv from "dotenv"
import express from "express";
import { bootstrap } from "./src/app.controller.js";
import { runIo } from "./src/modules/Socket/soket.controller.js";
dotenv.config({})
const app = express();
const server = app.listen(process.env.PORT, () => {
    console.log("sever is runing successfully in port", process.env.PORT)
})
bootstrap(app, express);
runIo(server);