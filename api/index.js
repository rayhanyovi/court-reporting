import { createApp } from "../backend/dist/app.js";
import { initDb } from "../backend/dist/db.js";

initDb();

export default createApp();
