import dotenv from 'dotenv';
import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import upload from "./middlewares/upload.js";
import mainRoutes from "./Routes/mainRoutes.js";
import auth from "./Routes/auth.js";
import * as path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 6000; // Default to 6000 if PORT not in .env

// Middleware
app.use(cors({
    origin: 'http://localhost:3000', // Allow frontend origin
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Handles form data

// Serve static files (if needed, e.g., images, barcodes)
app.use('/uploads', express.static(path.resolve('uploads')));

// Routes
app.use('/api/admin/main', mainRoutes);
app.use('/api/auth', auth);

// Default route
app.get('/', (req, res) => {
    res.send('Shejama Group Management System API is running.');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
