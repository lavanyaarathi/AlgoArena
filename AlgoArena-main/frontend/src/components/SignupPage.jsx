import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../App.css";


const SignupPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    if (!username || !email || !password) {
      toast.error("Please fill all fields",{
        position:"top-right",
        autoClose:3000,
      });
      return;
    }

    try {
      const response = await axios.post("/api/auth/signup", {
        username,
        email,
        password,
      });
      alert(response.data.message);
      if (response.data.username) {
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("token",response.data.token)
      }
      navigate("/create-join"); // Redirect to login page after signup
    } catch (error) {
      console.error("Signup error:", error);
      toast.error("Signup failed. Email might already be in use.",{
        position:"top-right",
        autoClose:3000,
      });
    }
  };

  return (
    <div className="signup-container">
      <form onSubmit={handleSignup} className="signup-form">
        <h1 className="signup-heading">Signup</h1>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="signup-input"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="signup-input"
        />
        <button type="submit" className="signup-button">
          Signup
        </button>
      </form>
      <div className="login-button-container">
        <button className="login-button" onClick={() => navigate("/login")}>
          Login
        </button>
      </div>
      <ToastContainer />
    </div>
  );
};

export default SignupPage;
