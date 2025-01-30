import express from "express";
import {createUser, deleteUser, getAllUser, getSingleUser, updateUser} from "../controllers/userController.js";
const router = express.Router()
import {verifyAdmin, verifyUser, verifyToken} from "../utils/verifyToken.js";

// create new user
router.post('/',verifyUser, createUser)

// update user
router.put('/:id', verifyUser, updateUser)

// delete user
router.delete('/:id',deleteUser)

// getSingle user
router.get('/:id', verifyUser, getSingleUser)

// get All users
router.get('/', verifyToken, getAllUser)


export default router;