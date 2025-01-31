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
    const sql = `INSERT INTO type (Ty_Id,Ca_Id,sub_one,sub_two) VALUES (?, ?,?,?)`;
    const values = [
        req.body.Ty_Id,
        req.body.Ca_Id,
        req.body.sub_one,
        req.body.sub_two
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
                sub_one: req.body.sub_one,
                sub_two: req.body.sub_two
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

router.get("/getitembycategory", async (req, res) => {
    const { category, subcategory } = req.query;
    console.log(category + " "+ subcategory);
    // Check if both category and subcategory are provided
    if (!category || !subcategory) {
        return res.status(400).json({
            success: false,
            message: "Both category and subcategory are required",
        });
    }


    // SQL query to join Item, Type, Category, and subCat_one based on category and subcategory
    const sql = `
        SELECT 
            i.I_Id, i.I_name, i.descrip, i.price, i.qty, i.img, 
            c.name AS category, sc.subcategory, t.sub_one AS type
        FROM Item i
        INNER JOIN Type t ON i.Ty_id = t.Ty_Id
        INNER JOIN Category c ON t.Ca_Id = c.Ca_Id
        INNER JOIN subCat_one sc ON sc.sb_c_id = t.sub_one
        WHERE c.name = ? AND sc.subcategory = ?
    `;

    try {
        const [rows] = await db.query(sql, [category, subcategory]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No items found for the given category and subcategory",
            });
        }

        // Send back the response with item data
        return res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            data: rows.map(row => ({
                id: row.I_Id,
                name: row.I_name,
                description: row.descrip,
                price: row.price,
                quantity: row.qty,
                category: row.category,
                subcategory: row.subcategory,
                type: row.type,
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

// Fetch Type ID & Items by Category and Subcategories
router.post("/gettypeid", async (req, res) => {
    try {
        const { category, sub_one, sub_two } = req.body;

        console.log(`Category: ${category}, Sub One: ${sub_one}, Sub Two: ${sub_two}`);

        // Validate input parameters
        if (!category || !sub_one || !sub_two) {
            return res.status(400).json({
                success: false,
                message: "Category, Sub One, and Sub Two are required",
            });
        }

        // SQL query to fetch Ty_Id based on category, sub_one, and sub_two
        const typeQuery = `
            SELECT Ty_Id FROM Type t
            INNER JOIN Category c ON t.Ca_Id = c.Ca_Id
            WHERE c.name = ? AND t.sub_one = ? AND t.sub_two = ?
        `;

        const [typeResult] = await db.query(typeQuery, [category, sub_one, sub_two]);

        if (typeResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No type found for the given category and subcategories",
            });
        }

        const typeId = typeResult[0].Ty_Id;

        // Fetch Items Based on Type ID
        const itemQuery = `
            SELECT I_Id, I_name, descrip, price, qty, img 
            FROM Item 
            WHERE Ty_id = ?
        `;

        const [items] = await db.query(itemQuery, [typeId]);

        if (items.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No items found for the given type",
            });
        }

        // Send Response
        return res.status(200).json({
            success: true,
            message: "Items retrieved successfully",
            typeId: typeId,
            data: items.map(item => ({
                id: item.I_Id,
                name: item.I_name,
                description: item.descrip,
                price: item.price,
                quantity: item.qty,
                img: item.img ? `data:image/png;base64,${item.img.toString("base64")}` : null,
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

// Fetch Images for Subcategory
router.post("/getcategorytwoimg", async (req, res) => {
    try {
        const { category } = req.body;
        console.log(`Fetching images for category: ${category}`);

        if (!category) {
            return res.status(400).json({
                success: false,
                message: "Category is required",
            });
        }

        // Fetch images for the given category
        const sql = `
            SELECT sc.sb_cc_id, sc.subcategory, sc.img, c.subcategory AS subcat_one 
            FROM subCat_two sc
            INNER JOIN subCat_one c ON sc.sb_c_id = c.sb_c_id
            WHERE c.subcategory = ?
        `;

        const [rows] = await db.query(sql, [category]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No images found for the given category",
            });
        }

        // Send response
        return res.status(200).json({
            success: true,
            message: "Category images retrieved successfully",
            data: rows.map(row => ({
                id: row.sb_cc_id,
                category: row.subcat_one,
                subcategory: row.subcategory,
                img: row.img ? `data:image/png;base64,${row.img.toString("base64")}` : null,
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
