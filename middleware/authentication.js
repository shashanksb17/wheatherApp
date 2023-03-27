const jwt=require("jsonwebtoken")
const {User}=require("../model/user.model")
require("dotenv").config()
const {redisClient}=require("./index")

const authMiddleware=async(req,res,next)=>{
    try{
        //blacklisting in redis
        const token=req.headers.authrization.split(" ")[1]
        const tokenn=await redisClient.get(token)
        const tokenfound=await redis.get("tokenn")

        if(tokenfound){
            return res.send("Please login again")
        }
        //verify
        const decodedToken=jwt.verify(token,process.env.jwtSecret)
        const {userId}=decodesToken

        //exists or not
        const user=await User.findById(userId)
        if(!user){
            return res.status(401).json({message:"Unsuthorized"})
        }

        next()

    }
    catch(err){
        console.log(err)
        return res.status(401).json({message:"Unauthorized"})
    }
}

module.exports={authMiddleware}