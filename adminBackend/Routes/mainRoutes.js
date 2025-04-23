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
            INSERT INTO Item (I_Id, I_name, descrip, color, material, price, stockQty, bookedQty, availableQty,reservedQty,dispatchedQty,damageQty, minQTY, img, img1, img2, img3, warrantyPeriod, mn_Cat, sb_catOne, sb_catTwo)
            VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0,0,0,0, ?, ?, ?, ?, ?, ?, ?, ?, ?);
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
    const {
        FtName, SrName, address, balance, c_ID, category,newAddress,isAddressChanged, couponCode, deliveryPrice, discountAmount, district, dvStatus, email,
        expectedDate, id, isNewCustomer, items, occupation, otherNumber, phoneNumber, specialNote, title, totalBillPrice, totalItemPrice,dvtype,
        type, workPlace, t_name,orderType,specialdiscountAmount
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or missing items." });
    }

    try {
        let Cust_id = c_ID;
        let Occupation = "-", WorkPlace = "-", tType = "-";
        let stID = null;

        if (type === 'Walking' || type === 'On site') {
            Occupation = occupation;
            WorkPlace = workPlace;
        } else {
            tType = t_name;
        }

        // **Handle New Customer Creation**
        if (isNewCustomer) {
            Cust_id = await generateNewId("Customer", "c_ID", "Cus");

            const checkExistingCustomer = `SELECT c_ID FROM Customer WHERE contact2 = ? OR contact1 = ? LIMIT 1`;
            const [existingCustomer] = await db.query(checkExistingCustomer, [otherNumber, phoneNumber]);

            if (existingCustomer.length > 0) {
                return res.status(400).json({ success: false, message: "Customer already exists." });
            }

            const sqlInsertCustomer = `
                INSERT INTO Customer (c_ID, title, FtName, SrName, address, contact1, contact2, email, id, balance, type, category, t_name, occupation, workPlace)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const valuesCustomer = [
                Cust_id, title, FtName, SrName, address, phoneNumber, otherNumber || "", email, id, 0, type, category, tType, Occupation, WorkPlace
            ];

            await db.query(sqlInsertCustomer, valuesCustomer);
        }

        // **Calculate Net Total and Balance**
        const netTotal = parseFloat(totalBillPrice) || 0;
        const advance = 0;
        const balance = netTotal - advance;

        // **Generate Order ID**
        const orID = `ORD_${Date.now()}`;
        const orderDate = new Date().toISOString().split("T")[0];

        // **Handle Coupon Code**
        if (couponCode) {
            const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
            const [couponResult] = await db.query(couponQuery, [couponCode]);

            if (couponResult.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid coupon code." });
            }

            stID = couponResult[0].stID;
            const newTotalOrder = parseFloat(totalItemPrice) - parseFloat(discountAmount);
            const updateSalesTeamQuery = `UPDATE sales_team SET totalOrder = totalOrder + ? WHERE stID = ?`;
            await db.query(updateSalesTeamQuery, [newTotalOrder, stID]);
        }

        // **Insert Order**
        const orderQuery = `
            INSERT INTO Orders (OrID, orDate, c_ID, orStatus, delStatus, delPrice, discount,specialdic, netTotal, total, stID, expectedDate, specialNote, ordertype, advance, balance, payStatus)
            VALUES (?, ?, ?, 'Pending', ?, ?, ?, ?, ?, ?,?, ?, ?, ?, ?, ?, 'Pending')`;

        const orderParams = [
            orID, orderDate, Cust_id, dvStatus, parseFloat(deliveryPrice) || 0, parseFloat(discountAmount) || 0,parseFloat(specialdiscountAmount) || 0,
            parseFloat(totalItemPrice) || 0, parseFloat(totalBillPrice) || 0, stID, expectedDate, specialNote,orderType, advance, balance
        ];

        await db.query(orderQuery, orderParams);

        // **Insert Order Details (Bulk Insert)**
        const orderDetailValues = items.map(item => [
            orID, item.I_Id, item.qty, parseFloat(item.price)
        ]);

        const orderDetailQuery = `
            INSERT INTO Order_Detail (orID, I_Id, qty, tprice) VALUES ?`;

        await db.query(orderDetailQuery, [orderDetailValues]);

        // **Insert Delivery Info**
        if (dvStatus === "Delivery" && !isAddressChanged) {
            const dvID = `DLV_${Date.now()}`;
            const deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, c_ID, status, schedule_Date,type,driverBalance)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?,?,0)`;

            await db.query(deliveryQuery, [dvID, orID, address, district, Cust_id, expectedDate,dvtype]);
        }else if (dvStatus === "Delivery" && isAddressChanged){
            const dvID = `DLV_${Date.now()}`;
            const deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, c_ID, status, schedule_Date,type,driverBalance)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?,?,0)`;

            await db.query(deliveryQuery, [dvID, orID, newAddress, district, Cust_id, expectedDate,dvtype]);
        }

        // **Insert Coupon Info**
        if (couponCode) {
            const ocID = `OCP_${Date.now()}`;
            const couponQuery = `INSERT INTO order_coupon (ocID, orID, cpID) VALUES (?, ?, ?)`;
            await db.query(couponQuery, [ocID, orID, couponCode]);
        }

        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: { orID, orderDate, expectedDate }
        });

    } catch (error) {
        console.error("Error inserting order data:", error);

        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: error.message
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
            customer : order.c_ID,
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

// Get all purchase notes
router.get("/allPurchasenote", async (req, res) => {
    try {
        // Query the database to fetch all purchase notes
        const [notes] = await db.query("SELECT * FROM purchase");

        // If no items found, return a 404 status
        if (notes.length === 0) {
            return res.status(404).json({ message: "No purchase notes found" });
        }

        // Format the purchase notes
        const formattedNotes = notes.map(item => ({
            noteId: item.pc_Id,
            supId: item.s_ID,
            date: item.rDate,
            total: item.total,
            pay: item.pay,
            balance: item.balance,
            deliveryCharge: item.deliveryCharge,
            invoiceId: item.invoiceId,
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedNotes);
    } catch (error) {
        console.error("Error fetching purchase notes:", error.message);
        return res.status(500).json({ message: "Error fetching purchase notes" });
    }
});

// Get all customers with filters for balance conditions
router.get("/allcustomers", async (req, res) => {
    try {
        const { filter } = req.query; // Get filter type from query params
        let query = "SELECT * FROM Customer";

        // Apply filters based on balance conditions
        if (filter === "Cash") {
            query += " WHERE category = 'Cash'";
        } else if (filter === "Credit") {
            query += " WHERE category = 'Credit'";
        } else if (filter === "Loyal") {
            query += " WHERE category = 'Loyal'";
        }

        const [customers] = await db.query(query);

        // If no customers found, return a 404 status
        if (customers.length === 0) {
            return res.status(404).json({ message: "No customers found" });
        }

        // Format the customer data
        const formattedCustomers = customers.map(customer => ({
            c_ID: customer.c_ID, // Customer ID
            title: customer.title,
            FtName: customer.FtName,
            SrName: customer.SrName,
            id: customer.id, // NIC or identifier
            email: customer.email || "", // Email (nullable)
            address: customer.address, // Address
            contact1: customer.contact1, // Primary contact
            contact2: customer.contact2 || "", // Secondary contact (nullable)
            balance: customer.balance, // Account balance
            category: customer.category,
            type: customer.type,
            t_name: customer.t_name,
            occupation: customer.occupation,
            workPlace: customer.workPlace,
        }));
        // Send the formatted customers as a JSON response
        return res.status(200).json(formattedCustomers);
    } catch (error) {
        console.error("Error fetching customers:", error.message);
        return res.status(500).json({ message: "Error fetching customers" });
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
            status: deliverynote.status,
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
            schedule_Date: formatDate(delivery.schedule_Date),
            delivery_Date: formatDate(delivery.delivery_Date),
        }));

        // Send the formatted items as a JSON response
        return res.status(200).json(formattedDeliveries);
    } catch (error) {
        console.error("Error fetching deliveries:", error.message);
        return res.status(500).json({ message: "Error fetching deliveries" });
    }
});

//add a new supplier
router.post("/supplier", async (req, res) => {
    const { name, contact, contact2, address} = req.body;

    // Generate new supplier ID
    const s_ID = await generateNewId("supplier", "s_ID", "S");
    const sqlInsertSupplier = `
        INSERT INTO Supplier (s_ID, name, address, contact, contact2)
        VALUES (?, ?, ?, ?, ?)`;
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

//add a new customer
router.post("/customer", async (req, res) => {
    const {title,FtName,SrName,id , email, contact, contact2, address,type,category,t_name,occupation,workPlace} = req.body;

    // Generate new supplier ID
    const c_ID = await generateNewId("Customer", "c_ID", "Cus");
    const sqlInsertCustomer = `
        INSERT INTO Customer (c_ID,title,FtName,SrName, address, contact1, contact2,email,id,balance,type,category,t_name,occupation,workPlace) VALUES
            (?, ?, ?, ?, ?,?,?,?,?,?,?,?,?,?,?)`;
    const valuesCustomer = [
        c_ID,title, FtName,SrName,address, contact, contact2 || "", email,id ,0,type,category,t_name,occupation,workPlace
    ];

    try {
        // Insert the customer into the Customer table
        await db.query(sqlInsertCustomer, valuesCustomer);

        // Respond with success message and new supplier details
        return res.status(201).json({
            success: true,
            message: "Customer  added successfully",
            data: {
                c_ID,
                FtName,
                contact,
                contact2,
                id,
            },
        });
    } catch (err) {
        console.error("Error inserting customer  data:", err.message);

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

        // 1️⃣ Fetch Order Info with Customer and Sales Team Details
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.c_ID, c.title, c.FtName, c.SrName, c.address, c.contact1, c.contact2,
                o.advance, o.balance, o.payStatus, o.orStatus, o.delStatus, o.delPrice, o.discount, o.total,o.specialdic,
                o.ordertype, o.expectedDate, o.specialNote, s.stID, e.name AS salesEmployeeName
            FROM Orders o
                     LEFT JOIN Customer c ON o.c_ID = c.c_ID
                     LEFT JOIN sales_team s ON o.stID = s.stID
                     LEFT JOIN Employee e ON s.E_Id = e.E_Id
            WHERE o.OrID = ?`;

        const [orderResult] = await db.query(orderQuery, [orID]);
        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const orderData = orderResult[0];

        // 2️⃣ Fetch Ordered Items
        const itemsQuery = `
            SELECT
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty, i.stockQty
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

        // 5️⃣ Format Customer Name with Title
        const customerName = [orderData.title, orderData.FtName, orderData.SrName].filter(Boolean).join(" ");

        // 6️⃣ Initialize Response Object
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate:formatDate(orderData.orDate),
            customerId: orderData.c_ID,
            customerName: customerName,
            address: orderData.address,
            ordertype: orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            specialdiscount: orderData.specialdic,
            totalPrice: orderData.total,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                color: item.color,
                quantity: item.qty,
                unitPrice: item.unitPrice,
                totalPrice: Number(item.qty) * Number(item.unitPrice),
                booked: item.bookedQty > 0,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty,
                stockQuantity: item.stockQty
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

        // 7️⃣ Fetch Delivery Info If Order is for Delivery
        if (orderData.delStatus === "Delivery") {
            const deliveryQuery = `
                SELECT dv_id, address, district, status, schedule_Date, delivery_Date
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
                    scheduleDate: formatDate(deliveryData.schedule_Date),
                    deliveryDate: deliveryData.delivery_Date ? formatDate(deliveryData.delivery_Date) : null
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
            details: error.message
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

        // 1️⃣ Fetch Order Info with Customer Details
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount, o.netTotal, o.total,
                o.advance, o.balance, o.payStatus, o.stID, o.expectedDate, o.specialNote, o.ordertype,o.specialdic,
                c.title, c.FtName, c.SrName, c.email, c.contact1, c.contact2, c.balance AS customerBalance,
                c.category, c.type, c.t_name, c.occupation, c.workPlace
            FROM Orders o
                     LEFT JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.OrID = ?`;

        const [orderResult] = await db.query(orderQuery, [orID]);
        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const orderData = orderResult[0];

        // 2️⃣ Fetch Ordered Items
        const itemsQuery = `
            SELECT
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // 3️⃣ Fetch Issued Items with barcode and issue date
        const issuedItemsQuery = `
            SELECT
                ii.delNoID, ii.orID, ii.pid_Id, ii.status, ii.date AS issuedDate, 
                p.barcode_img, p.stock_Id, p.pc_Id
            FROM issued_items ii
                     JOIN p_i_detail p ON ii.pid_Id = p.pid_Id
            WHERE ii.orID = ?`;

        const [issuedItemsResult] = await db.query(issuedItemsQuery, [orID]);

        // 4️⃣ Fetch Order Payment History
        const paymentHistoryQuery = `
            SELECT op.op_ID, op.orID, op.amount, op.dateTime
            FROM order_payment op
            WHERE op.orID = ?`;

        const [paymentHistoryResult] = await db.query(paymentHistoryQuery, [orID]);

        // 5️⃣ Format Customer Name
        const customerName = [orderData.title, orderData.FtName, orderData.SrName].filter(Boolean).join(" ");

        // 6️⃣ Prepare Response Data
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: formatDate(orderData.orDate),
            customerId: orderData.c_ID,
            customerName: customerName,
            customerEmail: orderData.email,
            customerPhone: orderData.contact1,
            customerOptionalPhone: orderData.contact2,
            customerBalance: orderData.customerBalance,
            customerCategory: orderData.category,
            customerType: orderData.type,
            customerOccupation: orderData.occupation,
            customerWorkplace: orderData.workPlace,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            specialdiscount: orderData.specialdic,
            totalPrice: orderData.total,
            netTotal: orderData.netTotal,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                color: item.color,
                quantity: item.qty,
                unitPrice: item.unitPrice,
                totalPrice: Number(item.qty) * Number(item.unitPrice),
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty
            })),
            issuedItems: issuedItemsResult.map(item => ({
                pid_Id: item.pid_Id,
                stockId: item.stock_Id,
                BatchId: item.pc_Id,
                // barcodeImage: item.barcode_img.toString("base64"), // Convert LONGBLOB to base64
                status: item.status,
                issuedDate: formatDate(item.issuedDate),
            })),
            paymentHistory: paymentHistoryResult.map(payment => ({
                paymentId: payment.op_ID,
                amount: payment.amount,
                paymentDate: formatDate(payment.dateTime)
            }))
        };

        // 7️⃣ Fetch Delivery Info If Applicable
        if (orderData.delStatus === "Delivery") {
            const deliveryQuery = `
                SELECT 
                    dv.dv_id, dv.address, dv.district, dv.status, dv.schedule_Date, dv.delivery_Date, 
                    dv.type, dv.devID, dv.driverBalance, c.contact1 AS customerContact
                FROM delivery dv
                LEFT JOIN Customer c ON dv.c_ID = c.c_ID
                WHERE dv.orID = ?`;

            const [deliveryResult] = await db.query(deliveryQuery, [orID]);

            if (deliveryResult.length > 0) {
                const deliveryData = deliveryResult[0];
                orderResponse.deliveryInfo = {
                    deliveryId: deliveryData.dv_id,
                    address: deliveryData.address,
                    district: deliveryData.district,
                    status: deliveryData.status,
                    scheduleDate: new Date(deliveryData.schedule_Date).toISOString().split("T")[0],
                    deliveryDate: deliveryData.delivery_Date ? formatDate(deliveryData.delivery_Date) : null,
                    type: deliveryData.type,
                    driverId: deliveryData.devID,
                    driverBalance: deliveryData.driverBalance,
                    customerContact: deliveryData.customerContact
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

//Get Details of returned orders
router.get("/returned-order-details", async (req, res) => {
    try {
        const { orID } = req.query;
        if (!orID) {
            return res.status(400).json({ success: false, message: "Order ID is required" });
        }

        // 1️⃣ Fetch Order Info with Customer, Sales Team, and Return Reason
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount, o.total, 
                o.netTotal, o.advance, o.balance, o.payStatus, o.expectedDate, o.specialNote, o.ordertype,o.specialdic,
                c.title, c.FtName, c.SrName, c.email, c.contact1, c.contact2, c.address,
                s.stID, e.name AS salesEmployeeName, ro.detail AS returnReason
            FROM Orders o
            LEFT JOIN Customer c ON o.c_ID = c.c_ID
            LEFT JOIN sales_team s ON o.stID = s.stID
            LEFT JOIN Employee e ON s.E_Id = e.E_Id
            LEFT JOIN return_orders ro ON o.OrID = ro.OrID
            WHERE o.OrID = ?`;

        const [orderResult] = await db.query(orderQuery, [orID]);
        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }
        const orderData = orderResult[0];

        // 2️⃣ Fetch Ordered Items
        const itemsQuery = `
            SELECT
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty
            FROM Order_Detail od
            JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // 3️⃣ Fetch Issued Items from `p_i_detail` and `issued_items`
        const issuedItemsQuery = `
            SELECT
                ii.delNoID, ii.orID, ii.pid_Id, ii.status, ii.date AS issuedDate, 
                p.I_Id, i.I_name, p.stock_Id, p.pc_Id, p.barcode_img
            FROM issued_items ii
            JOIN p_i_detail p ON ii.pid_Id = p.pid_Id
            JOIN Item i ON p.I_Id = i.I_Id
            WHERE ii.orID = ?`;

        const [issuedItemsResult] = await db.query(issuedItemsQuery, [orID]);

        // 4️⃣ Format Customer Name with Title
        const customerName = [orderData.title, orderData.FtName, orderData.SrName].filter(Boolean).join(" ");

        // 5️⃣ Prepare Response Data
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: formatDate(orderData.orDate),
            customerId: orderData.c_ID,
            customerName: customerName,
            customerEmail: orderData.email,
            address: orderData.address,
            orderType: orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            specialdiscount: orderData.specialdic,
            totalPrice: orderData.total,
            netTotal: orderData.netTotal,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            returnReason: orderData.returnReason || null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                color: item.color,
                quantity: item.qty,
                unitPrice: item.unitPrice,
                totalPrice: Number(item.qty) * Number(item.unitPrice),
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty
            })),
            issuedItems: issuedItemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                stockId: item.stock_Id,
                BatchId: item.pc_Id,
                barcodeImage: item.barcode_img.toString("base64"), // Convert LONGBLOB to base64
                status: item.status,
                issuedDate: formatDate(item.issuedDate),
            }))
        };

        // 6️⃣ Fetch Delivery Info If Applicable
        if (orderData.delStatus === "Delivery") {
            const deliveryQuery = `
                SELECT 
                    dv.dv_id, dv.address, dv.district, dv.status, dv.schedule_Date, dv.delivery_Date, 
                    dv.type, dv.devID, dv.driverBalance, c.contact1 AS customerContact
                FROM delivery dv
                LEFT JOIN Customer c ON dv.c_ID = c.c_ID
                WHERE dv.orID = ?`;

            const [deliveryResult] = await db.query(deliveryQuery, [orID]);

            if (deliveryResult.length > 0) {
                const deliveryData = deliveryResult[0];
                orderResponse.deliveryInfo = {
                    deliveryId: deliveryData.dv_id,
                    address: deliveryData.address,
                    district: deliveryData.district,
                    status: deliveryData.status,
                    scheduleDate: formatDate(deliveryData.schedule_Date),
                    deliveryDate: deliveryData.delivery_Date ? formatDate(deliveryData.delivery_Date) : null,
                    type: deliveryData.type,
                    driverId: deliveryData.devID,
                    driverBalance: deliveryData.driverBalance,
                    customerContact: deliveryData.customerContact
                };
            }
        }

        return res.status(200).json({
            success: true,
            message: "Returned order details fetched successfully",
            order: orderResponse
        });

    } catch (error) {
        console.error("Error fetching returned order details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching returned order details",
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

        // Fetch Order Info along with Customer and Sales Team details
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.c_ID, c.title, c.FtName, c.SrName, c.address, c.contact1, c.contact2,
                o.orStatus, o.delStatus, o.delPrice, o.discount, o.netTotal, o.total,o.specialdic,
                o.advance, o.balance, o.payStatus, o.expectedDate, o.specialNote, o.ordertype,
                s.stID, e.name AS salesEmployeeName
            FROM Orders o
                     LEFT JOIN Customer c ON o.c_ID = c.c_ID
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
            SELECT
                od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                i.bookedQty, i.availableQty, i.stockQty
            FROM Order_Detail od
                     JOIN Item i ON od.I_Id = i.I_Id
            WHERE od.orID = ?`;

        const [itemsResult] = await db.query(itemsQuery, [orID]);

        // Format customer name with title
        const customerName = [orderData.title, orderData.FtName, orderData.SrName].filter(Boolean).join(" ");

        // Prepare Order Response
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate:  formatDate(orderData.orDate),
            ordertype: orderData.ordertype,
            phoneNumber: orderData.contact1,
            optionalNumber: orderData.contact2,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,
            deliveryCharge: orderData.delPrice,
            discount: orderData.discount,
            specialdiscount: orderData.specialdic,
            netTotal: orderData.netTotal,
            totalPrice: orderData.total,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            customerId: orderData.c_ID,
            name: customerName, // Title added to the name
            address: orderData.address,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                itemId: item.I_Id,
                itemName: item.I_name,
                color: item.color,
                quantity: item.qty,
                unitPrice: item.unitPrice,
                totalPrice: Number(item.qty) * Number(item.unitPrice),
                booked: item.bookedQty > 0,
                bookedQuantity: item.bookedQty,
                availableQuantity: item.availableQty,
                stockQuantity: item.stockQty,
            })),
        };
        console.log(orderResponse.items);

        // Fetch Delivery Info if it's a delivery order
        if (orderData.delStatus === "Delivery") {
            const deliveryQuery = `
                SELECT dv_id, address, district, status, schedule_Date, delivery_Date, c_ID
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
                    scheduleDate: formatDate(deliveryData.schedule_Date),
                    deliveryDate: deliveryData.delivery_Date ? formatDate(deliveryData.delivery_Date) : null

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

        // ✅ Fetch stock details from `p_i_detail` table
        const stockQuery = `
            SELECT pid_Id, stock_Id, pc_Id, status, orID, datetime
            FROM p_i_detail
            WHERE I_Id = ?
              AND status IN ('Available', 'Damage', 'Reserved')
            ORDER BY pid_Id ASC, FIELD(status, 'Available', 'Reserved', 'Damage')`;

        const [stockResults] = await db.query(stockQuery, [I_Id]);

        const stockDetails = stockResults.map(stock => ({
            pid_Id: stock.pid_Id,
            stock_Id: stock.stock_Id,
            pc_Id: stock.pc_Id,
            status: stock.status,
            orID: stock.orID,
            datetime: stock.datetime
        }));

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

// router.get("/item-details", async (req, res) => {
//     try {
//         const { I_Id } = req.query;
//
//         if (!I_Id) {
//             return res.status(400).json({ success: false, message: "Item ID is required" });
//         }
//
//         // ✅ Fetch item details from Item table
//         const itemQuery = `
//             SELECT
//                 I.I_Id, I.I_name, I.descrip, I.price, I.stockQty, I.bookedQty, I.availableQty, I.minQTY,
//                 I.warrantyPeriod, I.img, I.img1, I.img2, I.img3, I.color, I.material, I.mn_Cat, I.sb_catOne, I.sb_catTwo
//             FROM Item I
//             WHERE I.I_Id = ?`;
//
//         const [itemResult] = await db.query(itemQuery, [I_Id]);
//
//         if (itemResult.length === 0) {
//             return res.status(404).json({ success: false, message: "Item not found" });
//         }
//
//         const itemData = itemResult[0];
//
//         // ✅ Convert images to Base64
//         const mainImgBase64 = itemData.img ? Buffer.from(itemData.img).toString("base64") : null;
//         const img1Base64 = itemData.img1 ? Buffer.from(itemData.img1).toString("base64") : null;
//         const img2Base64 = itemData.img2 ? Buffer.from(itemData.img2).toString("base64") : null;
//         const img3Base64 = itemData.img3 ? Buffer.from(itemData.img3).toString("base64") : null;
//
//         // ✅ Fetch suppliers providing this item
//         const supplierQuery = `
//             SELECT S.s_ID, S.name, S.contact, ISUP.unit_cost
//             FROM Supplier S
//                      JOIN item_supplier ISUP ON S.s_ID = ISUP.s_ID
//             WHERE ISUP.I_Id = ?`;
//
//         const [suppliersResult] = await db.query(supplierQuery, [I_Id]);
//
//         const suppliers = suppliersResult.map(supplier => ({
//             s_ID: supplier.s_ID,
//             name: supplier.name,
//             contact: supplier.contact,
//             unit_cost: supplier.unit_cost
//         }));
//
//         // ✅ Fetch stock details **excluding** 'Issued' status, only include 'Available', 'Damage', 'Reserved'
//         const stockQuery = `
//             SELECT srd_Id, stock_Id, sr_ID, status
//             FROM m_s_r_detail
//             WHERE I_Id = ?
//               AND status IN ('Available', 'Damage', 'Reserved')
//             ORDER BY FIELD(status, 'Available', 'Reserved', 'Damage')`;
//
//         const [stockResults] = await db.query(stockQuery, [I_Id]);
//
//         // ✅ Categorize stock into 3 separate arrays by status
//         const availableStock = [];
//         const reservedStock = [];
//         const damageStock = [];
//
//         stockResults.forEach(stock => {
//             if (stock.status === 'Available') {
//                 availableStock.push(stock);
//             } else if (stock.status === 'Reserved') {
//                 reservedStock.push(stock);
//             } else if (stock.status === 'Damage') {
//                 damageStock.push(stock);
//             }
//         });
//
//         // ✅ Construct final response
//         const responseData = {
//             success: true,
//             item: {
//                 I_Id: itemData.I_Id,
//                 I_name: itemData.I_name,
//                 descrip: itemData.descrip,
//                 color: itemData.color,
//                 material: itemData.material,
//                 price: itemData.price,
//                 stockQty: itemData.stockQty,
//                 availableQty: itemData.availableQty,
//                 bookedQty: itemData.bookedQty,
//                 warrantyPeriod: itemData.warrantyPeriod,
//                 minQTY: itemData.minQTY,
//                 maincategory: itemData.mn_Cat,
//                 sub_one: itemData.sb_catOne,
//                 sub_two: itemData.sb_catTwo,
//                 img: mainImgBase64,
//                 img1: img1Base64,
//                 img2: img2Base64,
//                 img3: img3Base64,
//                 suppliers: suppliers,
//                 stockDetails: {
//                     available: availableStock, // Stocks with 'Available' status
//                     reserved: reservedStock,   // Stocks with 'Reserved' status
//                     damage: damageStock       // Stocks with 'Damage' status
//                 }
//             }
//         };
//
//         return res.status(200).json(responseData);
//
//     } catch (error) {
//         console.error("❌ Error fetching item details:", error.message);
//         return res.status(500).json({ success: false, message: "Server error", error: error.message });
//     }
// });

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
            customer: order.c_ID, // Customer Email
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
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orwStatus, o.delStatus, o.delPrice,
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
                    customer: order.c_ID,
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
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
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
                    customer: order.c_ID,
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

// Get all orders by status= issued
router.get("/orders-issued", async (req, res) => {
    try {
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
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
            return res.status(404).json({ message: "No Issued orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customer: order.c_ID,
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

// Get all orders by status= deliverd
router.get("/orders-deliverd", async (req, res) => {
    try {
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            WHERE o.orStatus = 'Delivered'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No Delivered orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customer: order.c_ID,
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

// Get all orders by status= returned
router.get("/orders-returned", async (req, res) => {
    try {
        // Query to fetch returned orders with their acceptance status and return reason
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
            WHERE o.orStatus = 'Returned'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No returned orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customer: order.c_ID,
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
                    returnReason: order.returnReason || "No reason provided", // Handle null reasons
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
            message: "Returned orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching returned orders:", error.message);
        return res.status(500).json({ message: "Error fetching returned orders", error: error.message });
    }
});

// Get all orders by status= canceled
router.get("/orders-canceled", async (req, res) => {
    try {
        // Query to fetch returned orders with their acceptance status and return reason
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
            WHERE o.orStatus = 'Cancelled'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No returned orders found" });
        }

        // Group orders by OrID
        const groupedOrders = {};

        orders.forEach(order => {
            if (!groupedOrders[order.OrID]) {
                groupedOrders[order.OrID] = {
                    OrID: order.OrID,
                    orDate: order.orDate,
                    customer: order.c_ID,
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
                    returnReason: order.returnReason || "No reason provided", // Handle null reasons
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
            message: "Returned orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching returned orders:", error.message);
        return res.status(500).json({ message: "Error fetching returned orders", error: error.message });
    }
});

// Get all orders by status= inproduction
router.get("/orders-inproduction", async (req, res) => {
    try {
        // Query to fetch incomplete production orders along with unit cost
        const query = `
            SELECT 
                p.p_ID,
                p.I_Id,
                p.qty,
                p.s_ID,
                p.expectedDate,
                p.specialNote,
                p.status,
                isup.unit_cost
            FROM production p
            LEFT JOIN item_supplier isup ON p.I_Id = isup.I_Id AND p.s_ID = isup.s_ID
            WHERE p.status = 'Incomplete'
        `;

        const [suporders] = await db.query(query);

        // If no orders found, return a 404 status
        if (suporders.length === 0) {
            return res.status(404).json({ message: "No supplier orders found" });
        }

        // Format orders
        const formattedOrders = suporders.map(order => ({
            p_ID: order.p_ID,
            I_Id: order.I_Id,
            qty: order.qty,
            s_ID: order.s_ID,
            expectedDate: order.expectedDate,
            specialNote: order.specialNote,
            status: order.status,
            unit_cost: order.unit_cost !== null ? order.unit_cost : 0  // Handle missing unit cost
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
                Item.color,
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

// get all have to payment to supplier
router.get("/unpaid-stock-details", async (req, res) => {
    try {
        const { s_Id } = req.query;

        // Validate input
        if (!s_Id) {
            return res.status(400).json({ success: false, message: "Supplier ID is required" });
        }

        // Query to fetch unpaid stock details from the purchase table
        const query = `
            SELECT pc_Id, rDate, total, pay, balance, deliveryCharge, invoiceId 
            FROM purchase 
            WHERE s_ID = ? AND balance > 0;
        `;

        const totalQuery = `
            SELECT SUM(total) AS fullTotal 
            FROM purchase 
            WHERE s_ID = ? AND balance > 0;
        `;

        const [itemsResult] = await db.query(query, [s_Id]);
        const [[totalResult]] = await db.query(totalQuery, [s_Id]);

        // If no unpaid items found, return a 404 response
        if (itemsResult.length === 0) {
            return res.status(404).json({ success: false, message: "No unpaid stock details found for the given supplier" });
        }

        // Return the unpaid stock details along with the full total
        return res.status(200).json({
            success: true,
            unpaidStockDetails: itemsResult,
            fullTotal: totalResult.fullTotal || 0, // Ensure fullTotal is returned even if null
        });

    } catch (error) {
        console.error("Error fetching unpaid stock details:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Get all suppliers
router.get("/suppliers", async (req, res) => {
    try {
        // Step 1: Fetch all suppliers
        const suppliersQuery = `SELECT s_ID, name, contact,contact2,address FROM Supplier`;

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

// Get all employees
router.get("/employees", async (req, res) => {
    try {
        // Step 1: Fetch all suppliers
        const employeesQuery = `SELECT E_Id, name, nic, job, basic FROM Employee`;

        const [employeesResult] = await db.query(employeesQuery);
        // Step 2: Check if suppliers were found
        if (employeesResult.length === 0) {
            return res.status(404).json({ success: false, message: "No employees found" });
        }

        // Step 3: Return the supplier details
        return res.status(200).json({
            success: true,
            employees: employeesResult,
        });

    } catch (error) {
        console.error("Error fetching employees:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// get Permanent employees
router.get("/Permanent-employees", async (req, res) => {
    try {
        // Step 1: Fetch all suppliers
        const employeesQuery = `SELECT E_Id, name, nic, job, basic FROM Employee WHERE type='Permanent'`;

        const [employeesResult] = await db.query(employeesQuery);
        // Step 2: Check if suppliers were found
        if (employeesResult.length === 0) {
            return res.status(404).json({ success: false, message: "No employees found" });
        }

        // Step 3: Return the supplier details
        return res.status(200).json({
            success: true,
            employees: employeesResult,
        });

    } catch (error) {
        console.error("Error fetching employees:", error.message);
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
                I.I_Id, I.I_name, I.descrip, I.price, I.stockQty,I.bookedQty,I.availableQty,
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
    const { p_ID, rDate, recCount, cost, delivery, Invoice } = req.body;
    const imageFile = req.file;

    if (!p_ID || !rDate || !recCount || !cost) {
        return res.status(400).json({ error: "All fields are required" });
    }

    try {
        // Fetch production order details
        const [rows] = await db.query(
            "SELECT qty, I_Id, s_ID FROM production WHERE p_ID = ?", [p_ID]
        );

        if (rows.length === 0) {
            return res.status(404).json({ error: "Production order not found" });
        }

        const { qty: currentQty, I_Id: itemId, s_ID: supId } = rows[0];
        const receivedQty = parseInt(recCount);
        const deliveryPrice = parseFloat(delivery) || 0;
        const total = parseFloat(cost) * receivedQty;

        // Validate that the item exists in `item` table
        const [itemExists] = await db.query("SELECT I_Id FROM item WHERE I_Id = ?", [itemId]);
        if (itemExists.length === 0) {
            return res.status(400).json({ error: "Item ID does not exist in item table" });
        }

        // Generate new purchase ID
        const purchase_id = await generateNewId("purchase", "pc_Id", "PC");

        // Handle image upload if any
        let imagePath = null;
        if (imageFile) {
            const imageName = `item_${purchase_id}_${Date.now()}.${imageFile.mimetype.split("/")[1]}`;
            const savePath = path.join("./uploads/images", imageName);
            fs.writeFileSync(savePath, imageFile.buffer);
            imagePath = `/uploads/images/${imageName}`;
        }

        // Convert date format from 'DD/MM/YYYY' to 'YYYY-MM-DD'
        const formattedDate = rDate.split('/').reverse().join('-');

        // Insert into the purchase table
        const insertPurchaseQuery = `
            INSERT INTO purchase (pc_Id, s_ID, rDate, total, pay, balance, deliveryCharge, invoiceId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        await db.query(insertPurchaseQuery, [purchase_id, supId, formattedDate, total, 0, total, deliveryPrice, Invoice]);

        // Check if the item already exists in `item_supplier`
        const checkUnitPriceQuery = `SELECT unit_cost FROM item_supplier WHERE I_Id = ? AND s_ID = ?`;
        const [unitPriceResult] = await db.query(checkUnitPriceQuery, [itemId, supId]);

        if (unitPriceResult.length > 0) {
            const existingUnitPrice = unitPriceResult[0].unit_cost;
            if (parseFloat(existingUnitPrice) !== parseFloat(cost)) {
                // Update unit price if changed
                const updateUnitPriceQuery = `
                    UPDATE item_supplier SET unit_cost = ? WHERE I_Id = ? AND s_ID = ?
                `;
                await db.query(updateUnitPriceQuery, [cost, itemId, supId]);
            }
        } else {
            // Insert new record if it doesn't exist
            const insertUnitPriceQuery = `
                INSERT INTO item_supplier (I_Id, s_ID, unit_cost) VALUES (?, ?, ?)
            `;
            await db.query(insertUnitPriceQuery, [itemId, supId, cost]);
        }

        // Insert into purchase_detail
        const purchaseDetailQuery = `
            INSERT INTO purchase_detail (pc_Id, I_Id, rec_count, unitPrice, total, stock_range)
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        await db.query(purchaseDetailQuery, [purchase_id, itemId, receivedQty, cost, total, ""]);

        // Barcode Generation
        const barcodeFolderPath = path.join("./uploads/barcodes");
        if (!fs.existsSync(barcodeFolderPath)) {
            fs.mkdirSync(barcodeFolderPath, { recursive: true });
        }

        const insertBarcodeQuery = `
            INSERT INTO p_i_detail (pc_Id, I_Id, stock_Id, barcode_img, status, orID, datetime)
            VALUES (?, ?, ?, ?, ?, ?,?)
        `;

        // Get last stock ID for the item
        const [lastStockResult] = await db.query(
            `SELECT MAX(stock_Id) AS lastStockId FROM p_i_detail WHERE I_Id = ?`, [itemId]
        );
        let lastStockId = lastStockResult[0]?.lastStockId || 0;

        // Generate barcodes
        const startStockId = lastStockId + 1;
        for (let j = 1; j <= receivedQty; j++) {
            lastStockId++;
            const barcodeData = `${itemId}-${lastStockId}`;
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

            // Save barcode image
            fs.writeFileSync(barcodeImagePath, pngBuffer);

            // Insert barcode record
            await db.query(insertBarcodeQuery, [purchase_id, itemId, lastStockId, barcodeImagePath, "Available", "", ""]);
        }

        // Update stock_range in purchase_detail
        const stockRange = `${startStockId}-${lastStockId}`;
        await db.query(
            `UPDATE purchase_detail SET stock_range = ? WHERE pc_Id = ? AND I_Id = ?`,
            [stockRange, purchase_id, itemId]
        );

        // Update stock in `Item` table
        await db.query(
            `UPDATE Item SET stockQty = stockQty + ?, availableQty = availableQty + ? WHERE I_Id = ?`,
            [receivedQty, receivedQty, itemId]
        );

        // Determine new status
        let newStatus = "Incomplete";
        let newQty = currentQty - receivedQty;

        if (receivedQty >= currentQty) {
            newStatus = "Complete";
            newQty = 0;
        }

        // Update production table
        await db.query(`UPDATE production SET qty = ?, status = ? WHERE p_ID = ?`, [newQty, newStatus, p_ID]);

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
        const {orID, isPickup, netTotal, totalAdvance, previousAdvance, balance, addedAdvance, updatedDeliveryCharge, updatedDiscount} = req.body;

        if (!orID) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }
        const op_ID = await generateNewId("order_payment", "op_ID", "OP");

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
            await db.query("INSERT INTO order_payment (op_ID,orID, amount, dateTime) VALUES (?,?, ?, NOW())", [op_ID,orID, addedAdvance]);
            await db.query("INSERT INTO cash_balance (reason, ref, ref_type,dateTime,amount) VALUES (?,?, ?, NOW(),?)", ["Order payment",op_ID,"order", addedAdvance]);

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
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
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
                    customer: order.c_ID,
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

// update return order status to other status
router.put("/updateReturnOrder", async (req, res) => {
    try {
        const { orderId,  orderStatus,deliveryStatus,  } = req.body;
        // Check if the order exists
        const orderCheckQuery = `SELECT * FROM orders WHERE OrID = ?`;
        const [orderResult] = await db.query(orderCheckQuery, [orderId]);

        if (orderResult.length === 0) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderUpdateQuery = `UPDATE orders SET orStatus = ?,delStatus = ? WHERE OrID = ?`;
        await db.query(orderUpdateQuery, [
            orderStatus, deliveryStatus, orderId
        ]);

        return res.status(200).json({
            success: true,
            message: "Order updated successfully",
            data: {
                orderId: orderId
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

// Update order
router.put("/update-order-details", async (req, res) => {
    try {
        const { orderId, orderDate, orderStatus,payStatus,phoneNumber,optionalNumber,netTotal,customerId,
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
        // if (advance === null){
        //     const orderUpdateQuery = `
        //     UPDATE orders SET orStatus = ?,delStatus = ? WHERE OrID = ?`;
        //     await db.query(orderUpdateQuery, [
        //          orderStatus, deliveryStatus, orderId
        //     ]);
        // }

        //Update order details
        const orderUpdateQuery = `
            UPDATE orders SET c_ID =?, orStatus = ?, payStatus = ?,delStatus = ?, delPrice = ?, discount = ?,
                              total = ?, advance = ?, balance = ?, specialNote = ?, netTotal=?
            WHERE OrID = ?`;
        await db.query(orderUpdateQuery, [
            customerId, orderStatus, payStatus, deliveryStatus, deliveryCharge, discount, totalPrice,
            advance, balance, specialNote,netTotal, orderId
        ]);
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
        // Query the database to fetch all sales team members with their details
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

        // Query to fetch coupons for each sales team member
        const [coupons] = await db.query(`
            SELECT
                sc.cpID,
                sc.stID,
                sc.discount
            FROM sales_coupon sc;
        `);

        // Group coupons by stID
        const couponMap = {};
        coupons.forEach(coupon => {
            if (!couponMap[coupon.stID]) {
                couponMap[coupon.stID] = [];
            }
            couponMap[coupon.stID].push({
                cpID: coupon.cpID,
                discount: coupon.discount
            });
        });

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
            totalIssued: member.totalIssued,
            coupons: couponMap[member.stID] || [] // Attach coupons or empty array if none exist
        }));

        // Send the formatted data as a JSON response
        return res.status(200).json({
            message: "Sales team members and their coupons retrieved successfully.",
            data: formattedSalesTeam
        });

    } catch (error) {
        console.error("Error fetching sales team members and coupons:", error.message);
        return res.status(500).json({ message: "Error fetching sales team members and coupons" });
    }
});

//Get All driver members
router.get("/drivers", async (req, res) => {
    try {
        // Query the database to fetch all drivers and their related employee details
        const [drivers] = await db.query(`
            SELECT
                d.devID,
                d.balance,
                e.E_Id,
                e.name AS employeeName,
                e.address,
                e.nic,
                e.dob,
                e.contact,
                e.job,
                e.basic
            FROM driver d
                     JOIN Employee e ON d.E_ID = e.E_Id;
        `);

        // If no drivers are found, return a 404 status
        if (drivers.length === 0) {
            return res.status(404).json({ message: "No drivers found" });
        }

        // Format the response data
        const formattedDrivers = drivers.map(driver => ({
            devID: driver.devID,
            E_Id: driver.E_Id,
            employeeName: driver.employeeName,
            address: driver.address,
            nic: driver.nic,
            dob: driver.dob,
            contact: driver.contact,
            job: driver.job,
            basic: driver.basic,
            balance: driver.balance
        }));

        // Send the formatted data as a JSON response
        return res.status(200).json({
            message: "Drivers found.",
            data: formattedDrivers
        });

    } catch (error) {
        console.error("Error fetching drivers:", error.message);
        return res.status(500).json({ message: "Error fetching drivers" });
    }
});

// Get orders for a specific sales team member (stID)
router.get("/orders/by-sales-team", async (req, res) => {
    try {
        const { stID } = req.query;

        // Fetch sales team details
        const [results] = await db.query(`
            SELECT
                e.E_Id AS employeeId,
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
                SUM(CASE WHEN o.orStatus = 'Issued' THEN 1 ELSE 0 END) AS issuedCount,
                COALESCE(SUM(o.netTotal - o.discount), 0) AS totalOrderValue,
                COALESCE(SUM(CASE WHEN o.orStatus = 'Issued' THEN o.netTotal - o.discount ELSE 0 END), 0) AS issuedOrderValue
            FROM sales_team st
            JOIN Employee e ON e.E_Id = st.E_Id
            LEFT JOIN Orders o ON o.stID = st.stID
            WHERE st.stID = ?
            GROUP BY st.stID, e.E_Id, e.name, e.contact, e.nic, e.dob, e.address, e.job, e.basic,
                     st.orderTarget, st.issuedTarget, st.totalOrder, st.totalIssued;
        `, [stID]);

        if (results.length === 0) {
            return res.status(404).json({ message: "No data found for this sales team member." });
        }

        const memberDetails = results[0];

        // Get date ranges
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();
        const firstDayOfCurrentMonth = new Date(currentYear, currentMonth, 1);
        const firstDayOfLastMonth = new Date(currentYear, currentMonth - 1, 1);
        const lastDayOfLastMonth = new Date(currentYear, currentMonth, 0);

        // Fetch orders for the current month
        const [ordersThisMonth] = await db.query(`
            SELECT o.OrID AS orderId, o.orDate AS orderDate, o.netTotal - o.discount AS totalPrice, o.orStatus AS orderStatus
            FROM Orders o
            WHERE o.stID = ? AND o.orDate >= ? AND o.orDate <= ?
        `, [stID, firstDayOfCurrentMonth, currentDate]);

        // Fetch orders for the last month
        const [ordersLastMonth] = await db.query(`
            SELECT o.OrID AS orderId, o.orDate AS orderDate, o.netTotal - o.discount AS totalPrice, o.orStatus AS orderStatus
            FROM Orders o
            WHERE o.stID = ? AND o.orDate >= ? AND o.orDate <= ?
        `, [stID, firstDayOfLastMonth, lastDayOfLastMonth]);

        // Separate orders into Issued and Other types
        const ordersThisMonthIssued = ordersThisMonth.filter(order => order.orderStatus === 'Issued');
        const ordersThisMonthOther = ordersThisMonth.filter(order => order.orderStatus !== 'Issued');
        const ordersLastMonthIssued = ordersLastMonth.filter(order => order.orderStatus === 'Issued');
        const ordersLastMonthOther = ordersLastMonth.filter(order => order.orderStatus !== 'Issued');

        // Fetch coupon separately
        const [coupons] = await db.query(`
            SELECT sc.cpID AS couponId, sc.discount AS couponDiscount
            FROM sales_coupon sc
            WHERE sc.stID = ?;
        `, [stID]);

        // Fetch detailed advance records for the current month
        const [advanceDetails] = await db.query(`
            SELECT ad_ID AS advanceId, E_Id AS employeeId, amount, dateTime
            FROM salary_advance
            WHERE E_Id IN (SELECT E_Id FROM sales_team WHERE stID = ?)
            AND MONTH(dateTime) = MONTH(CURDATE())
            AND YEAR(dateTime) = YEAR(CURDATE());
        `, [stID]);

        // Calculate total advance amount
        const totalAdvance = advanceDetails.reduce((sum, advance) => sum + advance.amount, 0);

        return res.status(200).json({
            message: "Sales team details, orders for current and last month, coupons, and advance details fetched successfully.",
            data: {
                memberDetails,
                ordersThisMonthIssued: ordersThisMonthIssued.length > 0 ? ordersThisMonthIssued : [],
                ordersThisMonthOther: ordersThisMonthOther.length > 0 ? ordersThisMonthOther : [],
                ordersLastMonthIssued: ordersLastMonthIssued.length > 0 ? ordersLastMonthIssued : [],
                ordersLastMonthOther: ordersLastMonthOther.length > 0 ? ordersLastMonthOther : [],
                coupons: coupons.length > 0 ? [coupons[0]] : [],
                advanceDetails: advanceDetails.length > 0 ? advanceDetails : [], // Pass detailed advances
                totalAdvance // Pass total advance amount
            }
        });
    } catch (error) {
        console.error("Error fetching data:", error.message);
        return res.status(500).json({ message: "Error fetching data." });
    }
});

//Get in detail for a specific driver (devID)
router.get("/drivers/details", async (req, res) => {
    try {
        const { devID } = req.query;

        if (!devID) {
            return res.status(400).json({ message: "Missing devID parameter." });
        }

        // ✅ Fetch Driver & Employee Details
        const driverQuery = `
            SELECT d.devID, d.balance, e.E_Id, e.name, e.address, e.nic, e.dob, e.contact, e.job, e.basic
            FROM driver d
                     INNER JOIN Employee e ON d.E_ID = e.E_Id
            WHERE d.devID = ?;
        `;
        const [driverResults] = await db.execute(driverQuery, [devID]);

        if (driverResults.length === 0) {
            return res.status(404).json({ message: "Driver not found." });
        }

        // ✅ Fetch & Calculate Delivery Charges (Total & Detailed) with Non-Zero driverBalance
        const chargeQuery = `
            SELECT dv_id AS deliveryId, delivery_Date AS date, driverBalance AS amount
            FROM delivery
            WHERE devID = ?
              AND (DATE(delivery_Date) = CURDATE()
               OR (MONTH(delivery_Date) = MONTH(CURDATE()) AND YEAR(delivery_Date) = YEAR(CURDATE())))
              AND driverBalance > 0;  -- Only consider deliveries with a non-zero driverBalance
        `;
        const [chargeDetails] = await db.execute(chargeQuery, [devID]);

        const dailyCharges = chargeDetails.filter(delivery => new Date(delivery.date).toDateString() === new Date().toDateString());
        const monthlyCharges = chargeDetails;

        const dailyChargeTotal = dailyCharges.reduce((sum, charge) => sum + charge.amount, 0);
        const monthlyChargeTotal = monthlyCharges.reduce((sum, charge) => sum + charge.amount, 0);

        // ✅ Fetch Delivery Notes for This Month & Last Month
        const deliveryNoteQuery = `
            SELECT delNoID, district, hire, MONTH(date) AS month, YEAR(date) AS year
            FROM delivery_note
            WHERE devID = ? AND status = 'complete'
              AND (MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE())
               OR MONTH(date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(date) = YEAR(CURDATE()));
        `;
        const [deliveryNotes] = await db.execute(deliveryNoteQuery, [devID]);

        const thisMonthNotes = deliveryNotes.filter(note => note.month === new Date().getMonth() + 1);
        const lastMonthNotes = deliveryNotes.filter(note => note.month === new Date().getMonth());

        // ✅ Fetch Advance Details for Current Month
        const advanceQuery = `
            SELECT ad_ID AS advanceId, amount, dateTime
            FROM salary_advance
            WHERE E_Id = ? AND MONTH(dateTime) = MONTH(CURDATE()) AND YEAR(dateTime) = YEAR(CURDATE());
        `;
        const [advanceDetails] = await db.execute(advanceQuery, [devID]);

        // ✅ Calculate Total Advance
        const totalAdvance = advanceDetails.reduce((sum, advance) => sum + advance.amount, 0);

        // ✅ Prepare Final Response
        const responseData = {
            ...driverResults[0],
            deliveryCharges: {
                dailyChargeTotal,
                dailyCharges: dailyCharges.length > 0 ? dailyCharges : [],
                monthlyChargeTotal,
                monthlyCharges: monthlyCharges.length > 0 ? monthlyCharges : []
            },
            deliveryNotes: {
                thisMonth: thisMonthNotes,
                lastMonth: lastMonthNotes,
            },
            advanceDetails: advanceDetails.length > 0 ? advanceDetails : [],
            totalAdvance,
        };

        return res.status(200).json({ success: true, data: responseData });

    } catch (error) {
        console.error("Error fetching driver details:", error.message);
        return res.status(500).json({ message: "Error fetching driver details." });
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
router.get("/subcategories", async (req, res) => {
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
router.get("/SubCatNames", async (req, res) => {
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

        // Insert into `main_stock_received`
        const insertQuery = `
            INSERT INTO main_stock_received (s_ID, I_Id, rDate, rec_count, unitPrice, detail, payment)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;
        const [result] = await db.query(insertQuery, [
            supplierId,
            itemId,
            date,
            stockCount,
            cost,
            comment || "",
            "NotPaid",
        ]);
        const receivedStockId = result.insertId;

        // Update Item table stock
        await db.query(
            `UPDATE Item SET stockQty = stockQty + ?, availableQty = availableQty + ? WHERE I_Id = ?`,
            [stockCount, stockCount, itemId]
        );

        // Get last `stock_Id`
        const [lastStockResult] = await db.query(
            `SELECT MAX(stock_Id) AS lastStockId FROM p_i_detail WHERE I_Id = ?`,
            [itemId]
        );
        let lastStockId = lastStockResult[0]?.lastStockId || 0;

        const insertDetailQuery = `
            INSERT INTO p_i_detail (I_Id, stock_Id, pi_ID, barcode, status, orID, datetime)
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

// add purchase note and add stock
// Generate barcodes for each stock
router.post("/addStock", upload.single("image"), async (req, res) => {
    try {
        const { purchase_id, supplier_id, date, itemTotal, delivery, invoice, items } = req.body;
        const imageFile = req.file;

        const total = Number(itemTotal) || 0;
        const deliveryPrice = Number(delivery) || 0;

        if (!supplier_id || !itemTotal || !date || !delivery || !purchase_id || !items) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        let imagePath = null;
        if (imageFile) {
            const imageName = `item_${purchase_id}_${Date.now()}.${imageFile.mimetype.split("/")[1]}`;
            const savePath = path.join("./uploads/images", imageName);
            fs.writeFileSync(savePath, imageFile.buffer);
            imagePath = `/uploads/images/${imageName}`;
        }

        const formattedDate = date.split('/').reverse().join('-');

        const insertQuery = `
            INSERT INTO purchase (pc_Id, s_ID, rDate, total, pay, balance, deliveryCharge, invoiceId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(insertQuery, [purchase_id, supplier_id, formattedDate, total, 0, total, deliveryPrice, invoice]);

        const stockCount = items.length;
        const stockDetails = [];

        for (let i = 0; i < stockCount; i++) {
            const { I_Id, unit_price, quantity } = items[i];
            const totalPrice = parseFloat(unit_price) * Number(quantity);

            const checkUnitPriceQuery = `SELECT unit_cost FROM item_supplier WHERE I_Id = ? AND s_ID = ?`;
            const [unitPriceResult] = await db.query(checkUnitPriceQuery, [I_Id, supplier_id]);

            if (unitPriceResult.length > 0) {
                const existingUnitPrice = unitPriceResult[0].unit_cost;
                if (parseFloat(existingUnitPrice) !== parseFloat(unit_price)) {
                    const updateUnitPriceQuery = `
                        UPDATE item_supplier
                        SET unit_cost = ?
                        WHERE I_Id = ? AND s_ID = ?`;
                    await db.query(updateUnitPriceQuery, [unit_price, I_Id, supplier_id]);
                }
            } else {
                const insertUnitPriceQuery = `
                    INSERT INTO item_supplier (I_Id, s_ID, unit_cost)
                    VALUES (?, ?, ?)`;
                await db.query(insertUnitPriceQuery, [I_Id, supplier_id, unit_price]);
            }

            const purchaseDetailQuery = `
                INSERT INTO purchase_detail (pc_Id, I_Id, rec_count, unitPrice, total, stock_range)
                VALUES (?, ?, ?, ?, ?, ?)`;
            await db.query(purchaseDetailQuery, [purchase_id, I_Id, quantity, unit_price, totalPrice, ""]);

            stockDetails.push({ I_Id, quantity });
        }

        const insertBarcodeQuery = `
            INSERT INTO p_i_detail (pc_Id, I_Id, stock_Id, barcode_img, status, orID, datetime)
            VALUES (?, ?, ?, ?, ?, ?, ?)`;

        const barcodeFolderPath = path.join("./uploads/barcodes");
        if (!fs.existsSync(barcodeFolderPath)) {
            fs.mkdirSync(barcodeFolderPath, { recursive: true });
        }

        const stockRanges = [];

        for (let i = 0; i < stockCount; i++) {
            const { I_Id, quantity } = stockDetails[i];

            const [lastStockResult] = await db.query(
                `SELECT MAX(stock_Id) AS lastStockId FROM p_i_detail WHERE I_Id = ?`,
                [I_Id]
            );
            let lastStockId = lastStockResult[0]?.lastStockId || 0;
            let startStockId = lastStockId + 1;

            for (let j = 1; j <= quantity; j++) {
                lastStockId++;
                const barcodeData = `${I_Id}-${lastStockId}`;
                const barcodeImageName = `barcode_${barcodeData}.png`;
                const barcodeImagePath = path.join(barcodeFolderPath, barcodeImageName);

                const pngBuffer = await bwipjs.toBuffer({
                    bcid: "code128",
                    text: barcodeData,
                    scale: 3,
                    height: 10,
                    includetext: true,
                    textxalign: "center",
                });

                fs.writeFileSync(barcodeImagePath, pngBuffer);

                await db.query(insertBarcodeQuery, [
                    purchase_id,
                    I_Id,
                    lastStockId,
                    barcodeImagePath,
                    "Available",
                    "",
                    "",
                ]);
            }

            // ✅ Update stock only ONCE per item
            await db.query(
                `UPDATE Item SET stockQty = stockQty + ?, availableQty = availableQty + ? WHERE I_Id = ?`,
                [quantity, quantity, I_Id]
            );

            const stockRange = `${startStockId}-${lastStockId}`;
            stockRanges.push({ I_Id, stockRange });
        }

        for (let { I_Id, stockRange } of stockRanges) {
            const updateStockRangeQuery = `
                UPDATE purchase_detail
                SET stock_range = ?
                WHERE pc_Id = ? AND I_Id = ?`;
            await db.query(updateStockRangeQuery, [stockRange, purchase_id, I_Id]);
        }

        return res.status(201).json({
            success: true,
            message: "Stock received successfully, image uploaded, and barcodes saved!",
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

// Find subcategory by Ca_Id
router.get("/find-subcategory", async (req, res) => {
    try {
        const { Ca_Id } = req.query;

        // Validate query parameter
        if (!Ca_Id) {
            return res.status(400).json({ message: "Ca_Id is required." });
        }

        // Query the database
        const [subcategories] = await db.query(`
            SELECT sb_c_id, subcategory 
            FROM subCat_one 
            WHERE Ca_Id = ?;
        `, [Ca_Id]);

        // If no subcategories found, return a 404 response
        if (subcategories.length === 0) {
            return res.status(404).json({ message: "No subcategories found for this Ca_Id." });
        }

        // Return the result
        return res.status(200).json({
            message: "Subcategories found.",
            data: subcategories,  // Returns an array of subcategories
        });

    } catch (error) {
        console.error("Error fetching subcategories:", error.message);
        return res.status(500).json({ message: "Error fetching subcategories" });
    }
});

//Find issuded orders by district & date
router.get("/find-completed-orders", async (req, res) => {
    try {
        const { district, date } = req.query;

        if (!district) {
            return res.status(400).json({ success: false, message: "District is required." });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required." });
        }

        // Parse the date in DD/MM/YYYY format and convert it to YYYY-MM-DD format
        const parsedDate = parseDate(date);

        // 1️⃣ Fetch Completed Orders with Sales Team & Customer Details
        const orderQuery = `
            SELECT
                o.orId, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount,
                o.total, o.ordertype, o.stID, o.expectedDate, o.specialNote, o.advance, o.balance,
                o.payStatus, d.address, d.district, d.schedule_Date, d.type,
                s.stID, e.name AS salesEmployeeName,
                c.FtName, c.SrName, c.contact1, c.contact2
            FROM Orders o
                     JOIN delivery d ON o.orID = d.orID
                     LEFT JOIN sales_team s ON o.stID = s.stID
                     LEFT JOIN Employee e ON s.E_Id = e.E_Id
                     LEFT JOIN Customer c ON o.c_ID = c.c_ID
            WHERE d.district = ? AND o.orStatus = 'Completed' AND o.expectedDate = ?;
        `;

        const [orders] = await db.query(orderQuery, [district, parsedDate]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No completed orders found for this district and date." });
        }

        // 2️⃣ Fetch Ordered Items for Each Order
        const orderDetails = await Promise.all(orders.map(async (order) => {
            const itemsQuery = `
                SELECT
                    od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                    i.bookedQty, i.availableQty
                FROM Order_Detail od
                         JOIN Item i ON od.I_Id = i.I_Id
                WHERE od.orID = ?`;

            const [items] = await db.query(itemsQuery, [order.orId]);

            // 3️⃣ Fetch Booked Items for Each Order
            const bookedItemsQuery = `
                SELECT bi.I_Id, i.I_name, bi.qty
                FROM booked_item bi
                         JOIN Item i ON bi.I_Id = i.I_Id
                WHERE bi.orID = ?`;

            const [bookedItems] = await db.query(bookedItemsQuery, [order.orId]);

            // 4️⃣ Fetch Accepted Items
            const acceptedOrdersQuery = `
                SELECT ao.I_Id, i.I_name, ao.itemReceived, ao.status
                FROM accept_orders ao
                         JOIN Item i ON ao.I_Id = i.I_Id
                WHERE ao.orID = ?`;

            const [acceptedOrders] = await db.query(acceptedOrdersQuery, [order.orId]);

            // 5️⃣ Build the Response Object
            return {
                orderId: order.orId,
                orderDate: formatDate(order.orDate),
                expectedDeliveryDate: formatDate(order.expectedDate),
                customerId: order.c_ID,
                customerName: `${order.FtName} ${order.SrName}`,
                phoneNumber: order.contact1,
                optionalNumber: order.contact2,
                orderStatus: order.orStatus,
                deliveryStatus: order.delStatus,
                totalPrice: order.total,
                deliveryCharge : order.delPrice,
                discount : order.discount,
                advance: order.advance,
                balance: order.balance,
                payStatus: order.payStatus,
                deliveryInfo: {
                    address: order.address,
                    district: order.district,
                    scheduleDate: formatDate(order.schedule_Date),
                    type : order.type,
                },
                items: items.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    quantity: item.qty,
                    color: item.color,
                    price: item.tprice,
                    unitPrice: item.unitPrice,
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty,
                })),
                salesTeam: {
                    stID: order.stID,
                    employeeName: order.salesEmployeeName, // Sales team member's name
                },
                bookedItems: bookedItems.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    quantity: item.qty
                })),
                acceptedOrders: acceptedOrders.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    itemReceived: item.itemReceived,
                    status: item.status
                }))
            };
        }));

        return res.status(200).json({
            success: true,
            message: "Completed orders fetched successfully.",
            orders: orderDetails
        });

    } catch (error) {
        console.error("Error fetching completed orders:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching completed orders.",
            details: error.message
        });
    }
});

// Find Return Orders by district & date
router.get("/find-returned-orders", async (req, res) => {
    try {
        const { district, date } = req.query;

        if (!district) {
            return res.status(400).json({ success: false, message: "District is required." });
        }

        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required." });
        }

        // Parse date in YYYY-MM-DD format
        const parsedDate = parseDate(date);

        // Fetch Return Orders (Only Orders with Returned Items)
        const orderQuery = `
            SELECT
                o.orId, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount,
                o.total, o.ordertype, o.stID, o.expectedDate, o.specialNote, o.advance, o.balance,
                o.payStatus, d.address, d.district, d.schedule_Date, d.type,
                s.stID, e.name AS salesEmployeeName,
                c.FtName, c.SrName, c.contact1, c.contact2
            FROM Orders o
            JOIN delivery d ON o.orID = d.orID
            LEFT JOIN sales_team s ON o.stID = s.stID
            LEFT JOIN Employee e ON s.E_Id = e.E_Id
            LEFT JOIN Customer c ON o.c_ID = c.c_ID
            WHERE d.district = ? AND o.orStatus = 'Returned' AND o.expectedDate = ?;
        `;

        const [orders] = await db.query(orderQuery, [district, parsedDate]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No return orders found for this district and date." });
        }

        // Process return orders
        const orderDetails = await Promise.all(orders.map(async (order) => {
            // Fetch only return items from the issued_item table
            const returnItemsQuery = `
                SELECT ii.I_Id, i.I_name, ii.qty, i.color, ii.status
                FROM issued_item ii
                JOIN Item i ON ii.I_Id = i.I_Id
                WHERE ii.orID = ? AND ii.status IN ('Reserved', 'Available');`;

            const [returnItems] = await db.query(returnItemsQuery, [order.orId]);

            return {
                orderId: order.orId,
                orderDate: formatDate(order.orDate),
                expectedDeliveryDate: formatDate(order.expectedDate),
                customerId: order.c_ID,
                customerName: `${order.FtName} ${order.SrName}`,
                phoneNumber: order.contact1,
                optionalNumber: order.contact2,
                orderStatus: order.orStatus,
                deliveryStatus: order.delStatus,
                totalPrice: order.total,
                deliveryCharge: order.delPrice,
                discount: order.discount,
                advance: order.advance,
                balance: order.balance,
                payStatus: order.payStatus,
                deliveryInfo: {
                    address: order.address,
                    district: order.district,
                    scheduleDate: formatDate(order.schedule_Date),
                    type: order.type,
                },
                salesTeam: {
                    stID: order.stID,
                    employeeName: order.salesEmployeeName,
                },
                returnItems: returnItems.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    quantity: item.qty,
                    color: item.color,
                    status: item.status, // Reserved or Available
                }))
            };
        }));

        return res.status(200).json({
            success: true,
            message: "Return orders fetched successfully.",
            orders: orderDetails
        });

    } catch (error) {
        console.error("Error fetching return orders:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching return orders.",
            details: error.message
        });
    }
});

//Find issuded orders by  date
router.get("/find-completed-orders-by-date", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required." });
        }

        // Ensure the date is in `YYYY-MM-DD` format for the database query
        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD." });
        }

        // Fetch completed orders with customer details, sales team, and employee name
        const orderQuery = `
            SELECT
                o.orId, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount,
                o.total, o.ordertype, o.stID, o.expectedDate, o.specialNote, o.advance, o.balance,
                o.payStatus, d.address, d.district, d.type, d.status AS deliveryStatus, d.schedule_Date,
                s.stID, e.name AS salesEmployeeName,
                c.FtName, c.SrName, c.contact1, c.contact2
            FROM Orders o
                     JOIN delivery d ON o.orID = d.orID
                     LEFT JOIN sales_team s ON o.stID = s.stID
                     LEFT JOIN Employee e ON s.E_Id = e.E_Id
                     LEFT JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Completed' AND o.expectedDate = ?;
        `;

        const [orders] = await db.query(orderQuery, [parsedDate]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No completed orders found for this date." });
        }

        // Process orders
        const orderDetails = await Promise.all(orders.map(async (order) => {
            const itemsQuery = `
                SELECT od.I_Id, i.I_name, i.color, od.qty, od.tprice, i.price AS unitPrice,
                       i.bookedQty, i.availableQty
                FROM Order_Detail od
                         JOIN Item i ON od.I_Id = i.I_Id
                WHERE od.orID = ?`;

            const [items] = await db.query(itemsQuery, [order.orId]);

            return {
                orderId: order.orId,
                orderDate: formatDate(order.orDate),
                expectedDeliveryDate: formatDate(order.expectedDate),
                customerId: order.c_ID,
                customerName: `${order.FtName} ${order.SrName}`,
                phoneNumber: order.contact1,
                optionalNumber: order.contact2,
                orderStatus: order.orStatus,
                deliveryStatus: order.delStatus,
                totalPrice: order.total,
                deliveryCharge: order.delPrice,
                discount: order.discount,
                advance: order.advance,
                balance: order.balance,
                payStatus: order.payStatus,
                deliveryInfo: {
                    address: order.address,
                    district: order.district,
                    scheduleDate: formatDate(order.schedule_Date),
                    type: order.type,
                },
                items: items.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    quantity: item.qty,
                    color: item.color,
                    price: item.tprice,
                    unitPrice: item.unitPrice,
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty,
                })),
                salesTeam: {
                    stID: order.stID,
                    employeeName: order.salesEmployeeName, // Sales team member's name
                },
            };
        }));

        return res.status(200).json({
            success: true,
            message: "Completed orders fetched successfully.",
            orders: orderDetails,
        });

    } catch (error) {
        console.error("Error fetching completed orders:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching completed orders.",
            details: error.message,
        });
    }
});

//Find Return orders by  date
router.get("/find-returned-orders-by-date", async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ success: false, message: "Date is required." });
        }

        // Convert DD/MM/YYYY to YYYY-MM-DD
        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD." });
        }

        // Fetch Return Orders (Only Orders with Returned Items)
        const orderQuery = `
            SELECT
                o.orId, o.orDate, o.c_ID, o.orStatus, o.delStatus, o.delPrice, o.discount,
                o.total, o.ordertype, o.stID, o.expectedDate, o.specialNote, o.advance, o.balance,
                o.payStatus, d.address, d.district, d.type, d.status AS deliveryStatus, d.schedule_Date,
                s.stID, e.name AS salesEmployeeName,
                c.FtName, c.SrName, c.contact1, c.contact2
            FROM Orders o
            JOIN delivery d ON o.orID = d.orID
            LEFT JOIN sales_team s ON o.stID = s.stID
            LEFT JOIN Employee e ON s.E_Id = e.E_Id
            LEFT JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Return' AND o.expectedDate = ?;
        `;

        const [orders] = await db.query(orderQuery, [parsedDate]);

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No return orders found for this date." });
        }

        // Process return orders
        const orderDetails = await Promise.all(orders.map(async (order) => {
            // Fetch only return items from the issued_item table
            const returnItemsQuery = `
                SELECT ii.I_Id, i.I_name, ii.qty, i.color, ii.status
                FROM issued_item ii
                JOIN Item i ON ii.I_Id = i.I_Id
                WHERE ii.orID = ? AND ii.status IN ('Reserved', 'Available');`;

            const [returnItems] = await db.query(returnItemsQuery, [order.orId]);

            return {
                orderId: order.orId,
                orderDate: formatDate(order.orDate),
                expectedDeliveryDate: formatDate(order.expectedDate),
                customerId: order.c_ID,
                customerName: `${order.FtName} ${order.SrName}`,
                phoneNumber: order.contact1,
                optionalNumber: order.contact2,
                orderStatus: order.orStatus,
                deliveryStatus: order.delStatus,
                totalPrice: order.total,
                deliveryCharge: order.delPrice,
                discount: order.discount,
                advance: order.advance,
                balance: order.balance,
                payStatus: order.payStatus,
                deliveryInfo: {
                    address: order.address,
                    district: order.district,
                    scheduleDate: formatDate(order.schedule_Date),
                    type: order.type,
                },
                salesTeam: {
                    stID: order.stID,
                    employeeName: order.salesEmployeeName,
                },
                returnItems: returnItems.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    quantity: item.qty,
                    color: item.color,
                    status: item.status, // Reserved or Available
                }))
            };
        }));

        return res.status(200).json({
            success: true,
            message: "Return orders fetched successfully.",
            orders: orderDetails,
        });

    } catch (error) {
        console.error("Error fetching return orders:", error.message);
        return res.status(500).json({
            success: false,
            message: "Error fetching return orders.",
            details: error.message,
        });
    }
});

// Get subcat one detail by ca_id
router.get("/getSubcategories", async (req, res) => {
    const { Ca_Id } = req.query;
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
    const { Ca_Id, sub_one, sub_two, isNewSubOne } = req.body;
    const subcatone_img = req.files["subcatone_img"] ? req.files["subcatone_img"][0].buffer : null;
    const subcattwo_img = req.files["subcattwo_img"] ? req.files["subcattwo_img"][0].buffer : null;

    try {
        let sb_c_id;

        if (isNewSubOne === "true") {
            // Generate ID for new subCat_one
            sb_c_id = await generateNewId("subCat_one", "sb_c_id", "S1");

            // Insert new subcategory into subCat_one
            await db.query(
                "INSERT INTO subCat_one (sb_c_id, subcategory, Ca_Id, img) VALUES (?, ?, ?, ?)",
                [sb_c_id, sub_one, Ca_Id, subcatone_img]
            );
        } else {
            // Fetch existing sb_c_id for selected subcategory
            const [existingSub] = await db.query(
                "SELECT sb_c_id FROM subCat_one WHERE subcategory = ? AND Ca_Id = ?",
                [sub_one, Ca_Id]
            );

            if (!existingSub.length) {
                return res.status(400).json({ success: false, message: "Invalid subcategory selection." });
            }
            sb_c_id = existingSub[0].sb_c_id;
        }

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
    const { district } = req.query;

    if (!district) {
        return res.status(400).json({ message: "District is required" });
    }

    try {
        // Fetch all delivery dates for the given district
        const [result] = await db.query(
            "SELECT ds_date FROM delivery_schedule WHERE district = ?",
            [district]
        );

        if (result.length === 0) {
            return res.status(404).json({ message: "District not found" });
        }

        // Convert UTC timestamps to IST and format them as YYYY-MM-DD
        const upcomingDates = result
            .map(row => {
                const utcDate = new Date(row.ds_date);

                // Convert to IST (UTC +5:30)
                const istDate = new Date(utcDate.getTime() + 5.5 * 60 * 60 * 1000);

                return istDate.toISOString().split("T")[0]; // Extract YYYY-MM-DD
            })
            .filter(date => {
                const today = new Date();
                today.setHours(0, 0, 0, 0); // Reset time to midnight for comparison

                return new Date(date) >= today; // Keep today's and upcoming dates
            })
            .sort((a, b) => new Date(a) - new Date(b));

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

// get stock detail by item ids
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
            SELECT * FROM p_i_detail
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

// get stock detail by item id
router.post("/get-stock-detail", async (req, res) => {
    try {
        const { itemId } = req.body;

        if (!itemId || typeof itemId !== "string") {
            return res.status(400).json({ error: "Invalid request. 'itemId' must be a non-empty string." });
        }

        const trimmedItemId = itemId.trim();

        const sql = `
            SELECT * FROM p_i_detail
            WHERE I_Id = ?
              AND status = 'Available'
        `;

        const [results] = await db.query(sql, [trimmedItemId]);

        if (results.length === 0) {
            return res.status(404).json({
                message: "No stock details found for the provided item ID",
                itemId: trimmedItemId,
                stockDetails: []
            });
        }

        return res.status(200).json({
            message: "Stock details retrieved successfully",
            itemId: trimmedItemId,
            stockDetails: results
        });

    } catch (error) {
        console.error("Error fetching stock details:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Special Reserved
router.post("/special-reserved", async (req, res) => {
    const { orID, selectedItems } = req.body;

    if (!orID || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // Group items by I_Id and count how many times each appears in selectedItems
        const itemCounts = {};
        for (const item of selectedItems) {
            itemCounts[item.I_Id] = (itemCounts[item.I_Id] || 0) + 1;
        }

        for (const [I_Id, newReserveCount] of Object.entries(itemCounts)) {
            // Get total qty allowed from Order_Detail
            const [orderDetails] = await db.query(
                `SELECT qty FROM Order_Detail WHERE orID = ? AND I_Id = ?`,
                [orID, I_Id]
            );

            if (orderDetails.length === 0) {
                return res.status(400).json({ success: false, message: `Item ${I_Id} not found in order` });
            }

            const allowedQty = orderDetails[0].qty;

            // Get current reserved count in p_i_detail for this orID and I_Id
            const [reservedCountData] = await db.query(
                `SELECT COUNT(*) AS reservedCount
                 FROM p_i_detail
                 WHERE orID = ? AND I_Id = ? AND status = 'Reserved'`,
                [orID, I_Id]
            );

            const reservedCount = reservedCountData[0].reservedCount || 0;
            const totalAfterReserve = reservedCount + newReserveCount;

            if (totalAfterReserve > allowedQty) {
                return res.status(400).json({
                    success: false,
                    message: `Cannot reserve more than ordered for Item ${I_Id}. Ordered: ${allowedQty}, Already Reserved: ${reservedCount}, Trying to Reserve: ${newReserveCount}`
                });
            }
        }

        // Passed checks - now reserve items and insert into Special_Reservation table
        for (const item of selectedItems) {
            // Update p_i_detail status to 'Reserved'
            await db.query(
                `UPDATE p_i_detail
                 SET status = 'Reserved', orID = ?, datetime = NOW()
                 WHERE pid_Id = ?`,
                [orID, item.pid_Id]
            );

            // Update the Item table to adjust reservedQty and bookedQty
            await db.query(
                `UPDATE Item
                 SET bookedQty = bookedQty - 1,
                     reservedQty = reservedQty + 1
                 WHERE I_Id = ?`,
                [item.I_Id]
            );

            // Insert into Special_Reservation table
            await db.query(
                `INSERT INTO Special_Reservation (orID, pid_Id)
                 VALUES (?, ?)`,
                [orID, item.pid_Id]
            );
        }

        return res.status(200).json({ success: true, message: "Items reserved and Special_Reservation updated successfully" });

    } catch (error) {
        console.error("Error updating reservation:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// GET reserved items for an order
router.post("/get-special-reserved", async (req, res) => {
    try {
        const { orID, itemIds } = req.body;
        console.log(orID)

        if (!orID || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: "Invalid request. Provide orID and itemIds array." });
        }

        // Construct placeholders for itemIds
        const placeholders = itemIds.map(() => '?').join(', ');

        const sql = `
            SELECT sr.srID, sr.orID, sr.pid_Id, p.*
            FROM Special_Reservation sr
            JOIN p_i_detail p ON sr.pid_Id = p.pid_Id
            WHERE sr.orID = ?
              AND p.I_Id IN (${placeholders})
        `;

        const [results] = await db.query(sql, [orID, ...itemIds]);

        return res.status(200).json({
            message: "Special reserved items fetched successfully",
            reservedItems: results
        });
    } catch (error) {
        console.error("Error fetching special reserved items:", error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
});

// Issued order
router.post("/issued-order", async (req, res) => {
    const { orID, delStatus, delPrice, discount, subtotal, total, advance, balance, payStatus, stID, paymentAmount, selectedItems } = req.body;

    if (!orID || !stID || paymentAmount === undefined || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // 1. Update Orders table
        await db.query(
            `UPDATE Orders
             SET delStatus = ?, orStatus = 'Issued', delPrice = ?, discount = ?, total = ?, advance = ?, balance = ?, payStatus = ?, stID = ?
             WHERE OrID = ?`,
            [delStatus, delPrice, discount, total, advance, balance, payStatus, stID, orID]
        );

        // 2. Update p_i_detail table (Mark selected items as issued)
        const updateItemPromises = selectedItems.map(async (item) => {
            await db.query(
                `UPDATE p_i_detail
                 SET status = 'Issued', orID = ?, datetime = NOW()
                 WHERE pid_Id = ?`,
                [orID, item.pid_Id]
            );

            await db.query(
                `INSERT INTO issued_items (orID, pid_Id, status, date) VALUES (?, ?, 'Issued', NOW())`,
                [orID, item.pid_Id]
            );
        });

        // Run all queries in parallel
        await Promise.all(updateItemPromises);

        // 3. Get Order Details
        const [[orderDetail]] = await db.query(
            `SELECT advance, balance, discount, total AS netTotal FROM Orders WHERE OrID = ?`,
            [orID]
        );

        // 4. Update sales_team table
        const issuedPrice = orderDetail.balance === 0
            ? parseFloat(orderDetail.netTotal) - parseFloat(orderDetail.discount)
            : orderDetail.advance || 0;

        await db.query(
            `UPDATE sales_team SET totalIssued = totalIssued + ? WHERE stID = ?`,
            [issuedPrice, stID]
        );

        // 5. Update Item stock quantities
        const [orderItems] = await db.query(
            `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
            [orID]
        );

        const updateStockPromises = orderItems.map(item =>
            db.query(
                `UPDATE Item SET stockQty = stockQty - ?, bookedQty = bookedQty - ? WHERE I_Id = ? AND stockQty >= ?`,
                [item.qty, item.qty, item.I_Id, item.qty]
            )
        );

        await Promise.all(updateStockPromises);

        // 6. Delete from booked_item & accept_orders
        await db.query(`DELETE FROM booked_item WHERE orID = ?`, [orID]);
        await db.query(`DELETE FROM accept_orders WHERE orID = ?`, [orID]);

        // 7. Insert into Payment table
        const op_ID = await generateNewId("order_payment", "op_ID", "OP");
        await db.query("INSERT INTO order_payment (op_ID, orID, amount, dateTime) VALUES (?, ?, ?, NOW())", [op_ID, orID, paymentAmount]);
        await db.query("INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)", ["Order payment", op_ID, "order", paymentAmount]);

        return res.status(200).json({ success: true, message: "Order updated successfully" });

    } catch (error) {
        console.error("Error updating order:", error.message);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
    }
});

// Issued Orders items
router.post("/issued-items", async (req, res) => {
    const { orID, payStatus, selectedItems } = req.body;

    if (!orID || !payStatus || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // 1. Update Orders table
        await db.query(
            `UPDATE Orders SET orStatus = 'Delivered', payStatus = ? WHERE OrID = ?`,
            [payStatus, orID]
        );

        // 2. Update p_i_detail table (Mark selected items as issued)
        for (const item of selectedItems) {
            await db.query(
                `UPDATE p_i_detail
                 SET status = 'Dispatched', orID = ?, datetime = NOW()
                 WHERE pid_Id = ?`,
                [orID, item.pid_Id]
            );
            await db.query(
                `INSERT INTO issued_items (orID, pid_Id, status, date) VALUES (?, ?, 'Dispatched', NOW())`,
                [orID, item.pid_Id]
            );
        }

        // 3. Update Item stock quantities using Order_Detail table
        const [orderItems] = await db.query(
            `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
            [orID]
        );

        for (const item of orderItems) {
            await db.query(
                `UPDATE Item
                 SET stockQty = stockQty - ?, availableQty = availableQty - ?
                 WHERE I_Id = ?`,
                [item.qty, item.qty, item.I_Id]
            );
        }

        // 4. Delete from booked_item & accept_orders
        await db.query(`DELETE FROM booked_item WHERE orID = ?`, [orID]);
        await db.query(`DELETE FROM accept_orders WHERE orID = ?`, [orID]);

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
        const { name, address, nic, dob, contact, job, basic, orderTarget , issuedTarget ,type } = req.body;

        if (!name || !address || !nic || !dob || !contact || !job || !basic ) {
            return res.status(400).json({
                success: false,
                message: "All fields are required except target and currentRate (only for Sales)."
            });
        }

        const E_Id = await generateNewId("Employee", "E_Id", "E"); // Generate new Employee ID

        const sql = `INSERT INTO Employee (E_Id, name, address, nic, dob, contact, job, basic,type) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)`;
        await db.query(sql, [E_Id, name, address, nic, dob, contact, job, basic,type]);

        // If job is Sales, insert into sales_team table
        let Data = null;
        if (job === "Sales" && orderTarget && issuedTarget) {
            const stID = await generateNewId("sales_team", "stID", "ST");
            const sqlSales = `INSERT INTO sales_team (stID, E_Id, orderTarget,issuedTarget, totalOrder, totalIssued) VALUES (?, ?, ?,?,'0', '0')`;
            await db.query(sqlSales,[stID, E_Id, orderTarget , issuedTarget]);

            Data = { stID, orderTarget , issuedTarget };
        }
        if ( job === "Driver"){
            const devID = await generateNewId("driver","devID","DI");
            const sqlDriver = `INSERT INTO driver (devID,E_ID,balance) VALUES (?,?,'0')`;
            await db.query(sqlDriver,[devID,E_Id]);

            Data = {devID,E_Id};

        }
        return res.status(201).json({
            success: true,
            message: "Employee added successfully",
            data:  {E_Id,Data},
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

        const { driverName, driverId, vehicleName, hire, date, district, orders, balanceToCollect } = req.body;

        // Validate required fields
        if (!driverName || !vehicleName || !date || !hire || !Array.isArray(orders) || orders.length === 0) {
            return res.status(400).json({ message: "Driver name, vehicle name, hire, date, and orders are required." });
        }
        // Insert into delivery_note table
        const [result] = await db.query(`
            INSERT INTO delivery_note (driverName, devID, vehicalName, date, hire, district, balanceToCollect, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Incomplete')
        `, [driverName, driverId, vehicleName, date, hire, district, balanceToCollect]);

        // Get the generated Delivery Note ID
        const delNoID = result.insertId;
        // Insert orders into delivery_note_orders table
        const orderQueries = orders.map(async ({ orderId, balance = 0 }) => {
            try {
                return await db.query(`
                    INSERT INTO delivery_note_orders (delNoID, orID, balance)
                    VALUES (?, ?, ?)
                `, [delNoID, orderId, balance]);
            } catch (err) {
                console.error(`Error inserting order ${orderId}:`, err);
            }
        });

        // Update delivery status for each order
        const deliveryQueries = orders.map(async ({ orderId }) => {
            try {
                return await db.query(`
                    UPDATE delivery
                    SET status = 'Delivered', delivery_Date = ?
                    WHERE orID = ?
                `, [date, orderId]);
            } catch (err) {
                console.error(`Error updating delivery for order ${orderId}:`, err);
            }
        });

        // Execute all insert and update queries
        await Promise.allSettled(orderQueries);
        await Promise.allSettled(deliveryQueries);

        // Send success response
        return res.status(201).json({
            message: "Delivery note created successfully",
            delNoID
        });

    } catch (error) {
        console.error("Error creating delivery note:", error);
        return res.status(500).json({ message: "Error creating delivery note", details: error.message });
    }
});

// Get Delivery Note detail
router.get("/delivery-note", async (req, res) => {
    try {
        const { delNoID } = req.query;

        if (!delNoID) {
            return res.status(400).json({ success: false, message: "Delivery Note ID is required." });
        }

        // Fetch delivery note details including driver ID (devID) and driver name from Employee
        const [deliveryNote] = await db.query(
            `SELECT dn.*, e.name AS driverName
             FROM delivery_note dn
                      LEFT JOIN driver d ON dn.devID = d.devID
                      LEFT JOIN Employee e ON d.E_Id = e.E_Id
             WHERE dn.delNoID = ?`,
            [delNoID]
        );

        if (deliveryNote.length === 0) {
            return res.status(404).json({ success: false, message: "Delivery note not found" });
        }

        // Fetch associated orders and balance from delivery_note_orders
        const [orders] = await db.query(
            `SELECT o.OrID, o.orStatus AS orderStatus, o.delStatus AS deliveryStatus,
                    o.payStatus, dno.balance AS balanceAmount
             FROM delivery_note_orders dno
                      INNER JOIN Orders o ON o.OrID = dno.orID
             WHERE dno.delNoID = ?`,
            [delNoID]
        );

        if (orders.length === 0) {
            return res.status(404).json({ success: false, message: "No orders found for this delivery note" });
        }

        // Fetch issued and returned items from the issued_items table
        const orderIds = orders.map(order => order.OrID);
        let issuedItems = [];

        if (orderIds.length > 0) {
            [issuedItems] = await db.query(
                `SELECT ii.orID, ii.pid_Id, ii.status AS itemStatus,
                        pi.stock_Id, pi.barcode_img, pi.datetime, pi.I_Id
                 FROM issued_items ii
                          JOIN p_i_detail pi ON ii.pid_Id = pi.pid_Id
                 WHERE ii.orID IN (?)`,
                [orderIds]
            );
        }

        // Organize issued items under their respective orders
        const ordersWithIssuedItems = orders.map(order => ({
            ...order,
            issuedItems: issuedItems.filter(item => item.orID === order.OrID),
            balance: order.payStatus === "COD" ? order.balanceAmount : null // Include balance only if COD
        }));

        return res.status(200).json({
            success: true,
            message: "Delivery note details fetched successfully",
            details: deliveryNote[0], // Delivery note details including devID and driver name
            orders: ordersWithIssuedItems // Orders with issued and returned items grouped
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

// Salary-advance save
router.post("/save-advance", async (req, res) => {
    try {
        const { id, name, advance } = req.body;
        const amount = Number(advance) || 0;
        const advancepay = Number(amount); // Make sure the advancepay is a positive amount (unless negative is needed)

        // Generate unique Advance Payment ID
        const ad_ID = await generateNewId("salary_advance", "ad_ID", "AP");

        // Insert into advance_payment table
        const sql = `INSERT INTO salary_advance (ad_ID, E_Id, amount, dateTime) VALUES (?, ?, ?, NOW())`;
        const values = [ad_ID, id, amount];
        const [result] = await db.query(sql, values);

        // Insert into payment table with the negative advance amount (for payment record)
        const sql1 = `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)`;
        const values1 = ["Pay Advance", ad_ID, "advance", -advancepay];
        const [result1] = await db.query(sql1, values1);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Advance added successfully",
            data: {
                ad_ID,               // The generated Advance Payment ID
                amount,              // The amount of the advance
                paymentAmount: -advancepay, // Payment amount as negative (if needed)
            },
        });
    } catch (err) {
        console.error("Error inserting Advance data:", err.message);

        // Respond with error details
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message,
        });
    }
});

// Salary-advance save
router.post("/save-loan", async (req, res) => {
    try {
        const { id, name, loan,months,installment } = req.body;
        const amount = Number(loan) || 0;
        const installment1 = Number(installment) || 0;
        const count = Number(months) || 0;

        // Generate unique Advance Payment ID
        const sl_ID = await generateNewId("salary_loan", "sl_ID", "LP");

        // Insert into advance_payment table
        const sql = `INSERT INTO salary_loan (sl_ID, E_Id, amount, dateTime,installment,months,skip) VALUES (?, ?, ?, NOW(),?,?,0)`;
        const values = [sl_ID, id, amount,installment1,count];
         const [result] = await db.query(sql, values);

        // Insert installment details into sal_loan_detail
        let currentDate = new Date();
        for (let i = 0; i < count; i++) {
            currentDate.setMonth(currentDate.getMonth() + 1); // Move to next month
            let formattedDate = currentDate.toISOString().split("T")[0]; // Format as YYYY-MM-DD

            const sql2 = `INSERT INTO sal_loan_detail (sl_ID, date, installment) VALUES (?, ?, ?)`;
            const values2 = [sl_ID, formattedDate, installment1];
            await db.query(sql2, values2);
        }

        // Insert into payment table with the negative advance amount (for payment record)
        const sql1 = `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)`;
        const values1 = ["Pay Loan", sl_ID, "Loan", -amount];
         const [result1] = await db.query(sql1, values1);

        // Return success response with inserted data details
        return res.status(201).json({
            success: true,
            message: "Loan added successfully",
            data: {
                sl_ID,               // The generated Advance Payment ID
                amount,              // The amount of the advance
            },
        });
    } catch (err) {
        console.error("Error inserting Advance data:", err.message);

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

// Update delivery note when order status issued (done)
router.post("/delivery-return", async (req, res) => {
    const { deliveryNoteId, orderIds } = req.body;

    if (!deliveryNoteId || !Array.isArray(orderIds) || orderIds.length === 0) {
        return res.status(400).json({ error: "Missing deliveryNoteId or invalid orderIds in request body." });
    }

    try {
        // Fetch all orders related to the delivery note
        const [orders] = await db.query(
            "SELECT OrID, payStatus FROM Orders WHERE OrID IN (?)",
            [orderIds]
        );

        if (orders.length === 0) {
            return res.status(404).json({ error: "No orders found for the given order IDs." });
        }

        // Check if all orders are either "Settled" or "N-Settled"
        const allSettled = orders.every(order => order.payStatus === "Settled" || order.payStatus === "N-Settled");

        if (!allSettled) {
            return res.status(400).json({
                error: "Some orders are not settled. Delivery note update aborted."
            });
        }

        // Update the delivery note status to "Complete"
        const [result] = await db.query(
            "UPDATE delivery_note SET status = ? WHERE delNoID = ?",
            ["Complete", deliveryNoteId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: "Delivery note not found or already updated." });
        }

        return res.status(200).json({ success: true, message: "Delivery note updated successfully." });

    } catch (error) {
        console.error("Error updating delivery note:", error);
        return res.status(500).json({ error: "Internal server error." });
    }
});

// update payment in delivery note
router.post("/delivery-payment", async (req, res) => {
    const { customReason, deliveryStatus, driver, driverId, deliveryDate, orderId, orderStatus, paymentDetails, reason, rescheduledDate,issuedItems, returnedItems, cancelledItems } = req.body;
    const { RPayment, customerbalance, driverbalance, profitOrLoss } = paymentDetails || {};


    const receivedPayment = Number(RPayment) || 0;
    const DrivBalance = Number(driverbalance) || 0;
    const CustBalance = Number(customerbalance) || 0;
    const Loss = Number(profitOrLoss) || 0;

    try {
        // Fetch order details
        const [Orderpayment] = await db.query(
            "SELECT orID, c_ID, balance, advance, total, netTotal, discount, delPrice, stID FROM Orders WHERE OrID = ?",
            [orderId]
        );

        if (!Orderpayment.length) {
            console.error("No order found for this order ID.");
            return res.status(404).json({ error: "Order not found." });
        }

        // Extract order details
        const { orID, c_ID, balance, advance, total, netTotal, discount, delPrice, stID } = Orderpayment[0];

        // Ensure valid numbers
        let NetTotal1 = Math.max(0, Number(netTotal) || 0);
        let totalAmount = Math.max(0, Number(total) || 0);
        let discountAmount = Number(discount) || 0;
        let deliveryCharge = Number(delPrice) || 0;
        let previousAdvance = Number(advance) || 0;

        // Fetch delivery details
        const [deliveryData] = await db.query("SELECT dv_id FROM delivery WHERE orID = ?", [orderId]);
        const dv_id = deliveryData?.[0]?.dv_id || null;

        // Fetch customer balance
        const [customerData] = await db.query("SELECT balance FROM Customer WHERE c_ID = ?", [c_ID]);
        let customerBalance = Number(customerData?.[0]?.balance || 0) + CustBalance;

        // Fetch driver balance
        const [driverData] = await db.query("SELECT balance FROM Driver WHERE devID = ?", [driverId]);
        let driverNewBalance = Number(driverData?.[0]?.balance || 0) + DrivBalance;

        // Calculate advance and balance
        let advance1 = Loss !== 0 ? previousAdvance + (receivedPayment + Loss) : previousAdvance + receivedPayment;
        let balance1 = Math.max(0, totalAmount - advance1);

        // Process returned items
        if (returnedItems && Array.isArray(returnedItems)) {
            for (const item of returnedItems) {
                if (!item.itemId || !item.stockId) continue;

                const [price] = await db.query("SELECT price FROM Item WHERE I_Id = ?", [item.itemId]);
                if (price?.[0]?.price) {
                    NetTotal1 -= parseFloat(price[0].price);
                }
            }
        }

        // Process cancelled items
        if (cancelledItems && Array.isArray(cancelledItems)) {
            for (const item of cancelledItems) {
                if (!item.itemId || !item.stockId) continue;

                const [price] = await db.query("SELECT price FROM Item WHERE I_Id = ?", [item.itemId]);
                if (price?.[0]?.price) {
                    NetTotal1 -= parseFloat(price[0].price);
                }
            }
        }

        // Ensure NetTotal1 is valid
        NetTotal1 = Math.max(0, NetTotal1);
        // Determine payment status (Only Settled if Balance1 is 0)
        const payStatus = (balance1 === 0) ? "Settled" : "N-Settled";

        // Update customer balance
        let newTotal = Math.max(0, (NetTotal1 - discountAmount) + deliveryCharge);
        let reducePrice = newTotal - totalAmount;
        customerBalance += (NetTotal1 === 0 ? receivedPayment : reducePrice);

        // Generate unique Advance Payment ID
        const op_ID = await generateNewId("order_payment", "op_ID", "OP");

        // Update customer & driver balance
        await db.query("UPDATE Customer SET balance = ? WHERE c_ID = ?", [customerBalance, c_ID]);
        await db.query("UPDATE Driver SET balance = ? WHERE devID = ?", [driverNewBalance, driverId]);

        if (orderStatus === "Delivered" ) {
            await db.query(
                "UPDATE Orders SET balance = ?, advance = ?, orStatus = ?, total = ?, netTotal = ?, delStatus = ?, payStatus = ? WHERE OrID = ?",
                [balance1, advance1,"Issued", newTotal, NetTotal1, deliveryStatus, payStatus, orderId]
            );
        }else {
            await db.query(
                "UPDATE Orders SET balance = ?, advance = ?, orStatus = ?, total = ?, netTotal = ?, delStatus = ?, payStatus = ? WHERE OrID = ?",
                [balance1, advance1,orderStatus, newTotal, NetTotal1, deliveryStatus, payStatus, orderId]
            );
        }

        // Update delivery details
        if (dv_id) {
            await db.query(
                "UPDATE delivery SET delivery_Date = ?, status = ? ,driverBalance =?, devID=? WHERE dv_id = ?",
                [deliveryDate, deliveryStatus,DrivBalance,driverId, dv_id]
            );
        }

        // Process returned items
        if (returnedItems && Array.isArray(returnedItems)) {
            for (const item of returnedItems) {
                if (!item.itemId || !item.stockId) continue;  // Use itemId and stockId

                console.log(item.itemId, item.stockId,item.status);

                await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?",
                    [item.status, item.itemId, item.stockId]);  // Use correct keys

                const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?",
                    [item.itemId, item.stockId]);

                const srdId = srdData?.[0]?.pid_Id || null;
                if (srdId !== null) {
                    await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?",
                        [item.status, srdId, orderId]);  // Use item.status
                }

                // Update stock based on status
                if (item.status === "Available") {
                    await db.query("UPDATE Item SET stockQty = stockQty + 1, availableQty = availableQty + 1 WHERE I_Id = ?",
                        [item.itemId]);
                } else if (item.status === "Reserved") {
                    if (srdId !== null) {
                        await db.query("INSERT INTO Special_Reservation (orID, pid_Id) VALUES (?, ?)", [orderId, srdId]);
                    }
                    await db.query("UPDATE Item SET stockQty = stockQty + 1, reservedQty = reservedQty + 1, availableQty = availableQty - 1 WHERE I_Id = ?",
                        [item.itemId]);
                } else if (item.status === "Damaged") {
                    await db.query("UPDATE Item SET stockQty = stockQty + 1, damageQty = damageQty + 1, availableQty = availableQty - 1 WHERE I_Id = ?",
                        [item.itemId]);
                }
            }
        }

        // Process cancelled items
        if (cancelledItems && Array.isArray(cancelledItems)) {
            for (const item of cancelledItems) {
                if (!item.itemId || !item.stockId) continue;

                console.log(item.itemId, item.stockId);

                await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?",
                    [item.status, item.itemId, item.stockId]);

                const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?",
                    [item.itemId, item.stockId]);

                const srdId = srdData?.[0]?.pid_Id || null;
                if (srdId !== null) {
                    await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?",
                        [item.status, srdId, orderId]);
                }

                // Update stock based on status
                if (item.status === "Available") {
                    await db.query("UPDATE Item SET stockQty = stockQty + 1, availableQty = availableQty + 1 WHERE I_Id = ?",
                        [item.itemId]);
                } else if (item.status === "Damaged") {
                    await db.query("UPDATE Item SET stockQty = stockQty + 1, damageQty = damageQty + 1, availableQty = availableQty - 1 WHERE I_Id = ?",
                        [item.itemId]);
                }
            }
        }

        // Process issued items (dispatched => issued)
        if (issuedItems && Array.isArray(issuedItems)) {
            for (const item of issuedItems) {
                if (!item.I_Id || !item.stock_Id) continue;

                await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?",
                    ["Issued", item.I_Id, item.stock_Id]);

                const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?",
                    [item.I_Id, item.stock_Id]);

                const srdId = srdData?.[0]?.pid_Id || null;
                if (srdId !== null) {
                    await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?",
                        ["Issued", srdId, orderId]);
                }
            }
        }

        // Update balance in delivery note orders
        await db.query("UPDATE delivery_note_orders SET balance = ? WHERE orID = ?", [balance1, orderId]);

        // Insert payment record
        if (receivedPayment !== 0){
            await db.query("INSERT INTO order_payment (op_ID,orID, amount, dateTime) VALUES (?,?, ?, NOW())", [op_ID,orderId, receivedPayment]);
            await db.query("INSERT INTO cash_balance (reason, ref, ref_type,dateTime,amount) VALUES (?,?, ?, NOW(),?)", ["Order payment",op_ID,"order", receivedPayment]);
        }

        // Update sales team records only when order status is "Issued"
        if (orderStatus === "Issued") {
            await db.query("UPDATE sales_team SET totalIssued = totalIssued + ? WHERE stID = ?", [advance1 - deliveryCharge, stID]);
        }

        // Insert loss profit if applicable
        if (Loss !== 0) {
            // Generate unique Advance Payment ID
            const op_ID1 = await generateNewId("order_payment", "op_ID", "OP");
            await db.query("INSERT INTO cash_balance (reason, ref, ref_type,dateTime,amount) VALUES (?,?, ?, NOW(),?)", ["Ignore Balance",op_ID1,"Loss", -Loss]);
        }

        // Insert return or canceled orders only if necessary
        if (orderStatus === "Returned" || orderStatus === "Cancelled") {
            const reasonTable = orderStatus === "Returned" ? "return_orders" : "canceled_orders";
            await db.query(`INSERT INTO ${reasonTable} (orID, detail) VALUES (?, ?)`, [orID, reason]);
        }
        if (rescheduledDate !== null){
            await db.query("UPDATE Orders SET expectedDate = ? WHERE orID = ?", [rescheduledDate, orderId]);
            await db.query("UPDATE delivery SET schedule_Date = ? WHERE orID = ?", [rescheduledDate, orderId]);
        }

        res.json({ success: true, message: "Payment processed successfully.", paymentStatus: payStatus });
    } catch (error) {
        console.error("Error processing delivery payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

// get delivery schdule by date
router.get("/check-delivery", async (req, res) => {
    const { date } = req.query; // Get date from query parameter
    if (!date) {
        return res.status(400).json({ message: "Date is required" });
    }

    try {
        // Check if the given date is already scheduled for delivery
        const [result] = await db.query(
            "SELECT COUNT(*) AS count FROM delivery_schedule WHERE ds_date = ?",
            [date]
        );

        // Reverse the logic: if count is 0, delivery is available; otherwise, it's not available
        const available = result[0].count === 0;

        return res.status(200).json({
            message: available ? "Delivery available" : "No delivery available on this date",
            available: available
        });
    } catch (error) {
        console.error("Error checking delivery availability:", error.message);
        return res.status(500).json({ message: "Error checking delivery availability" });
    }
});

// Get total order count sum
router.get("/sales/count", async (req, res) => {
    try {
        // Get the current system date
        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().split('T')[0]; // YYYY-MM-DD
        const firstDayOfMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

        // Query to get daily sales categorized into issued, returned, canceled, and other
        const [dailySales] = await db.query(`
            SELECT 
                sales_team.stID, 
                Employee.name AS salesperson_name, 
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'issued' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS issued_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'returned' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS returned_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'canceled' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS canceled_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus NOT IN ('issued', 'returned', 'canceled') THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS other_sales
            FROM sales_team
            LEFT JOIN Orders ON sales_team.stID = Orders.stID AND Orders.orDate = ?
            LEFT JOIN Employee ON sales_team.E_Id = Employee.E_Id
            GROUP BY sales_team.stID, Employee.name;
        `, [formattedDate]);

        // Query to get monthly sales categorized into issued, returned, canceled, and other
        const [monthlySales] = await db.query(`
            SELECT 
                sales_team.stID, 
                Employee.name AS salesperson_name, 
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'issued' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS issued_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'returned' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS returned_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus = 'canceled' THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS canceled_sales,
                COALESCE(SUM(CASE WHEN Orders.orStatus NOT IN ('issued', 'returned', 'canceled') THEN Orders.netTotal - Orders.discount ELSE 0 END), 0) AS other_sales
            FROM sales_team
            LEFT JOIN Orders ON sales_team.stID = Orders.stID AND Orders.orDate BETWEEN ? AND ?
            LEFT JOIN Employee ON sales_team.E_Id = Employee.E_Id
            GROUP BY sales_team.stID, Employee.name;
        `, [firstDayOfMonth, formattedDate]);

        return res.status(200).json({
            message: "Daily and monthly sales totals fetched successfully.",
            data: {
                dailySales,
                monthlySales
            }
        });
    } catch (error) {
        console.error("Error fetching sales total:", error.message);
        return res.status(500).json({ message: "Error fetching sales total." });
    }
});

// Get new purchaseid
router.get("/newPurchasenoteID", async (req, res) => {
    try {
        const PurchaseID = await generateNewId("purchase", "pc_Id", "PC"); // Generate new Purchase ID
        return res.status(200).json({
            success: true,
            message: "PurchaseID fetched successfully.",
            PurchaseID
        });
    } catch (error) {
        console.error("Error fetching pc_Id:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching Purchase ID.",
            error: error.message
        });
    }
});

//Get details of purchase id
router.get("/purchase-details", async (req, res) => {
    try {
        const { pc_Id } = req.query;

        if (!pc_Id) {
            return res.status(400).json({ success: false, message: "pc_Id is required" });
        }

        // Fetch purchase record
        const [purchase] = await db.query("SELECT * FROM purchase WHERE pc_Id = ?", [pc_Id]);
        if (purchase.length === 0) {
            return res.status(404).json({ success: false, message: "Purchase not found" });
        }

        // Fetch purchase details
        const [purchaseDetails] = await db.query(
            "SELECT * FROM purchase_detail WHERE pc_Id = ?", [pc_Id]
        );

        // Fetch stock details
        const [pIDetails] = await db.query(
            "SELECT * FROM p_i_detail WHERE pc_Id = ?", [pc_Id]
        );

        // Fetch payment details
        const [paymentDetails] = await db.query(
            "SELECT * FROM cash_balance WHERE ref = ?", [pc_Id]
        );

        return res.status(200).json({
            success: true,
            purchase: purchase[0],   // Single purchase record
            purchaseDetails,         // Purchase item details
            pIDetails,               // Stock-related details
            paymentDetails           // Payment records
        });

    } catch (error) {
        console.error("Error fetching purchase details:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Settle supplier payment
router.post("/settle-payment", async (req, res) => {
    try {
        const { pc_Id, amountPaid } = req.body;

        if (!pc_Id || !amountPaid || amountPaid <= 0) {
            return res.status(400).json({ success: false, message: "Invalid payment details provided." });
        }

        const amount = Number(amountPaid);

        // Fetch current pay & balance
        const [purchaseResult] = await db.query("SELECT pay, balance FROM purchase WHERE pc_Id = ?", [pc_Id]);

        if (purchaseResult.length === 0) {
            return res.status(404).json({ success: false, message: "Purchase record not found." });
        }

        const { pay, balance } = purchaseResult[0];

        if (balance < amount) {
            return res.status(400).json({ success: false, message: "Payment exceeds remaining balance." });
        }

        // Insert transaction into cash_balance (recording the payment)
        const sql1 = `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)`;
        const values1 = ["Supplier Payment", pc_Id, "supplier", -amount];
        await db.query(sql1, values1);

        // Update purchase table (pay & balance)
        const sql2 = `UPDATE purchase SET pay = pay + ?, balance = balance - ? WHERE pc_Id = ?`;
        await db.query(sql2, [amount, amount, pc_Id]);

        // Fetch updated purchase details
        const [updatedPurchase] = await db.query("SELECT s_ID,pay, balance FROM purchase WHERE pc_Id = ?", [pc_Id]);

        return res.status(200).json({
            success: true,
            message: "Payment settled successfully.",
            data: {
                pc_Id,
                amountPaid: amount,
                newPay: updatedPurchase[0].pay,
                newBalance: updatedPurchase[0].balance,
                supplier: updatedPurchase[0].s_ID,
            },
        });

    } catch (err) {
        console.error("Error processing payment:", err.message);
        return res.status(500).json({ success: false, message: "Server error while processing payment.", error: err.message });
    }
});

// pass sale team value to review in month end

// Function to generate new ida
const generateNewId = async (table, column, prefix) => {
    const [rows] = await db.query(`SELECT ${column} FROM ${table} ORDER BY ${column} DESC LIMIT 1`);
    if (rows.length === 0) return `${prefix}_001`; // First entry
    const lastId = rows[0][column]; // Get last ID
    const lastNum = parseInt(lastId.split("_")[1],10) + 1; // Extract number and increment
    return `${prefix}_${String(lastNum).padStart(3, "0")}`;
};

// Helper function to parse date from DD/MM/YYYY format to YYYY-MM-DD format
const parseDate = (dateStr) => {
    if (!dateStr) return null;
    let year, month, day;

    // Check if the date is in `YYYY-MM-DD` format
    if (dateStr.includes("-")) {
        [year, month, day] = dateStr.split("-");
    }
    // Check if the date is in `DD/MM/YYYY` format
    else if (dateStr.includes("/")) {
        [day, month, year] = dateStr.split("/");
    } else {
        return null; // Invalid format
    }
    console.log(day,month,year);

    // Validate components
    if (!day || !month || !year || isNaN(day) || isNaN(month) || isNaN(year)) {
        return null;
    }

    // Convert to `YYYY-MM-DD` for MySQL queries
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const formatDate = (date) => {
    return date ? new Date(date).toLocaleDateString("en-GB") : null;
};

export default router;
