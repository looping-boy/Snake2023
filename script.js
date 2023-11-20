document.addEventListener("DOMContentLoaded", function () {
    
    const canvas = document.getElementById("snakeCanvas");
    const ctx = canvas.getContext("2d");

    const boxSize = 10;

    const socket = new WebSocket('ws://52.47.142.196:3000');
    // const socket = new WebSocket('ws://localhost:3000');
    socket.onmessage = function(e){ };
    socket.onopen = () => conn.send('hello');

    socket.addEventListener('open', (event) => {
        console.log('WebSocket connection opened');
    });

    socket.addEventListener('error', (error) => {
        console.error('WebSocket connection error:', error);
    });

    socket.addEventListener('message', (event) => {
        const { type, data } = JSON.parse(event.data);
        //console.log("message", event.data[0])
        //console.log(JSON.stringify(event.data.lp7eu63))
        if (type === 'snake') {
            // Iterate over the keys of the data object
            

            drawSnake(data);
        }
    });

    document.addEventListener("keydown", function (event) {
        const keyCode = event.keyCode;

        // Send the key code to the server
        socket.send(JSON.stringify({ type: 'keydown', data: { keyCode } }));
    });

    function drawSnake(data) {
        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        for (const clientId in data) {
            //console.log(clientId)
            if (data.hasOwnProperty(clientId)) {
                // Get the x and y values for each clientId
                const xValue = data[clientId][0].x;
                const yValue = data[clientId][0].y;

                // Log or use the x and y values
                console.log(`ClientId: ${clientId}, X: ${xValue}, Y: ${yValue}`);
                // Draw the snake
                for (let i = 0; i < data[clientId].length; i++) {
                    ctx.fillStyle = i === 0 ? "#4CAF50" : "#45a049";
                    ctx.fillRect(data[clientId][i].x, data[clientId][i].y, boxSize, boxSize);
                    ctx.strokeStyle = "#fff";
                    ctx.strokeRect(data[clientId][i].x, data[clientId][i].y, boxSize, boxSize);
                }
                //drawSnake(data[clientId]);
            }
        }

        
    }
});