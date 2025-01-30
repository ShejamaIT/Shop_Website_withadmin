import express from 'express';
import multer from 'multer';
import bcrypt from "bcrypt";
import db from '../utils/db.js';

const router = express.Router();
// Set up multer for image upload
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage: storage });


// Save New Category
router.post("/category", async (req, res) => {
    const sql = `INSERT INTO Category (Ca_Id,name) VALUES (?, ?)`;
    const values = [
        req.body.Ca_Id,
        req.body.name,
    ];
    try {
        // Execute the query and retrieve the result
        const [result] = await db.query(sql, values);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Category added successfully",
            data: {
                Ca_Id: req.body.Ca_Id,
                name: req.body.name
            },
        });
    } catch (err) {
        console.error("Error inserting category data:", err.message);

        // Respond with error details
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});
// Save New Type
router.post("/type", async (req, res) => {
    const sql = `INSERT INTO type (Ty_Id,Ca_Id,sub_cag,oter_cag) VALUES (?, ?,?,?)`;
    const values = [
        req.body.Ty_Id,
        req.body.Ca_Id,
        req.body.sub_cag,
        req.body.oter_cag
    ];
    try {
        // Execute the query and retrieve the result
        const [result] = await db.query(sql, values);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Type added successfully",
            data: {
                Ty_Id : req.body. Ty_Id,
                Ca_Id: req.body.Ca_Id,
                sub_cag: req.body.sub_cag,
                oter_cag: req.body.oter_cag
            },
        });
    } catch (err) {
        console.error("Error inserting type data:", err.message);

        // Respond with error details
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// Save New Item
router.post("/item", upload.single('img'), async (req, res) => {
    const sql = `INSERT INTO Item (I_Id, I_name, Ty_id, descrip, price, qty, img) VALUES (?, ?, ?, ?, ?, ?, ?)`;

    const values = [
        req.body.I_Id,
        req.body.I_name,
        req.body.Ty_id,
        req.body.descrip,
        req.body.price,
        req.body.qty,
        req.file.buffer,  // The image file is in `req.file.buffer`
    ];

    try {
        const [result] = await db.query(sql, values);

        return res.status(201).json({
            success: true,
            message: "Item added successfully",
            data: {
                I_Id: req.body.I_Id,
                I_name: req.body.I_name,
                Ty_id: req.body.Ty_id,
                descrip: req.body.descrip,
                price: req.body.price,
                qty: req.body.qty,
                img: req.body.img,
            },
        });
    } catch (err) {
        console.error("Error inserting item data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// Save New Promotion
router.post("/promotion", upload.single('img'), async (req, res) => {
    const sql = `INSERT INTO Promotion (img, date ) VALUES (?, ?)`;

    const values = [
        req.file.buffer,  // The image file is in `req.file.buffer`
        req.body.date,
    ];

    try {
        const [result] = await db.query(sql, values);

        return res.status(201).json({
            success: true,
            message: "Promotion added successfully",
            data: {
                img: req.body.img,
                date: req.body.date,
            },
        });
    } catch (err) {
        console.error("Error inserting item data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

//Get all promotiones
router.get("/promotions", async (req, res) => {
    try {
        // Query the database to fetch all promotions
        const [promotions] = await db.query("SELECT * FROM Promotion");

        // If no promotions found, return a 404 status
        if (promotions.length === 0) {
            return res.status(404).json({ message: "No promotions found" });
        }

        // Convert the binary image data (LONGBLOB) to Base64
        const formattedPromotions = promotions.map(promotion => ({
            id: promotion.id, // Assuming you have an id column
            img: `data:image/png;base64,${promotion.img.toString("base64")}`, // Convert binary to Base64
            date: promotion.date,
        }));

        // Send the formatted promotions as a JSON response
        return res.status(200).json(formattedPromotions);
    } catch (error) {
        console.error("Error fetching promotions:", error.message);
        return res.status(500).json({ message: "Error fetching promotions" });
    }
});


//get all items
router.get("/items", async (req, res) => {
    try {
        // Query the database to fetch all items
        const [items] = await db.query("SELECT * FROM Item");

        // If no items found, return a 404 status
        if (items.length === 0) {
            return res.status(404).json({ message: "No items found" });
        }

        // Format the items data
        const formattedItems = items.map(item => ({
            I_Id: item.I_Id, // Item ID
            I_name: item.I_name, // Item name
            Ty_id: item.Ty_id, // Type ID (foreign key)
            descrip: item.descrip, // Item description
            price: item.price, // Price
            qty: item.qty, // Quantity
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB image to Base64
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Get last 3 items
router.get("/last3items", async (req, res) => {
    try {
        // Query the database to fetch the last 3 items
        const [items] = await db.query("SELECT * FROM Item ORDER BY I_Id DESC LIMIT 4");

        // If no items found, return a 404 status
        if (items.length === 0) {
            return res.status(404).json({ message: "No items found" });
        }

        // Format the items data
        const formattedItems = items.map(item => ({
            I_Id: item.I_Id, // Item ID
            I_name: item.I_name, // Item name
            Ty_id: item.Ty_id, // Type ID (foreign key)
            descrip: item.descrip, // Item description
            price: item.price, // Price
            qty: item.qty, // Quantity
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB image to Base64
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Get random 3 items
router.get("/get3items", async (req, res) => {
    try {
        // Query the database to fetch the last 3 items
        const [items] = await db.query("SELECT * FROM Item ORDER BY RAND() LIMIT 3");

        // If no items found, return a 404 status
        if (items.length === 0) {
            return res.status(404).json({ message: "No items found" });
        }

        // Format the items data
        const formattedItems = items.map(item => ({
            I_Id: item.I_Id, // Item ID
            I_name: item.I_name, // Item name
            Ty_id: item.Ty_id, // Type ID (foreign key)
            descrip: item.descrip, // Item description
            price: item.price, // Price
            qty: item.qty, // Quantity
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB image to Base64
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Save New Customer login
router.post("/custsignup", async (req, res) => {
    const { name, email, password } = req.body;
    // Check if email already exists
    const [existingUser] = await db.query("SELECT * FROM customer_log WHERE email=?", [email]);
    if (existingUser.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Email already exists",
        });
    }
    try {
        // Hash the password before storing it
        const hashedPassword = await bcrypt.hash(password, 12);
        const sql = `INSERT INTO customer_log (name, email, password) VALUES (?, ?, ?)`;
        const values = [name, email, hashedPassword];
        const [result] = await db.query(sql, values);
        return res.status(201).json({
            success: true,
            message: "Customer added successfully",
            data: { name, email },
        });
    } catch (err) {
        console.error("Error inserting customer data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});
// Get saved customer login
router.post("/custsignin", async (req, res) => {
    const { email, password } = req.body;
    try {
        // Fetch user from database
        const [users] = await db.query("SELECT * FROM customer_log WHERE email=?", [email]);

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Customer not found",
            });
        }

        const user = users[0];
        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid password",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Customer found successfully",
            data: {
                name: user.name,
                email: user.email, // Do NOT send password
            },
        });
    } catch (err) {
        console.error("Error finding customer data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error finding data in database",
            details: err.message,
        });
    }
});

router.get("/get-items-by-type", async (req, res) => {
    try {
        // Extract query parameters
        const { category_name, sub_cag, oter_cag } = req.query;

        if (!category_name || !sub_cag || !oter_cag) {
            return res.status(400).json({ message: "category_name, sub_cag, and oter_cag are required" });
        }

        // Find the Category ID based on the category name
        const categoryQuery = "SELECT Ca_Id FROM Category WHERE name = ?";
        const [categoryResult] = await db.query(categoryQuery, [category_name]);

        if (categoryResult.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        const categoryId = categoryResult[0].Ca_Id;

        // Fetch items based on category, sub category, and other category
        const query = `
            SELECT Item.*
            FROM Item
            INNER JOIN Type ON Item.Ty_id = Type.Ty_Id
            WHERE Type.Ca_Id = ? AND Type.sub_cag = ? AND Type.oter_cag = ?
        `;

        const [items] = await db.query(query, [categoryId, sub_cag, oter_cag]);

        if (items.length === 0) {
            return res.status(404).json({ message: "No items found for the given filters" });
        }

        // Format the items to include Base64-encoded image
        const formattedItems = items.map(item => ({
            I_Id: item.I_Id,
            I_name: item.I_name,
            Ty_id: item.Ty_id,
            descrip: item.descrip,
            price: item.price,
            qty: item.qty,
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB to Base64
        }));

        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items by type:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Save Sub category with image { Home Furniture -> Living Room furniture }
router.post("/subcatone", upload.single('img'), async (req, res) => {
    const sql = `INSERT INTO subCat_one (sb_c_id,subcategory,Ca_Id,img) VALUES (?, ?, ?,?)`;

    const values = [
        req.body.sb_c_id,
        req.body.subcategory,
        req.body.Ca_Id,
        req.file.buffer,  // The image file is in `req.file.buffer`
    ];

    try {
        const [result] = await db.query(sql, values);

        return res.status(201).json({
            success: true,
            message: "Category image added successfully",
            data: {
                sb_c_id: req.body.sb_c_id,
                subcategory: req.body.subcategory,
                Ca_Id : req.body.Ca_Id,
                img: req.body.img,
            },
        });
    } catch (err) {
        console.error("Error inserting image data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});
// Save Sub category with image { Home Furniture -> Living Room furniture }
router.post("/subcattwo", upload.single('img'), async (req, res) => {
    const sql = `INSERT INTO subCat_two (sb_cc_id,subcategory,sb_c_id,img) VALUES (?, ?, ?,?)`;

    const values = [
        req.body.sb_cc_id,
        req.body.subcategory,
        req.body.sb_c_id,
        req.file.buffer,  // The image file is in `req.file.buffer`
    ];

    try {
        const [result] = await db.query(sql, values);

        return res.status(201).json({
            success: true,
            message: "Category image added successfully",
            data: {
                sb_cc_id: req.body.sb_cc_id,
                subcategory: req.body.subcategory,
                sb_c_id: req.body.sb_c_id,
                img: req.body.img,
            },
        });
    } catch (err) {
        console.error("Error inserting image data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

//Get image of category
// Get image of category
router.get("/getcategoryimg", async (req, res) => {
    const { category } = req.query;

    // Check if category is provided
    if (!category) {
        return res.status(400).json({
            success: false,
            message: "Category is required",
        });
    }

    // SQL query to join Category and subCat_one based on category name
    const sql = `
        SELECT sc.sb_c_id, sc.subcategory, sc.img, c.name AS category 
        FROM subCat_one sc
        INNER JOIN Category c ON sc.Ca_Id = c.Ca_Id
        WHERE c.name = ?
    `;

    try {
        const [rows] = await db.query(sql, [category]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No images found for the given category",
            });
        }

        // Send back the response with image data
        return res.status(200).json({
            success: true,
            message: "Category images retrieved successfully",
            data: rows.map(row => ({
                id: row.sb_c_id,
                category: row.category,
                subcategory: row.subcategory,
                img: row.img.toString("base64"), // Convert binary image to Base64
            })),
        });
    } catch (err) {
        console.error("Error fetching data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching data from database",
            details: err.message,
        });
    }
});






export default router;
