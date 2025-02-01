import express from 'express';
import multer from 'multer';
import bcrypt from "bcrypt";
import db from '../utils/db.js';

const router = express.Router();
// Set up multer for image upload
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage: storage });

//Get all orders
router.get("/orders", async (req, res) => {
    try {
        // Query the database to fetch all Orders
        const [orders] = await db.query("SELECT * FROM Orders");

        // If no promotions found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Orders found" });
        }

        // Convert the binary image data (LONGBLOB) to Base64
        // const formattedPromotions = orders.map(order => ({
        //     id: order.OrID, // Assuming you have an id column
        //     date: order.date,
        // }));
        console.log(orders);

        // Send the formatted promotions as a JSON response
        return res.status(200).json({ message: "founed" });
    } catch (error) {
        console.error("Error fetching promotions:", error.message);
        return res.status(500).json({ message: "Error fetching promotions" });
    }
});




export default router;
