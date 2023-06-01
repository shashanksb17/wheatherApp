const express=require("express")

const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
 const fs=require("fs")
const {User}=require("./model/user.model")
require("dotenv").config()
const {authentication}=require("../middleware/authentication")

const callRouter=express.Router()

callRouter.get("/",async(req,res)=>{
    const city=req.query.city
    const country=req.query.country

    const res=await fetch(`http://api.openweathermap.org/data/2.5/weather?q=${city},${country}&APPID=051a58db360e920fad45ae3f1f40b8ce`)
    const json=await res.json()

    console.log(json)
    res.send(json)
})

module.exports={callRouter}