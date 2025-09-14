const express = require('express');
const { Room } = require('../db');
const zod=require('zod');
const { AuthMiddleware } = require('../middlewares/auth');
const { v4: uuidv4 } = require('uuid');
const app=express.Router()
const roombody=zod.object({
    roomid:zod.string().uuid()
})


app.post("/",AuthMiddleware, async (req,res)=>{

  const code = "// Start coding here!";
  const language = "Javascript";
    try {
        const roomId = uuidv4();
        const newRoom = await Room.create({ roomId, code, language });
        
        res.status(201).json({ message: "Room created successfully", roomId: newRoom.roomId });
    } catch (error) {
        res.status(400).json({ error: error.errors });
    }
})

app.get('/:roomId',AuthMiddleware, async (req, res) => {
    try {
      const room = await Room.findOne({ roomId: req.params.roomId });
      
      if (!room) {
        return res.status(404).json({ message: 'Room not found' });
      }
      
      res.status(200).json({ message: 'Room found', roomId: room.roomId });
    } catch (error) {
      console.error(error.message);
      res.status(500).json({ message: 'Server error' });
    }
});

app.get('/get-code/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }
    
    res.status(200).json({ message: 'Room found', iniCode: room.code });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update the code of a specific room
app.put("/update-code/:roomId", async (req, res) => {
  try {
      const { code } = req.body; // Get new code from request body
      const updatedRoom = await Room.findOneAndUpdate(
          { roomId: req.params.roomId }, // Find room by roomId
          { code }, // Update code field
          { new: true } // Return updated document
      );

      
      if (!updatedRoom) {
          return res.status(404).json({ message: "Room not found" });
      }

      res.json({ message: "Code updated successfully" });
  } catch (error) {
      res.status(500).json({ message: "Server error", error });
  }
});

module.exports = app;