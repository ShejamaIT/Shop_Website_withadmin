import jwt from 'jsonwebtoken';

// const verifyToken = (req,res,next) =>{
//     const token = req.cookies.accessToken

//     if(!token){
//         return res.status(401).json({success:false,message:"You're not authorize."})
//     }

//     //if token is exists
//     jwt.verify(token, process.env.JWT_SECRET_KEY , (err,user) =>{
//         if(err){
//             return res.status(401).json({success:false , message :"token is invaild."})
//         }

//         req.user = user
//         next()
//     })
// }

// export const verifyToken = (req, res, next) => {
//     const token = req.cookies.accessToken; // Access token from cookies
//     console.log("user"+process.env.JWT_SECRET_KEY); // Check if token is properly accessed
//
//     if (!token) {
//         return res.status(401).json({ success: false, message: "You're not authorized." });
//     }
//
//     // If token exists, verify it
//     jwt.verify(token, process.env.JWT_SECRET_KEY, (err, decoded) => {
//         if (err) {
//             console.log(err)
//             return res.status(401).json({ success: false, message: "Token is invalid." });
//         }
//         req.user = decoded; // Attach decoded user information to the request object
//         next(); // Proceed to the next middleware or route handler
//     });
// };


export const verifyToken = (req, res, next, callback) => {
    const token = req.header('Authorization')?.split(' ')[1]; // Extract Bearer token
    console.log(token);
    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, 'your_jwt_secret_key'); // Use your actual secret key
        req.user = decoded;
        callback();
    } catch (err) {
        res.status(400).json({ success: false, message: 'Invalid token.' });
    }
};

export const verifyUser  =  (req,res,next) =>{
    verifyToken(req,res,next,()=>{
        if (req.user.id === req.params.id || req.user.role === 'admin'){
            next()
        }else {
            return res.status(401).json({success:false , message :"You're not authenticated."})
        }
    })
}

export const verifyAdmin  =  (req,res,next) =>{
    verifyToken(req,res,next,()=>{
        if (req.user.role === 'admin'){
            next()
        }else {
            return res.status(401).json({success:false , message :"You're not authorize."})
        }
    })
}