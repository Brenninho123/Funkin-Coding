const express = require('express');
const http = require('http');
const path = require('path');
const fs = require('fs');
const WebSocket = require('ws');

const PORT = process.env.PORT || 3000;
const MESSAGES_FILE = path.join(__dirname, 'community-messages.json');
const MAX_MESSAGES = 200;
const MAX_MESSAGE_LENGTH = 500;
const MAX_NAME_LENGTH = 40;

const app = express();
app.use(express.static(__dirname));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws/community' });

function loadMessages(){
  try{
    const raw = fs.readFileSync(MESSAGES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch(err){
    return [];
  }
}

function saveMessages(messages){
  try{
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch(err){
    console.error('Failed to persist community messages:', err.message);
  }
}

let messages = loadMessages();

function broadcast(data){
  const payload = JSON.stringify(data);
  wss.clients.forEach(client => {
    if(client.readyState === WebSocket.OPEN){
      client.send(payload);
    }
  });
}

function broadcastUserCount(){
  broadcast({ type: 'userCount', count: wss.clients.size });
}

function makeId(){
  return Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 8);
}

wss.on('connection', (ws) => {
  ws.isAlive = true;
  ws.on('pong', () => { ws.isAlive = true; });

  ws.send(JSON.stringify({ type: 'history', messages }));
  broadcastUserCount();

  ws.on('message', (raw) => {
    let data;
    try{
      data = JSON.parse(raw.toString());
    } catch(err){
      return;
    }
    if(!data || data.type !== 'message') return;

    const name = String(data.name || 'Guest').trim().slice(0, MAX_NAME_LENGTH) || 'Guest';
    const avatar = typeof data.avatar === 'string' && data.avatar.startsWith('https://') ? data.avatar : '';
    const text = String(data.text || '').trim().slice(0, MAX_MESSAGE_LENGTH);
    if(!text) return;

    const message = {
      id: makeId(),
      name,
      avatar,
      text,
      timestamp: Date.now()
    };

    messages.push(message);
    if(messages.length > MAX_MESSAGES){
      messages = messages.slice(-MAX_MESSAGES);
    }
    saveMessages(messages);
    broadcast({ type: 'message', message });
  });

  ws.on('close', () => {
    broadcastUserCount();
  });
});

const heartbeat = setInterval(() => {
  wss.clients.forEach(ws => {
    if(ws.isAlive === false) return ws.terminate();
    ws.isAlive = false;
    ws.ping();
  });
}, 30000);

wss.on('close', () => clearInterval(heartbeat));

server.listen(PORT, () => {
  console.log(`Funkin' Coding server running at http://localhost:${PORT}`);
  console.log(`Community chat available at ws://localhost:${PORT}/ws/community`);
});
