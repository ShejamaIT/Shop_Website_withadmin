import express from 'express';
import multer from 'multer';
import bcrypt from "bcrypt";
import db from '../utils/db.js';

const router = express.Router();
// Set up multer for image upload
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage: storage });


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
            qty: item.availableQty, // Quantity
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
            qty: item.availableQty, // Quantity
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
            qty: item.availableQty, // Quantity
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
            qty: item.availableQty,
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

// Fetch Images for Subcategory one
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
            i.I_Id, i.I_name, i.descrip, i.price, i.availableQty, i.img, 
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
                quantity: row.availableQty,
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
            SELECT I_Id, I_name, descrip, price, availableQty, img 
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
                quantity: item.availableQty,
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

// Fetch Images for Subcategory two
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

// get coupone details
router.post("/coupone", async (req, res) => {
    const { cpID } = req.body; // Get cpID from query parameters

    try {
        let query;
        let params = [];

        if (cpID) {
            // If cpID is provided, fetch that specific coupon
            query = "SELECT * FROM sales_coupon WHERE cpID = ?";
            params = [cpID];
        } else {
            // If no cpID is provided, fetch all coupons
            query = "SELECT * FROM sales_coupon";
        }

        const [coupone] = await db.query(query, params);

        if (coupone.length === 0) {
            return res.status(404).json({ message: "No coupon found" });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon(s) retrieved successfully",
            data: coupone,
        });
    } catch (error) {
        console.error("Error fetching coupons:", error.message);
        return res.status(500).json({ message: "Error fetching coupons", error: error.message });
    }
});

// Save a order
router.post("/orders", async (req, res) => {
    try {
        const {
            deliveryMethod,
            customerAddress,
            city,
            district,
            email,
            phoneNumber,
            optionalNumber,
            cartItems,
            totalAmount,
            deliveryCharge,
            discount,
            coupon,
            expectedDate,
            specialNote
        } = req.body;
        console.log(cartItems);
        // Generate unique order ID
        const orID = `ORD_${Date.now()}`;
        const orderDate = new Date().toISOString().split("T")[0]; // Get current date
        const dvStatus = deliveryMethod === "Delivery" ? "Delivery" : "Pick up"; // Set delivery status based on method

        // Initialize stID to null
        let stID = null;

        // Check if a coupon is provided, if yes fetch associated stID
        if (coupon) {
            // Fetch the stID associated with the provided coupon ID (cpID)
            const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
            const [couponResult] = await db.query(couponQuery, [coupon]);

            if (couponResult.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid coupon code"
                });
            }

            // Set the sales team ID (stID) from the coupon
            stID = couponResult[0].stID;
        }
        // Insert Order
        let orderQuery = `
            INSERT INTO Orders (OrID, orDate, customerEmail,contact1,contact2, orStatus, dvStatus,city, dvPrice, disPrice, totPrice, stID, expectedDate, specialNote,order_type)
            VALUES (?, ?, ?,?,?, 'Pending', ?, ?, ?, ?, ?, ?, ?,?,'site')`;
        let orderParams = [orID, orderDate, email,phoneNumber,optionalNumber, dvStatus,city, deliveryCharge, discount, totalAmount, stID, expectedDate, specialNote];

        await db.query(orderQuery, orderParams);

        // Insert Order Details
        for (const item of cartItems) {
            let orderDetailQuery = `
                INSERT INTO Order_Detail (orID, I_Id, qty, tprice)
                VALUES (?, ?, ?, ?)`;
            let orderDetailParams = [orID, item.I_Id, item.qty, item.price];

            await db.query(orderDetailQuery, orderDetailParams);
        }

        // Insert Delivery Info if delivery is selected
        if (deliveryMethod === "Delivery") {
            const dvID = `DLV_${Date.now()}`;
            let deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, contact, status,schedule_Date)
                VALUES (?, ?, ?, ?, ?, 'Pending',?)`;
            let deliveryParams = [dvID, orID, customerAddress, district, phoneNumber, expectedDate];

            await db.query(deliveryQuery, deliveryParams);
        }

        // Insert Coupon Info if a coupon is used
        if (coupon) {
            const ocID = `OCP_${Date.now()}`;
            let couponQuery = `
                INSERT INTO order_coupon (ocID, orID, cpID)
                VALUES (?, ?, ?)`;
            let couponParams = [ocID, orID, coupon];

            await db.query(couponQuery, couponParams);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: {
                orID: orID,
                orderDate: orderDate,
                expectedDate: expectedDate
            },
        });

    } catch (error) {
        console.error("Error inserting order data:", error.message);

        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: error.message,
        });
    }
});

// API Endpoint to get subcategories by category name
router.get("/categories", async (req, res) => {
    const categoryName = req.query.name;

    if (!categoryName) {
        return res.status(400).json({ message: "Category name is required" });
    }

    try {
        // Query the Category table to find the Ca_Id based on the category name
        const [category] = await db.query("SELECT Ca_Id FROM Category WHERE name = ?", [categoryName]);

        // If category is not found, return a 404
        if (category.length === 0) {
            return res.status(404).json({ message: "Category not found" });
        }

        // Get the Ca_Id of the found category
        const Ca_Id = category[0].Ca_Id;

        // Now, query the subCat_one table to get all subcategories for this category
        const [subcategories] = await db.query("SELECT sb_c_id, subcategory FROM subCat_one WHERE Ca_Id = ?", [Ca_Id]);

        // If no subcategories found for this category, return a 404
        if (subcategories.length === 0) {
            return res.status(404).json({ message: "No subcategories found for this category" });
        }

        // Convert the binary image data (LONGBLOB) to Base64 format
        const formattedSubcategories = subcategories.map(subcategory => ({
            sb_c_id: subcategory.sb_c_id, // Assuming you have a subcategory ID
            subcategory: subcategory.subcategory,
        }));

        // Send the formatted subcategories as a JSON response
        return res.status(200).json(formattedSubcategories);
    } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        return res.status(500).json({ message: "Error fetching subcategories" });
    }
});

//get second subcategories by category subcategorie name
router.get("/subcategories", async (req, res) => {
    const subcategoryName = req.query.name;

    if (!subcategoryName) {
        return res.status(400).json({ message: "Subcategory name is required" });
    }

    try {
        // Query the subCat_one table to find sb_c_id based on the subcategory name
        const [subCatOne] = await db.query("SELECT sb_c_id, subcategory FROM subCat_one WHERE subcategory = ?", [subcategoryName]);

        // If the subcategory is not found, return a 404
        if (subCatOne.length === 0) {
            return res.status(404).json({ message: "Subcategory not found" });
        }

        // Get the sb_c_id of the found subcategory in subCat_one
        const sb_c_id = subCatOne[0].sb_c_id;

        // Now, query the subCat_two table to get all subcategories related to this sb_c_id
        const [subcategoriesTwo] = await db.query("SELECT sb_cc_id, subcategory FROM subCat_two WHERE sb_c_id = ?", [sb_c_id]);

        // If no related subcategories are found, return a 404
        if (subcategoriesTwo.length === 0) {
            return res.status(404).json({ message: "No subcategories found for this subcategory" });
        }

        // Send the formatted subcategories as a JSON response
        return res.status(200).json({
            subcategories: subcategoriesTwo.map(sub => ({
                sb_cc_id: sub.sb_cc_id,
                subcategory: sub.subcategory,
            }))
        });
    } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        return res.status(500).json({ message: "Error fetching subcategories" });
    }
});

// GET API to fetch delivery amount by district
router.get("/delivery-rate", async (req, res) => {
    const { district } = req.query; // Get district from query parameter

    if (!district) {
        return res.status(400).json({ message: "District is required" });
    }

    try {
        const [result] = await db.query(
            "SELECT amount FROM deli_Rates WHERE district = ?",
            [district]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "District not found" });
        }

        return res.status(200).json({
            message: "Delivery rate found",
            district: district,
            amount: result[0].amount,
        });
    } catch (error) {
        console.error("Error fetching delivery rate:", error.message);
        return res.status(500).json({ message: "Error fetching delivery rate" });
    }
});

// GET API to fetch delivery schedule by district
router.get("/delivery-schedule", async (req, res) => {
    const { district } = req.query; // Get district from query parameter
    console.log(district);

    if (!district) {
        return res.status(400).json({ message: "District is required" });
    }

    try {
        // Fetch all delivery dates for the given district
        const [result] = await db.query(
            "SELECT ds_date FROM delivery_schedule WHERE district = ?",
            [district]
        );
        console.log(result);

        if (result.length === 0) {
            return res.status(404).json({ message: "District not found" });
        }

        // Get the current date (yyyy-mm-dd format)
        const currentDate = new Date().toISOString().split("T")[0];

        // Filter and sort dates
        const upcomingDates = result
            .map(row => {
                // Convert ds_date to a string in yyyy-mm-dd format (ignoring time part)
                const date = new Date(row.ds_date).toISOString().split("T")[0];
                return date;
            })
            .filter(date => date >= currentDate) // Keep only upcoming dates
            .sort((a, b) => new Date(a) - new Date(b)); // Sort in ascending order

        if (upcomingDates.length === 0) {
            return res.status(404).json({ message: "No upcoming delivery dates available" });
        }

        return res.status(200).json({
            message: "Upcoming delivery dates found",
            district: district,
            upcomingDates: upcomingDates,
        });
    } catch (error) {
        console.error("Error fetching delivery schedule:", error.message);
        return res.status(500).json({ message: "Error fetching delivery schedule" });
    }
});



export default router;
