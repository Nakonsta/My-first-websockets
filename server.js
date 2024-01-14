import 'dotenv/config';
import { nanoid } from 'nanoid';
import { WebSocketServer } from 'ws';
import http from 'http';
import express from 'express';
import { URL } from 'url';
import cookie from 'cookie';

const DB = {
  users: [
    { id: 1, username: 'Anna', password: 'Anna' },
    { id: 2, username: 'Victor', password: 'Victor' },
    { id: 3, username: 'Sasha', password: 'Sasha' },
  ],
  tokens: {},
};

const app = express();
const port = process.env.PORT || 3000;
app.use(express.static('public'));

const server = http.createServer(app);

const wss = new WebSocketServer({ clientTracking: false, noServer: true });
const clients = new Map();

app.post('/login', express.json(), (req, res) => {
  const { username, password } = req.body;
  const user = DB.users.find((u) => u.username === username);

  if (!user) {
    return res.status(401).send('Unknown username');
  }
  if (user.password !== password) {
    return res.status(401).send('Wrong password');
  }

  const token = nanoid();
  DB.tokens[token] = user.id;

  res.cookie('token', token).json({ ok: true });
});

server.on('upgrade', (req, socket, head) => {
  console.log(req);
  const cookies = cookie.parse(req.headers['cookie']);
  const token = cookies && cookies['token'];
  const userId = token && DB.tokens[token];

  if (!userId) {
    socket.write('HTTP/1.1 401 Unautorized\r\n\r\n');
    socket.destroy();
    return;
  }

  req.userId = userId;

  wss.handleUpgrade(req, socket, head, (ws) => {
    wss.emit('connection', ws, req);
  });
});

wss.on('connection', (ws, req) => {
  const { userId } = req;

  clients.set(userId, ws);

  ws.on('close', () => {
    clients.delete(userId);
  });

  ws.on('message', (message) => {
    let data;

    try {
      data = JSON.parse(message);
    } catch (err) {
      return;
    }

    if (data.type === 'chat_message') {
      const user = DB.users.find((u) => u.id === userId);
      const fullMessage = JSON.stringify({
        type: 'chat_message',
        message: data.message,
        name: user.username,
      });

      for (ws of clients.values()) {
        ws.send(fullMessage);
      }
    }
  });
});

server.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
