import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json()); // Add middleware to parse JSON bodies

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const activeRequests = new Map();

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.on('new_service_request', (request) => {
    activeRequests.set(request.id, {
      ...request,
      status: 'submitted',
      progress: 0,
      submittedAt: new Date()
    });
    io.emit('service_request_update', Array.from(activeRequests.values()));
  });

  socket.on('accept_request', (requestId) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.status = 'accepted';
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('update_progress', ({ requestId, progress }) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.progress = progress;
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('submit_price', ({ requestId, price }) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.proposedPrice = price;
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});