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
                o.OrID, o.orDate, o.customerEmail, o.contact1, o.contact2, o.orStatus, o.dvStatus,
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

        // Fetch Ordered Items with Stock Count and Unit Price from Item table
        const itemsQuery = `
            SELECT 
                od.I_Id, i.I_name, od.qty, od.tprice, i.price AS unitPrice, i.qty AS stockCount
            FROM Order_Detail od
            JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // Initialize order response
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
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
                price: item.tprice,
                unitPrice: item.unitPrice, // Corrected to fetch from the Item table
                stockCount: item.stockCount
            }))
        };

        // If it's a delivery order, fetch delivery details
        if (orderData.dvStatus === "Delivery") {
            const deliveryQuery = `
                SELECT dv_id, address, district, contact, status, schedule_Date
                FROM delivery
                WHERE orID = ?`;

            const [deliveryResult] = await db.query(deliveryQuery, [orID]);

            if (deliveryResult.length > 0) {
                const deliveryData = deliveryResult[0];
                orderResponse.deliveryInfo = {
                    deliveryId: deliveryData.dv_id,
                    address: deliveryData.address,
                    district: deliveryData.district,
                    status: deliveryData.status,
                    scheduleDate: deliveryData.schedule_Date,
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
//update order
router.put("/update-order", async (req, res) => {
    try {
        const {
            orderId,
            orderDate,
            customerEmail,
            phoneNumber,
            optionalNumber,
            orderStatus,
            deliveryStatus,
            deliveryCharge,
            discount,
            totalPrice,
            expectedDeliveryDate,
            specialNote,
            salesTeam,
            items,
            booked,
        } = req.body;

        // Generate query to check if order exists
        const orderCheckQuery = `SELECT * FROM Orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Begin updating the order
        const orderUpdateQuery = `
            UPDATE Orders
            SET orDate = ?, customerEmail = ?, contact1 = ?, contact2 = ?, orStatus = ?, 
                dvStatus = ?, dvPrice = ?, disPrice = ?, totPrice = ?, expectedDate = ?, specialNote = ?
            WHERE OrID = ?`;
        const orderUpdateParams = [
            orderDate,
            customerEmail,
            phoneNumber,
            optionalNumber,
            orderStatus,
            deliveryStatus,
            deliveryCharge,
            discount,
            totalPrice,
            expectedDeliveryDate,
            specialNote,
            orderId,
        ];

        await db.query(orderUpdateQuery, orderUpdateParams);

        // Update the order details (items)
        for (const item of items) {
            console.log(item);
            const orderDetailUpdateQuery = `
                UPDATE Order_Detail
                SET qty = ?, tprice = ?
                WHERE orID = ? AND I_Id = ?`;
            const orderDetailUpdateParams = [item.quantity, item.price, orderId, item.itemId];
            await db.query(orderDetailUpdateQuery, orderDetailUpdateParams);
            console.log(booked);
            // If the "Booked" field is "Yes", reduce stock in the Item table
            if (booked === "Yes") {
                const itemUpdateQuery = `
                    UPDATE Item
                    SET qty = qty - ?
                    WHERE I_Id = ?`;
                const itemUpdateParams = [item.quantity, item.itemId];

                await db.query(itemUpdateQuery, itemUpdateParams);
            }
        }

        // If delivery status is "Delivery", you may want to update delivery info
        if (deliveryStatus === "Delivery") {
            const deliveryUpdateQuery = `
                UPDATE delivery
                SET address = ?, district = ?, contact = ?, schedule_Date = ?
                WHERE orID = ?`;
            const deliveryUpdateParams = [
                req.body.customerAddress, // Assuming customer address is part of the request
                req.body.district, // Assuming district is part of the request
                phoneNumber,
                expectedDeliveryDate,
                orderId,
            ];

            await db.query(deliveryUpdateQuery, deliveryUpdateParams);
        }

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: {
                orderId: orderId,
                orderDate: orderDate,
                expectedDeliveryDate: expectedDeliveryDate,
            },
        });

    } catch (error) {
        console.error("Error updating order data:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error updating data in database",
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

//Get all orders by status= pending
router.get("/orders-pending", async (req, res) => {
    try {
        // Query the database to fetch all pending Orders
        const [orders] = await db.query("SELECT * FROM Orders WHERE orStatus = 'pending'");

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No pending orders found" });
        }

        // Format orders
        const formattedOrders = orders.map(order => ({
            OrID: order.OrID, // Order ID
            orDate: order.orDate, // Order Date
            customerEmail: order.customerEmail, // Customer Email
            orStatus: order.orStatus, // Order Status
            dvStatus: order.dvStatus, // Delivery Status
            dvPrice: order.dvPrice, // Delivery Price
            disPrice: order.disPrice, // Discount Price
            totPrice: order.totPrice, // Total Price
            stID: order.stID, // Sales Team ID
            expectedDeliveryDate: order.expectedDate, // Expected Delivery Date
        }));

        // Send the formatted orders as a JSON response
        return res.status(200).json({
            message: "Pending orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        return res.status(500).json({ message: "Error fetching pending orders", error: error.message });
    }
});

//Get all orders by status= accepting
router.get("/orders-accepting", async (req, res) => {
    try {
        // Query the database to fetch all pending Orders
        const [orders] = await db.query("SELECT * FROM Orders WHERE orStatus = 'Accepted'");

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        // Format orders
        const formattedOrders = orders.map(order => ({
            OrID: order.OrID, // Order ID
            orDate: order.orDate, // Order Date
            customerEmail: order.customerEmail, // Customer Email
            orStatus: order.orStatus, // Order Status
            dvStatus: order.dvStatus, // Delivery Status
            dvPrice: order.dvPrice, // Delivery Price
            disPrice: order.disPrice, // Discount Price
            totPrice: order.totPrice, // Total Price
            stID: order.stID, // Sales Team ID
            expectedDeliveryDate: order.expectedDate, // Expected Delivery Date
        }));

        // Send the formatted orders as a JSON response
        return res.status(200).json({
            message: "Pending orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        return res.status(500).json({ message: "Error fetching pending orders", error: error.message });
    }
});



export default router;
