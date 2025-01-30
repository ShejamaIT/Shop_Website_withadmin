import Item from "../models/Item.js";
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Ensure the uploads directory exists
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, "uploads/images");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up multer for file upload
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Append the current timestamp to the filename
    }
});

const upload = multer({ storage: storage });

// Middleware to handle image uploads
export const uploadImage = upload.single('imgUrl');

// Create new item
export const createItem = async (req, res) => {
    console.log("Request Body...");
    console.log(req.body);

    const newItem = new Item({
        productName: req.body.productName,
        shortDesc: req.body.shortDesc,
        description: req.body.description,
        price: req.body.price,
        category: req.body.category,
        imgUrl: null // Initially set to null, will be updated after image upload
    });

    console.log("New Item.....");
    console.log(newItem);

    try {
        const savedItem = await newItem.save();
        res.status(200).json({ success: true, message: 'Successfully created..', data: savedItem });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Not Created..', error: err.message });
    }
};

// Update item with image upload
export const updateItemWithImage = async (req, res) => {
    const id = req.params.id;

    try {
        const updatedFields = req.body;
        if (req.file) {
            updatedFields.imgUrl = `http://localhost:${process.env.PORT}/uploads/images/${req.file.filename}`;
        }

        const updatedItem = await Item.findByIdAndUpdate(id, {
            $set: updatedFields
        }, { new: true });

        res.status(200).json({ success: true, message: 'Successfully updated..', data: updatedItem });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to update..', error: err.message });
    }
};

// Image upload endpoint (if needed separately)
export const addImage = async (req, res) => {
    const id = req.params.id;

    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        if (req.file) {
            item.imgUrl = `http://localhost:${process.env.PORT}/uploads/images/${req.file.filename}`;
            await item.save();
        }

        res.status(200).json({ success: true, message: 'Image uploaded successfully', data: item });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to upload image', error: err.message });
    }
};
//delete item
export const deleteItem = async (req,res) =>{
    const id = req.params.id

    try{

        await Item.findByIdAndDelete(id);

        res.status(200).json({success:true,message:'Successfully deleted..'});
    }catch (err){
        res.status(500).json({success:false,message:'failed to delete..'})
    }
};

//getSingle item
export const getSingleItem = async (req,res) =>{
    const id = req.params.id

    try{

        const item = await Item.findById(id);

        res.status(200).json({success:true,message:'Successfully Found..', data:item});
    }catch (err){
        res.status(404).json({success:false,message:'Not Found..'})
    }
};



//getAll item
export const getAllItem = async (req,res) =>{

    //for pagintion

    const page = parseInt(req.query.page)
    console.log(page)

    try{

        const items = await Item.find({})

        res.status(200).json({success:true,message:'Successfully found..',data:items})

    }catch (err){
        res.status(404).json({success:false,message:'Not Found..'})
    }
};


// Get item with image details
export const getItemWithImage = async (req, res) => {
    const id = req.params.id;

    try {
        const item = await Item.findById(id);
        console.log(item)

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        res.status(200).json({ success: true, message: 'Successfully found', data: item });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to fetch item', error: err.message });
    }
};

