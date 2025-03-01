import express from 'express';
import upload from "../middlewares/upload.js";
import db from '../utils/db.js';
import bwipjs from 'bwip-js';
import path from "path";
import fs from "fs";
const router = express.Router();

// Save  new item
router.post("/add-item", upload.fields([{ name: "img", maxCount: 1 }, { name: "img1", maxCount: 1 }, { name: "img2", maxCount: 1 }, { name: "img3", maxCount: 1 }]), async (req, res) => {
    try {
        const { I_Id, I_name, descrip, color, price, warrantyPeriod, cost, material, s_Id, minQty, Ca_Id, sub_one, sub_two } = req.body;
        const parsedPrice = parseFloat(price) || 0;
        const parsedCost = parseFloat(cost) || 0;

        // ✅ Check if main category exists
        const [mainCatCheck] = await db.query(`SELECT name FROM Category WHERE Ca_Id = ?`, [Ca_Id]);
        if (mainCatCheck.length === 0) {
            return res.status(400).json({ success: false, message: `Invalid Main Category: ${Ca_Id}` });
        }
        const mainCategoryName = mainCatCheck[0].name;

        // ✅ Check if subCat_one exists
        const [subCatOneCheck] = await db.query(`SELECT subcategory FROM subCat_one WHERE sb_c_id = ?`, [sub_one]);
        if (subCatOneCheck.length === 0) {
            return res.status(400).json({ success: false, message: `Invalid Sub Category One: ${sub_one}` });
        }
        const subCatOneName = subCatOneCheck[0].subcategory;

        // ✅ Check if subCat_two exists or set as 'None'
        let subCatTwoName = 'None';
        if (sub_two !== 'None') {
            const [subCatTwoCheck] = await db.query(`SELECT subcategory FROM subCat_two WHERE sb_cc_id = ?`, [sub_two]);
            if (subCatTwoCheck.length === 0) {
                return res.status(400).json({ success: false, message: `Invalid Sub Category Two: ${sub_two}` });
            }
            subCatTwoName = subCatTwoCheck[0].subcategory;
        }

        // ✅ Check if supplier exists
        const [supplierCheck] = await db.query(`SELECT s_ID FROM Supplier WHERE s_ID = ?`, [s_Id]);
        if (supplierCheck.length === 0) {
            return res.status(400).json({ success: false, message: `Invalid Supplier ID: ${s_Id}` });
        }

        // ✅ Extract image buffers (only main image required)
        const imgBuffer = req.files["img"]?.[0]?.buffer || null;
        const img1Buffer = req.files["img1"]?.[0]?.buffer || null;
        const img2Buffer = req.files["img2"]?.[0]?.buffer || null;
        const img3Buffer = req.files["img3"]?.[0]?.buffer || null;

        if (!imgBuffer) {
            return res.status(400).json({ success: false, message: "Main image (img) is required." });
        }

        // ✅ Insert into `Item` table
        const itemSql = `
            INSERT INTO Item (I_Id, I_name, descrip, color, material, price, stockQty, bookedQty, availableQty, minQTY, img, img1, img2, img3, warrantyPeriod, mn_Cat, sb_catOne, sb_catTwo)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?);
        `;
        await db.query(itemSql, [
            I_Id,
            I_name,
            descrip,
            color,
            material,
            parsedPrice,
            minQty,
            imgBuffer,
            img1Buffer,
            img2Buffer,
            img3Buffer,
            warrantyPeriod,
            mainCategoryName,
            subCatOneName,
            subCatTwoName
        ]);

        // ✅ Insert into `Item_supplier` table
        const supplierSql = `INSERT INTO item_supplier (I_Id, s_ID, unit_cost) VALUES (?, ?, ?);`;
        await db.query(supplierSql, [I_Id, s_Id, parsedCost]);

        res.status(201).json({
            success: true,
            message: "✅ Item added successfully!",
            data: {
                I_Id,
                I_name,
                descrip,
                color,
                material,
                price: parsedPrice,
                warrantyPeriod,
                cost: parsedCost,
                mn_Cat: mainCategoryName,
                sb_catOne: subCatOneName,
                sb_catTwo: subCatTwoName
            }
        });
    } catch (err) {
        console.error("❌ Error inserting item data:", err.message);
        res.status(500).json({ success: false, message: "Error inserting data into database", details: err.message });
    }
});

// Update item
router.put("/update-item", upload.fields([{ name: "img", maxCount: 1 }, { name: "img1", maxCount: 1 }, { name: "img2", maxCount: 1 }, { name: "img3", maxCount: 1 },]), async (req, res) => {
        try {
            const {I_Id, I_name, descrip, color, material, price, warrantyPeriod, stockQty, bookedQty, availableQty, maincategory, sub_one, sub_two, suppliers,} = req.body;

            if (!I_Id) {
                return res.status(400).json({ success: false, message: "Item ID is required." });
            }

            // ✅ Log received files and form data
            const [itemCheckResult] = await db.query(`SELECT * FROM Item WHERE I_Id = ?`, [I_Id]);
            if (itemCheckResult.length === 0) {
                return res.status(404).json({ success: false, message: "Item not found." });
            }

            const parsedPrice = parseFloat(price) || 0;

            // ✅ Properly extract image buffers
            const imgBuffer = req.files["img"]?.[0]?.buffer || null;
            const img1Buffer = req.files["img1"]?.[0]?.buffer || null;
            const img2Buffer = req.files["img2"]?.[0]?.buffer || null;
            const img3Buffer = req.files["img3"]?.[0]?.buffer || null;

            // ✅ Fetch subcategory names
            let subCatOneName = null;
            let subCatTwoName = sub_two !== "None" ? null : "None";

            if (sub_one) {
                const [subOneResult] = await db.query(`SELECT subcategory FROM subCat_one WHERE sb_c_id = ?`, [sub_one]);
                subCatOneName = subOneResult[0]?.subcategory || null;
            }

            if (sub_two !== "None") {
                const [subTwoResult] = await db.query(`SELECT subcategory FROM subCat_two WHERE sb_cc_id = ?`, [sub_two]);
                subCatTwoName = subTwoResult[0]?.subcategory || null;
            }

            let updateFields = [];
            let updateValues = [];

            // ✅ Dynamic field updates
            const fields = {
                I_name, descrip, color, material, price: parsedPrice, warrantyPeriod, stockQty, bookedQty, availableQty, mn_Cat: maincategory, sb_catOne: subCatOneName, sb_catTwo: subCatTwoName, img: imgBuffer, img1: img1Buffer, img2: img2Buffer, img3: img3Buffer,
            };

            for (const key in fields) {
                if (fields[key] !== undefined && fields[key] !== null) {
                    updateFields.push(`${key} = ?`);
                    updateValues.push(fields[key]);
                }
            }

            if (updateFields.length > 0) {
                const updateQuery = `UPDATE Item SET ${updateFields.join(", ")} WHERE I_Id = ?`;
                updateValues.push(I_Id);
                await db.query(updateQuery, updateValues);
            }

            // ✅ Handle suppliers
            if (suppliers) {
                let supplierData = typeof suppliers === "string" ? JSON.parse(suppliers) : suppliers;
                if (Array.isArray(supplierData)) {
                    for (const { s_ID, unit_cost } of supplierData) {
                        const parsedUnitCost = parseFloat(unit_cost) || 0;
                        await db.query(
                            `INSERT INTO item_supplier (I_Id, s_ID, unit_cost)
                             VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE unit_cost = VALUES(unit_cost)`,
                            [I_Id, s_ID, parsedUnitCost]
                        );
                    }
                }
            }

            res.status(200).json({
                success: true,
                message: "Item updated successfully",
                data: { I_Id, I_name },
            });
        } catch (err) {
            console.error("❌ Error updating item:", err.message);
            res.status(500).json({ success: false, message: "Error updating item", details: err.message });
        }
    });

// Save a order
router.post("/orders", async (req, res) => {
    try {
        const {
            dvStatus,
            address,
            city,
            district,
            email,
            name,
            phoneNumber,
            otherNumber,
            items,
            totalBillPrice,
            deliveryPrice,
            discountAmount,
            totalItemPrice,
            couponCode,
            expectedDate,
            specialNote,
        } = req.body;

        // Calculate net total, balance
        const netTotal = parseFloat(totalBillPrice) ; // Ensure it's a valid number
        const advance = 0;  // Advance is explicitly set to 0
        const balance = netTotal - parseFloat(advance);  // Balance calculation

        // Generate unique order ID
        const orID = `ORD_${Date.now()}`;
        const orderDate = new Date().toISOString().split("T")[0]; // Get current date

        // Initialize stID to null
        let stID = null;

        // Check if a coupon is provided, if yes fetch associated stID
        if (couponCode) {
            // Fetch the stID associated with the provided coupon ID (cpID)
            const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
            const [couponResult] = await db.query(couponQuery, [couponCode]);

            if (couponResult.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid coupon code"
                });
            }

            // Set the sales team ID (stID) from the coupon
            stID = couponResult[0].stID;

            // Update sales_team table: update totalOrder
            const newTotalOrder = (parseFloat(totalItemPrice) - parseFloat(discountAmount));  // (Total Bill Price - discountAmount)
            const updateSalesTeamQuery = `
                UPDATE sales_team
                SET totalOrder = totalOrder + ?
                WHERE stID = ?
            `;
            await db.query(updateSalesTeamQuery, [newTotalOrder, stID]);
        }

        // Insert Order
        let orderQuery = `
            INSERT INTO Orders (OrID, orDate, custName, customerEmail, contact1, contact2, orStatus, delStatus, city, delPrice, discount, total, stID, expectedDate, specialNote, ordertype,advance,balance,payStatus)
            VALUES (?, ?, ?, ?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?, ?,?, 'on-site',?,?,'Pending')`;
        let orderParams = [orID, orderDate, name, email, phoneNumber, otherNumber, dvStatus, city, parseFloat(deliveryPrice), parseFloat(discountAmount), parseFloat(totalBillPrice), stID, expectedDate, specialNote,advance,balance];

        await db.query(orderQuery, orderParams);

        // Insert Order Details
        for (const item of items) {
            let orderDetailQuery = `
                INSERT INTO Order_Detail (orID, I_Id, qty, tprice)
                VALUES (?, ?, ?, ?)`;
            let orderDetailParams = [orID, item.I_Id, item.qty, parseFloat(item.price)];

            await db.query(orderDetailQuery, orderDetailParams);
        }

        // Insert Delivery Info if delivery is selected
        if (dvStatus === "Delivery") {
            const dvID = `DLV_${Date.now()}`;
            let deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, contact, status, schedule_Date)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?)`;
            let deliveryParams = [dvID, orID, address, district, phoneNumber, expectedDate];

            await db.query(deliveryQuery, deliveryParams);
        }

        // Insert Coupon Info if a coupon is used
        if (couponCode) {
            const ocID = `OCP_${Date.now()}`;
            let couponQuery = `
                INSERT INTO order_coupon (ocID, orID, cpID)
                VALUES (?, ?, ?)`;
            let couponParams = [ocID, orID, couponCode];

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
            ordertype : order.ordertype,
            orStatus : order.orStatus,
            delStatus : order.delStatus,
            delPrice : order.delPrice,
            disPrice : order.discount,
            totPrice : order.total,
            advance : order.advance,
            balance : order.balance,
            payStatus : order.payStatus,
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
            descrip: item.descrip, // Item description
            price: item.price, // Price
            stockQty: item.stockQty, // Quantity
            availableQty : item.availableQty, // available stock
            warrantyPeriod: item.warrantyPeriod,
            img: `data:image/png;base64,${item.img.toString("base64")}`, // Convert LONGBLOB image to Base64
            color: item.color,
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedItems);
    } catch (error) {
        console.error("Error fetching items:", error.message);
        return res.status(500).json({ message: "Error fetching items" });
    }
});

// Get all delivery notes
router.get("/alldeliverynotes", async (req, res) => {
    try {
        // Query the database to fetch all items
        const [deliveryNotes] = await db.query("SELECT * FROM delivery_note");

        // If no items found, return a 404 status
        if (deliveryNotes.length === 0) {
            return res.status(404).json({ message: "No deliveries found" });
        }

        // Format the items data
        const formattedDeliveryNotes = deliveryNotes.map(deliverynote => ({
            delNoID: deliverynote.delNoID,
            driverName: deliverynote.driverName,
            date: deliverynote.date,
            district: deliverynote.district
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedDeliveryNotes);
    } catch (error) {
        console.error("Error fetching deliveries:", error.message);
        return res.status(500).json({ message: "Error fetching deliveries" });
    }
});

// Get all deliveries
router.get("/alldeliveries", async (req, res) => {
    try {
        // Query the database to fetch all items
        const [deliveries] = await db.query("SELECT * FROM delivery");

        // If no items found, return a 404 status
        if (deliveries.length === 0) {
            return res.status(404).json({ message: "No deliveries found" });
        }

        // Format the items data
        const formattedDeliveries = deliveries.map(delivery => ({
            dv_id: delivery.dv_id,
            orID: delivery.orID,
            district: delivery.district,
            status: delivery.status,
            schedule_Date: delivery.schedule_Date,
            delivery_Date: delivery.delivery_Date,
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedDeliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error.message);
        return res.status(500).json({ message: "Error fetching deliveries" });
    }
});

//add a new supplier and items
router.post("/supplier", async (req, res) => {
    const { name, contact, contact2, address} = req.body;

    // Generate new supplier ID
    const s_ID = await generateNewId("supplier", "s_ID", "S");
    console.log(s_ID);
    const sqlInsertSupplier = `
        INSERT INTO Supplier (s_ID, name, address, contact, contact2)
        VALUES (?, ?, ?, ?, ?)
    `;
    const valuesSupplier = [
        s_ID,
        name,
        address,
        contact,
        contact2 || "", // If contact2 is empty, set it as an empty string
    ];

    try {
        // Insert the supplier into the Supplier table
        await db.query(sqlInsertSupplier, valuesSupplier);

        // Respond with success message and new supplier details
        return res.status(201).json({
            success: true,
            message: "Supplier  added successfully",
            data: {
                s_ID,
                name,
                contact,
                contact2,
                address,
            },
        });
    } catch (err) {
        console.error("Error inserting supplier  data:", err.message);

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
                o.OrID, o.orDate, o.customerEmail, o.contact1, o.contact2,o.advance,o.balance,o.payStatus,
                o.orStatus, o.delStatus, o.delPrice, o.discount, o.total, o.ordertype,o.stID,
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
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
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
            ordertype : orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            saleID: orderData.stID,
            totalPrice: orderData.total,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus : orderData.payStatus,
            expectedDeliveryDate: orderData.expectedDate,
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                quantity: item.qty,
                color: item.color,
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
// Get Details of isssued order
router.get("/issued-order-details", async (req, res) => {
    try {
        const { orID } = req.query;
        if (!orID) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // 1️⃣ Fetch Order Info with Sales Team Details
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.customerEmail, o.contact1, o.contact2, o.advance, o.balance, o.payStatus,
                o.orStatus, o.delStatus, o.delPrice, o.discount, o.total, o.ordertype, o.stID,
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
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // 3️⃣ Fetch Issued Items for this Order from `m_s_r_detail`
        const issuedItemsQuery = `
            SELECT
                m.I_Id, i.I_name, m.stock_Id, m.sr_ID, m.barcode, m.status, m.datetime
            FROM m_s_r_detail m
                     JOIN Item i ON m.I_Id = i.I_Id
            WHERE m.orID = ?`;

        const [issuedItemsResult] = await db.query(issuedItemsQuery, [orID]);

        // 4️⃣ Initialize Response Object
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            ordertype: orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            saleID: orderData.stID,
            totalPrice: orderData.total,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: orderData.expectedDate,
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                quantity: item.qty,
                color: item.color,
                price: item.tprice,
                unitPrice: item.unitPrice,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty
            })),
            issuedItems: issuedItemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                stockId: item.stock_Id,
                srID: item.sr_ID,
                barcode: item.barcode.toString('base64'), // Convert to readable format if needed
                status: item.status,
                datetime: item.datetime
            }))
        };

        // 5️⃣ Fetch Delivery Info If Order is for Delivery
        if (orderData.delStatus === "Delivery") {
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
                o.OrID, o.orDate, o.customerEmail, o.contact1, o.contact2, o.orStatus, o.delStatus,
                o.delPrice, o.discount, o.total, o.advance , o.balance, o.payStatus, o.expectedDate,
                o.specialNote, o.ordertype, s.stID, e.name AS salesEmployeeName
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
                od.I_Id,
                i.I_name,
                i.color,
                od.qty,
                od.tprice,
                i.price AS unitPrice,
                i.bookedQty,
                i.availableQty,
                i.stockQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;
        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // Prepare the order response
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: orderData.orDate,
            customerEmail: orderData.customerEmail,
            ordertype: orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            totalPrice: orderData.total,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus : orderData.payStatus,
            expectedDeliveryDate: orderData.expectedDate,
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: [],
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
                    color: item.color,
                    quantity: item.qty,
                    unitPrice: item.unitPrice,
                    booked: item.bookedQty > 0, // true if the item is booked
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty, // Updated field from Item table
                    stockQuantity: item.stockQty,
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
                color: item.color,
                unitPrice: item.unitPrice,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty, // Updated field
                stockQuantity: item.stockQty
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

        // ✅ Fetch item details from Item table
        const itemQuery = `
            SELECT
                I.I_Id, I.I_name, I.descrip, I.price, I.stockQty, I.bookedQty, I.availableQty, I.minQTY,
                I.warrantyPeriod, I.img, I.img1, I.img2, I.img3, I.color, I.material, I.mn_Cat, I.sb_catOne, I.sb_catTwo
            FROM Item I
            WHERE I.I_Id = ?`;

        const [itemResult] = await db.query(itemQuery, [I_Id]);

        if (itemResult.length === 0) {
            return res.status(404).json({ success: false, message: "Item not found" });
        }

        const itemData = itemResult[0];

        // ✅ Convert images to Base64
        const mainImgBase64 = itemData.img ? Buffer.from(itemData.img).toString("base64") : null;
        const img1Base64 = itemData.img1 ? Buffer.from(itemData.img1).toString("base64") : null;
        const img2Base64 = itemData.img2 ? Buffer.from(itemData.img2).toString("base64") : null;
        const img3Base64 = itemData.img3 ? Buffer.from(itemData.img3).toString("base64") : null;

        // ✅ Fetch suppliers providing this item
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
            unit_cost: supplier.unit_cost
        }));

        // ✅ Fetch stock details **excluding** 'Issued' status, only include 'Available', 'Damage', 'Reserved'
        const stockQuery = `
            SELECT srd_Id, stock_Id, sr_ID, status
            FROM m_s_r_detail
            WHERE I_Id = ?
              AND status IN ('Available', 'Damage', 'Reserved')
            ORDER BY srd_Id ASC , FIELD(status, 'Available', 'Reserved', 'Damage')`;

        const [stockResults] = await db.query(stockQuery, [I_Id]);
        console.log(I_Id);

        const stockDetails = stockResults.map(stock => ({
            srd_Id: stock.srd_Id,
            stock_Id: stock.stock_Id,
            sr_ID: stock.sr_ID,
            status: stock.status
        }));
        console.log(stockDetails);

        // ✅ Construct final response
        const responseData = {
            success: true,
            item: {
                I_Id: itemData.I_Id,
                I_name: itemData.I_name,
                descrip: itemData.descrip,
                color: itemData.color,
                material: itemData.material,
                price: itemData.price,
                stockQty: itemData.stockQty,
                availableQty: itemData.availableQty,
                bookedQty: itemData.bookedQty,
                warrantyPeriod: itemData.warrantyPeriod,
                minQTY: itemData.minQTY,
                maincategory: itemData.mn_Cat,
                sub_one: itemData.sb_catOne,
                sub_two: itemData.sb_catTwo,
                img: mainImgBase64,
                img1: img1Base64,
                img2: img2Base64,
                img3: img3Base64,
                suppliers: suppliers,
                stockDetails: stockDetails // Only 'Available', 'Reserved', 'Damage'
            }
        };

        return res.status(200).json(responseData);

    } catch (error) {
        console.error("❌ Error fetching item details:", error.message);
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
            ordertype : order.ordertype,
            orStatus: order.orStatus, // Order Status
            dvStatus: order.delStatus, // Delivery Status
            dvPrice: order.delPrice, // Delivery Price
            disPrice: order.discount, // Discount Price
            totPrice: order.total, // Total Price
            advance: order.advance,
            balance: order.balance,
            payStatus : order.payStatus,
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
                o.OrID, o.orDate, o.customerEmail, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
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
                    ordertype: order.ordertype,
                    orStatus: order.orStatus,
                    dvStatus: order.delStatus,
                    dvPrice: order.delPrice,
                    disPrice: order.discount,
                    totPrice: order.total,
                    advance: order.advance,
                    balance: order.balance,
                    payStatus: order.payStatus,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    itemReceived: order.itemReceived,
                    acceptanceStatus: "Complete", // Default status is Complete
                    acceptanceStatuses: [] // Track individual item statuses
                };
            }

            // Add each item status to the list
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // If any items have an "In Production" or "None" status, mark as "Incomplete"
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
                o.OrID, o.orDate, o.customerEmail, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Completed'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Completed orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype: order.ordertype,
                    orStatus: order.orStatus,
                    dvStatus: order.delStatus,
                    dvPrice: order.delPrice,
                    disPrice: order.discount,
                    totPrice: order.total,
                    advance: order.advance,
                    balance: order.balance,
                    payStatus: order.payStatus,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    itemReceived: order.itemReceived,
                    acceptanceStatus: "Complete", // Default status is Complete
                    acceptanceStatuses: [] // Track individual item statuses
                };
            }

            // Add each item status to the list
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // If any items have an "In Production" or "None" status, mark as "Incomplete"
            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        // Convert the grouped orders into an array
        const formattedOrders = Object.values(groupedOrders);

        // Send the formatted orders with their acceptance status as a JSON response
        return res.status(200).json({
            message: "Completed orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching completed orders:", error.message);
        return res.status(500).json({ message: "Error fetching completed orders", error: error.message });
    }
});

// Fetch Issued order
router.get("/orders-issued", async (req, res) => {
    try {
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT
                o.OrID, o.orDate, o.customerEmail, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Issued'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Completed orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype: order.ordertype,
                    orStatus: order.orStatus,
                    dvStatus: order.delStatus,
                    dvPrice: order.delPrice,
                    disPrice: order.discount,
                    totPrice: order.total,
                    advance: order.advance,
                    balance: order.balance,
                    payStatus: order.payStatus,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    itemReceived: order.itemReceived,
                    acceptanceStatus: "Complete", // Default status is Complete
                    acceptanceStatuses: [] // Track individual item statuses
                };
            }

            // Add each item status to the list
            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            // If any items have an "In Production" or "None" status, mark as "Incomplete"
            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        // Convert the grouped orders into an array
        const formattedOrders = Object.values(groupedOrders);

        // Send the formatted orders with their acceptance status as a JSON response
        return res.status(200).json({
            message: "Completed orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching completed orders:", error.message);
        return res.status(500).json({ message: "Error fetching completed orders", error: error.message });
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
            "SELECT I_Id, I_name, descrip, price,stockQty, availableQty, img FROM Item WHERE availableQty <= minQTY"
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

// get all items for the supplier
router.get("/supplier-items", async (req, res) => {
    try {
        const { s_Id } = req.query;

        // Validate input
        if (!s_Id) {
            return res.status(400).json({ success: false, message: "Supplier ID is required" });
        }

        // Query to fetch supplier's items along with cost, warranty period, and image
        const query = `
            SELECT
                item_supplier.I_Id,
                Item.I_name,
                item_supplier.unit_cost,
                Item.warrantyPeriod,
                Item.img  -- Fetch the binary image (LONGBLOB)
            FROM item_supplier
                     JOIN Item ON Item.I_Id = item_supplier.I_Id
            WHERE item_supplier.s_ID = ?
        `;

        const [itemsResult] = await db.query(query, [s_Id]);

        // If no items found, return a 404 response
        if (itemsResult.length === 0) {
            return res.status(404).json({ success: false, message: "No items found for the given supplier" });
        }

        // Convert image binary data to Base64
        const itemsWithImages = itemsResult.map(item => ({
            ...item,
            img: item.img ? `data:image/jpeg;base64,${item.img.toString('base64')}` : null  // Convert LONGBLOB to Base64
        }));

        // Return the supplier's items with cost, warranty period, and image
        return res.status(200).json({
            success: true,
            items: itemsWithImages,
        });

    } catch (error) {
        console.error("Error fetching supplier items:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Get all suppliers
router.get("/suppliers", async (req, res) => {
    try {
        // Step 1: Fetch all suppliers
        const suppliersQuery = `SELECT s_ID, name, contact,address FROM Supplier`;

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

//Update stock
router.post("/update-stock", upload.single("image"), async (req, res) => {
    const { p_ID, rDate, recCount, cost, detail } = req.body;
    const imageFile = req.file;

    if (!p_ID || !rDate || !recCount) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Fetch current quantity and item details from production
        const [rows] = await db.query("SELECT qty, I_Id, s_ID FROM production WHERE p_ID = ?", [p_ID]);

        if (rows.length === 0) {
            return res.status(404).json({ error: "Production order not found" });
        }

        const currentQty = rows[0].qty;
        const itemId = rows[0].I_Id;
        const supId = rows[0].s_ID;
        const receivedQty = parseInt(recCount, 10);

        // Validate that the item exists in the `item` table
        const [itemExists] = await db.query("SELECT I_Id FROM item WHERE I_Id = ?", [itemId]);

        if (itemExists.length === 0) {
            return res.status(400).json({ error: "Item ID does not exist in item table" });
        }

        console.log("Validated Item ID:", itemId);

        // Handle image upload
        let imagePath = null;
        if (imageFile) {
            const imageName = `item_${itemId}_${Date.now()}.${imageFile.mimetype.split("/")[1]}`;
            const savePath = path.join("./uploads/images", imageName);
            fs.writeFileSync(savePath, imageFile.buffer);
            imagePath = `/uploads/images/${imageName}`;
        }

        // Insert into main_stock_received
        const insertQuery = `
            INSERT INTO main_stock_received (s_ID, I_Id, rDate, rec_count, unitPrice, detail)
            VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [supId, itemId, rDate, receivedQty, cost, detail || ""]);
        console.log(result);
        const receivedStockId = result.insertId;
        console.log(receivedStockId);

        // Fetch last stock_Id for this item
        const [lastStockResult] = await db.query(
            `SELECT MAX(stock_Id) AS lastStockId FROM m_s_r_detail WHERE I_Id = ?`,
            [itemId]
        );

        let lastStockId = lastStockResult[0]?.lastStockId || 0;

        const insertDetailQuery = `
            INSERT INTO m_s_r_detail (I_Id, stock_Id, sr_ID, barcode,status,orID,datetime)
            VALUES (?, ?, ?, ?,'Available','','')`;
        console.log(insertDetailQuery);

        // Ensure barcode folder exists
        const barcodeFolderPath = path.join("./uploads/barcodes");
        if (!fs.existsSync(barcodeFolderPath)) {
            fs.mkdirSync(barcodeFolderPath, { recursive: true });
        }

        // Ensure `stockCount` is properly defined
        const stockCount = receivedQty;

        for (let i = 1; i <= stockCount; i++) {
            lastStockId++;

            // Generate barcode data
            const barcodeData = `${itemId}-${lastStockId}-${receivedStockId}`;
            const barcodeImageName = `barcode_${barcodeData}.png`;
            const barcodeImagePath = path.join(barcodeFolderPath, barcodeImageName);

            // Generate barcode image
            const pngBuffer = await bwipjs.toBuffer({
                bcid: "code128",
                text: barcodeData,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: "center",
            });

            // Save barcode image to folder
            fs.writeFileSync(barcodeImagePath, pngBuffer);

            // Save barcode data in the database
            const query = await db.query(insertDetailQuery, [itemId, lastStockId, receivedStockId, pngBuffer]);
        }

        // Determine new stock status
        let newStatus = "Incomplete";
        let newQty = currentQty - receivedQty;

        if (receivedQty >= currentQty) {
            newStatus = "Complete";
            newQty = 0;
        }

        // Update production table
        const sqlUpdate = `UPDATE production SET qty = ?, status = ? WHERE p_ID = ?`;
        await db.query(sqlUpdate, [newQty, newStatus, p_ID]);

        // Update stock quantity in Item table
        const sqlUpdateItem = `UPDATE Item SET stockQty = stockQty + ? WHERE I_Id = ?`;
        await db.query(sqlUpdateItem, [receivedQty, itemId]);

        const sqlUpdateItem1 = `UPDATE Item SET availableQty = availableQty + ? WHERE I_Id = ?`;
        await db.query(sqlUpdateItem1, [receivedQty, itemId]);

        return res.status(200).json({
            success: true,
            message: "Stock received updated successfully",
            updatedStatus: newStatus,
            remainingQty: newQty,
        });

    } catch (error) {
        console.error("Error updating stock received:", error);
        return res.status(500).json({ error: "Internal Server Error", details: error.message });
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
            totalAdvance,
            previousAdvance,
            balance,
            addedAdvance,
            updatedDeliveryCharge,
            updatedDiscount
        } = req.body;

        if (!orID) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        // 🔍 Check if the order exists
        const orderCheckQuery = `SELECT * FROM Orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orID]);

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        // 🔄 Determine Payment Status
        let payStatus = "Pending"; // Default status

        if (totalAdvance > 0) {
            payStatus = "Advanced"; // Some advance payment has been made
        }

        if (balance === 0) {
            payStatus = "Settled"; // Fully paid order
        }

        // 🔄 Update Orders table
        const orderUpdateQuery = `
            UPDATE Orders
            SET total = ?, discount = ?, delPrice = ?, advance = ?, balance = ?, payStatus = ?
            WHERE OrID = ?`;
        const orderUpdateParams = [netTotal, updatedDiscount, updatedDeliveryCharge, totalAdvance, balance, payStatus, orID];
        await db.query(orderUpdateQuery, orderUpdateParams);

        // 🛑 If it's a pickup order, remove it from the delivery table
        if (isPickup) {
            const deleteDeliveryQuery = `DELETE FROM delivery WHERE orID = ?`;
            await db.query(deleteDeliveryQuery, [orID]);
        }

        // 🕒 Get the current date and time
        const currentDateTime = new Date().toISOString().slice(0, 19).replace("T", " ");

        // 💰 Insert a new entry into the Payment table
        if (addedAdvance > 0) {
            const insertPaymentQuery = `
                INSERT INTO Payment (orID, amount, dateTime)
                VALUES (?, ?, ?)`;
            const paymentParams = [orID, addedAdvance, currentDateTime];
            await db.query(insertPaymentQuery, paymentParams);
        }

        return res.status(200).json({
            success: true,
            message: "Order and payment updated successfully",
            payStatus,
        });
    } catch (error) {
        console.error("❌ Error updating invoice:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error updating invoice data",
            details: error.message,
        });
    }
});

// Fetch Accept orders in booked-unbooked
router.get("/orders-accept", async (req, res) => {
    try {
        // Step 1: Fetch all the orders and their associated items' statuses from the accept_orders table.
        const query = `
            SELECT
                o.OrID, o.orDate, o.customerEmail, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Accepted'
        `;

        const [orders] = await db.query(query);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        const groupedOrders = {};
        const bookedOrders = [];
        const unbookedOrders = [];

        // Step 3: Process each order and its items.
        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customerEmail: order.customerEmail,
                    ordertype: order.ordertype,
                    orStatus: order.orStatus,
                    dvStatus: order.delStatus,
                    dvPrice: order.delPrice,
                    disPrice: order.discount,
                    totPrice: order.total,
                    advance: order.advance,
                    balance: order.balance,
                    payStatus: order.payStatus,
                    stID: order.stID,
                    expectedDeliveryDate: order.expectedDeliveryDate,
                    acceptanceStatuses: [],
                    isUnbooked: false
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus !== "Complete") {
                groupedOrders[order.OrID].isUnbooked = true;
            }
        });

        // Step 4: Categorize orders.
        Object.values(groupedOrders).forEach(order => {
            if (order.isUnbooked) {
                order.acceptanceStatus = "Incomplete";
                unbookedOrders.push(order);
            } else {
                order.acceptanceStatus = "Complete";
                bookedOrders.push(order);
            }
        });

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
router.put("/update-order-details", async (req, res) => {
    try {
        const { orderId, orderDate, customerEmail, phoneNumber, optionalNumber, orderStatus,payStatus,
            deliveryStatus, deliveryCharge, discount, totalPrice,advance , balance , expectedDeliveryDate, specialNote } = req.body;

        // Check if the order exists
        const orderCheckQuery = `SELECT * FROM orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        if (advance === 0 && payStatus === 'Advanced'){

            return res.status(404).json({ success: false, message: "payement status cannot change to advance when advance is 0" });
        }

        // Update order details
        const orderUpdateQuery = `
            UPDATE orders SET orDate = ?, customerEmail = ?, contact1 = ?, contact2 = ?, orStatus = ?, payStatus = ?,
                              delStatus = ?, delPrice = ?, discount = ?, total = ?, advance = ?, balance = ?, expectedDate = ?, specialNote = ?
            WHERE OrID = ?`;
        await db.query(orderUpdateQuery, [
            orderDate, customerEmail, phoneNumber, optionalNumber, orderStatus, payStatus, deliveryStatus,
            deliveryCharge, discount, totalPrice, advance, balance, expectedDeliveryDate, specialNote, orderId
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
// Fetch existing order details from the database
        const checkOrderItemsQuery = `SELECT I_Id FROM Order_Detail WHERE orID = ?`;
        const [existingRecords] = await db.query(checkOrderItemsQuery, [orderId]);

        const existingItemIds = existingRecords.map(item => item.I_Id);
        const newItemIds = items.map(item => item.itemId);

// Identify items to remove (exist in DB but not in the request)
        const itemsToRemove = existingItemIds.filter(id => !newItemIds.includes(id));

        console.log("Existing records:", existingItemIds);
        console.log("New records:", newItemIds);
        console.log("Items to remove:", itemsToRemove);

// Remove missing items from Order_Detail
        for (const itemId of itemsToRemove) {
            const deleteOrderDetailQuery = `DELETE FROM Order_Detail WHERE orID = ? AND I_Id = ?`;
            await db.query(deleteOrderDetailQuery, [orderId, itemId]);
            const deleteAccceptDetailQuery = `DELETE FROM accept_orders WHERE orID = ? AND I_Id = ?`;
            await db.query(deleteAccceptDetailQuery, [orderId, itemId]);
        }

// Update or Insert new items
        for (const item of items){
            //Check if the record exists in order detail table
            const checkOrderDetailQuery = `SELECT * FROM Order_Detail WHERE orID = ? AND I_Id = ?`;
            const [existingRecord] = await db.query(checkOrderDetailQuery, [orderId, item.itemId]);

            if (existingRecord.length > 0) {
                const updateAcceptOrderQuery = `UPDATE Order_Detail SET qty = ?, tprice = ? WHERE orID = ? AND I_Id = ?`;
                await db.query(updateAcceptOrderQuery, [item.quantity , item.price , orderId, item.itemId]);
            } else {
                const insertAcceptOrderQuery = `INSERT INTO Order_Detail (orID, I_Id, qty, tprice) VALUES (?, ?, ?, ?)`;
                await db.query(insertAcceptOrderQuery, [orderId, item.itemId, item.quantity , item.price]);
            }
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
        console.log(orderId , deliveryInfo , deliveryStatus , phoneNumber);

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
                st.orderTarget,
                st.issuedTarget,
                st.totalOrder,
                st.totalIssued,
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
            orderTarget: member.orderTarget,
            issuedTarget: member.issuedTarget,
            totalOrder: member.totalOrder,
            totalIssued: member.totalIssued
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
                st.orderTarget,
                st.issuedTarget,
                st.totalOrder,
                st.totalIssued,
                COUNT(o.OrID) AS totalCount,
                SUM(CASE WHEN o.orStatus = 'issued' THEN 1 ELSE 0 END) AS issuedCount,
                COALESCE(SUM(o.total), 0) AS totalOrderValue,
                COALESCE(SUM(CASE WHEN o.orStatus = 'issued' THEN o.total ELSE 0 END), 0) AS issuedOrderValue,
                o.OrID AS orderId,
                o.orDate AS orderDate,
                o.total AS totalPrice,
                o.orStatus AS orderStatus
            FROM sales_team st
                     JOIN Employee e ON e.E_Id = st.E_Id
                     LEFT JOIN Orders o ON o.stID = st.stID
            WHERE st.stID = ?
            GROUP BY st.stID, e.name, e.contact, e.nic, e.dob, e.address, e.job, e.basic,
                     st.orderTarget, st.issuedTarget, st.totalOrder, st.totalIssued, o.OrID, o.orDate, o.total, o.orStatus;
        `, [stID]);

        if (results.length === 0) {
            return res.status(404).json({ message: "No data found for this sales team member." });
        }

        // Extract member details from the first row
        const memberDetails = {
            employeeName: results[0].employeeName,
            employeeContact: results[0].employeeContact,
            employeeNic: results[0].employeeNic,
            employeeDob: results[0].employeeDob,
            employeeAddress: results[0].employeeAddress,
            employeeJob: results[0].employeeJob,
            employeeBasic: results[0].employeeBasic,
            stID: results[0].stID,
            orderTarget: results[0].orderTarget,
            issuedTarget: results[0].issuedTarget,
            totalOrder: results[0].totalOrder,  // Total sales value of all orders
            totalIssued: results[0].totalIssued,  // Total sales value of issued orders
            totalCount: results[0].totalCount,  // Total number of orders
            issuedCount: results[0].issuedCount  // Number of issued orders
        };

        // Filter out null orders and return an empty array if none exist
        const orders = results.filter(order => order.orderId !== null).map(order => ({
            orderId: order.orderId,
            orderDate: order.orderDate,
            totalPrice: order.totalPrice,
            orderStatus: order.orderStatus
        }));

        return res.status(200).json({
            message: "Sales team details and orders fetched successfully.",
            data: {
                memberDetails,
                orders: orders.length > 0 ? orders : [] // Ensure orders array is empty if there are no valid orders
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
        const { Ca_Id } = req.query;

        if (!Ca_Id) {
            return res.status(400).json({ message: "Category ID is required." });
        }

        // Fetch subCat_one and related subCat_two details for the given Ca_Id
        const [subCategories] = await db.query(`
            SELECT
                s1.sb_c_id AS subCatOneId,
                s1.subcategory AS subCatOneName,
                s1.img AS subCatOneImg,
                s2.sb_cc_id AS subCatTwoId,
                s2.subcategory AS subCatTwoName,
                s2.img AS subCatTwoImg
            FROM subCat_one s1
                     LEFT JOIN subCat_two s2 ON s1.sb_c_id = s2.sb_c_id
            WHERE s1.Ca_Id = ?;
        `, [Ca_Id]);

        if (subCategories.length === 0) {
            return res.status(404).json({ message: "No subcategories found for this category." });
        }

        // Group subCat_two under corresponding subCat_one and set "None" if empty
        const groupedData = subCategories.reduce((acc, curr) => {
            const existingSubCatOne = acc.find(item => item.subCatOneId === curr.subCatOneId);

            const subCatTwoItem = curr.subCatTwoId
                ? {
                    subCatTwoId: curr.subCatTwoId,
                    subCatTwoName: curr.subCatTwoName,
                    subCatTwoImg: curr.subCatTwoImg
                }
                : { subCatTwoId: "None", subCatTwoName: "None", subCatTwoImg: null };

            if (existingSubCatOne) {
                if (!existingSubCatOne.subCatTwo.some(item => item.subCatTwoId === subCatTwoItem.subCatTwoId)) {
                    existingSubCatOne.subCatTwo.push(subCatTwoItem);
                }
            } else {
                acc.push({
                    subCatOneId: curr.subCatOneId,
                    subCatOneName: curr.subCatOneName,
                    subCatOneImg: curr.subCatOneImg,
                    subCatTwo: [subCatTwoItem]
                });
            }

            return acc;
        }, []);

        return res.status(200).json({
            message: "Subcategories fetched successfully.",
            data: groupedData
        });

    } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        return res.status(500).json({ message: "Error fetching subcategories." });
    }
});

// find subcat one and two data by category name
router.get("/typesname", async (req, res) => {
    try {
        const { categoryName } = req.query;

        if (!categoryName) {
            return res.status(400).json({ message: "Category name is required." });
        }

        // Fetch the Ca_Id based on the category name
        const [categoryResult] = await db.query(`
            SELECT Ca_Id FROM Category WHERE name = ?;
        `, [categoryName]);

        if (categoryResult.length === 0) {
            return res.status(404).json({ message: "Category not found." });
        }

        const Ca_Id = categoryResult[0].Ca_Id;

        // Fetch subCat_one and related subCat_two details for the given Ca_Id
        const [subCategories] = await db.query(`
            SELECT
                s1.sb_c_id AS subCatOneId,
                s1.subcategory AS subCatOneName,
                s1.img AS subCatOneImg,
                s2.sb_cc_id AS subCatTwoId,
                s2.subcategory AS subCatTwoName,
                s2.img AS subCatTwoImg
            FROM subCat_one s1
                     LEFT JOIN subCat_two s2 ON s1.sb_c_id = s2.sb_c_id
            WHERE s1.Ca_Id = ?;
        `, [Ca_Id]);

        if (subCategories.length === 0) {
            return res.status(404).json({ message: "No subcategories found for this category." });
        }

        // Group subCat_two under corresponding subCat_one and set "None" if empty
        const groupedData = subCategories.reduce((acc, curr) => {
            const existingSubCatOne = acc.find(item => item.subCatOneId === curr.subCatOneId);

            const subCatTwoItem = curr.subCatTwoId
                ? {
                    subCatTwoId: curr.subCatTwoId,
                    subCatTwoName: curr.subCatTwoName,
                    subCatTwoImg: curr.subCatTwoImg
                }
                : { subCatTwoId: "None", subCatTwoName: "None", subCatTwoImg: null };

            if (existingSubCatOne) {
                if (!existingSubCatOne.subCatTwo.some(item => item.subCatTwoId === subCatTwoItem.subCatTwoId)) {
                    existingSubCatOne.subCatTwo.push(subCatTwoItem);
                }
            } else {
                acc.push({
                    subCatOneId: curr.subCatOneId,
                    subCatOneName: curr.subCatOneName,
                    subCatOneImg: curr.subCatOneImg,
                    subCatTwo: [subCatTwoItem]
                });
            }

            return acc;
        }, []);

        return res.status(200).json({
            message: "Subcategories fetched successfully.",
            data: groupedData
        });

    } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        return res.status(500).json({ message: "Error fetching subcategories." });
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

// Route for adding stock with barcode generation
router.post("/add-stock-received", upload.single("image"), async (req, res) => {
    try {
        const { supplierId, itemId, date, cost, stockCount, comment } = req.body;
        const imageFile = req.file;

        // Validate required fields
        if (!supplierId || !itemId || !date || !stockCount) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        // Validate item existence
        const [itemExists] = await db.query("SELECT I_Id FROM Item WHERE I_Id = ?", [itemId]);
        if (itemExists.length === 0) {
            return res.status(400).json({ success: false, message: "Invalid Item ID" });
        }

        // Handle image upload
        let imagePath = null;
        if (imageFile) {
            const imageName = `item_${itemId}_${Date.now()}.${imageFile.mimetype.split("/")[1]}`;
            const savePath = path.join("./uploads/images", imageName);
            fs.writeFileSync(savePath, imageFile.buffer);
            imagePath = `/uploads/images/${imageName}`;
        }

        // Insert into main_stock_received
        const insertQuery = `
            INSERT INTO main_stock_received (s_ID, I_Id, rDate, rec_count, unitPrice, detail)
            VALUES (?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [supplierId, itemId, date, stockCount, cost, comment || ""]);
        const receivedStockId = result.insertId;

        // Update Item table stock
        await db.query(
            `UPDATE Item SET stockQty = stockQty + ?, availableQty = availableQty + ? WHERE I_Id = ?`,
            [stockCount, stockCount, itemId]
        );

        // Get last stock_Id
        const [lastStockResult] = await db.query(
            `SELECT MAX(stock_Id) AS lastStockId FROM m_s_r_detail WHERE I_Id = ?`,
            [itemId]
        );
        let lastStockId = lastStockResult[0]?.lastStockId || 0;

        console.log("Last stock ID before insert:", lastStockId);

        const insertDetailQuery = `
            INSERT INTO m_s_r_detail (I_Id, stock_Id, sr_ID, barcode, status, orID, datetime)
            VALUES (?, ?, ?, ?, 'Available', ?, NOW())`;

        // Ensure barcodes folder exists
        const barcodeFolderPath = path.join("./uploads/barcodes");
        if (!fs.existsSync(barcodeFolderPath)) {
            fs.mkdirSync(barcodeFolderPath, { recursive: true });
        }

        for (let i = 1; i <= stockCount; i++) {
            lastStockId++;

            // Create barcode data
            const barcodeData = `${itemId}-${lastStockId}-${receivedStockId}`;
            const barcodeImageName = `barcode_${barcodeData}.png`;
            const barcodeImagePath = path.join(barcodeFolderPath, barcodeImageName);

            // Generate barcode image
            const pngBuffer = await bwipjs.toBuffer({
                bcid: "code128",
                text: barcodeData,
                scale: 3,
                height: 10,
                includetext: true,
                textxalign: "center",
            });

            // Save barcode image to folder
            fs.writeFileSync(barcodeImagePath, pngBuffer);

            // Save barcode details in the database
            await db.query(insertDetailQuery, [itemId, lastStockId, receivedStockId, barcodeData, ""]);
            console.log(`Inserted barcode for stock ID: ${lastStockId}`);
        }

        return res.status(201).json({
            success: true,
            message: "Stock received successfully, image uploaded, and barcodes saved!",
            stockReceivedId: receivedStockId,
            imagePath,
        });
    } catch (error) {
        console.error("Error adding stock received:", error);
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

//find issuded order by district
router.get("/find-issued-orders", async (req, res) => {
    try {
        const { district } = req.query;

        // Ensure district is provided in the query params
        if (!district) {
            return res.status(400).json({ message: "District is required." });
        }

        // Query the database to fetch orders with matching district and status "issued"
        const [orders] = await db.query(`
            SELECT
                o.orId,
                O.custName,
                O.contact1,
                O.contact2,
                D.address,
                O.total,
                O.advance,
                O.balance,
                o.city
            FROM Orders O
                     JOIN delivery D ON O.OrID = D.orID
            WHERE D.district = ? AND O.orStatus = 'Issued';
        `, [district]);

        // If no orders are found, return a 404
        if (orders.length === 0) {
            return res.status(404).json({ message: "No issued orders found for this district." });
        }

        // Return the orders as a JSON response
        return res.status(200).json({
            message: "Issued orders found.",
            orders: orders,  // Return all matching orders
        });

    } catch (error) {
        console.error("Error fetching issued orders:", error.message);
        return res.status(500).json({ message: "Error fetching issued orders." });
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

// Get subcat two detail by ca_id
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

//Save new item to supplier
router.post("/add-supplier-item", async (req, res) => {
    try {
        const { I_Id, s_ID, unit_cost } = req.body;
        console.log(I_Id, s_ID, unit_cost);

        // Validate input
        if (!I_Id || !s_ID || !unit_cost) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        // Query to insert the supplier item
        const query = `
            INSERT INTO item_supplier (I_Id, s_ID, unit_cost)
            VALUES (?, ?, ?)
                ON DUPLICATE KEY UPDATE unit_cost = VALUES(unit_cost)
        `;

        await db.query(query, [I_Id, s_ID, unit_cost]);

        return res.status(201).json({ success: true, message: "Item added successfully" });
    } catch (error) {
        console.error("Error adding supplier item:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Fetch all coupons
router.get("/coupon-details", async (req, res) => {
    try {
        const query = `
            SELECT
                sc.cpID AS coupon_code,
                sc.discount,
                st.stID AS sales_team_id,
                e.name AS employee_name
            FROM sales_coupon sc
                     JOIN sales_team st ON sc.stID = st.stID
                     JOIN Employee e ON st.E_Id = e.E_Id
        `;

        const [results] = await db.query(query);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No coupon details found" });
        }

        return res.status(200).json({
            success: true,
            message: "Coupon details retrieved successfully",
            data: results,
        });
    } catch (error) {
        console.error("Error fetching coupon details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching coupon details",
            error: error.message,
        });
    }
});

// Fetch all Delivery rates
router.get("/delivery-rates", async (req, res) => {
    try {
        const query = `SELECT * FROM deli_rates`;

        const [results] = await db.query(query);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No rates details found" });
        }

        return res.status(200).json({
            success: true,
            message: "Rates details retrieved successfully",
            data: results,
        });
    } catch (error) {
        console.error("Error fetching  details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching details",
            error: error.message,
        });
    }
});

// GET API to fetch delivery schedule by district
router.get("/delivery-schedule", async (req, res) => {
    const { district } = req.query; // Get district from query parameter

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

// Update change qty
router.put("/change-quantity", async (req, res) => {
    const { orId, itemId, newQuantity, updatedPrice, booked } = req.body;
    console.log(req.body);

    // Validation: Check required fields
    if (!orId || !itemId || newQuantity == null || updatedPrice == null) {
        return res.status(400).json({ message: "Missing required fields." });
    }

    try {
        // Fetch current item quantities
        const [currentItem] = await db.query(
            "SELECT bookedQty, availableQty FROM Item WHERE I_Id = ?",
            [itemId]
        );
        console.log("Current Item:", currentItem);

        if (!currentItem || currentItem.length === 0) {
            return res.status(404).json({ message: "Item not found." });
        }

        // Fetch current order quantity
        const [currentOrder] = await db.query(
            "SELECT qty FROM Order_Detail WHERE orID = ? AND I_Id = ?",
            [orId, itemId]
        );

        if (!currentOrder || currentOrder.length === 0) {
            return res.status(404).json({ message: "Order detail not found." });
        }

        //  Correctly accessing the first row values
        const qtyDifference = Number(newQuantity) - Number(currentOrder[0].qty);

        let newBookedQty = Number(currentItem[0].bookedQty);
        let newAvailableQty = Number(currentItem[0].availableQty);

        if (booked) {
            newBookedQty += qtyDifference;
            newAvailableQty -= qtyDifference;

            if (newAvailableQty < 0) {
                return res.status(400).json({ message: "Insufficient available quantity." });
            }
        }

        // Update Order_Detail
        await db.query(
            "UPDATE Order_Detail SET qty = ?, tprice = ? WHERE orID = ? AND I_Id = ?",
            [newQuantity, updatedPrice, orId, itemId]
        );

        // Only update booked_item and Item when booked is true
        if (booked) {
            await db.query(
                "UPDATE booked_item SET qty = ? WHERE orID = ? AND I_Id = ?",
                [newQuantity, orId, itemId]
            );

            await db.query(
                "UPDATE Item SET bookedQty = ?, availableQty = ? WHERE I_Id = ?",
                [newBookedQty, newAvailableQty, itemId]
            );
        }

        // Success response
        return res.status(200).json({ message: "Quantity updated successfully." });
    } catch (error) {
        console.error("Error updating quantity:", error.message);
        return res.status(500).json({ message: "Error updating quantity.", error: error.message });
    }
});

// save new stock in item update stock
router.post("/get-stock-details", async (req, res) => {
    try {
        // Ensure req.body is an array
        if (!Array.isArray(req.body) || req.body.length === 0) {
            return res.status(400).json({ error: "Invalid request. Provide an array of item IDs." });
        }

        const itemIds = req.body.map(id => id.trim()); // Trim whitespace

        // Construct dynamic SQL query with placeholders
        const placeholders = itemIds.map(() => "?").join(", ");
        const sql = `
            SELECT * FROM m_s_r_detail
            WHERE I_Id IN (${placeholders})
              AND status = 'Available'
        `;

        // Execute query
        const [results] = await db.query(sql, itemIds);

        if (results.length === 0) {
            return res.status(404).json({
                message: "No stock details found for the provided item IDs",
                itemIds: itemIds,
                stockDetails: []
            });
        }

        return res.status(200).json({
            message: "Stock details retrieved successfully",
            itemIds: itemIds,
            stockDetails: results
        });

    } catch (error) {
        console.error("Error fetching stock details:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Issued order
router.post("/isssued-order", async (req, res) => {
    const { orID, delStatus, delPrice, discount,subtotal, total, advance, balance, payStatus, stID, paymentAmount, selectedItems } = req.body;

    if (!orID || !stID || paymentAmount === undefined || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const IssuedPrice = parseFloat(subtotal) - parseFloat(discount);

    try {
        // 1. Update Orders table
        await db.query(
            `UPDATE Orders
             SET delStatus = ?, orStatus = 'Issued', delPrice = ?, discount = ?, total = ?, advance = ?, balance = ?, payStatus = ?, stID = ?
             WHERE OrID = ?`,
            [delStatus, delPrice, discount, total, advance, balance, payStatus, stID, orID]
        );

        // 2. Update m_s_r_detail table (Mark selected items as issued)
        for (const item of selectedItems) {
            await db.query(
                `UPDATE m_s_r_detail
                 SET status = 'Issued', orID = ?, datetime = NOW()
                 WHERE srd_Id = ?`,
                [orID, item.srd_Id]
            );
        }

        // 3. Update sales_team table
        await db.query(
            `UPDATE sales_team
             SET totalIssued = totalIssued + ?
             WHERE stID = ?`,
            [IssuedPrice, stID]
        );

        // 4. Update Item stock quantities using Order_Detail table
        const [orderItems] = await db.query(
            `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
            [orID]
        );

        for (const item of orderItems) {
            await db.query(
                `UPDATE Item
                 SET stockQty = stockQty - ?, bookedQty = bookedQty - ?
                 WHERE I_Id = ?`,
                [item.qty, item.qty, item.I_Id]
            );
        }

        // 5. Delete from booked_item & accept_orders
        await db.query(`DELETE FROM booked_item WHERE orID = ?`, [orID]);
        await db.query(`DELETE FROM accept_orders WHERE orID = ?`, [orID]);

        // 6. Insert into Payment table
        await db.query(
            `INSERT INTO Payment (orID, amount, dateTime)
             VALUES (?, ?, NOW())`,
            [orID, paymentAmount]
        );

        return res.status(200).json({ success: true, message: "Order updated successfully" });

    } catch (error) {
        console.error("Error updating order:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Save new Delivery Rate
router.post("/delivery-rates", async (req, res) => {
    try {
        // SQL query to insert new category
        const sql = `INSERT INTO deli_Rates (district, amount) VALUES (?, ?)`;
        const values = [req.body.District,req.body.rate];

        // Execute the insert query
        await db.query(sql, values);

        // Return success response with the new category details
        return res.status(201).json({
            success: true,
            message: "Rate added successfully",
            data: {
                District: req.body.District,
                rate: req.body.rate
            },
        });
    } catch (err) {
        console.error("Error inserting rates data:", err.message);

        // Respond with error details
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// Save Scheduled dates
router.post("/delivery-dates", async (req, res) => {
    try {
        console.log(req.body);

        const { District, dates } = req.body; // Extract district and dates array

        if (!District || !Array.isArray(dates) || dates.length === 0) {
            return res.status(400).json({
                success: false,
                message: "District and at least one date are required"
            });
        }

        // SQL query to insert multiple dates
        const sql = `INSERT INTO delivery_schedule (district, ds_date) VALUES ?`;
        const values = dates.map(date => [District, date]); // Create array of values

        // Execute the insert query
        await db.query(sql, [values]);

        return res.status(201).json({
            success: true,
            message: "Delivery dates added successfully",
            data: {
                District,
                dates,
            },
        });

    } catch (err) {
        console.error("Error inserting delivery dates:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// Save new employee and saleteam
router.post("/employees", async (req, res) => {
    try {
        const { name, address, nic, dob, contact, job, basic, orderTarget , issuedTarget } = req.body;
        console.log(req.body);

        if (!name || !address || !nic || !dob || !contact || !job || !basic || !orderTarget || !issuedTarget) {
            return res.status(400).json({
                success: false,
                message: "All fields are required except target and currentRate (only for Sales)."
            });
        }

        const E_Id = await generateNewId("Employee", "E_Id", "E"); // Generate new Employee ID

        const sql = `INSERT INTO Employee (E_Id, name, address, nic, dob, contact, job, basic) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [E_Id, name, address, nic, dob, contact, job, basic]);

        // If job is Sales, insert into sales_team table
        let salesData = null;
        if (job === "Sales" && orderTarget && issuedTarget) {
            const stID = await generateNewId("sales_team", "stID", "ST");
            const sqlSales = `INSERT INTO sales_team (stID, E_Id, orderTarget,issuedTarget, totalOrder, totalIssued) VALUES (?, ?, ?,?,'0', '0')`;
            await db.query(sqlSales,[stID, E_Id, orderTarget , issuedTarget]);

            salesData = { stID, orderTarget , issuedTarget };
        }

        return res.status(201).json({
            success: true,
            message: "Employee added successfully",
            data:  {E_Id,salesData},
        });

    } catch (err) {
        console.error("Error adding employee:", err);
        return res.status(500).json({
            success: false,
            message: "Error adding employee",
            details: err.message
        });
    }
});

// Save Delivery Notes
router.post("/create-delivery-note", async (req, res) => {
    try {
        const { driverName, vehicleName, hire, date, district, orderIds ,balanceToCollect } = req.body;

        const delHire = parseFloat(hire);

        // Check if the required fields are present in the request body
        if (!driverName || !vehicleName || !date || !hire || !orderIds || orderIds.length === 0) {
            return res.status(400).json({ message: "Driver name, vehicle name, hire, date, and order IDs are required." });
        }

        // Convert the date from DD/MM/YY format to YYYY-MM-DD
        const [day, month, year] = date.split('/');
        const formattedDate = `20${year.length === 2 ? year : year.slice(2)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Insert into the delivery_note table
        const [result] = await db.query(`
            INSERT INTO delivery_note (driverName, vehicalName, date, hire, district , balanceToCollect , status)
            VALUES (?, ?, ?, ?,? , ?,'Incomplete')
        `, [driverName, vehicleName, formattedDate, delHire,district, balanceToCollect]);

        // Get the generated delNoID (Delivery Note ID)
        const delNoID = result.insertId;

        // Insert the orders into the delivery_note_orders table
        const orderQueries = orderIds.map((orID) => {
            return db.query(`
                INSERT INTO delivery_note_orders (delNoID, orID)
                VALUES (?, ?)
            `, [delNoID, orID]);
        });

        // Execute all the queries in parallel
        await Promise.all(orderQueries);

        const deliveryQueries = orderIds.map((orID) => {
            return db.query(`
                UPDATE delivery
                SET status = 'Delivered', delivery_Date = ?
                WHERE orID = ?
            `, [formattedDate, orID]);
        });

        // Execute all delivery updates in parallel
        await Promise.all(deliveryQueries);

        // Send a success response
        return res.status(201).json({
            message: "Delivery note and orders created successfully, and delivery status updated.",
            delNoID,  // Return the generated Delivery Note ID
        });

    } catch (error) {
        console.error("Error creating delivery note:", error.message);
        return res.status(500).json({ message: "Error creating delivery note" });
    }
});

// Get Delivery Note detail
router.get("/delivery-note", async (req, res) => {
    try {
        const { delNoID } = req.query;
        console.log("Requested Delivery Note ID:", delNoID);

        if (!delNoID) {
            return res.status(400).json({ success: false, message: "Delivery Note ID is required" });
        }

        // Fetch delivery note details
        const [deliveryNote] = await db.query(
            "SELECT * FROM delivery_note WHERE delNoID = ?",
            [delNoID]
        );

        if (deliveryNote.length === 0) {
            return res.status(404).json({ success: false, message: "Delivery note not found" });
        }

        // Fetch associated orders (only required fields)
        const [orders] = await db.query(
            `SELECT o.OrID, o.orStatus AS orderStatus, o.delStatus AS deliveryStatus
             FROM Orders o
                      INNER JOIN delivery_note_orders dno ON o.OrID = dno.orID
             WHERE dno.delNoID = ?`,
            [delNoID]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found for this delivery note" });
        }

        // Fetch issued items grouped by order ID
        const orderIds = orders.map(order => order.OrID);
        let issuedItems = [];
        if (orderIds.length > 0) {
            [issuedItems] = await db.query(
                `SELECT m.orID, m.srd_Id, m.I_Id, m.stock_Id, m.barcode, m.datetime
                 FROM m_s_r_detail m
                 WHERE m.orID IN (?) AND m.status = 'Issued'`,
                [orderIds]
            );
        }

        // Organize issued items under their respective orders
        const ordersWithIssuedItems = orders.map(order => ({
            ...order,
            issuedItems: issuedItems.filter(item => item.orID === order.OrID)
        }));

        return res.status(200).json({
            success: true,
            message: "Delivery note details fetched successfully",
            details: deliveryNote[0], // Delivery note details
            orders: ordersWithIssuedItems // Orders with issued items grouped
        });

    } catch (error) {
        console.error("Error fetching delivery note details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching delivery note details",
            error: error.message
        });
    }
});

// Save Delivery Notes
router.post("/create-delivery-note", async (req, res) => {
    try {
        const { driverName, vehicleName, hire, date, orderIds } = req.body;

        const delHire = parseFloat(hire);

        // Check if the required fields are present in the request body
        if (!driverName || !vehicleName || !date || !hire || !orderIds || orderIds.length === 0) {
            return res.status(400).json({ message: "Driver name, vehicle name, hire, date, and order IDs are required." });
        }

        // Convert the date from DD/MM/YY format to YYYY-MM-DD
        const [day, month, year] = date.split('/');
        const formattedDate = `20${year.length === 2 ? year : year.slice(2)}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

        // Insert into the delivery_note table
        const [result] = await db.query(`
            INSERT INTO delivery_note (driverName, vehicalName, date, hire)
            VALUES (?, ?, ?, ?)
        `, [driverName, vehicleName, formattedDate, delHire]);

        // Get the generated delNoID (Delivery Note ID)
        const delNoID = result.insertId;

        // Insert the orders into the delivery_note_orders table
        const orderQueries = orderIds.map((orID) => {
            return db.query(`
                INSERT INTO delivery_note_orders (delNoID, orID)
                VALUES (?, ?)
            `, [delNoID, orID]);
        });

        // Execute all the queries in parallel
        await Promise.all(orderQueries);

        // Send a success response
        return res.status(201).json({
            message: "Delivery note and orders created successfully.",
            delNoID,  // Return the generated Delivery Note ID
        });

    } catch (error) {
        console.error("Error creating delivery note:", error.message);
        return res.status(500).json({ message: "Error creating delivery note" });
    }
});

// Save New Coupone
router.post("/coupone", async (req, res) => {
    const sql = `INSERT INTO sales_coupon (cpID,stID,discount) VALUES (?, ?,?)`;
    const values = [
        req.body.couponCode,
        req.body.saleteamCode,
        req.body.discount
    ];
    try {
        // Execute the query and retrieve the result
        const [result] = await db.query(sql, values);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Coupone added successfully",
            data: {
                couponCode : req.body.couponCode,
                saleteamCode: req.body.saleteamCode,
                discount: req.body.discount
            },
        });
    } catch (err) {
        console.error("Error inserting coupone data:", err.message);

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
    console.log(values);

    // try {
    //     const [result] = await db.query(sql, values);
    //
    //     return res.status(201).json({
    //         success: true,
    //         message: "Promotion added successfully",
    //         data: {
    //             img: req.body.img,
    //             date: req.body.date,
    //         },
    //     });
    // } catch (err) {
    //     console.error("Error inserting item data:", err.message);
    //     return res.status(500).json({
    //         success: false,
    //         message: "Error inserting data into database",
    //         details: err.message,
    //     });
    // }
});

// Function to generate new ida
const generateNewId = async (table, column, prefix) => {
    const [rows] = await db.query(`SELECT ${column} FROM ${table} ORDER BY ${column} DESC LIMIT 1`);
    if (rows.length === 0) return `${prefix}_001`; // First entry
    const lastId = rows[0][column]; // Get last ID
    console.log(lastId);
    const lastNum = parseInt(lastId.split("_")[1],10) + 1; // Extract number and increment
    console.log(lastNum);
    console.log(`${prefix}_${String(lastNum).padStart(3, "0")}`);
    return `${prefix}_${String(lastNum).padStart(3, "0")}`;
};

export default router;
