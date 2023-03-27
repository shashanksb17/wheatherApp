const express=require("express")
const redis=require("redis")
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")
const {connection}=require("./config/db")
const {User}=require("./model/user.model")
const winston = require("winston");
const winston_mongodb=require('winston-mongodb');
const expressWinston = require("express-winston");
const {callRouter}=require("./routes/wheather.routes")
const auth=require("./middleware/authentication")

app.use("/weather",auth,callRouter)



const app=express()
app.use(express.json())
require("dotenv").config()

//redis server
const redisClient=redis.createClient({
    url:`redis://default:${process.env.redisPassword}@redis-19173.c114.us-east-1-4.ec2.cloud.redislabs.com:19173`
})
try{
    redisClient.connect()
}
catch(error){
    console.log(error.message)
}

app.get("/",(req,res)=>{
    res.send("WELCOME TO WHEATHER APP")
})

app.use(
    expressWinston.logger({
      statusLevels:true,
      transports: [
        new winston.transports.Console({
          level: "info",
          json: true,
        }),
        new winston.transports.MongoDB({
          level: "info",
          collection:"errorLogs",
          db: `${process.env.mongo_url}`,
          maxsize: 52428800,
          json: true
        })
      ],
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.json()
      ),
    })
  );

app.post("/signup",async(req,res)=>{
    try{
        const {email,password}=req.body
        //checking id he exists
        const userExists=await Users.findOne({email})
        if(userExists){
            return res.status(400).json({message:"User already exists"})
        }
        //create new user & store in mongodb
        const hashed_password=bcrypt.hashSync(password,6)
        const user=new User({email,password:hashed_password})
        await user.save()
        
        //store data in redis
        await redisClient.set(JSON.stringify(email),JSON.stringify(hashed_password),'EX', 60*60)
        
        res.json({message:"user created successfully"})
    }
    catch(err){
        console.log(err)
    }
})

app.post("/login",async(req,res)=>{
    try{
        const {email,password}=req.body
        //find the user
        const user=await User.findOne({email})
        if(!user){
            return res.status(401).json({message:"Invalid email or password"})
        }
        //redis verify
        const mail=await redisClient.get(`${req.body.email}`)
        const found=await redis.get("mail")

        //compare
        const isPassword=await bcrypt.compare(password,user.password)
        if(!isPassword && found){
            return res.status(401).json({message:"Invalid email or password"})
        }
        //jwt
        const token=jwt.sign({userID:user._id},process.env.jwtSecret,{
            expiresIn:"1h"
        })
        res.json({message:"login successful",token})
    }
    catch(err){
        console.log(err)
    }
})


app.get("/logout",async(req,res)=>{
    const {email,password}=req.body
    await redisClient.set("blacklist",`${req.headers?.authorization?.split(" ")[1]}`)
    // Blacklist.push(req.headers?.authorization?.split(" ")[1])
    res.send("logout successful")
})

app.listen(process.env.port,async()=>{
    try{
        await connection
        console.log("connected to DB")
    }
    catch(err){
        console.log("error connecting to DB")
        console.log(err)
    }
    console.log(`server running at port - ${process.env.port}`)
})

module.exports={redisClient}