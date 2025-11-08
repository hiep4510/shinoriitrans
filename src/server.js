// src/server.js
import express from "express";
import { ENV } from "./config.js";
import { handleNewPost } from "./fbHandler.js";

const app = express();
app.use(express.json());

const VERIFY_TOKEN = ENV.FB_VERIFY_TOKEN;

app.get("/", (req, res) => res.send("✅ Bot is running!"));
app.get("/webhook", (req, res) => {
  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    console.log("✅ Facebook Webhook verified successfully!");
    res.status(200).type("text/plain").send(challenge);
  } else {
    console.log("❌ Webhook verification failed!");
    res.sendStatus(403);
  }
});

app.post("/webhook", async (req, res) => {
  const body = req.body;
  if (body.object === "page") {
    body.entry?.forEach((entry) => {
      entry.changes?.forEach((change) => {
        if (change.field === "feed") {
          const value = change.value;
          if (
            value.verb === "add" &&
            ["status", "photo", "share"].includes(value.item)
          )
            handleNewPost(value);
        }
      });
    });
    res.status(200).send("EVENT_RECEIVED");
  } else res.sendStatus(404);
});

export function startServer() {
  const PORT = ENV.PORT || 3000;
  app.listen(PORT, "0.0.0.0", () =>
    console.log(`🌐 Express server online on port ${PORT}`)
  );
}
