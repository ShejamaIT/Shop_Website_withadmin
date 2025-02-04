import express from 'express';
import multer from 'multer';
import bcrypt from "bcrypt";
import db from '../utils/db.js';

const router = express.Router();
// Set up multer for image upload
const storage = multer.memoryStorage(); // Store image in memory
const upload = multer({ storage: storage });

//Get all orders
router.get("/orders", async (req, res) => {
    try {
        // Query the database to fetch all Orders
        const [orders] = await db.query("SELECT * FROM Orders");

        // If no promotions found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Orders found" });
        }


        const formattedOrders = orders.map(order => ({
            OrID : order.OrID, // Assuming you have an id column
            orDate : order.orDate,
            customerEmail : order.customerEmail,
            orStatus : order.orStatus,
            dvStatus : order.dvStatus,
            dvPrice : order.dvPrice,
            disPrice : order.disPrice,
            totPrice : order.totPrice,
            stID:  order.stID,
            expectedDeliveryDate: order.expectedDate
        }));
        // console.log(formattedOrders);

        // Send the formatted promotions as a JSON response
        return res.status(200).json({
            message: "Orders are founded.",
            data : formattedOrders,
        });
    } catch (error) {
        console.error("Error fetching promotions:", error.message);
        return res.status(500).json({ message: "Error fetching promotions" });
    }
});

//get all items
router.get("/allitems", async (req, res) => {
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
//Save Supplier
router.post("/supplier", async (req, res) => {
    const sql = `INSERT INTO Supplier (s_ID,name,contact) VALUES (?, ?,?)`;
    const values = [
        req.body.s_ID,
        req.body.name,
        req.body.contact,
    ];
    try {
        // Execute the query and retrieve the result
        const [result] = await db.query(sql, values);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Suppplier added successfully",
            data: {
                s_ID: req.body.s_ID,
                name: req.body.name,
                contact : req.body.contact
            },
        });
    } catch (err) {
        console.error("Error inserting supplier data:", err.message);

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
    const sql = `INSERT INTO Item (I_Id, I_name, Ty_id, descrip, price, qty, img,s_ID,warrantyPeriod,cost) VALUES (?, ?, ?, ?, ?, ?, ?,?,?,?)`;

    const values = [
        req.body.I_Id,
        req.body.I_name,
        req.body.Ty_id,
        req.body.descrip,
        req.body.price,
        req.body.qty,
        req.file.buffer,  // The image file is in `req.file.buffer`
        req.body.s_ID,
        req.body.warrantyPeriod,
        req.body.cost
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
                warrantyPeriod : req.body.warrantyPeriod,
                cost : req.body.cost,
                s_ID: req.body.s_ID
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

// router.post("/orders", async (req, res) => {
//     try {
//         const {
//             customerName,
//             deliveryMethod,
//             customerAddress,
//             district, // Sending district instead of postal code
//             email,
//             phoneNumber,
//             cartItems,
//             totalAmount,
//             deliveryCharge,
//             discount,
//             coupon,
//             expectedDate,
//             specialNote
//         } = req.body;
//
//         // Validate required fields
//         if (!customerName || !email || !phoneNumber || cartItems.length === 0 || !totalAmount) {
//             return res.status(400).json({
//                 success: false,
//                 message: "Missing required fields."
//             });
//         }
//
//         // Generate unique order ID
//         const orID = `ORD_${Date.now()}`;
//         const orderDate = new Date().toISOString().split("T")[0]; // Get current date
//         const dvStatus = deliveryMethod === "Delivery" ? "Delivery" : "Pick up"; // Set delivery status
//
//         // Initialize stID to null
//         let stID = null;
//
//         // If a coupon is provided, fetch the associated sales team ID (stID)
//         if (coupon) {
//             const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
//             const [couponResult] = await db.query(couponQuery, [coupon]);
//
//             if (couponResult.length === 0) {
//                 return res.status(400).json({
//                     success: false,
//                     message: "Invalid coupon code"
//                 });
//             }
//
//             // Set the stID from the coupon
//             stID = couponResult[0].stID;
//         }
//
//         // Insert Order into the database
//         const orderQuery = `
//             INSERT INTO Orders (OrID, orDate, customerEmail, orStatus, dvStatus, dvPrice, disPrice, totPrice, stID, expectedDate, specialNote)
//             VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?)`;
//         const orderParams = [orID, orderDate, email, dvStatus, deliveryCharge, discount, totalAmount, stID, expectedDate, specialNote];
//
//         await db.query(orderQuery, orderParams);
//
//         // Insert each cart item into Order_Detail
//         for (const item of cartItems) {
//             const orderDetailQuery = `
//                 INSERT INTO Order_Detail (orID, I_Id, qty, price)
//                 VALUES (?, ?, ?, ?)`;
//             const orderDetailParams = [orID, item.I_Id, item.qty, item.price];
//
//             await db.query(orderDetailQuery, orderDetailParams);
//         }
//
//         // Insert Delivery Info if delivery is selected
//         if (deliveryMethod === "Delivery") {
//             const dvID = `DLV_${Date.now()}`;
//             const deliveryQuery = `
//                 INSERT INTO delivery (dv_id, orID, address, district, contact, status, schedule_Date, delivery_Date)
//                 VALUES (?, ?, ?, ?, ?, 'Pending', ?, 'none')`;
//             const deliveryParams = [dvID, orID, customerAddress, district, phoneNumber, expectedDate];
//
//             await db.query(deliveryQuery, deliveryParams);
//         }
//
//         // Insert Coupon Info if a coupon is used
//         if (coupon) {
//             const ocID = `OCP_${Date.now()}`;
//             const couponQuery = `
//                 INSERT INTO order_coupon (ocID, orID, cpID)
//                 VALUES (?, ?, ?)`;
//             const couponParams = [ocID, orID, coupon];
//
//             await db.query(couponQuery, couponParams);
//         }
//
//         return res.status(201).json({
//             success: true,
//             message: "Order placed successfully",
//             data: {
//                 orID: orID,
//                 orderDate: orderDate,
//             },
//         });
//
//     } catch (error) {
//         console.error("Error inserting order data:", error.message);
//         return res.status(500).json({
//             success: false,
//             message: "Error inserting data into database",
//             details: error.message,
//         });
//     }
// });

//get one order in-detail
router.get("/order-details", async (req, res) => {
    try {
        const { orID } = req.query;
        if (!orID) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // Fetch Order Info along with Sales Team details (Employee Name)
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.customerEmail, o.orStatus, o.dvStatus,
                o.dvPrice, o.disPrice, o.totPrice, o.expectedDate, o.specialNote,
                s.stID, e.name AS salesEmployeeName
            FROM Orders o
            LEFT JOIN sales_team s ON o.stID = s.stID
            LEFT JOIN Employee e ON s.E_Id = e.E_Id
            WHERE o.OrID = ?`;

        const [orderResult] = await db.query(orderQuery, [orID]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderData = orderResult[0];

        // Fetch Ordered Items
        const itemsQuery = `
            SELECT od.I_Id, i.I_name, od.qty, od.price
            FROM Order_Detail od
            JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // Initialize order response
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.dvStatus,
            deliveryCharge: orderData.dvPrice,
            discount: orderData.disPrice,
            totalPrice: orderData.totPrice,
            expectedDeliveryDate: orderData.expectedDate,
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                quantity: item.qty,
                price: item.price
            }))
        };

        // If it's a delivery order, fetch delivery details
        if (orderData.dvStatus === "Delivery") {
            const deliveryQuery = `
                SELECT dv_id, address, district, contact, status, schedule_Date, delivery_Date
                FROM delivery
                WHERE orID = ?`;

            const [deliveryResult] = await db.query(deliveryQuery, [orID]);

            if (deliveryResult.length > 0) {
                const deliveryData = deliveryResult[0];
                orderResponse.deliveryInfo = {
                    deliveryId: deliveryData.dv_id,
                    address: deliveryData.address,
                    district: deliveryData.district,
                    contact: deliveryData.contact,
                    status: deliveryData.status,
                    scheduleDate: deliveryData.schedule_Date,
                    deliveryDate: deliveryData.delivery_Date || "Not delivered yet"
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: "Order details fetched successfully",
            order: orderResponse
        });

    } catch (error) {
        console.error("Error fetching order details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching order details",
            details: error.message,
        });
    }
});


// GET Item Details by Item ID
router.get("/item-details", async (req, res) => {
    try {
        const { I_Id } = req.query;

        if (!I_Id) {
            return res.status(400).json({ success: false, message: "Item ID is required" });
        }

        // Query to get item details
        const query = `
            SELECT 
                I_Id, I_name, Ty_id, descrip, price, qty, 
                warrantyPeriod, s_ID, cost, img
            FROM Item 
            WHERE I_Id = ?
        `;

        const [result] = await db.query(query, [I_Id]);

        if (result.length === 0) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        // Convert image from BLOB to Base64 (to send as JSON response)
        const item = result[0];
        item.img = item.img.toString("base64");

        return res.status(200).json({ success: true, item });

    } catch (error) {
        console.error("Error fetching item details:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});


export default router;
