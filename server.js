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

const port = 3000;
const gameClock = 50;
const boxSize = 10;
const gridSize = 20;
const xMax = gridSize * boxSize * 2;
const xMin = 0;
const yMax = gridSize * boxSize * 2;
const yMin = 0;

const clients = new Set();

let snakes = [];

function getRandomCoordinate(min, max, boxSize) {
  return Math.floor(Math.random() * ((max - boxSize) - min + 1) / boxSize) * boxSize;
}

function createNewApple() {
  const apple_x = getRandomCoordinate(xMin, xMax, boxSize);
  const apple_y = getRandomCoordinate(yMin, yMax, boxSize);
  return { x: apple_x, y: apple_y };
}

let apple = createNewApple();

wss.on('connection', (ws) => {
  // ADD CLIENT 
  clients.add(ws);

  // Generate a unique ID for the connected client
  const id = generateUniqueId();

  // Initialize the snake for the connected client
  snakes.push({
    id: id,
    snake: [{
      x: gridSize * boxSize,
      y: gridSize * boxSize,
      direction: 'right'
    }]
  });

  // Send the initial snake data to the client
  ws.send(JSON.stringify({ type: 'snake', data: snakes }));

  ws.send(JSON.stringify({ type: 'apple', data: apple }));

  ws.on('message', (message) => {
    const { type, data } = JSON.parse(message);
    //console.log(type, data)
    // OPTIMIZE CODE HERE:
    if (type === 'keydown') {
      handleKeyDown(id, data.keyCode);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    const index = snakes.findIndex(snake => snake.id === id);
    if (index !== -1) {
      snakes.splice(index, 1);
    }
  });
});

function generateUniqueId() {
  return Date.now().toString(36).slice(5, 7) + Math.random().toString(36).slice(3, 5);
}

function handleKeyDown(clientId, keyCode) {
  const snakeObj = snakes.find(snake => snake.id === clientId);
  if (snakeObj) {
    const head = Object.assign({}, snakeObj.snake[0]);
    let directionChoose;
    switch (keyCode) {
      case 37:
        directionChoose = 'left'
        if (snakeObj.snake[0].direction == 'right') { snakeObj.snake.reverse(); snakeObj.snake[0].direction = snakeReverse(snakeObj.snake) }
        else {snakeObj.snake[0].direction = directionChoose;}
        break;
      case 38:
        directionChoose = 'down'
        if (snakeObj.snake[0].direction == 'up') { snakeObj.snake.reverse(); snakeObj.snake[0].direction = snakeReverse(snakeObj.snake) }
        else {snakeObj.snake[0].direction = directionChoose;}
        break;
      case 39:
        directionChoose = 'right'
        if (snakeObj.snake[0].direction == 'left') { snakeObj.snake.reverse(); snakeObj.snake[0].direction = snakeReverse(snakeObj.snake) }
        else {snakeObj.snake[0].direction = directionChoose;}
        break;
      case 40:
        directionChoose = 'up'
        if (snakeObj.snake[0].direction == 'down') { snakeObj.snake.reverse(); snakeObj.snake[0].direction = snakeReverse(snakeObj.snake) }
        else {snakeObj.snake[0].direction = directionChoose;}
        break;
    }
  }
}

function snakeReverse(snake) {
  const length = snake.length;
  if (length >= 2) {
    const [head, neck] = [snake[0], snake[1]];
    if (head.x === neck.x) {
      return head.y > neck.y ? 'up' : 'down';
    } else if (head.y === neck.y) {
      return head.x > neck.x ? 'right' : 'left';
    } 
  } 
}

function moveSnakes() {
  
  for (const snakeObj of snakes) {

    // MOVING/REAPEARING:
    const head = Object.assign({}, snakeObj.snake[0]);
    switch (head.direction) {
      case 'left':
        head.x -= boxSize;
        if (head.x < 0) { head.x = gridSize * boxSize * 2 - boxSize; }
        break;
      case 'down':
        head.y -= boxSize;
        if (head.y < 0) { head.y = gridSize * boxSize * 2 - boxSize; }
        break;
      case 'right':
        head.x += boxSize;
        if (head.x >= gridSize * boxSize * 2) { head.x = 0; }
        break;
      case 'up':
        head.y += boxSize;
        if (head.y >= gridSize * boxSize * 2) { head.y = 0; }
        break;
    }
    snakeObj.snake.unshift(head);

    // EATING YOURSELF:
    const snakeBodyWithoutHead = snakeObj.snake.slice(1);
    const snakeBodyId = snakeObj.id
    for (const bodyPosition of snakeBodyWithoutHead) {
      if (head.x === bodyPosition.x && head.y === bodyPosition.y) {
        // Replace with a new snake
        snakes.splice(snakes.indexOf(snakeObj), 1, createNewSnake(head, snakeBodyId)); 
      }
    }
    
 
    // APPLE PART :
    let { direction, ...headWithoutDir } = head;
    if (headWithoutDir.x === apple.x && headWithoutDir.y === apple.y) {
      apple = createNewApple();
      broadcastApplePosition();
    } else {
      snakeObj.snake.pop();
    }
    
  }
}

function createNewSnake(head, id) {
  return {
    id: id,
    snake: [{
      x: head.x,
      y: head.y,
      direction: head.direction
    }]
  };
}

function broadcastSnakePositions() {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ 
        type: 'snake', 
        data: snakes 
      }));
    }
  });
}

function broadcastApplePosition() {
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({ 
        type: 'apple', 
        data: apple 
      }));
    }
  });
}

setInterval(() => {
  moveSnakes();
  broadcastSnakePositions();
}, gameClock);

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
