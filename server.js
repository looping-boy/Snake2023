const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const http = require('http');
const WebSocket = require('ws');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const boxSize = 10;
const gridSize = 20

let snakes = {};

wss.on('connection', (ws) => {
  // Generate a unique ID for the connected client
  const clientId = ws._socket.remoteAddress;
  console.log(clientId)

  // Initialize the snake for the connected client
  snakes[clientId] = [{
    x: gridSize * boxSize,
    y: gridSize * boxSize,
    direction: 'right'
  }];

  // Send the initial snake data to the client
  ws.send(JSON.stringify({ type: 'snake', data: snakes[clientId] }));

  ws.on('message', (message) => {
    const { type, data } = JSON.parse(message);

    if (type === 'keydown') {
      // Process the key code and update the snake position
      handleKeyDown(clientId, data.keyCode);
    }
  });

  ws.on('close', () => {
    // Remove the disconnected client's snake
    delete snakes[clientId];
  });
});

function handleKeyDown(clientId, keyCode) {
  // Update the snake position based on the key code
  const head = Object.assign({}, snakes[clientId][0]);
  let directionChoose;
  switch (keyCode) {
    case 37:
      head.x -= boxSize;
      directionChoose = 'left'
      break;
    case 38:
      head.y -= boxSize;
      directionChoose = 'down'
      break;
    case 39:
      head.x += boxSize;
      directionChoose = 'right'
      break;
    case 40:
      head.y += boxSize;
      directionChoose = 'up'
      break;
  }

  snakes[clientId].direction = directionChoose; 
}

function moveSnakes() {
    for (const clientId in snakes) {
      const head = Object.assign({}, snakes[clientId][0]);
      switch (snakes[clientId].direction) {
        case 'left':
          head.x -= boxSize;
          if (head.x < 0) {
            // Wrap to the right side of the grid
            head.x = gridSize * boxSize * 2 - boxSize;
          }
          break;
        case 'down':
          head.y -= boxSize;
          if (head.y < 0) {
            // Wrap to the bottom side of the grid
            head.y = gridSize * boxSize * 2 - boxSize;
          }
          break;
        case 'right':
          head.x += boxSize;
          if (head.x >= gridSize * boxSize * 2) {
            // Wrap to the left side of the grid
            head.x = 0;
          }
          break;
        case 'up':
          head.y += boxSize;
          if (head.y >= gridSize * boxSize * 2) {
            // Wrap to the top side of the grid
            head.y = 0;
          }
          break;
      }
  
      snakes[clientId].unshift(head);
      snakes[clientId].pop();
    }
  }
  
  function checkCollisions() {
    // Implement collision detection logic here
    // Example: Check if a snake collides with itself or with the boundaries of the canvas
  }
  
  function broadcastSnakePositions() {
    // Broadcast the updated snake positions to all clients
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        const clientId = getClientIdByWebSocket(client);
        // console.log(snakes)
        if (clientId) {
          client.send(JSON.stringify({ type: 'snake', data: snakes[clientId] }));
        }
      }
    });
  }
  
  function getClientIdByWebSocket(ws) {
    // Helper function to get the client ID based on the WebSocket instance
    for (const client of wss.clients) {
      if (client._socket === ws._socket) {
        return client._socket.remoteAddress; // Use a property that uniquely identifies the client
      }
    }
    return null;
  }

// Set up the game loop
setInterval(() => {
  moveSnakes();
//   checkCollisions();
  broadcastSnakePositions();
}, 50);

const port = 3000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});