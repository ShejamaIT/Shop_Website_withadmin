import multer from "multer";

// Multer storage (Memory for processing images in memory)
const storage = multer.memoryStorage();

// File filter to allow only images (JPEG, PNG, WebP, GIF)
const fileFilter = (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true); // Accept the file
    } else {
        cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Invalid file type. Only images (JPG, PNG, WebP, GIF) are allowed."), false);
    }
};

// Define Multer upload middleware
const upload = multer({
    storage,
    limits: {
        fileSize: 20 * 1024 * 1024,  // ✅ 20MB per file
    },
    fileFilter,
});

// Export the upload instance
export default upload;
