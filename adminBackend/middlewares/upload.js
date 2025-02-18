import multer from "multer";

// Set up Multer for storing images in memory
const storage = multer.memoryStorage();

// File filter to allow only image uploads
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error("Invalid file type. Only images are allowed."), false);
    }
};

// Define Multer upload middleware
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 20 * 1024 * 1024,  // 20MB per file
        fieldSize: 50 * 1024 * 1024, // ⬅️ Increase field size to 50MB
    },
    fileFilter: fileFilter,
});


export default upload;
