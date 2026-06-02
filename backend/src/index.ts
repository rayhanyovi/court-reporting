import { createApp } from "./app.js";
import { initDb } from "./db.js";

initDb();

const app = createApp();
const PORT = Number(process.env.PORT ?? 4000);
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
