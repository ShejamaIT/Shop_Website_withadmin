import express from "express";
import User from "../models/User.js";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

//user registration
export const register = async (req, res) => {
    try {
        // Hashing password
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(req.body.password, salt);

        const newUser = new User({
            username: req.body.username,
            email: req.body.email,
            password: hash,
            role: req.body.role,
            status: req.body.status
        });

        await newUser.save();

        res.status(200).json({ success: true, message: "Successfully saved...." });

    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create...." });
    }
};

//user login
export const login = async (req, res) => {
    const email = req.body.email;

    try {
        const user = await User.findOne({ email });

        // If user doesn't exist
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // If user exists then check the password
        const checkCorrectPassword = await bcrypt.compare(
            req.body.password,
            user.password
        );

        // If password is incorrect
        if (!checkCorrectPassword) {
            return res.status(401).json({ success: false, message: "Incorrect password or email" });
        }

        // Update the user's status to 'login'
        user.status = 'login';
        await user.save();

        const { password, role, ...rest } = user._doc;

        // Create jwt token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET_KEY,
            { expiresIn: '15d' }
        );

        // Set token in the browser cookies and send the response to the client
        res.cookie('accessToken', token, {
            httpOnly: true,
            expires: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) // 15 days
        }).status(200).json({
            token,
            success: true,
            message: 'Successfully logged in',
            data: { ...rest }
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.toString() });
    }
};

// Logout Route
export const logout = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.status = 'logout';
        await user.save();

        res.clearCookie('accessToken').status(200).json({
            success: true,
            message: 'Successfully logged out'
        });
    } catch (err) {
        return res.status(500).json({ success: false, message: "Failed to logout." });
    }
};

// Middleware to handle automatic logout on inactivity or expired token
export const autoLogout = async (req, res) => {
    const token = req.cookies.accessToken;
    if (!token) return next();

    jwt.verify(token, process.env.JWT_SECRET_KEY, async (err, decoded) => {
        if (err) {
            // If token is expired or invalid, logout the user
            const user = await User.findById(decoded?.id);
            if (user) {
                user.status = 'logout';
                await user.save();
            }
            res.clearCookie('accessToken');
            return res.status(401).json({ success: false, message: "Session expired. Please login again." });
        }

        const user = await User.findById(decoded.id);
        if (user) {
            user.status = 'login';
            user.lastActivity = Date.now();
            await user.save();
        }

        req.user = user;
        next();
    });
};
