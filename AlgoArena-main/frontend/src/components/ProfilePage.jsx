import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import axios from "../api/axios"
import "../App.css";


const ProfilePage = () => {
  const [user, setUser] = useState(null)
  const [isEditing, setIsEditing] = useState(false)
  const [newUsername, setNewUsername] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const navigate = useNavigate()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get("/api/auth/profile", {
          headers: { Authorization: "Bearer " + localStorage.getItem("token") },
        })
        setUser(response.data)
        setNewUsername(response.data.username)
      } catch (error) {
        console.error("Error fetching profile:", error)
        alert("Failed to fetch profile")
      }
    }
    fetchProfile()
  }, [])

  const handleEdit = () => setIsEditing(true)

  const handleSave = async () => {
    try {
      const updateData = { username: newUsername }
      if (newPassword.trim() !== "") updateData.password = newPassword

      await axios.put("/api/auth/profile", updateData, {
        headers: { Authorization: "Bearer " + localStorage.getItem("token") },
      })

      setUser((prevUser) => ({ ...prevUser, username: newUsername }))
      setIsEditing(false)
      setNewPassword("")
    } catch (error) {
      console.error("Error updating profile:", error)
      alert("Failed to update profile")
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("username")
    navigate("/login")
  }

  return (
    <div className="profile-container">
      <div className="profile-card">
        <h1 className="profile-title">Profile</h1>
        {user ? (
          <div className="profile-info-container">
            <p className="profile-info">
              <strong>Username:</strong>
              {isEditing ? (
                <input
                  type="text"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="profile-input"
                />
              ) : (
                ` ${user.username}`
              )}
            </p>

            <p className="profile-info">
              <strong>Email:</strong> {user.email}
            </p>

            {isEditing && (
              <p className="profile-info">
                <strong>New Password:</strong>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Leave blank to keep current password"
                  className="profile-input"
                />
              </p>
            )}

            {isEditing ? (
              <button onClick={handleSave} className="profile-button">Save</button>
            ) : (
              <button onClick={handleEdit} className="profile-button">Edit</button>
            )}

            <button onClick={handleLogout} className="profile-logout-button">Logout</button>
          </div>
        ) : (
          <p className="profile-loading">Loading...</p>
        )}
      </div>
    </div>
  )
}

export default ProfilePage