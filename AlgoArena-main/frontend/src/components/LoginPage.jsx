import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post("/api/auth/signin", { email, password });
      console.log("Login response:", response);
      
      if (response.data) {
        try {
          if (response.data.token) {
            localStorage.setItem("token", response.data.token);
          }
          
          if (response.data.username) {
            localStorage.setItem("username", response.data.username);
            console.log("Token:", response.data.token);
            navigate("/create-join");
          } else {
            console.warn("Username not found in API response");
            toast.warning("Login successful, but username is missing.");
            navigate("/create-join");
          }
        } catch (storageError) {
          console.error("Storage error:", storageError);
          toast.warning("Login successful but couldn't save session");
          navigate("/create-join");
        }
      }
    } catch (error) {
      console.error("Login error:", error);
      
      if (error.response) {
        console.log("Error response data:", error.response.data);
        console.log("Error response status:", error.response.status);
        
        let errorMessage = "Login failed. Please check your credentials.";
        
        if (typeof error.response.data === "string") {
          errorMessage = error.response.data;
        } else if (typeof error.response.data === "object") {
          errorMessage = error.response.data.message || errorMessage;
        }
        
        if (errorMessage.toLowerCase().includes("user not found")) {
          toast.error("New user? Sign up first!", {
            position: "top-right",
            autoClose: 3000,
          });
        } else {
          toast.error(errorMessage, {
            position: "top-right",
            autoClose: 3000,
          });
        }
      } else if (error.request) {
        toast.error("Network error. Please check your connection.", {
          position: "top-right",
          autoClose: 3000,
        });
      } else {
        toast.error("An unexpected error occurred.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleLogin} className="login-form">
        <h1 className="login-heading">Login</h1>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="login-input"
          disabled={isLoading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="login-input"
          disabled={isLoading}
        />
        <button type="submit" className="login-button" disabled={isLoading}>
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>
      <div className="signup-button-container">
        <button className="signup-button" onClick={() => navigate("/signup")}>
          SignUp
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default LoginPage;