// RoomPage.jsx
import React, { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { io } from "socket.io-client";
import { CodeMirror } from "@uiw/react-codemirror";
import { basicSetup } from "@codemirror/basic-setup";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { cpp } from "@codemirror/lang-cpp";

export default function RoomPage() {
  const { roomId } = useParams();
  const [code, setCode] = useState("// Start coding here!");
  const [language, setLanguage] = useState("javascript");
  const [users, setUsers] = useState([]);
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");

  const socketRef = useRef(null);

  const getLanguageExtension = (lang) => {
    switch (lang) {
      case "javascript":
        return javascript();
      case "python":
        return python();
      case "cpp":
        return cpp();
      default:
        return javascript();
    }
  };

  // Connect to socket.io backend
  useEffect(() => {
    const socket = io(import.meta.env.VITE_BACKEND_URL, {
      query: { username: localStorage.getItem("username") || "Guest" },
    });
    socketRef.current = socket;

    // Join room
    socket.emit("join-room", { roomId });

    // Active users
    socket.on("active-users", (userList) => {
      setUsers(userList);
    });

    // Receive messages
    socket.on("receive-message", (msg) => {
      setChatMessages((prev) => [...prev, msg]);
    });

    // Receive code updates
    socket.on("yjs-sync", (initialCode) => {
      // initialCode comes as Uint8Array from backend Yjs doc
      setCode(new TextDecoder().decode(initialCode));
    });

    socket.on("yjs-update", (update) => {
      // Apply updates (if you want to implement full Yjs sync)
      // For simplicity, ignoring binary updates here
    });

    // Receive language updates
    socket.on("room-language", (lang) => {
      setLanguage(lang);
    });

    return () => {
      socket.emit("leave-room", { roomId });
      socket.disconnect();
    };
  }, [roomId]);

  const handleSendMessage = () => {
    if (chatInput.trim() === "") return;
    const msg = {
      roomId,
      username: localStorage.getItem("username") || "Guest",
      message: chatInput,
    };
    socketRef.current.emit("send-message", msg);
    setChatInput("");
  };

  const handleLanguageChange = (e) => {
    const newLang = e.target.value;
    setLanguage(newLang);
    socketRef.current.emit("set-language", { roomId, language: newLang });
  };

  const handleCodeChange = (value) => {
    setCode(value);
    // Emit code updates to server (backend Yjs will persist & broadcast)
    // Here we convert string to Uint8Array for simplicity
    const update = new TextEncoder().encode(value);
    socketRef.current.emit("yjs-update", { roomId, update });
  };

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      {/* Editor */}
      <div style={{ flex: 3, padding: "10px" }}>
        <div style={{ marginBottom: "10px" }}>
          <select value={language} onChange={handleLanguageChange}>
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="cpp">C++</option>
          </select>
        </div>
        <CodeMirror
          value={code}
          height="80vh"
          extensions={[basicSetup, getLanguageExtension(language)]}
          onChange={handleCodeChange}
        />
      </div>

      {/* Sidebar */}
      <div style={{ flex: 1, borderLeft: "1px solid #444", padding: "10px" }}>
        <h3>Active Users</h3>
        <ul>
          {users.map((username, idx) => (
            <li key={idx}>{username}</li>
          ))}
        </ul>

        <h3>Chat</h3>
        <div
          style={{
            height: "50vh",
            overflowY: "auto",
            border: "1px solid #333",
            marginBottom: "10px",
            padding: "5px",
          }}
        >
          {chatMessages.map((msg, idx) => (
            <div key={idx}>
              <b>{msg.username}: </b>
              <span>{msg.message}</span>
            </div>
          ))}
        </div>

        <input
          type="text"
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
          placeholder="Type a message..."
          style={{ width: "80%" }}
        />
        <button onClick={handleSendMessage} style={{ width: "18%" }}>
          Send
        </button>
      </div>
    </div>
  );
}
