import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
app.use(cors()); // ✅ Enable CORS for Express routes

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] } // ✅ Needed for Socket.IO
});

const boardState = []; // Stores all drawn strokes

// Handle new client connections
io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Send existing board state to new user
    socket.emit("initBoard", boardState);

    // Listen for drawing actions (store and broadcast full strokes)
    socket.on("draw", (data) => {
        if (data.prevX === null || data.prevY === null) return; // Ignore invalid data
        
        boardState.push(data); // Store the full stroke
        io.emit("draw", data); // ✅ Broadcast full stroke to all clients
    });

    // Handle board clearing
    socket.on("clear", () => {
        boardState.length = 0; // Clear stored board state
        io.emit("clear"); // Inform all clients to clear their boards
    });

    // Handle disconnects
    socket.on("disconnect", () => {
        console.log(`User disconnected: ${socket.id}`);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
