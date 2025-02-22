import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Connect to backend

const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");
const colorPicker = document.getElementById("colorPicker");
const brushSize = document.getElementById("brushSize");
const clearBtn = document.getElementById("clearBtn");

// Set canvas size
canvas.width = window.innerWidth * 0.8;
canvas.height = window.innerHeight * 0.8;

// Track drawing state
let drawing = false;
let color = colorPicker.value;
let size = brushSize.value;
let prevX = null;
let prevY = null;

colorPicker.addEventListener("change", (e) => color = e.target.value);
brushSize.addEventListener("input", (e) => size = e.target.value);

// Capture drawing actions
canvas.addEventListener("mousedown", (e) => {
    drawing = true;
    const { x, y } = getMousePos(e);
    prevX = x;
    prevY = y;
});

canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const { x, y } = getMousePos(e);

    // Emit the full stroke data with previous coordinates
    socket.emit("draw", { prevX, prevY, x, y, color, size });

    prevX = x;
    prevY = y;
});

canvas.addEventListener("mouseup", () => {
    drawing = false;
    prevX = null;
    prevY = null;
});

// Function to get mouse position relative to canvas
function getMousePos(e) {
    return { x: e.clientX - canvas.offsetLeft, y: e.clientY - canvas.offsetTop };
}

// Listen for full board state on connection
socket.on("initBoard", (strokes) => {
    strokes.forEach(({ prevX, prevY, x, y, color, size }) => drawStroke(prevX, prevY, x, y, color, size));
});

// Draw strokes only when received from server
socket.on("draw", ({ prevX, prevY, x, y, color, size }) => {
    drawStroke(prevX, prevY, x, y, color, size);
});

// Function to draw strokes
function drawStroke(prevX, prevY, x, y, color, size) {
    if (prevX === null || prevY === null) return; // Ignore first point

    ctx.lineWidth = size;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(prevX, prevY);
    ctx.lineTo(x, y);
    ctx.stroke();
}

// Clear board event
clearBtn.addEventListener("click", () => {
    socket.emit("clear");
});

// Listen for board clear event
socket.on("clear", () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
});
