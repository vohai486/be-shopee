const {
  updateLastViewOfConversation,
} = require("../models/repositories/conversation.repo");

let listRooms = [];
class SocketService {
  static addRoom = (room) => [...new Set([...listRooms, room])];
  static checkRoom = (room) => listRooms.includes(room);
  static connection(socket) {
    socket.on("disconnect", () => {
      //   io.emit("getOnline", { onlineAdmins, onlineUsers });
    });
    socket.on("join", (userId) => {
      SocketService.addRoom(userId);
      socket.join(userId);
    });
    socket.on("join-group", (roomName) => {
      SocketService.addRoom(roomName);
      socket.join(roomName);
    });
    socket.on("leave-room", (roomName) => {
      socket.leave(roomName);
    });
    socket.on("join-conversations", (conversationIds) => {
      conversationIds.map((id) => {
        socket.join(id);
        SocketService.addRoom(id);
      });
    });
    socket.on("typing", (roomName) => {
      socket.broadcast.to(roomName).emit("typing", roomName);
    });
    socket.on("conversation-last-view", async ({ conversationId, userId }) => {
      try {
        await updateLastViewOfConversation({ conversationId, userId });
        console.log(conversationId);
        _io
          .to(conversationId + "")
          .emit("conversation-last-view", conversationId);
      } catch (error) {
        console.log(error);
      }
    });
  }
}

module.exports = SocketService;
