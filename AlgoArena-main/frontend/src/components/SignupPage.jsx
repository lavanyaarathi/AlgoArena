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
      toast.error("Please fill all fields", { autoClose: 3000 });
      return;
    }

    try {
      const response = await axios.post("/api/auth/signup", {
        username,
        email,
        password,
      });

      // Store username and token in localStorage
      if (response.data.username && response.data.token) {
        localStorage.setItem("username", response.data.username);
        localStorage.setItem("token", response.data.token);
      }

      toast.success(response.data.message || "Signup successful!", {
        autoClose: 3000,
      });

      navigate("/create-join"); // redirect to main page
    } catch (error) {
      console.error("Signup error:", error);

      let errorMessage = "Signup failed. Please try again.";
      if (error.response && error.response.data) {
        errorMessage =
          error.response.data.message || JSON.stringify(error.response.data);
      }

      toast.error(errorMessage, { autoClose: 3000 });
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
          className="signup-input"
        />

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="signup-input"
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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
