// backend/socket.js

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`🔌 New client connected: ${socket.id}`);

    // Example: Candidate joins interview room
    socket.on('joinInterview', (roomId) => {
      socket.join(roomId);
      console.log(`📹 Socket ${socket.id} joined interview room ${roomId}`);
    });

    // Example: Detection event (unauthorized device, distraction, etc.)
    socket.on('detectionEvent', (data) => {
      console.log("⚠️ Detection Event:", data);
      io.to(data.roomId).emit('detectionAlert', data);
    });

    // Example: Send chat message
    socket.on('sendMessage', (data) => {
      io.to(data.roomId).emit('newMessage', data);
    });

    socket.on('disconnect', () => {
      console.log(`❌ Client disconnected: ${socket.id}`);
    });
  });
};
