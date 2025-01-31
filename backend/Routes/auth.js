import express from 'express';
import bcrypt from "bcrypt";
 import jwt from 'jsonwebtoken';
import db from '../utils/db.js';

const router = express.Router();

// Login Route
router.post('/custsignin', async (req, res) => {
    const { email, password} = req.body;

    try {
        if (!email || !password ) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required.' });
        }

        const [rows] = await db.query(`SELECT * FROM customer_log WHERE email = ?`, [email]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "User Not found",  });
        }

        const user = rows[0];
        console.log(user);
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        // Set expiration time manually
        const expTime = Math.floor(Date.now() / 1000) + 60 * 60; // 1 hour
        const token = jwt.sign(
            { id: user.id, exp: expTime },
            process.env.JWT_SECRET
        );

        console.log('Generated Token Exp:', new Date(expTime * 1000));

        await db.query(
            `INSERT INTO SessionLogs (email, Token) VALUES (?, ?)`,
            [user.email, token]
        );

        res.status(200).json({
            success: true,
            message: "Customer found successfully",
            data: {
                name: user.name,
                email: user.email, // Do NOT send password
            },
        });
    } catch (err) {
        console.error('Error during login:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

// Logout Route
router.post('/logout', async (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(400).json({ message: 'Token is required.' });
    }

    try {
        // Invalidate the token by setting the LogoutTime
        const result = await db.query(
            `UPDATE SessionLogs SET LogoutTime = CURRENT_TIMESTAMP WHERE Token = ?`,
            [token]
        );

        if (result[0].affectedRows === 0) {
            return res.status(404).json({ message: 'Session not found.' });
        }

        res.status(200).json({ message: 'Logout successful.' });
    } catch (err) {
        console.error('Error during logout:', err);
        res.status(500).json({ message: 'Internal server error.' });
    }
});

export default router;
