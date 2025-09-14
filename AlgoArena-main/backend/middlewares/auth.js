const jwt=require('jsonwebtoken');
const {JWT_SECRET}=require('../config');
const AuthMiddleware=(req,res,next)=>{
    const authHeader=req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ message: 'Authorization header is missing or invalid' });
    }
    const token=authHeader.split(" ")[1];
    try{
        const decoded= jwt.verify(token,JWT_SECRET);
        req.userId=decoded.userId;
        next();
    }catch(e){
        return res.status(403).json({ message: 'Invalid token or verification failed' });
    }
}

module.exports={
    AuthMiddleware,
}