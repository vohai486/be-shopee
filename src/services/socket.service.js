const {
  updateLastViewOfConversation,
} = require("../models/repositories/conversation.repo");

class SocketService {
  static connection = (io) => {
    io.on("connection", (socket) => {
      socket.on("disconnect", () => {
        //   io.emit("getOnline", { onlineAdmins, onlineUsers });
      });
      socket.on("join", (userId) => {
        socket.join(userId);
      });
      socket.on("join-group", (roomName) => {
        socket.join(roomName);
      });
      socket.on("leave-room", (roomName) => {
        socket.leave(roomName);
      });
      socket.on("join-conversations", (conversationIds) => {
        conversationIds.map((id) => {
          socket.join(id);
        });
      });
      socket.on("typing", (roomName) => {
        socket.broadcast.to(roomName).emit("typing", roomName);
      });
      socket.on(
        "conversation-last-view",
        async ({ conversationId, userId }) => {
          try {
            await updateLastViewOfConversation({ conversationId, userId });
            _io
              .to(conversationId + "")
              .emit("conversation-last-view", conversationId);
          } catch (error) {
            console.log(error);
          }
        }
      );
    });
  };
}

module.exports = SocketService;
