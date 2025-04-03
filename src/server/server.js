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
    origin: "http://localhost:8080",
    methods: ["GET", "POST"]
  }
});

// Store active requests, contractor data, and wallet balances
const activeRequests = new Map();
const contractorWallets = new Map();
const contractorReviews = new Map();

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

  socket.on('accept_request', ({ requestId, contractorId }) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.status = 'accepted';
      request.contractorId = contractorId;
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('update_progress', ({ requestId, progress, contractorId, stage }) => {
    const request = activeRequests.get(requestId);
    if (request && request.contractorId === contractorId) {
      request.progress = progress;
      request.lastStageCompleted = stage;
      request.lastUpdated = new Date();
      io.emit('service_request_update', Array.from(activeRequests.values()));
      
      // Simulate customer verification after 5 seconds
      if (progress < 100) {
        setTimeout(() => {
          request.verificationStatus = 'verified';
          io.emit('service_request_update', Array.from(activeRequests.values()));
        }, 5000);
      }
    }
  });

  socket.on('complete_request', ({ requestId, contractorId }) => {
    const request = activeRequests.get(requestId);
    if (request && request.contractorId === contractorId) {
      request.status = 'completed';
      request.completedAt = new Date();
      
      // Update contractor wallet with payment
      let walletBalance = contractorWallets.get(contractorId) || 0;
      walletBalance += Number(request.proposedPrice || 0);
      contractorWallets.set(contractorId, walletBalance);
      
      // Add a random review
      const reviews = contractorReviews.get(contractorId) || [];
      reviews.unshift({
        id: Math.random().toString(36).substr(2, 9),
        customerId: `customer-${Math.floor(Math.random() * 1000)}`,
        customerName: ['Alice', 'Bob', 'Charlie', 'David', 'Emma'][Math.floor(Math.random() * 5)],
        rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
        comment: ['Great service!', 'Excellent work!', 'Would recommend!', 'Very professional!', 'Fast and efficient!'][Math.floor(Math.random() * 5)],
        date: new Date()
      });
      contractorReviews.set(contractorId, reviews);
      
      io.emit('service_request_update', Array.from(activeRequests.values()));
      io.emit('wallet_update', { contractorId, balance: walletBalance });
      io.emit('reviews_update', { contractorId, reviews });
      
      // Keep completed jobs in a history but remove them from active
      setTimeout(() => activeRequests.delete(requestId), 1000);
    }
  });

  socket.on('submit_price', ({ requestId, price }) => {
    const request = activeRequests.get(requestId);
    if (request) {
      request.proposedPrice = price;
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('upload_proof', ({ requestId, contractorId, stage, imageUrl }) => {
    const request = activeRequests.get(requestId);
    if (request && request.contractorId === contractorId) {
      request.proofImages = request.proofImages || {};
      request.proofImages[stage] = imageUrl;
      io.emit('service_request_update', Array.from(activeRequests.values()));
    }
  });

  socket.on('get_wallet_balance', ({ contractorId }) => {
    const balance = contractorWallets.get(contractorId) || 0;
    socket.emit('wallet_balance', { contractorId, balance });
  });

  socket.on('get_reviews', ({ contractorId }) => {
    const reviews = contractorReviews.get(contractorId) || [];
    socket.emit('reviews_data', { contractorId, reviews });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
