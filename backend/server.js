const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors()); // Allows your mobile/web app to connect
app.use(express.json()); // Allows the server to read JSON data

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allows any frontend to connect for now
        methods: ["GET", "POST"]
    }
});

// Store the latest data for all jeeps in memory
let jeepDatabase = {};

// 1. COMMUTER CONNECTION
io.on('connection', (socket) => {
    console.log('A commuter connected: ' + socket.id);

    // Immediately send the new commuter the current location of all jeeps
    socket.emit('initialData', jeepDatabase);

    socket.on('disconnect', () => {
        console.log('Commuter disconnected');
    });
});

// 2. E-JEEP DATA RECEIVER (The endpoint for drivers)
// This is where the e-jeep sends its Lat, Lon, and Density
app.post('/update-jeep', (req, res) => {
    const { id, lat, lon, density } = req.body;

    if (!id || !lat || !lon) {
        return res.status(400).send("Missing data");
    }

    // Save to our "database"
    jeepDatabase[id] = { lat, lon, density, lastUpdate: new Date() };

    // BROADCAST: Send this update to ALL connected commuters instantly
    io.emit('jeepUpdate', { id, lat, lon, density });

    console.log(`Update from ${id}: ${lat}, ${lon} (${density})`);
    res.status(200).send("Position received by Radio Tower");
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});