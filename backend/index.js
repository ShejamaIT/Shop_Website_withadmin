import express from 'express';
import dotenv from 'dotenv';
import mongoose from "mongoose";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import userRoute from './routes/users.js';
import authRoute from './routes/auth.js';
import itemRoute from './routes/items.js';
import orderRoute from './routes/orders.js';
import path from "path";
import {fileURLToPath} from "url";
import { dirname } from 'path';

dotenv.config()

const app = express()
const port = process.env.PORT || 8000

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);


//database connection
mongoose.set('strictQuery',false);
const connect = async ()=>{
    try{
        await mongoose.connect(process.env.MONGO_URI,{
            useNewUrlParser:true,
            useUnifiedTopology:true
        })
        console.log("MongoDb database connected..");
    }catch (err){
        console.log("MongoDb database not connected..");
        console.log(err)
    }
}

//middleware
app.use(express.json())
app.use(cors({
    origin: 'http://localhost:3000', // Adjust this to your frontend's URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
}));
app.use(cookieParser())
app.use('/users',userRoute)
app.use('/auth',authRoute)
app.use('/item',itemRoute)
app.use('/order',orderRoute)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.listen(port, ()=>{
    connect();
    console.log('server listening on port...',port)
})