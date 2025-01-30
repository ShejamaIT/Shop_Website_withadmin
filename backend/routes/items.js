import {
    createItem,
    deleteItem,
    getAllItem,
    getSingleItem,
    updateItemWithImage,
    uploadImage,
    addImage,
    getItemWithImage
} from "../controllers/itemController.js";
import express from "express";
import { verifyAdmin, verifyUser } from "../utils/verifyToken.js";

const router = express.Router();

// Create new item with file upload
router.post('/', createItem);

// Update item with file upload
router.put('/:id', uploadImage, updateItemWithImage);

// Delete item
router.delete('/:id', deleteItem);

// Get single item
router.get('/:id', getSingleItem);

// Get all items
router.get('/', getAllItem);

// Image upload endpoint (if needed separately)
router.post('/:id/upload', uploadImage, addImage);

// Get item with image details
router.get('/:id/details', getItemWithImage);

export default router;
