const express=require('express')

const UserRoute=require('./User')
const Roomrouter=require('./Room')
const { model } = require('mongoose')

const app=express.Router()

app.use(express.json())
app.use("/auth",UserRoute)

app.use("/rooms",Roomrouter)

module.exports=app