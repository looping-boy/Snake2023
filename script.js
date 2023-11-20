document.addEventListener("DOMContentLoaded", function () {
    
    const canvas = document.getElementById("snakeCanvas");
    const ctx = canvas.getContext("2d");

    const boxSize = 10;

    // const socket = new WebSocket('ws://52.47.142.196:3000');
    const socket = new WebSocket('ws://localhost:3000');
    //socket.onmessage = function(e){ console.log(e.data); };
    //socket.onopen = () => conn.send('hello');

    socket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
    });

    socket.addEventListener('message', (event) => {
        const { type, data } = JSON.parse(event.data);
        console.log("message", event.data)
        //console.log(JSON.stringify(event.data.lp7eu63))
        if (type === 'snake') {
            drawSnake(data);
        }
    });

    document.addEventListener("keydown", function (event) {
        const keyCode = event.keyCode;

        // Send the key code to the server
        socket.send(JSON.stringify({ type: 'keydown', data: { keyCode } }));
    });

    function drawSnake(snake) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw the snake
        for (let i = 0; i < snake.length; i++) {
            ctx.fillStyle = i === 0 ? "#4CAF50" : "#45a049";
            ctx.fillRect(snake[i].x, snake[i].y, boxSize, boxSize);
            ctx.strokeStyle = "#fff";
            ctx.strokeRect(snake[i].x, snake[i].y, boxSize, boxSize);
        }
    }
});