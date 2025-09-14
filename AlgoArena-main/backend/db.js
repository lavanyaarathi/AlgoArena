const mongoose=require('mongoose')

try{
  // change the mongoDB connection string to use the database, or you could you mine too
    mongoose.connect(process.env.MONGODB_URL)
    console.log("connected to database");
}catch(e){
    console.log("Some Error while connecting to Database")
}

const userSchema = mongoose.Schema({
  username: { 
    type: String, 
    required: true, 
    unique: true },
  email: { 
    type: String, 
    required: true, 
    unique: true },
  password: { 
    type: String, 
    required: true },
  createdAt: { type: Date, 
    default: Date.now },
});

const RoomSchema = mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    code: {
      type: String,
    },
    language: {
      type: String,
      required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const User=mongoose.model('User',userSchema);
const Room = mongoose.model('Room', RoomSchema);
module.exports={
    User,
    Room
}