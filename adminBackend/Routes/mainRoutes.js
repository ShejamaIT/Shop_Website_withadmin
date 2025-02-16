import express from 'express';
import upload from "../middlewares/upload.js";
import db from '../utils/db.js';

const router = express.Router();

// Save  new item
router.post("/add-item", upload.fields([{ name: "img", maxCount: 1 }, { name: "img1", maxCount: 1 }, { name: "img2", maxCount: 1 }, { name: "img3", maxCount: 1 }]), async (req, res) => {
    try {
        // Validate request body
        const { I_Id, I_name, Ty_id, descrip, color, price, warrantyPeriod, cost ,material,s_Id } = req.body;
        // Convert data to appropriate types
        const parsedPrice = parseFloat(price) || 0;
        const parsedCost = parseFloat(cost) || 0;

        // Extract image buffers
        const imgBuffer = req.files["img"][0].buffer;
        const img1Buffer = req.files["img1"][0].buffer;
        const img2Buffer = req.files["img2"][0].buffer ;
        const img3Buffer = req.files["img3"][0].buffer;

        const itemValues = [
            I_Id, I_name, Ty_id, descrip, color,material, parsedPrice, imgBuffer, warrantyPeriod
        ];
        const imgValues = [
            I_Id, img1Buffer ? Buffer.from(img1Buffer) : null, img2Buffer ? Buffer.from(img2Buffer) : null, img3Buffer ? Buffer.from(img3Buffer) : null
        ];
        const supplierValues = [
            I_Id, s_Id,parsedCost
        ];
        // Insert into `Item` table (Main image)
        const itemSql = `INSERT INTO Item (I_Id, I_name, Ty_id, descrip, color,material, price, stockQty, bookedQty, availableQty, img, warrantyPeriod) 
                         VALUES (?, ?, ?, ?, ?,?,?, 0, 0, 0, ?, ?);`;

        const query = await db.query(itemSql, itemValues);
        console.log("query");

        // Insert into `Item_img` table (Additional images)
        const imgSql = `INSERT INTO Item_img (I_Id, img1, img2, img3) VALUES (?, ?, ?, ?);`;

        const query1 = await db.query(imgSql, imgValues);
        console.log("query1");

        // Insert into `Item_supplier` table
        const itemsuplierSql = `INSERT INTO item_supplier (I_Id, s_ID,unit_cost) VALUES (?, ?,?);`;

        const query2 = await db.query(itemsuplierSql, supplierValues);
        console.log("query2");

        res.status(201).json({
            success: true,
            message: "Item added successfully",
            data: {
                I_Id,
                I_name,
                Ty_id: Ty_id,
                descrip,
                color,
                material,
                price: parsedPrice,
                warrantyPeriod,
                cost: parsedCost
            }
        });
    } catch (err) {
        console.error("❌ Error inserting item data:", err.message);
        res.status(500).json({ success: false, message: "Error inserting data into database", details: err.message });
    }
});

// Update exit item
router.put("/update-item", upload.fields([{ name: "img", maxCount: 1 }, { name: "img1", maxCount: 1 }, { name: "img2", maxCount: 1 }, { name: "img3", maxCount: 1 }]), async (req, res) => {
    try {
        // Extract and validate request body
        const { I_Id, I_name, Ty_id, descrip, color, price, warrantyPeriod, cost, material, s_Id, availableQty, bookedQty, stockQty, img1, img2, img3 } = req.body;
        const parsedPrice = parseFloat(price) || 0;
        const parsedCost = parseFloat(cost) || 0;

        // Check if the I_Id exists
        const itemCheckSql = `SELECT * FROM Item WHERE I_Id = ?`;
        const itemCheckResult = await db.query(itemCheckSql, [I_Id]);

        if (itemCheckResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Item not found."
            });
        }

        // Extract image buffers if provided
        // const imgBuffer = req.files["img"] ? req.files["img"][0].buffer : null;
        // const img1Buffer = req.files["img1"] ? req.files["img1"][0].buffer : null;
        // const img2Buffer = req.files["img2"] ? req.files["img2"][0].buffer : null;
        // const img3Buffer = req.files["img3"] ? req.files["img3"][0].buffer : null;

        const imgBuffer = req.files["img"][0].buffer;
        const img1Buffer = req.files["img1"][0].buffer;
        const img2Buffer = req.files["img2"][0].buffer ;
        const img3Buffer = req.files["img3"][0].buffer;

        const itemValues = [
            I_name, Ty_id, descrip, color, material, parsedPrice, availableQty, bookedQty, stockQty, imgBuffer ? imgBuffer : null, warrantyPeriod, I_Id
        ];
        console.log(itemValues);

        const imgValues = [
            I_Id, img1Buffer ? img1Buffer : null, img2Buffer ? img2Buffer : null, img3Buffer ? img3Buffer : null
        ];
        console.log(imgValues);

        const supplierValues = [
            I_Id, s_Id, parsedCost
        ];
        console.log(supplierValues);

        // // Update `Item` table
        // const itemUpdateSql = `
        //     UPDATE Item
        //     SET I_name = ?, Ty_id = ?, descrip = ?, color = ?, material = ?, price = ?, availableQty = ?, bookedQty = ?, stockQty = ?, img = ?, warrantyPeriod = ?
        //     WHERE I_Id = ?;
        // `;
        //
        // await db.query(itemUpdateSql, itemValues);
        //
        // // Update `Item_img` table if images are provided
        // if (img1Buffer || img2Buffer || img3Buffer) {
        //     const imgUpdateSql = `
        //         UPDATE Item_img
        //         SET img1 = ?, img2 = ?, img3 = ?
        //         WHERE I_Id = ?;
        //     `;
        //     await db.query(imgUpdateSql, imgValues);
        // }
        //
        // // Update the supplier information
        // const supplierUpdateSql = `
        //     UPDATE item_supplier
        //     SET unit_cost = ?
        //     WHERE I_Id = ? AND s_ID = ?;
        // `;
        //
        // await db.query(supplierUpdateSql, supplierValues);

        res.status(200).json({
            success: true,
            message: "Item updated successfully",
            data: {
                I_Id,
                I_name,
                Ty_id,
                descrip,
                color,
                material,
                price: parsedPrice,
                warrantyPeriod,
                cost: parsedCost,
                availableQty,
                bookedQty,
                stockQty
            }
        });
    } catch (err) {
        console.error("❌ Error updating item data:", err.message);
        res.status(500).json({ success: false, message: "Error updating data into database", details: err.message });
    }
});


// Get all orders
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
            ordertype : order.order_type,
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

// Get all items
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
            stockQty: item.stockQty, // Quantity
            availableQty : item.availableQty, // available stock
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB image to Base64
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Save Supplier
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

// Get one accept order in-detail
router.get("/accept-order-details", async (req, res) => {
    try {
        const { orID } = req.query;
        if (!orID) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // 1️⃣ Fetch Order Info with Sales Team Details
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.customerEmail, o.contact1, o.contact2,
                o.orStatus, o.dvStatus, o.dvPrice, o.disPrice, o.totPrice, o.order_type,
                o.expectedDate, o.specialNote, s.stID, e.name AS salesEmployeeName
            FROM Orders o
                     LEFT JOIN sales_team s ON o.stID = s.stID
                     LEFT JOIN Employee e ON s.E_Id = e.E_Id
            WHERE o.OrID = ?`;

        const [orderResult] = await db.query(orderQuery, [orID]);
        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const orderData = orderResult[0];

        // 2️⃣ Fetch Ordered Items with Updated Stock Fields
        const itemsQuery = `
            SELECT
                od.I_Id, i.I_name, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // 3️⃣ Fetch Booked Items
        const bookedItemsQuery = `
            SELECT bi.I_Id, i.I_name, bi.qty
            FROM booked_item bi
                     JOIN Item i ON bi.I_Id = i.I_Id
            WHERE bi.orID = ?`;

        const [bookedItemsResult] = await db.query(bookedItemsQuery, [orID]);

        // 4️⃣ Fetch Accepted Orders
        const acceptedOrdersQuery = `
            SELECT ao.I_Id, i.I_name, ao.itemReceived, ao.status
            FROM accept_orders ao
                     JOIN Item i ON ao.I_Id = i.I_Id
            WHERE ao.orID = ?`;

        const [acceptedOrdersResult] = await db.query(acceptedOrdersQuery, [orID]);

        // 5️⃣ Initialize Response Object
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            ordertype : orderData.order_type,
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
                unitPrice: item.unitPrice,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty // Updated field from Item table
            })),
            bookedItems: bookedItemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                quantity: item.qty
            })),
            acceptedOrders: acceptedOrdersResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                itemReceived: item.itemReceived,
                status: item.status
            }))
        };

        // 6️⃣ Fetch Delivery Info If Order is for Delivery
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

        // // 7️⃣ If Order Status is "Accepted", Trigger Additional API Call (Optional)
        // if (orderData.orStatus === "Accepted") {
        //     // console.log(`Calling additional API for accepted order: ${orID}`);
        //     // Add API call logic here if needed (e.g., send notification)
        // }

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

// Get one order in-detail
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
                o.dvPrice, o.disPrice, o.totPrice, o.expectedDate, o.specialNote, o.order_type,
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

        // Fetch Ordered Items with Updated Stock Fields
        const itemsQuery = `
            SELECT
                od.I_Id, i.I_name, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty , i.stockQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // Prepare the order response
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            ordertype : orderData.order_type,
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
            items: []
        };

        // If order is "Accepted", fetch booked items and accept_orders
        if (orderData.orStatus === "Accepted") {
            for (const item of itemsResult) {
                let itemReceived = "No";
                let itemStatus = "Incomplete";

                // Fetch accept order data
                const acceptQuery = `SELECT itemReceived, status FROM accept_orders WHERE orID = ? AND I_Id = ?`;
                const [acceptResult] = await db.query(acceptQuery, [orID, item.I_Id]);
                if (acceptResult.length > 0) {
                    itemReceived = acceptResult[0].itemReceived;
                    itemStatus = acceptResult[0].status;
                }

                orderResponse.items.push({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    price: item.tprice,
                    quantity: item.qty,
                    unitPrice: item.unitPrice,
                    booked: item.bookedQty > 0, // true if the item is booked
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty, // Updated field from Item table
                    stockQuantity : item.stockQty,
                    itemReceived: itemReceived,
                    itemStatus: itemStatus
                });
            }
        } else {
            // If order is not "Accepted", return normal item details
            orderResponse.items = itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                quantity: item.qty,
                price: item.tprice,
                unitPrice: item.unitPrice,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty, // Updated field
                stockQuantity : item.stockQty
            }));
        }

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

// GET Item Details by Item ID
router.get("/item-details", async (req, res) => {
    try {
        const { I_Id } = req.query;

        if (!I_Id) {
            return res.status(400).json({ success: false, message: "Item ID is required" });
        }

        // Fetch item details along with Type and Category information
        const itemQuery = `
            SELECT
                I.I_Id, I.I_name, I.Ty_id, I.descrip, I.price, I.stockQty, I.bookedQty, I.availableQty,
                I.warrantyPeriod, I.img, I.color , I.material,
                T.sub_one, T.sub_two, C.name AS category_name
            FROM Item I
            JOIN Type T ON I.Ty_id = T.Ty_Id
            JOIN Category C ON T.Ca_Id = C.Ca_Id
            WHERE I.I_Id = ?`;

        const [itemResult] = await db.query(itemQuery, [I_Id]);

        if (itemResult.length === 0) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const itemData = itemResult[0];

        // Fetch additional images from Item_img table
        const imageQuery = `SELECT img1, img2, img3 FROM Item_img WHERE I_Id = ?`;
        const [imageResult] = await db.query(imageQuery, [I_Id]);

        let imgData = {
            img1: null,
            img2: null,
            img3: null
        };

        if (imageResult.length > 0) {
            imgData = {
                img1: imageResult[0].img1 ? Buffer.from(imageResult[0].img1).toString("base64") : null,
                img2: imageResult[0].img2 ? Buffer.from(imageResult[0].img2).toString("base64") : null,
                img3: imageResult[0].img3 ? Buffer.from(imageResult[0].img3).toString("base64") : null,
            };
        }

        // Convert the main image from Item table to Base64
        const mainImgBase64 = itemData.img ? Buffer.from(itemData.img).toString("base64") : null;

        // Fetch all suppliers that provide this item along with unit_cost
        const supplierQuery = `
            SELECT S.s_ID, S.name, S.contact, ISUP.unit_cost
            FROM Supplier S
            JOIN item_supplier ISUP ON S.s_ID = ISUP.s_ID
            WHERE ISUP.I_Id = ?`;

        const [suppliersResult] = await db.query(supplierQuery, [I_Id]);

        const suppliers = suppliersResult.map(supplier => ({
            s_ID: supplier.s_ID,
            name: supplier.name,
            contact: supplier.contact,
            unit_cost: supplier.unit_cost // Include unit cost
        }));

        // Construct final response
        const responseData = {
            success: true,
            item: {
                I_Id: itemData.I_Id,
                I_name: itemData.I_name,
                Ty_id: itemData.Ty_id,
                descrip: itemData.descrip,
                color: itemData.color,
                material: itemData.material,
                price: itemData.price,
                stockQty: itemData.stockQty,
                availableQty: itemData.availableQty,
                bookedQty: itemData.bookedQty,
                warrantyPeriod: itemData.warrantyPeriod,
                img: mainImgBase64, // Main image from Item table
                img1: imgData.img1, // Additional Image 1
                img2: imgData.img2, // Additional Image 2
                img3: imgData.img3, // Additional Image 3
                category_name: itemData.category_name, // Category name
                subcategory_one: itemData.sub_one, // Subcategory One
                subcategory_two: itemData.sub_two,  // Subcategory Two
                suppliers: suppliers // List of suppliers with unit cost
            }
        };

        return res.status(200).json(responseData);
    } catch (error) {
        console.error("Error fetching item details:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Get all orders by status= pending
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
            ordertype : order.order_type,
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

// Get all orders by status= accepting
router.get("/orders-accepting", async (req, res) => {
    try {
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT 
                o.OrID, 
                o.orDate, 
                o.customerEmail,
                o.order_type,
                o.orStatus, 
                o.dvStatus, 
                o.dvPrice, 
                o.disPrice, 
                o.totPrice, 
                o.stID, 
                o.expectedDate AS expectedDeliveryDate, 
                ao.itemReceived, 
                ao.status AS acceptanceStatus
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Accepted'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype : order.order_type,
                    orStatus: order.orStatus,
                    dvStatus: order.dvStatus,
                    dvPrice: order.dvPrice,
                    disPrice: order.disPrice,
                    totPrice: order.totPrice,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    itemReceived: order.itemReceived,
                    acceptanceStatus: "Complete", // Default status is Complete
                    acceptanceStatuses: [] // Track individual item statuses
                };
                console.log(order.order_type);
            }

            // Add each item status to the list
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // If any of the items have an "In Production" or "None" status, mark the order as "Incomplete"
            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        // Convert the grouped orders into an array
        const formattedOrders = Object.values(groupedOrders);

        // Send the formatted orders with their acceptance status as a JSON response
        return res.status(200).json({
            message: "Accepted orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching accepted orders:", error.message);
        return res.status(500).json({ message: "Error fetching accepted orders", error: error.message });
    }
});

// Get all orders by status= completed
router.get("/orders-completed", async (req, res) => {
    try {
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT 
                o.OrID, 
                o.orDate, 
                o.customerEmail,
                o.order_type,
                o.orStatus, 
                o.dvStatus, 
                o.dvPrice, 
                o.disPrice, 
                o.totPrice, 
                o.stID, 
                o.expectedDate AS expectedDeliveryDate, 
                ao.itemReceived, 
                ao.status AS acceptanceStatus
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Completed'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype : order.order_type,
                    orStatus: order.orStatus,
                    dvStatus: order.dvStatus,
                    dvPrice: order.dvPrice,
                    disPrice: order.disPrice,
                    totPrice: order.totPrice,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    itemReceived: order.itemReceived,
                    acceptanceStatus: "Complete", // Default status is Complete
                    acceptanceStatuses: [] // Track individual item statuses
                };
            }

            // Add each item status to the list
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // If any of the items have an "In Production" or "None" status, mark the order as "Incomplete"
            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        // Convert the grouped orders into an array
        const formattedOrders = Object.values(groupedOrders);

        // Send the formatted orders with their acceptance status as a JSON response
        return res.status(200).json({
            message: "Accepted orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching accepted orders:", error.message);
        return res.status(500).json({ message: "Error fetching accepted orders", error: error.message });
    }
});

// Get all orders by status= inproduction
router.get("/orders-inproduction", async (req, res) => {
    try {
        // Query the database to fetch all pending Orders
        const [suporders] = await db.query("SELECT * FROM production WHERE status= 'Incomplete'");

        // If no orders found, return a 404 status
        if (suporders.length === 0) {
            return res.status(404).json({ message: "No supplier orders found" });
        }

        // Format orders
        const formattedOrders = suporders.map(order => ({
            p_ID : order.p_ID,
            I_Id : order.I_Id,
            qty : order.qty,
            s_ID : order.s_ID,
            expectedDate : order.expectedDate,
            specialNote: order.specialNote,
            status: order.status
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

// Get all items where stock count is less than or equal to one
router.get("/allitemslessone", async (req, res) => {
    try {
        // Query the database to fetch items with qty <= 1
        const [items] = await db.query(
            "SELECT I_Id, I_name, Ty_id, descrip, price,stockQty, availableQty, img FROM Item WHERE availableQty <= 1"
        );

        // If no items found, return a 404 status with a descriptive message
        if (items.length === 0) {
            return res.status(404).json({ message: "No items found with stock count less than or equal to 1" });
        }

        // Format the items data with necessary fields
        const formattedItems = items.map(item => ({
            I_Id: item.I_Id,
            I_name: item.I_name,
            Ty_id: item.Ty_id,
            descrip: item.descrip,
            price: item.price,
            availableQty: item.availableQty,
            stockQty: item.stockQty,
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert image to base64
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// get all suppliers for the item
router.get("/item-suppliers", async (req, res) => {
    try {
        const { I_Id } = req.query;

        // Validate the input
        if (!I_Id) {
            return res.status(400).json({ success: false, message: "Item ID is required" });
        }

        // Step 1: Fetch the suppliers associated with the item from item_supplier table
        const itemSuppliersQuery = `
            SELECT s_ID
            FROM item_supplier
            WHERE I_Id = ?`;

        const [itemSuppliersResult] = await db.query(itemSuppliersQuery, [I_Id]);

        if (itemSuppliersResult.length === 0) {
            return res.status(404).json({ success: false, message: "No suppliers found for the given item" });
        }

        // Step 2: Extract the supplier IDs from the result
        const supplierIds = itemSuppliersResult.map(row => row.s_ID);

        // Step 3: Fetch the supplier details using the supplier IDs
        const suppliersQuery = `
            SELECT s_ID, name, contact
            FROM Supplier
            WHERE s_ID IN (?)`;

        const [suppliersResult] = await db.query(suppliersQuery, [supplierIds]);

        // Step 4: Return the supplier details
        return res.status(200).json({
            success: true,
            suppliers: suppliersResult,
        });

    } catch (error) {
        console.error("Error fetching item suppliers:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Get all suppliers
router.get("/suppliers", async (req, res) => {
    try {
        // Step 1: Fetch all suppliers
        const suppliersQuery = `
            SELECT s_ID, name, contact
            FROM Supplier`;

        const [suppliersResult] = await db.query(suppliersQuery);

        // Step 2: Check if suppliers were found
        if (suppliersResult.length === 0) {
            return res.status(404).json({ success: false, message: "No suppliers found" });
        }

        // Step 3: Return the supplier details
        return res.status(200).json({
            success: true,
            suppliers: suppliersResult,
        });

    } catch (error) {
        console.error("Error fetching suppliers:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// get item detail in item table only
router.get("/item-detail", async (req, res) => {
    try {
        const { Id } = req.query;

        if (!Id) {
            return res.status(400).json({ success: false, message: "Item ID is required" });
        }

        // Step 1: Fetch Item details
        const itemQuery = `
            SELECT 
                I.I_Id, I.I_name, I.Ty_id, I.descrip, I.price, I.stockQty,I.bookedQty,I.availableQty,
                I.warrantyPeriod, I.img
            FROM Item I
            WHERE I.I_Id = ?`;

        const [itemResult] = await db.query(itemQuery, [Id]);

        if (itemResult.length === 0) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const itemData1 = itemResult[0];
        // Step 2: Construct final response
        const responseData = {
            success: true,
            item: {
                I_Id: itemData1.I_Id,
                I_name: itemData1.I_name,
                price: itemData1.price,
                stockQty: itemData1.stockQty,
                bookedQty: itemData1.bookedQty,
                availableQty: itemData1.availableQty,
            }
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error("Error fetching item details:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// save in production
router.post('/add-production', async (req, res) => {
    const {itemId, qty, supplierId, expectedDate, specialnote} = req.body;

    if (!itemId || !qty || !supplierId || !expectedDate) {
        return res.status(400).json({error: 'All fields are required'});
    }

    const p_ID = `InP_${Date.now()}`;

    const sql = `INSERT INTO production (p_ID, I_Id, qty, s_ID, expectedDate, specialNote,status)
                 VALUES (?, ?, ?, ?, ?, ?,'Incomplete')`;
    const [Result] = await db.query(sql, [p_ID, itemId, qty, supplierId, expectedDate, specialnote]);
    return res.status(200).json({
        success: true,
        message: "Order details fetched successfully",
        result: Result
    });
});

// Get category namees
router.get("/getcategory", async (req, res) => {
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

// Check and update stock receive
router.post('/update-stock', async (req, res) => {
    const { p_ID, rDate, recCount, detail } = req.body;

    // Validate input fields
    if (!p_ID || !rDate || !recCount) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    try {
        // Get the current quantity for the production order
        const [rows] = await db.query("SELECT qty, I_Id FROM production WHERE p_ID = ?", [p_ID]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Production order not found" });
        }

        const currentQty = rows[0].qty;
        const itemId = rows[0].I_Id;
        const receivedQty = parseInt(recCount, 10); // Convert received count to integer

        // Insert received stock details into the stock_received table
        const sqlInsert = `INSERT INTO stock_received (p_ID, rDate, rec_count, detail) VALUES (?, ?, ?, ?)`;
        await db.query(sqlInsert, [p_ID, rDate, receivedQty, detail]);

        // Determine the new status and remaining quantity
        let newStatus = "Incomplete";
        let newQty = currentQty - receivedQty;

        if (receivedQty >= currentQty) {
            // Mark order as complete if received qty is equal or more than the order qty
            newStatus = "Complete";
            newQty = 0;
        }

        // Update the production table with the new status and remaining quantity
        const sqlUpdate = `UPDATE production SET qty = ?, status = ? WHERE p_ID = ?`;
        await db.query(sqlUpdate, [newQty, newStatus, p_ID]);

        // Update the Item table stock quantity
        const sqlUpdateItem = `UPDATE Item SET stockQty = stockQty + ? WHERE I_Id = ?`;
        await db.query(sqlUpdateItem, [receivedQty, itemId]);

        const sqlUpdateItem1 = `UPDATE Item SET availableQty = availableQty + ? WHERE I_Id = ?`;
        await db.query(sqlUpdateItem1, [receivedQty, itemId]);

        return res.status(200).json({
            success: true,
            message: "Stock received updated successfully",
            updatedStatus: newStatus,
            remainingQty: newQty
        });

    } catch (error) {
        console.error("Error updating stock received:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Update order in invoice part
router.put("/update-invoice", async (req, res) => {
    try {
        console.log(req.body);
        const {
            orID,
            isPickup,
            netTotal,
            updatedAdvance,
            updatedDeliveryCharge,
            updatedDiscount
        } = req.body;

        // Check if the order exists
        const orderCheckQuery = `SELECT * FROM Orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orID]);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Update the Orders table
        let orderUpdateQuery = `
            UPDATE Orders
            SET totPrice = ?, disPrice = ?, dvPrice = ?
            WHERE OrID = ?`;
        const orderUpdateParams = [netTotal, updatedDiscount, updatedDeliveryCharge, orID];
        await db.query(orderUpdateQuery, orderUpdateParams);

        // If isPickup is true, update the delivery table
        if (isPickup) {
            // Remove the existing delivery entry for the order
            const deleteDeliveryQuery = `DELETE FROM delivery WHERE orID = ?`;
            await db.query(deleteDeliveryQuery, [orID]);
        }

        // Calculate the balance (netTotal - advance)
        const balance = netTotal - updatedAdvance;

        // Insert the new entry into the order_Payment table
        const insertPaymentQuery = `
            INSERT INTO order_Payment (orID, netTotal, advance, balance)
            VALUES (?, ?, ?, ?)`;
        const paymentParams = [orID, netTotal, updatedAdvance, balance];
        await db.query(insertPaymentQuery, paymentParams);

        return res.status(200).json({
            success: true,
            message: "Order and payment updated successfully",
        });
    } catch (error) {
        console.error("Error updating invoice:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error updating invoice data",
            details: error.message,
        });
    }
});

//
router.get("/orders-accept", async (req, res) => {
    try {
        // Step 1: Fetch all the orders and their associated items' statuses from the accept_orders table.
        const query = `
            SELECT 
                o.OrID, 
                o.orDate, 
                o.customerEmail, 
                o.order_type,
                o.orStatus, 
                o.dvStatus, 
                o.dvPrice, 
                o.disPrice, 
                o.totPrice, 
                o.stID, 
                o.expectedDate AS expectedDeliveryDate, 
                ao.itemReceived, 
                ao.status AS acceptanceStatus
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Accepted'
        `;

        const [orders] = await db.query(query);

        // If no orders are found, return a 404 response.
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        // Step 2: Group orders by OrID.
        const groupedOrders = {};

        // Initialize arrays to hold booked and unbooked orders.
        const bookedOrders = [];
        const unbookedOrders = [];

        // Step 3: Process each order and its items.
        orders.forEach(order => {
            // If the order does not exist in the groupedOrders object, create it.
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype : order.order_type,
                    orStatus: order.orStatus,
                    dvStatus: order.dvStatus,
                    dvPrice: order.dvPrice,
                    disPrice: order.disPrice,
                    totPrice: order.totPrice,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    acceptanceStatuses: [], // Array to track item statuses.
                    isUnbooked: false // Flag to check if the order contains any unbooked item.
                };
            }

            // Add each item status to the list of acceptance statuses.
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // Check the acceptance status of the current item:
            if (order.acceptanceStatus !== "Complete") {
                // If the status is not "Complete", mark the order as unbooked.
                groupedOrders[order.OrID].isUnbooked = true;
            }
        });

        // Step 4: Now, categorize the orders as "booked" or "unbooked".
        Object.values(groupedOrders).forEach(order => {
            if (order.isUnbooked) {
                // If the order has any unbooked item, mark the entire order as unbooked.
                order.acceptanceStatus = "Incomplete";
                unbookedOrders.push(order);
            } else {
                // If all items are booked, mark the order as booked.
                order.acceptanceStatus = "Complete";
                bookedOrders.push(order);
            }
        });

        // Step 5: Send the response with two arrays: bookedOrders and unbookedOrders.
        return res.status(200).json({
            message: "Accepted orders found.",
            bookedOrders: bookedOrders,
            unbookedOrders: unbookedOrders
        });

    } catch (error) {
        console.error("Error fetching accepted orders:", error.message);
        return res.status(500).json({ message: "Error fetching accepted orders", error: error.message });
    }
});

// Update order
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
            deliveryInfo
        } = req.body;

        console.log(orderStatus);

        // Check if the order exists
        const orderCheckQuery = `SELECT * FROM orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orderId]);

        //console.log(orderResult);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // Ensure order status is 'Accepted' if any item is booked
        const isAnyItemBooked = items.some(item => item.booked);
        if (isAnyItemBooked && orderStatus !== "Accepted") {
            return res.status(400).json({
                success: false,
                message: "Order status must be 'Accepted' if any item is booked.",
            });
        }

        // Update the order details
        const orderUpdateQuery = `
            UPDATE orders
            SET orDate = ?, customerEmail = ?, contact1 = ?, contact2 = ?, orStatus = ?,
                dvStatus = ?, dvPrice = ?, disPrice = ?, totPrice = ?, expectedDate = ?, specialNote = ?
            WHERE OrID = ?`;
        const orderUpdateParams = [
            orderDate, customerEmail, phoneNumber, optionalNumber, orderStatus,
            deliveryStatus, deliveryCharge, discount, totalPrice, expectedDeliveryDate, specialNote, orderId
        ];
        const query = await db.query(orderUpdateQuery, orderUpdateParams);

        console.log(query);

        // Handle accept_orders table update
        for (const item of items) {
            const itemReceived = item.booked ? "Yes" : "No";
            const itemStatus = item.booked ? "Complete" : "Incomplete";

            // Check if the record already exists in accept_orders
            const checkAcceptOrderQuery = `SELECT * FROM accept_orders WHERE orID = ? AND I_Id = ?`;
            const [existingRecord] = await db.query(checkAcceptOrderQuery, [orderId, item.itemId]);

            console.log(existingRecord);

            if (existingRecord.length > 0) {
                // If the record exists, update it
                const updateAcceptOrderQuery = `
                    UPDATE accept_orders
                    SET itemReceived = ?, status = ?
                    WHERE orID = ? AND I_Id = ?`;
                await db.query(updateAcceptOrderQuery, [
                    itemReceived, itemStatus, orderId, item.itemId
                ]);
            } else {
                // If the record does not exist, insert a new one
                const insertAcceptOrderQuery = `
                    INSERT INTO accept_orders (orID, I_Id, itemReceived, status)
                    VALUES (?, ?, ?, ?)`;
                await db.query(insertAcceptOrderQuery, [
                    orderId, item.itemId, itemReceived, itemStatus
                ]);
            }
        }

        // Handle booked items & inventory update
        for (const item of items) {
            if (item.booked) {
                const checkBookedItemQuery = `SELECT * FROM booked_item WHERE orID = ? AND I_Id = ?`;
                const [existingBookedItem] = await db.query(checkBookedItemQuery, [orderId, item.itemId]);

                console.log(existingBookedItem);

                if (existingBookedItem.length === 0) {
                    // Insert only if the item is not already booked
                    const bookItemQuery = `
                        INSERT INTO booked_item (orID, I_Id, qty)
                        VALUES (?, ?, ?)`;
                    await db.query(bookItemQuery, [orderId, item.itemId, item.quantity]);

                    // Update inventory (only if booked is TRUE)
                    const updateItemQtyQuery = `
                        UPDATE Item
                        SET bookedQty = bookedQty + ?, availableQty = availableQty - ?
                        WHERE I_Id = ?`;
                    await db.query(updateItemQtyQuery, [item.quantity, item.quantity, item.itemId]);
                }
            } else {
                // If unchecked, remove from booked_item table & restore inventory
                const deleteBookedItemQuery = `DELETE FROM booked_item WHERE orID = ? AND I_Id = ?`;
                await db.query(deleteBookedItemQuery, [orderId, item.itemId]);

                // Restore inventory (only if item was previously booked)
                const checkIfBookedQuery = `SELECT * FROM Item WHERE I_Id = ? AND bookedQty >= ?`;
                const [bookedCheck] = await db.query(checkIfBookedQuery, [item.itemId, item.quantity]);

                if (bookedCheck.length > 0) {
                    const restoreStockQuery = `
                        UPDATE Item
                        SET bookedQty = bookedQty - ?, availableQty = availableQty + ?
                        WHERE I_Id = ?`;
                    await db.query(restoreStockQuery, [item.quantity, item.quantity, item.itemId]);
                }
            }
        }

        // If order status changes to "Pending", remove all bookings and restore stock
        if (orderStatus === "Pending") {
            const bookedItemsQuery = `SELECT I_Id, qty FROM booked_item WHERE orID = ?`;
            const [bookedItems] = await db.query(bookedItemsQuery, [orderId]);

            console.log(bookedItems);

            for (const item of bookedItems) {
                const restoreStockQuery = `
                    UPDATE Item
                    SET bookedQty = bookedQty - ?, availableQty = availableQty + ?
                    WHERE I_Id = ?`;
                await db.query(restoreStockQuery, [item.qty, item.qty, item.I_Id]);
            }

            const deleteBookedItemsQuery = `DELETE FROM booked_item WHERE orID = ?`;
            await db.query(deleteBookedItemsQuery, [orderId]);

            const deleteAcceptOrderQuery = `DELETE FROM accept_orders WHERE orID = ?`;
            await db.query(deleteAcceptOrderQuery, [orderId]);
        }

        // Update order details (items)
        for (const item of items) {
            const orderDetailUpdateQuery = `
                UPDATE Order_Detail
                SET qty = ?, tprice = ?
                WHERE orID = ? AND I_Id = ?`;
            await db.query(orderDetailUpdateQuery, [item.quantity, item.price, orderId, item.itemId]);
        }

        // **Handling delivery status change:**
        if (deliveryStatus === "Delivery" && deliveryInfo) {
            // Check if delivery record exists, if not, insert it
            const checkDeliveryQuery = `SELECT * FROM delivery WHERE orID = ?`;
            const [existingDelivery] = await db.query(checkDeliveryQuery, [orderId]);

            if (existingDelivery.length === 0) {
                const deliveryInsertQuery = `
                    INSERT INTO delivery (orID, address, district, contact, schedule_Date)
                    VALUES (?, ?, ?, ?, ?)`;
                await db.query(deliveryInsertQuery, [
                    orderId, deliveryInfo.address, deliveryInfo.district, phoneNumber, deliveryInfo.scheduleDate
                ]);
            } else {
                // Update delivery info if already exists
                const deliveryUpdateQuery = `
                    UPDATE delivery
                    SET address = ?, district = ?, contact = ?, schedule_Date = ?
                    WHERE orID = ?`;
                await db.query(deliveryUpdateQuery, [
                    deliveryInfo.address, deliveryInfo.district, phoneNumber, deliveryInfo.scheduleDate, orderId
                ]);
            }
        }

        // **Handle the case when changing from Delivery to Pickup**
        if (deliveryStatus === "Pick Up") {
            // Delete existing delivery record if exists
            const checkDeliveryQuery = `SELECT * FROM delivery WHERE orID = ?`;
            const [existingDelivery] = await db.query(checkDeliveryQuery, [orderId]);

            console.log(existingDelivery);

            if (existingDelivery.length > 0) {
                const deleteDeliveryQuery = `DELETE FROM delivery WHERE orID = ?`;
                await db.query(deleteDeliveryQuery, [orderId]);
            }

            // Reset delivery charge (dvPrice) when changing to Pickup
            const updateDeliveryQuery = `UPDATE orders SET dvPrice = 0 WHERE OrID = ?`;
            await db.query(updateDeliveryQuery, [orderId]);
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
router.put("/update-order-details", async (req, res) => {
    try {
        const { orderId, orderDate, customerEmail, phoneNumber, optionalNumber, orderStatus,
            deliveryStatus, deliveryCharge, discount, totalPrice, expectedDeliveryDate, specialNote } = req.body;

        // Check if the order exists
        const orderCheckQuery = `SELECT * FROM orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Update order details
        const orderUpdateQuery = `
            UPDATE orders SET orDate = ?, customerEmail = ?, contact1 = ?, contact2 = ?, orStatus = ?, 
            dvStatus = ?, dvPrice = ?, disPrice = ?, totPrice = ?, expectedDate = ?, specialNote = ?
            WHERE OrID = ?`;
        await db.query(orderUpdateQuery, [
            orderDate, customerEmail, phoneNumber, optionalNumber, orderStatus, deliveryStatus,
            deliveryCharge, discount, totalPrice, expectedDeliveryDate, specialNote, orderId
        ]);
        console.log("sucess");
        // return res.status(200).json({ success: true, message: "Order details updated successfully" });
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
router.put("/update-order-items", async (req, res) => {
    try {
        const { orderId, orderStatus, items } = req.body;

        if (!items || items.length === 0) {
            return res.status(400).json({ success: false, message: "No items provided." });
        }

        // Ensure order status is 'Accepted' if any item is booked
        const isAnyItemBooked = items.some(item => item.booked);
        if (isAnyItemBooked && orderStatus !== "Accepted") {
            return res.status(400).json({ success: false, message: "Order status must be 'Accepted' if any item is booked." });
        }

        for (const item of items) {
            const itemReceived = item.booked ? "Yes" : "No";
            const itemStatus = item.booked ? "Complete" : "Incomplete";

            // Check if the record exists in accept_orders
            const checkAcceptOrderQuery = `SELECT * FROM accept_orders WHERE orID = ? AND I_Id = ?`;
            const [existingRecord] = await db.query(checkAcceptOrderQuery, [orderId, item.itemId]);

            if (existingRecord.length > 0) {
                const updateAcceptOrderQuery = `UPDATE accept_orders SET itemReceived = ?, status = ? WHERE orID = ? AND I_Id = ?`;
                await db.query(updateAcceptOrderQuery, [itemReceived, itemStatus, orderId, item.itemId]);
            } else {
                const insertAcceptOrderQuery = `INSERT INTO accept_orders (orID, I_Id, itemReceived, status) VALUES (?, ?, ?, ?)`;
                await db.query(insertAcceptOrderQuery, [orderId, item.itemId, itemReceived, itemStatus]);
            }

            // Handle booking & inventory
            if (item.booked) {
                const checkBookedItemQuery = `SELECT * FROM booked_item WHERE orID = ? AND I_Id = ?`;
                const [existingBookedItem] = await db.query(checkBookedItemQuery, [orderId, item.itemId]);

                if (existingBookedItem.length === 0) {
                    const bookItemQuery = `INSERT INTO booked_item (orID, I_Id, qty) VALUES (?, ?, ?)`;
                    await db.query(bookItemQuery, [orderId, item.itemId, item.quantity]);

                    // Update inventory
                    const updateItemQtyQuery = `UPDATE Item SET bookedQty = bookedQty + ?, availableQty = availableQty - ? WHERE I_Id = ?`;
                    await db.query(updateItemQtyQuery, [item.quantity, item.quantity, item.itemId]);
                }
            } else {
                // Remove from booked items & restore inventory
                const deleteBookedItemQuery = `DELETE FROM booked_item WHERE orID = ? AND I_Id = ?`;
                await db.query(deleteBookedItemQuery, [orderId, item.itemId]);

                const checkIfBookedQuery = `SELECT * FROM Item WHERE I_Id = ? AND bookedQty >= ?`;
                const [bookedCheck] = await db.query(checkIfBookedQuery, [item.itemId, item.quantity]);

                if (bookedCheck.length > 0) {
                    const restoreStockQuery = `UPDATE Item SET bookedQty = bookedQty - ?, availableQty = availableQty + ? WHERE I_Id = ?`;
                    await db.query(restoreStockQuery, [item.quantity, item.quantity, item.itemId]);
                }
            }
        }

        return res.status(200).json({ success: true, message: "Order items updated successfully" });

    } catch (error) {
        console.error("Error updating order items:", error.message);
        return res.status(500).json({ success: false, message: "Database update failed", details: error.message });
    }
});
router.put("/update-delivery", async (req, res) => {
    try {
        const { orderId, deliveryStatus, phoneNumber, deliveryInfo } = req.body;

        if (!orderId || !deliveryStatus) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        if (deliveryStatus === "Delivery" && deliveryInfo) {
            // Check if a delivery record already exists
            const checkDeliveryQuery = `SELECT * FROM delivery WHERE orID = ?`;
            const [existingDelivery] = await db.query(checkDeliveryQuery, [orderId]);

            if (existingDelivery.length > 0) {
                // Update existing delivery record
                const deliveryUpdateQuery = `UPDATE delivery SET address = ?, district = ?, contact = ?, schedule_Date = ? WHERE orID = ?`;
                await db.query(deliveryUpdateQuery, [deliveryInfo.address, deliveryInfo.district, phoneNumber, deliveryInfo.scheduleDate, orderId]);
            } else {
                // Insert new delivery record
                const insertDeliveryQuery = `INSERT INTO delivery (orID, address, district, contact, schedule_Date) VALUES (?, ?, ?, ?, ?)`;
                await db.query(insertDeliveryQuery, [orderId, deliveryInfo.address, deliveryInfo.district, phoneNumber, deliveryInfo.scheduleDate]);
            }
        }

        if (deliveryStatus === "Pick Up") {
            // Remove any existing delivery record
            const deleteDeliveryQuery = `DELETE FROM delivery WHERE orID = ?`;
            await db.query(deleteDeliveryQuery, [orderId]);

            // Update the delivery price to 0 in orders
            const updateDeliveryQuery = `UPDATE orders SET dvPrice = 0 WHERE orID = ?`;
            await db.query(updateDeliveryQuery, [orderId]);
        }

        return res.status(200).json({ success: true, message: "Delivery information updated successfully" });

    } catch (error) {
        console.error("Error updating delivery information:", error.message);
        return res.status(500).json({ success: false, message: "Database update failed", details: error.message });
    }
});


//Get All sale team members
router.get("/salesteam", async (req, res) => {
    try {
        // Query the database to fetch all sales team members
        const [salesTeam] = await db.query(`
            SELECT 
                st.stID, 
                st.target, 
                st.currentRate, 
                e.E_Id, 
                e.name AS employeeName, 
                e.address, 
                e.nic, 
                e.dob, 
                e.contact, 
                e.job, 
                e.basic
            FROM sales_team st
            JOIN Employee e ON st.E_Id = e.E_Id;
        `);

        // If no sales team members found, return a 404 status
        if (salesTeam.length === 0) {
            return res.status(404).json({ message: "No sales team members found" });
        }

        // Format the response data
        const formattedSalesTeam = salesTeam.map(member => ({
            stID: member.stID,
            E_Id: member.E_Id,
            employeeName: member.employeeName,
            address: member.address,
            nic: member.nic,
            dob: member.dob,
            contact: member.contact,
            job: member.job,
            basic: member.basic,
            target: member.target,
            currentRate: member.currentRate
        }));

        // Send the formatted data as a JSON response
        return res.status(200).json({
            message: "Sales team members found.",
            data: formattedSalesTeam
        });

    } catch (error) {
        console.error("Error fetching sales team members:", error.message);
        return res.status(500).json({ message: "Error fetching sales team members" });
    }
});

// Get orders for a specific sales team member (stID)
router.get("/orders/by-sales-team", async (req, res) => {
    try {
        const { stID } = req.query;
        console.log(stID);

        // Query the database to fetch sales team member details and their orders using a JOIN
        const [results] = await db.query(`
            SELECT 
                e.name AS employeeName, 
                e.contact AS employeeContact,
                e.nic AS employeeNic,
                e.dob AS employeeDob,
                e.address AS employeeAddress,
                e.job AS employeeJob,
                e.basic AS employeeBasic,
                st.stID,
                st.target,
                st.currentRate,
                o.OrID AS orderId,
                o.orDate AS orderDate,
                o.totPrice AS totalPrice
            FROM sales_team st
            JOIN Employee e ON e.E_Id = st.E_Id
            LEFT JOIN Orders o ON o.stID = st.stID
            WHERE st.stID = ?;
        `, [stID]);

        // Check if we have any data for the given sales team
        if (results.length === 0) {
            return res.status(404).json({ message: "No orders found for this sales team member." });
        }

        // Prepare the response with sales team details and orders
        const memberDetails = {
            employeeName: results[0].employeeName,
            employeeContact: results[0].employeeContact,
            employeeNic: results[0].employeeNic,
            employeeDob: results[0].employeeDob,
            employeeAddress: results[0].employeeAddress,
            employeeJob: results[0].employeeJob,
            employeeBasic: results[0].employeeBasic,
            stID: results[0].stID,
            target: results[0].target,
            currentRate: results[0].currentRate,
        };

        const orders = results.map(order => ({
            orderId: order.orderId,
            orderDate: order.orderDate,
            totalPrice: order.totalPrice
        }));

        // Send the member details and orders as a JSON response
        return res.status(200).json({
            message: "Sales team details and orders fetched successfully.",
            data: {
                memberDetails,
                orders
            }
        });

    } catch (error) {
        console.error("Error fetching orders and member details:", error.message);
        return res.status(500).json({ message: "Error fetching orders and member details." });
    }
});

// Get all categories
router.get("/categories", async (req, res) => {
    try {
        // Query the database to fetch all categories
        const [categories] = await db.query("SELECT * FROM Category");

        // If no categories found, return a 404 status
        if (categories.length === 0) {
            return res.status(404).json({ message: "No categories found" });
        }

        // Map through categories to format the response
        const formattedCategories = categories.map(category => ({
            id: category.Ca_Id,  // Assuming you have a Ca_Id column for the category ID
            name: category.name   // Assuming you have a name column for the category name
        }));

        // Send the formatted categories as a JSON response
        return res.status(200).json(formattedCategories);
    } catch (error) {
        console.error("Error fetching categories:", error.message);
        return res.status(500).json({ message: "Error fetching categories" });
    }
});

//API to Get All Sub Categories (sub_one and sub_two) by Category ID (Ca_Id):
router.get("/types", async (req, res) => {
    try {
        const { Ca_Id } = req.query; // Get Category ID from the query parameters

        if (!Ca_Id) {
            return res.status(400).json({ message: "Category ID is required." });
        }

        // Query the database to fetch all types for the given Ca_Id
        const [types] = await db.query(`
            SELECT Ty_Id, sub_one, sub_two
            FROM Type
            WHERE Ca_Id = ?;
        `, [Ca_Id]);

        // If no types found for this category, return a 404 status
        if (types.length === 0) {
            return res.status(404).json({ message: "No types found for this category." });
        }

        // Send the types as a JSON response
        return res.status(200).json({
            message: "Types found.",
            types: types,
        });

    } catch (error) {
        console.error("Error fetching types:", error.message);
        return res.status(500).json({ message: "Error fetching types" });
    }
});

// find type by cat name
router.get("/types-cat", async (req, res) => {
    try {
        const { category_name } = req.query; // Get Category name from the query parameters

        if (!category_name) {
            return res.status(400).json({ message: "Category name is required." });
        }

        // Step 1: Query the Category table to get the Ca_Id based on the category_name
        const [categoryResult] = await db.query(`
            SELECT Ca_Id
            FROM Category
            WHERE name = ?;
        `, [category_name]);

        // If no category found, return an error
        if (categoryResult.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const Ca_Id = categoryResult[0].Ca_Id; // Extract the Ca_Id from the result

        // Step 2: Query the Type table to fetch all types for the given Ca_Id
        const [types] = await db.query(`
            SELECT Ty_Id, sub_one, sub_two
            FROM Type
            WHERE Ca_Id = ?;
        `, [Ca_Id]);

        // If no types found for this category, return a 404 status
        if (types.length === 0) {
            return res.status(404).json({ message: "No types found for this category." });
        }

        // Step 3: Return the found types
        return res.status(200).json({
            message: "Types found.",
            types: types,
        });

    } catch (error) {
        console.error("Error fetching types:", error.message);
        return res.status(500).json({ message: "Error fetching types" });
    }
});

// Find Type id
router.get("/find-types", async (req, res) => {
    try {
        const { Ca_Id, sub_one, sub_two } = req.query; // Get Category ID, sub_one, and sub_two from the query parameters

        if (!Ca_Id || !sub_one || !sub_two) {
            return res.status(400).json({ message: "Category ID, Sub One, and Sub Two are required." });
        }

        // Query the database to fetch the type for the given Ca_Id, sub_one, and sub_two
        const [types] = await db.query(`
            SELECT Ty_Id, sub_one, sub_two
            FROM Type
            WHERE Ca_Id = ? AND sub_one = ? AND sub_two = ?;
        `, [Ca_Id, sub_one, sub_two]);

        // If no type found for this combination, return a 404 status
        if (types.length === 0) {
            return res.status(404).json({ message: "No type found for this category and sub-one/sub-two combination." });
        }
        console.log(types[0]);

        // Send the type as a JSON response
        return res.status(200).json({
            message: "Type found.",
            type: types[0],  // Return only the first matching type
        });

    } catch (error) {
        console.error("Error fetching types:", error.message);
        return res.status(500).json({ message: "Error fetching types" });
    }
});

// Find type id when category name comes
router.get("/find-types-cat", async (req, res) => {
    try {
        const { category_name, sub_one, sub_two } = req.query; // Get Category name, sub_one, and sub_two from the query parameters

        if (!category_name || !sub_one || !sub_two) {
            return res.status(400).json({ message: "Category name, Sub One, and Sub Two are required." });
        }

        // Step 1: Query the Category table to get the Ca_Id based on the category name
        const [categoryResult] = await db.query(`
            SELECT Ca_Id
            FROM Category
            WHERE name = ?;
        `, [category_name]);

        // If no category found, return an error
        if (categoryResult.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const Ca_Id = categoryResult[0].Ca_Id; // Extract the Ca_Id from the result

        // Step 2: Query the Type table to find the Ty_Id based on Ca_Id, sub_one, and sub_two
        const [types] = await db.query(`
            SELECT Ty_Id, sub_one, sub_two
            FROM Type
            WHERE Ca_Id = ? AND sub_one = ? AND sub_two = ?;
        `, [Ca_Id, sub_one, sub_two]);

        // If no type found for this combination, return a 404 status
        if (types.length === 0) {
            return res.status(404).json({ message: "No type found for this category and sub-one/sub-two combination." });
        }

        console.log(types[0]);

        // Step 3: Return the found Type data
        return res.status(200).json({
            message: "Type found.",
            type: types[0],  // Return only the first matching type
        });

    } catch (error) {
        console.error("Error fetching types:", error.message);
        return res.status(500).json({ message: "Error fetching types" });
    }
});


// API endpoint to save item-supplier association
router.post('/add-item-supplier', async (req, res) => {
    const { I_Id, s_ID ,cost } = req.body;

    // Check if I_Id and s_ID are provided
    if (!I_Id || !s_ID ) {
        return res.status(400).json({ success: false, message: 'Item ID and Supplier ID are required' });
    }

    try {
        // Step 1: Check if the Item ID exists in the Item table
        const [itemExists] = await db.query('SELECT * FROM Item WHERE I_Id = ?', [I_Id]);
        if (itemExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Item not found' });
        }

        // Step 2: Check if the Supplier ID exists in the Supplier table
        const [supplierExists] = await db.query('SELECT * FROM Supplier WHERE s_ID = ?', [s_ID]);
        if (supplierExists.length === 0) {
            return res.status(404).json({ success: false, message: 'Supplier not found' });
        }

        // Step 3: Insert the item-supplier relationship into the item_supplier table
        const insertQuery = 'INSERT INTO item_supplier (I_Id, s_ID,unit_cost) VALUES (?, ?,?)';
        const [result] = await db.query(insertQuery, [I_Id, s_ID,cost]);

        // Step 4: Return success response
        return res.status(200).json({ success: true, message: 'Item-Supplier relationship added successfully', data: result });
    } catch (error) {
        console.error('Error adding item-supplier:', error.message);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// API to save stock received data
router.post("/add-stock-received", async (req, res) => {
    try {
        const { supplierId, itemId, date, stockCount, comment } = req.body;

        // Validate required fields
        if (!supplierId || !itemId || !date || !stockCount ) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        // Insert stock received record
        const insertQuery = `
                INSERT INTO main_stock_received (s_ID, I_Id, rDate, rec_count,  detail)
                VALUES (?, ?, ?, ?, ?)
            `;
        const values = [supplierId, itemId, date, stockCount, comment || ""];
        const [result] = await db.query(insertQuery, values);
        const receivedStockId = result.insertId;

        // Update stockQty and availableQty in Item table
        const updateItemQuery = `
                UPDATE Item 
                SET stockQty = stockQty + ?, availableQty = availableQty + ?
                WHERE I_Id = ?
            `;
        const [result1] =await db.query(updateItemQuery, [stockCount, stockCount, itemId]);

        // Get last stock_Id for this item
        const getLastStockIdQuery = `SELECT MAX(stock_Id) AS lastStockId FROM m_s_r_detail WHERE I_Id = ?`;
        const [lastStockResult] = await db.query(getLastStockIdQuery, [itemId]);
        let lastStockId = lastStockResult[0]?.lastStockId || 0; // Default to 0 if no previous stock exists

        // Insert stock details in m_s_r_detail
        const insertDetailQuery = `INSERT INTO m_s_r_detail (I_Id, stock_Id,sr_ID) VALUES (?, ?,?)`;
        for (let i = 1; i <= stockCount; i++) {
            lastStockId++;
            const query = await db.query(insertDetailQuery, [itemId, lastStockId,receivedStockId]);
        }

        return res.status(201).json({
            success: true,
            message: "Stock received successfully added and inventory updated!",
            stockReceivedId: receivedStockId,
        });
    } catch (error) {
        console.error("Error adding stock received:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Find cost by sid and iid
router.get("/find-cost", async (req, res) => {
    try {
        const { s_ID , I_Id } = req.query;

        if (!s_ID || !I_Id ) {
            return res.status(400).json({ message: "Item ID, Supplier Id are required." });
        }

        // Query the database to fetch the type for the given Ca_Id, sub_one, and sub_two
        const [cost] = await db.query(`
            SELECT unit_cost
            FROM item_supplier
            WHERE s_ID = ? AND I_Id = ? ;
        `, [s_ID,I_Id]);

        // If no type found for this combination, return a 404 status
        if (cost.length === 0) {
            return res.status(404).json({ message: "No cost found." });
        }

        // Send the type as a JSON response
        return res.status(200).json({
            message: "Cost found.",
            cost: cost[0],  // Return only the first matching cost
        });

    } catch (error) {
        console.error("Error fetching cost:", error.message);
        return res.status(500).json({ message: "Error fetching cost" });
    }
});

// Get subcat one detail by ca_id
router.get("/getSubcategories", async (req, res) => {
    const { Ca_Id } = req.query;
    console.log(Ca_Id);
    if (!Ca_Id) {
        return res.status(400).json({
            success: false,
            message: "Category ID (Ca_Id) is required",
        });
    }

    try {
        // Fetch subcategories under the given category ID
        const sqlSubcategories = `SELECT sb_c_id, subcategory FROM subCat_one WHERE Ca_Id = ?`;
        const [subCategories] = await db.query(sqlSubcategories, [Ca_Id]);

        if (subCategories.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No subcategories found for the given category ID",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subcategories retrieved successfully",
            data: subCategories.map(subCat => ({
                sb_c_id: subCat.sb_c_id,
                subcategory: subCat.subcategory
            })),
        });

    } catch (err) {
        console.error("Error fetching subcategories:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching data from database",
            details: err.message,
        });
    }
});

// // Get subcat two detail by ca_id
router.get("/getSubcategoriesTwo", async (req, res) => {
    const { sb_c_id } = req.query;

    if (!sb_c_id) {
        return res.status(400).json({
            success: false,
            message: "Subcategory One ID (sb_c_id) is required",
        });
    }

    try {
        // Fetch subcategory two names under the given subcategory one ID
        const sqlSubcategoriesTwo = `SELECT sb_cc_id, subcategory FROM subCat_two WHERE sb_c_id = ?
        `;
        const [subCategoriesTwo] = await db.query(sqlSubcategoriesTwo, [sb_c_id]);

        if (subCategoriesTwo.length === 0) {
            return res.status(200).json({
                success: true,
                message: "No subcategories found",
                data: [{ sb_cc_id: "None", subcategory: "None" }],
            });
        }

        return res.status(200).json({
            success: true,
            message: "Subcategories retrieved successfully",
            data: subCategoriesTwo.map(subCat => ({
                sb_cc_id: subCat.sb_cc_id,
                subcategory: subCat.subcategory
            })),
        });

    } catch (err) {
        console.error("Error fetching subcategories:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching data from database",
            details: err.message,
        });
    }
});

// Save New Category
router.post("/category", async (req, res) => {
    try {
        // Fetch the last inserted category ID
        const [lastCategory] = await db.query("SELECT Ca_Id FROM Category ORDER BY Ca_Id DESC LIMIT 1");

        let newId;
        if (lastCategory.length > 0) {
            // Extract the number from the last ID and increment
            const lastIdNumber = parseInt(lastCategory[0].Ca_Id.split("_")[1], 10);
            newId = `Ca_${String(lastIdNumber + 1).padStart(4, "0")}`;
        } else {
            // If no categories exist, start from Ca_0001
            newId = "Ca_0001";
        }

        // SQL query to insert new category
        const sql = `INSERT INTO Category (Ca_Id, name) VALUES (?, ?)`;
        const values = [newId, req.body.Catname];

        // Execute the insert query
        await db.query(sql, values);

        // Return success response with the new category details
        return res.status(201).json({
            success: true,
            message: "Category added successfully",
            data: {
                Ca_Id: newId,
                name: req.body.Catname
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

// Save New Sub category one and two with image
router.post("/subcategory", upload.fields([{ name: "subcatone_img" }, { name: "subcattwo_img" }]), async (req, res) => {
    const { Ca_Id, sub_one, sub_two } = req.body;
    const subcatone_img = req.files["subcatone_img"] ? req.files["subcatone_img"][0].buffer : null;
    const subcattwo_img = req.files["subcattwo_img"] ? req.files["subcattwo_img"][0].buffer : null;

    try {
        // Generate ID for subCat_one
        const sb_c_id = await generateNewId("subCat_one", "sb_c_id", "S1");

        // Insert into subCat_one
        await db.query(
            "INSERT INTO subCat_one (sb_c_id, subcategory, Ca_Id, img) VALUES (?, ?, ?, ?)",
            [sb_c_id, sub_one, Ca_Id, subcatone_img]
        );

        let sb_cc_id = null;
        if (sub_two !== "None" && subcattwo_img) {
            // Generate ID for subCat_two
            sb_cc_id = await generateNewId("subCat_two", "sb_cc_id", "S2");

            // Insert into subCat_two
            await db.query(
                "INSERT INTO subCat_two (sb_cc_id, subcategory, sb_c_id, img) VALUES (?, ?, ?, ?)",
                [sb_cc_id, sub_two, sb_c_id, subcattwo_img]
            );
        }

        return res.status(201).json({
            success: true,
            message: "Sub-category added successfully",
            data: {
                sb_c_id,
                sub_one,
                Ca_Id,
                sb_cc_id: sb_cc_id || null,
                sub_two: sb_cc_id ? sub_two : null,
            },
        });
    } catch (err) {
        console.error("Error inserting sub-category data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// API to save or retrieve existing Type
router.post("/type", async (req, res) => {
    const { Ca_Id, sub_one, sub_two } = req.body;
    console.log(req.body);

    if (!Ca_Id || !sub_one) {
        return res.status(400).json({
            success: false,
            message: "Ca_Id and sub_one are required.",
        });
    }

    try {
        // Check if a Type entry already exists
        const [existing] = await db.query(
            "SELECT * FROM Type WHERE Ca_Id = ? AND sub_one = ? AND (sub_two = ? OR ? IS NULL)",
            [Ca_Id, sub_one, sub_two, sub_two]
        );

        if (existing.length > 0) {
            return res.status(200).json({
                success: true,
                message: "Type already exists.",
                data: existing[0],
            });
        }

        // Generate new Type ID
        const newTypeId = await generateNewId("Type", "Ty_Id", "Ty");

        // Insert new Type entry
        await db.query(
            "INSERT INTO Type (Ty_Id, Ca_Id, sub_one, sub_two) VALUES (?, ?, ?, ?)",
            [newTypeId, Ca_Id, sub_one, sub_two || null]
        );

        return res.status(201).json({
            success: true,
            message: "Type added successfully.",
            data: {
                Ty_Id: newTypeId,
                Ca_Id,
                sub_one,
                sub_two: sub_two || null,
            },
        });
    } catch (err) {
        console.error("Error saving type:", err);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});


// Function to generate new ida
const generateNewId = async (table, column, prefix) => {
    const [rows] = await db.query(`SELECT ${column} FROM ${table} ORDER BY ${column} DESC LIMIT 1`);
    if (rows.length === 0) return `${prefix}_001`; // First entry
    const lastId = rows[0][column]; // Get last ID
    const lastNum = parseInt(lastId.split("_")[1], 10) + 1; // Extract number and increment
    return `${prefix}_${String(lastNum).padStart(3, "0")}`;
};


export default router;
