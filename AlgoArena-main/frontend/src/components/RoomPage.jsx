import React, { useEffect, useState, useRef, Suspense } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";

import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { yCollab } from "y-codemirror.next";

// Lazy load CodeMirror
const CodeMirror = React.lazy(() => import("@uiw/react-codemirror"));

const RoomPage = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [username, setUsername] = useState("Guest");
  const [language, setLanguage] = useState("javascript");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [activeUsers, setActiveUsers] = useState([]);
  const [languagesLoaded, setLanguagesLoaded] = useState(false);
  const [runResult, setRunResult] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [activeUsersHover, setActiveUsersHover] = useState(false);

  const [jsExt, setJsExt] = useState(null);
  const [pyExt, setPyExt] = useState(null);
  const [cppExt, setCppExt] = useState(null);
  const [javaExt, setJavaExt] = useState(null);

  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const socketRef = useRef(null);
  const chatMessagesRef = useRef(null);

  const [editorValue, setEditorValue] = useState("// Start coding here...");

  // Load language extensions
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        const [jsModule, pyModule, cppModule, javaModule] = await Promise.all([
          import("@codemirror/lang-javascript"),
          import("@codemirror/lang-python"),
          import("@codemirror/lang-cpp"),
          import("@codemirror/lang-java"),
        ]);
        setJsExt(() => jsModule.javascript);
        setPyExt(() => pyModule.python);
        setCppExt(() => cppModule.cpp);
        setJavaExt(() => javaModule.java);
        setLanguagesLoaded(true);
      } catch (error) {
        console.error("Error loading languages:", error);
        toast.error("Failed to load language support");
      }
    };
    loadLanguages();
  }, []);

  // Get username from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("username");
    if (stored) setUsername(stored);
  }, []);

  // Welcome toast
  useEffect(() => {
    if (roomId) {
      toast.success(`Welcome to room ${roomId}!`, { autoClose: 2000 });
    }
  }, [roomId]);

  // Initialize Yjs
  useEffect(() => {
    if (!roomId) return;
    try {
      ydocRef.current = new Y.Doc();
      const wsUrl = import.meta.env.VITE_YJS_WS_URL || "ws://localhost:1234";
      providerRef.current = new WebsocketProvider(wsUrl, roomId, ydocRef.current);
      
      providerRef.current.on('status', event => {
        if (event.status === 'connected') {
          console.log('✅ Connected to Yjs server');
        }
      });
    } catch (error) {
      console.error("Yjs connection error:", error);
      toast.error("Collaborative editing unavailable");
    }

    return () => {
      if (providerRef.current) providerRef.current.destroy();
      if (ydocRef.current) ydocRef.current.destroy();
    };
  }, [roomId]);

  // Socket.io chat
  useEffect(() => {
    if (!username || !roomId) return;
    
    const initSocket = async () => {
      try {
        const ioModule = await import("socket.io-client");
        const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
        
        socketRef.current = ioModule.io(backendUrl, { 
          query: { username },
          reconnection: true,
          reconnectionDelay: 1000,
        });

        socketRef.current.emit("join-room", { roomId, username });

        socketRef.current.on("receive-message", (data) => {
          if (data.roomId === roomId) {
            setMessages((prev) => [...prev, { username: data.username, text: data.message }]);
          }
        });

        socketRef.current.on("active-users", (users) => {
          setActiveUsers(Array.isArray(users) ? users : []);
        });

        socketRef.current.on("room-language", (data) => {
          if (data.id === roomId) {
            setLanguage(data.lang);
            toast.info(`Language changed to ${data.lang}`);
          }
        });

        socketRef.current.on("connect_error", () => {
          toast.error("Connection error. Retrying...");
        });

      } catch (error) {
        console.error("Socket connection error:", error);
        toast.error("Chat unavailable");
      }
    };

    initSocket();

    return () => {
      if (socketRef.current) {
        socketRef.current.emit("leave-room", { roomId, username });
        socketRef.current.disconnect();
      }
    };
  }, [username, roomId]);

  // Auto-scroll chat
  useEffect(() => {
    if (chatMessagesRef.current) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socketRef.current) return;
    
    socketRef.current.emit("send-message", { roomId, username, message: newMessage });
    setMessages((prev) => [...prev, { username, text: newMessage }]);
    setNewMessage("");
  };

  const getLanguageExtension = () => {
    switch (language) {
      case "python":
        return pyExt ? [pyExt()] : [];
      case "cpp":
        return cppExt ? [cppExt()] : [];
      case "java":
        return javaExt ? [javaExt()] : [];
      default:
        return jsExt ? [jsExt()] : [];
    }
  };

  const getFileExtension = () => {
    switch (language) {
      case "python": return "py";
      case "cpp": return "cpp";
      case "java": return "java";
      default: return "js";
    }
  };

  const toggleChat = () => setChatOpen((prev) => !prev);
  const toggleUserMenu = () => setUserMenuOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
    navigate("/login");
  };

  const handleProfileClick = () => navigate("/profile");
  const handleLeaveRoom = () => navigate("/create-join");

  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    if (socketRef.current) {
      socketRef.current.emit("set-language", { roomId, language: newLang });
    }
  };

  const runCode = async () => {
    if (!editorValue.trim()) {
      toast.warning("Please write some code first!");
      return;
    }

    setRunResult("Running...");
    
    try {
      const response = await fetch("https://emkc.org/api/v2/piston/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language,
          version: "*",
          files: [{ name: `file.${getFileExtension()}`, content: editorValue }],
          stdin: "",
          args: [],
          compile_timeout: 10000,
          run_timeout: 3000,
        }),
      });
      const data = await response.json();
      
      if (data.run?.stderr) {
        setRunResult(data.run.stderr);
      } else {
        setRunResult(data.run?.output || data.compile?.output || "No output");
      }
    } catch (error) {
      console.error("Code execution error:", error);
      setRunResult("Error executing code. Please try again.");
      toast.error("Failed to execute code");
    }
  };

  const clearOutput = () => setRunResult("");

  if (!languagesLoaded) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '1.2rem'
      }}>
        Loading editor...
      </div>
    );
  }

  return (
    <div className="container">
      <ToastContainer 
        position="top-center" 
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
      />

      {/* Navbar */}
      <div className="navbar">
        <div className="navLeft">
          <h1 className="title">Algo Arena</h1>
        </div>
        
        <div className="navCenter">
          <ul className="navLinks">
            <li className="navLink">Room: {roomId}</li>
            <li className="navLink">
              <div
                className="activeUsersButton"
                onMouseEnter={() => setActiveUsersHover(true)}
                onMouseLeave={() => setActiveUsersHover(false)}
                style={{ position: 'relative', cursor: 'pointer' }}
              >
                <span>👥 Active Users ({activeUsers.length})</span>
                {activeUsersHover && (
                  <div className="activeUsersDropdown">
                    <h3>Active Users in Room</h3>
                    {activeUsers.length === 0 ? (
                      <p>No other users online</p>
                    ) : (
                      <ul>
                        {activeUsers.map((user, index) => (
                          <li key={index}>
                            <span style={{ 
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: '#4ade80',
                              marginRight: '8px'
                            }}></span>
                            {user}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </li>
          </ul>
        </div>
        
        <div className="navRight">
          <button onClick={handleLeaveRoom} className="leaveButton">
            Leave Room
          </button>
          <button className="chatButton" onClick={toggleChat}>
            💬 Chat {messages.length > 0 && `(${messages.length})`}
          </button>
          <div className="userMenu">
            <div 
              className="userIcon" 
              onClick={toggleUserMenu}
              style={{ cursor: 'pointer' }}
            >
              👤 {username}
            </div>
            {userMenuOpen && (
              <div className="dropdownMenu">
                <div className="dropdownItem" onClick={handleProfileClick}>
                  Profile
                </div>
                <div className="dropdownItem" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Editor & Output side by side */}
      <div className="editorResultWrapper">
        <div className="editorContainer">
          {/* Editor Controls Bar */}
          <div className="editor-navbar">
            <span className="file-name">
              📄 main.{getFileExtension()}
            </span>
            
            <div className="language-selector">
              <label htmlFor="language-select" className="language-label">
                Language:
              </label>
              <select
                id="language-select"
                value={language}
                onChange={(e) => handleLanguageChange(e.target.value)}
                className="language-dropdown"
              >
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="cpp">C++</option>
                <option value="java">Java</option>
              </select>
            </div>
            
            <button className="runButton" onClick={runCode}>
              ▶️ Run Code
            </button>
          </div>

          {/* Code Editor */}
          <Suspense fallback={
            <div style={{ 
              padding: '20px', 
              textAlign: 'center',
              backgroundColor: '#1e1e1e',
              color: '#fff',
              height: '80vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              Loading CodeMirror...
            </div>
          }>
            {ydocRef.current && providerRef.current ? (
              <CodeMirror
                value={editorValue}
                height="80vh"
                onChange={setEditorValue}
                extensions={[
                  yCollab(
                    ydocRef.current.getText("codemirror"), 
                    providerRef.current.awareness
                  ),
                  ...getLanguageExtension()
                ]}
                theme="dark"
                basicSetup={{
                  lineNumbers: true,
                  highlightActiveLineGutter: true,
                  highlightSpecialChars: true,
                  foldGutter: true,
                  drawSelection: true,
                  dropCursor: true,
                  allowMultipleSelections: true,
                  indentOnInput: true,
                  bracketMatching: true,
                  closeBrackets: true,
                  autocompletion: true,
                  rectangularSelection: true,
                  highlightActiveLine: true,
                  highlightSelectionMatches: true,
                }}
              />
            ) : (
              <div style={{ padding: '20px', color: '#fff' }}>
                Initializing collaborative editor...
              </div>
            )}
          </Suspense>
        </div>

        {/* Output Panel */}
        <div className="resultContainer">
          <div className="output-navbar">
            <span className="output-title">📊 Output</span>
            <button className="btn clear" onClick={clearOutput}>
              Clear
            </button>
          </div>
          <pre className="output">{runResult || "Click 'Run Code' to see output here..."}</pre>
        </div>
      </div>

      {/* Chat Panel */}
      {chatOpen && (
        <div className={`chatContainer ${chatOpen ? 'open' : ''}`}>
          <div className="chatHeader">
            <span>💬 Chat Room</span>
            <button onClick={toggleChat} className="closeChat">✖</button>
          </div>
          
          <div className="chatMessages" ref={chatMessagesRef}>
            {messages.length === 0 ? (
              <div style={{ 
                padding: '20px', 
                textAlign: 'center', 
                color: '#888',
                fontStyle: 'italic'
              }}>
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div 
                  key={idx} 
                  className={`chatMessage ${msg.username === username ? "self" : ""}`}
                >
                  <strong>{msg.username}:</strong> {msg.text}
                </div>
              ))
            )}
          </div>
          
          <form className="chatInput" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              autoFocus
            />
            <button type="submit" disabled={!newMessage.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

export default RoomPage;