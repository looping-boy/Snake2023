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
const commands = new Set();

function getRandomCoordinate(min, max, boxSize) {
  return Math.floor(Math.random() * ((max - boxSize) - min + 1) / boxSize) * boxSize;
}

let apple = createNewApple();

wss.on('connection', (ws) => {
  // ADD CLIENT 
  clients.add(ws);

  // Generate a unique ID for the connected client
  const id = generateUniqueId();

  // Initialize the snake for the connected client
  //TODO:WHERE THERE'S NOBODY
  snakes.push({
    id: id,
    newDirection: "",
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
      handleUserAction(id, data.keyCode);
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

function handleKeyDown() {
  for (const snakeObj of snakes) {
    
      let directionChoose = snakeObj.newDirection;

      let headDirection = snakeObj.snake[0].direction;
      switch (directionChoose) {
        case 'left':
          if (headDirection == 'right') { snakeObj.snake = reverseAndDealWithDirection(snakeObj.snake, directionChoose) }
          else { snakeObj.snake[0].direction = directionChoose; }
          break;
        case 'down':
          if (headDirection == 'up') { snakeObj.snake = reverseAndDealWithDirection(snakeObj.snake, directionChoose) }
          else { snakeObj.snake[0].direction = directionChoose; }
          break;
        case 'right':
          if (headDirection == 'left') { snakeObj.snake = reverseAndDealWithDirection(snakeObj.snake, directionChoose) }
          else { snakeObj.snake[0].direction = directionChoose; }
          break;
        case 'up': 
          if (headDirection == 'down') { snakeObj.snake = reverseAndDealWithDirection(snakeObj.snake, directionChoose) }
          else { snakeObj.snake[0].direction = directionChoose; }
          break;
      }
      snakeObj.newDirection = "";
    
  }
}

function handleUserAction(clientId, keyCode) {
    switch (keyCode) {
      case 37:
        updateNewDirection(clientId, 'left')
        break;
      case 38:
        updateNewDirection(clientId, 'down')
        break;
      case 39:
        updateNewDirection(clientId, 'right')
        break;
      case 40:
        updateNewDirection(clientId, 'up')
        break;
    }
}

function updateNewDirection(clientId, newDirection) {
  for (const snakeObj of snakes) {
    if (snakeObj.id === clientId) {
      snakeObj.newDirection = newDirection;
      return;
    }
  }
}

function reverseAndDealWithDirection(snake, directionChoose) {
  snake.reverse(); 
  snake[0].direction = dealWithDirection(snake, directionChoose) ;
  return snake;
}

function dealWithDirection(snake, directionChoose) {
  const length = snake.length;
  if (length >= 2) {
    
    const [head, neck] = [snake[0], snake[1]];
    if (head.x === neck.x) {
      // If snake is going from one side of other of the wall:
      if (Math.abs(head.y - neck.y) > boxSize) {
        return head.y > neck.y ? 'down' : 'up';
      }
      return head.y > neck.y ? 'up' : 'down';
    } else if (head.y === neck.y) {
      // If snake is going from one side of other of the wall:
      if (Math.abs(head.x - neck.x) > boxSize) {
        return head.x > neck.x ? 'left' : 'right';
      }
      return head.x > neck.x ? 'right' : 'left';
    } 
  } else {
    return directionChoose;
  }
}

function moveSnakes() {
  
  for (const snakeObj of snakes) {

    const head = Object.assign({}, snakeObj.snake[0]);

    // EATING YOURSELF:
    const snakeBodyWithoutHead = snakeObj.snake.slice(1);
    const snakeBodyId = snakeObj.id
    for (const bodyPosition of snakeBodyWithoutHead) {
      if (head.x === bodyPosition.x && head.y === bodyPosition.y) {
        // Replace with a new snake
        snakes.splice(snakes.indexOf(snakeObj), 1, createNewSnake(head, snakeBodyId)); 
      }
    }

    // MOVING/REAPEARING:
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
    newDirection: "",
    snake: [{
      x: head.x,
      y: head.y,
      direction: head.direction
    }]
  };
}

function createNewApple() {
  const apple_x = getRandomCoordinate(xMin, xMax, boxSize);
  const apple_y = getRandomCoordinate(yMin, yMax, boxSize);
  return { x: apple_x, y: apple_y };
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

function checkSnakeCollisions() {
  for (let i = 0; i < snakes.length; i++) {
    const snakeObj = snakes[i];
    const head = Object.assign({}, snakeObj.snake[0]);
    const snakeBodyId = snakeObj.id
    for (let j = 0; j < snakes.length; j++) {
      if (i === j) { continue; }
      const snakeEnemy = snakes[j];
      if (areSnakesColliding(snakeObj.snake, snakeEnemy.snake)) {
        // Handle collision (e.g., end the game, remove colliding snakes, etc.)
        //console.log(`Collision between ${snakeObj.id} and ${snakeEnemy.id}`);
        snakes.splice(snakes.indexOf(snakeObj), 1, createNewSnake(head, snakeBodyId)); 
      }
    }
  }
}

function areSnakesColliding(snake, snakeEnemy) {
  // Check if any segment of snakeA collides with snakeB
  
    for (const segmentB of snakeEnemy) {
      if (snake[0].x === segmentB.x && snake[0].y === segmentB.y) {
        return true;
      }
    }
  
  return false;
}

setInterval(() => {
  handleKeyDown();
  moveSnakes();
  broadcastSnakePositions();
  checkSnakeCollisions();
}, gameClock);

server.listen(port, () => {
  console.log(`Server is running on ${port}`);
});
