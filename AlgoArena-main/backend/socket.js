// socket.js
const { Server: SocketIOServer } = require("socket.io");
const Y = require("yjs");
const { Room } = require("./db"); // adjust path if necessary

const setupSocket = (server) => {
  const io = new SocketIOServer(server, {
    cors: {
      origin: ["http://localhost:5173", "https://algoarena-frotend.onrender.com"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  // In-memory maps: roomId -> Y.Doc, and debounced save timers
  const docs = {};
  const saveTimers = {};

  // Persist doc content to Mongo (debounced)
  const schedulePersist = (roomId) => {
    if (saveTimers[roomId]) clearTimeout(saveTimers[roomId]);
    saveTimers[roomId] = setTimeout(async () => {
      try {
        const doc = docs[roomId];
        if (!doc) return;
        const ytext = doc.getText("codetext");
        const code = ytext.toString();
        await Room.findOneAndUpdate(
          { roomId },
          { code, "metadata.lastModified": Date.now() },
          { new: true }
        );
        // console.log(`Persisted room ${roomId} to DB`);
      } catch (e) {
        console.error("Error persisting room:", e);
      }
    }, 1000); // persist 1s after last update
  };

  // Keep basic presence + language map similar to original
  if (!global.__SERVER_ROOMS) global.__SERVER_ROOMS = {};
  const rooms = global.__SERVER_ROOMS;

  io.on("connection", (socket) => {
    // Allow passing username in handshake query (client side should set this)
    const username = socket.handshake.query.username || null;
    const clientId = socket.id;

    // Join room handler
    socket.on("join-room", async ({ roomId }) => {
      try {
        socket.join(roomId);
        // initialize presence structure
        if (!rooms[roomId]) {
          rooms[roomId] = { users: new Set(), language: "javascript" };
        }
        if (username) rooms[roomId].users.add(username);

        // Initialize or rehydrate Y.Doc for room
        if (!docs[roomId]) {
          const doc = new Y.Doc();
          docs[roomId] = doc;

          // rehydrate from DB snapshot if available
          try {
            const roomDoc = await Room.findOne({ roomId });
            if (roomDoc && typeof roomDoc.code === "string") {
              const ytext = doc.getText("codetext");
              if (ytext.length === 0) {
                ytext.insert(0, roomDoc.code);
              }
              if (roomDoc.language) rooms[roomId].language = roomDoc.language;
            }
          } catch (e) {
            console.error("Error loading room from DB:", e);
          }

          // When the server-side Y.Doc updates, broadcast the update to clients
          doc.on("update", (update, origin) => {
            // broadcast binary update to all sockets in this room
            // (we broadcast from server, clients should ignore updates they originated)
            io.to(roomId).emit("yjs-update", update);
            // schedule persist
            schedulePersist(roomId);
          });
        }

        // Send the current language and active-users
        socket.emit("room-language", rooms[roomId].language);
        io.to(roomId).emit("active-users", Array.from(rooms[roomId].users));

        // Send full initial document state to the newly joined socket
        const initialState = Y.encodeStateAsUpdate(docs[roomId]);
        socket.emit("yjs-sync", initialState);
      } catch (err) {
        console.error("join-room error:", err);
      }
    });

    // Client sends Yjs updates (binary Uint8Array) to apply to server doc
    socket.on("yjs-update", ({ roomId, update }) => {
      try {
        if (!docs[roomId]) {
          // This shouldn't happen because we create doc on join, but guard anyway
          docs[roomId] = new Y.Doc();
        }
        // update may come either as Buffer or ArrayBuffer depending on client
        // ensure it's Uint8Array
        let updateUint8;
        if (update instanceof Uint8Array) updateUint8 = update;
        else if (update.buffer instanceof ArrayBuffer) updateUint8 = new Uint8Array(update.buffer);
        else updateUint8 = Uint8Array.from(update);

        // Apply update to server doc (this triggers doc.on('update') which broadcasts)
        Y.applyUpdate(docs[roomId], updateUint8);
        // schedule persist (redundant since update handler schedules, but keep safe)
        schedulePersist(roomId);
      } catch (e) {
        console.error("Error applying yjs update:", e);
      }
    });

    // Language change handler (keeps original behavior)
    socket.on("set-language", ({ roomId, language }) => {
      if (rooms[roomId]) {
        rooms[roomId].language = language;
        io.to(roomId).emit("room-language", language);
        // also persist language to DB asynchronously
        Room.findOneAndUpdate({ roomId }, { language }, { new: true }).catch((e) =>
          console.error("Error persisting language:", e)
        );
      }
    });

    // Chat handling (preserve previous behavior but broadcast to room only)
    socket.on("send-message", ({ roomId, username: fromUser, message }) => {
      if (roomId) {
        // Broadcast to everyone in room including sender (or choose socket.broadcast.to to exclude sender)
        io.to(roomId).emit("receive-message", { username: fromUser, message, roomId });
      } else {
        console.log(`⚠️ send-message event missing roomId from ${fromUser}`);
      }
    });

    // Leave room
    socket.on("leave-room", ({ roomId }) => {
      socket.leave(roomId);
      if (rooms[roomId] && username) {
        rooms[roomId].users.delete(username);
        if (rooms[roomId].users.size === 0) {
          delete rooms[roomId];
          // optionally cleanup docs & persist final snapshot
          if (docs[roomId]) {
            // persist immediately
            const ytext = docs[roomId].getText("codetext");
            const code = ytext.toString();
            Room.findOneAndUpdate({ roomId }, { code, "metadata.lastModified": Date.now() }).catch((e) =>
              console.error("Error persisting on cleanup:", e)
            );
            delete docs[roomId];
          }
        } else {
          io.to(roomId).emit("active-users", Array.from(rooms[roomId].users));
        }
      }
    });

    // Disconnect handling
    socket.on("disconnect", () => {
      // remove user from any rooms
      if (username) {
        for (const roomId of Object.keys(rooms)) {
          if (rooms[roomId].users.has(username)) {
            rooms[roomId].users.delete(username);
            if (rooms[roomId].users.size === 0) {
              delete rooms[roomId];
              if (docs[roomId]) {
                const ytext = docs[roomId].getText("codetext");
                const code = ytext.toString();
                Room.findOneAndUpdate({ roomId }, { code, "metadata.lastModified": Date.now() }).catch((e) =>
                  console.error("Error persisting on cleanup:", e)
                );
                delete docs[roomId];
              }
            } else {
              io.to(roomId).emit("active-users", Array.from(rooms[roomId].users));
            }
          }
        }
      }
    });
  });
};

module.exports = setupSocket;
