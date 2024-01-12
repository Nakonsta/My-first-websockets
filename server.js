import 'dotenv/config';
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

const server = http.createServer(app);

const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    wss.clients.forEach((ws) => {
      ws.send(message);
    });
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
