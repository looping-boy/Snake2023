document.addEventListener("DOMContentLoaded", function () {
    
    let apple = null;

    let myId = null;

    const canvas = document.getElementById("snakeCanvas");
    const ctx = canvas.getContext("2d");

    const boxSize = 10;

    //const socket = new WebSocket('ws://13.38.251.95:3000');
    const socket = new WebSocket('ws://localhost:3000');
    socket.onmessage = function(e){ };
    //socket.onopen = () => socket.send({});

    socket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
    });

    socket.addEventListener('message', (event) => {
        const { type, data } = JSON.parse(event.data);
        if (type === 'apple') {
            apple = data;
        }
        if (type === 'snake') {
            drawSnake(data, apple);
        }
        if (type === 'id') {
            console.log(data);
            myId = data;
        }
        if (type === 'deathSound') {
            console.log("HURT");
            var audio = new Audio("./assets/sounds/aouch.mp3");
            audio.play();
        }
        if (type === 'appleSound') {
            console.log("Apple");
            var audio = new Audio("./assets/sounds/crunch.mp3");
            audio.play();
        }
    });

    document.addEventListener("keydown", function (event) {
        const keyCode = event.keyCode;

        // Send the key code to the server
        socket.send(JSON.stringify({ type: 'keydown', data: { keyCode } }));
    });

    function drawSnake(data, apple) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        data.forEach((snakeObj, player) => {
             // Get the x and y values for each clientId
             //const xValue = snakeObj.snake[0].x;
             //const yValue = snakeObj.snake[0].y;

             // Log or use the x and y values
             //console.log(`iD: ${clientId}, X: ${xValue}, Y: ${yValue}`);
             // Draw the snake
             for (let i = 0; i < snakeObj.snake.length; i++) {
                 ctx.fillStyle = player === 0 ? "#00FF00" : "#0000FF";
                 ctx.fillRect(snakeObj.snake[i].x, snakeObj.snake[i].y, boxSize, boxSize);
                 ctx.strokeStyle = "#fff";
                 ctx.strokeRect(snakeObj.snake[i].x, snakeObj.snake[i].y, boxSize, boxSize);
             }
        });
        if (apple != null) {
            drawApple(apple);
        }
    }

    function drawApple(apple) {
        ctx.fillStyle = "#FF0000";
        ctx.fillRect(apple.x, apple.y, boxSize, boxSize);
        ctx.strokeStyle = "#fff";
        ctx.strokeRect(apple.x, apple.y, boxSize, boxSize);
    }
});