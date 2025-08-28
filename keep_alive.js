// Dosya Adı: keep_alive.js
const express = require("express");
const server = express();

server.all("/", (req, res) => {
  res.send("Bot çalışır durumda.");
});

function keepAlive() {
  server.listen(3000, () => {
    console.log("Web sunucusu hazır!");
  });
}

module.exports = keepAlive;
