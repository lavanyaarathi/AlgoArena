import React from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";

const HelloPage = () => {
  const navigate = useNavigate();

  return (
    <div className="hello-container">
      <h1 className="hello-heading">Welcome to Algo Arena</h1>
      <div className="hello-button-container">
        <button className="hello-button" onClick={() => navigate("/login")}>
          Login
        </button>
        <button className="hello-button" onClick={() => navigate("/signup")}>
          Signup
        </button>
      </div>
    </div>
  );
};

export default HelloPage;
