const { WebSocketServer } = require('ws');
const { setupWSConnection } = require('y-websocket/dist/bin/utils.cjs');

const port = 1234;
const wss = new WebSocketServer({ port });

wss.on('connection', (conn, req) => {
  setupWSConnection(conn, req);
});

console.log(`Yjs WebSocket server running on ws://localhost:${port}`);