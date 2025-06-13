import express from 'express';
import upload from "../middlewares/upload.js";
import db from '../utils/db.js';
import bwipjs from 'bwip-js';
import path from "path";
import fs from "fs";
import moment from 'moment';
import mysql from "mysql2";
import { console } from 'inspector';
const router = express.Router();
// const fs = require('fs');

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
        const {previousId,I_Id, I_name, descrip, color, material, price, warrantyPeriod, stockQty, bookedQty, availableQty, maincategory, sub_one, sub_two, suppliers,} = req.body;

        if (!previousId) {
            return res.status(400).json({ success: false, message: "Item ID is required." });
        }

        // ✅ Log received files and form data
        const [itemCheckResult] = await db.query(`SELECT * FROM Item WHERE I_Id = ?`, [previousId]);
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
           I_Id, I_name, descrip, color, material, price: parsedPrice, warrantyPeriod, stockQty, bookedQty, availableQty, mn_Cat: maincategory, sb_catOne: subCatOneName, sb_catTwo: subCatTwoName, img: imgBuffer, img1: img1Buffer, img2: img2Buffer, img3: img3Buffer,
        };

        for (const key in fields) {
            if (fields[key] !== undefined && fields[key] !== null) {
                updateFields.push(`${key} = ?`);
                updateValues.push(fields[key]);
            }
        }

        if (updateFields.length > 0) {
            const updateQuery = `UPDATE Item SET ${updateFields.join(", ")} WHERE I_Id = ?`;
            updateValues.push(previousId);
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
                        [previousId, s_ID, parsedUnitCost]
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
        FtName, SrName, address, c_ID, category, newAddress, isAddressChanged,
        couponCode, deliveryPrice, discountAmount, district, dvStatus,orderDate,
        expectedDate, id, isNewCustomer, items, occupation, otherNumber = "",
        phoneNumber = "", specialNote, title, totalItemPrice,issuable,
        dvtype, type, workPlace, t_name, orderType, specialdiscountAmount,previousbalance,
        advance, balance ,payment,subPayment,customerBalanceDecision,finalCustomerBalance,paymentAmount,cashReturn,
        cardPayment={},chequePayment={},cashCardPayment={},tranferPayment={},creditPayment={},combinedChequePayment={},
        combinedCreditPayment={},combinedTransferPayment={},
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or missing items." });
    }

    try {
        let Cust_id = c_ID;
        let Occupation = "-", WorkPlace = "-", tType = "-";
        let stID = null;
        if (type === 'Walking' || type === 'On-site') {
            Occupation = occupation;
            WorkPlace = workPlace;
        } else {
            tType = t_name;
        }

        const trimmedPhone = phoneNumber.trim();
        const trimmedOther = otherNumber.trim();

        // ✅ Handle New Customer
        if (isNewCustomer) {
            Cust_id = await generateNewId("Customer", "c_ID", "Cus");

            // 🔍 Safe and flexible contact search
            let customerSearchQuery = `SELECT c_ID FROM Customer WHERE `;
            let searchParams = [];

            if (trimmedPhone && trimmedOther) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ? OR contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedPhone, trimmedPhone, trimmedOther, trimmedOther];
            } else if (trimmedPhone) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedPhone, trimmedPhone];
            } else if (trimmedOther) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedOther, trimmedOther];
            }

            if (searchParams.length > 0) {
                const [existingCustomer] = await db.query(customerSearchQuery, searchParams);
                if (existingCustomer.length > 0) {
                    return res.status(400).json({ success: false, message: "Customer already exists." });
                }
            }

            const sqlInsertCustomer = `
                INSERT INTO Customer (c_ID, title, FtName, SrName, address, contact1, contact2, id, balance, type, category, t_name, occupation, workPlace)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

            const valuesCustomer = [
                Cust_id, title, FtName, SrName, address,
                trimmedPhone || "-", trimmedOther || "-", id,
                0, type, category, tType, Occupation, WorkPlace
            ];

            await db.query(sqlInsertCustomer, valuesCustomer);
        }

        const advance1 = parseFloat(advance) || 0;
        const balance1 = parseFloat(balance) || 0;
        const newTotalOrder = parseFloat(totalItemPrice) - parseFloat(discountAmount);
        const TotalOrder = parseFloat(totalItemPrice) + parseFloat(deliveryPrice);
        const customerBalance = parseFloat(finalCustomerBalance);


        const orID = `ORD_${Date.now()}`;

        if (couponCode) {
            const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
            const [couponResult] = await db.query(couponQuery, [couponCode]);

            if (couponResult.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid coupon code." });
            }

            stID = couponResult[0].stID;

            const updateSalesTeamQuery = `UPDATE sales_team SET totalOrder = totalOrder + ? WHERE stID = ?`;
            await db.query(updateSalesTeamQuery, [newTotalOrder, stID]);
        }

        // ✅ Set order status for Walking to 'Accepted'
        const orderStatus = dvStatus === "Delivery" ?  "Delivered" : "Issued";
        console.log(dvStatus,orderStatus);
        // const orderStatus = orderType === "Walking" ? "Accepted" : "Pending";
        const orderQuery = `
            INSERT INTO Orders (OrID, orDate, c_ID, orStatus, delStatus, delPrice, discount, specialdic, netTotal, total, stID, expectedDate, specialNote, ordertype, advance, balance, payStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')`;

        const orderParams = [
            orID, orderDate, Cust_id, orderStatus, dvStatus,
            parseFloat(deliveryPrice) || 0,
            parseFloat(discountAmount) || 0,
            parseFloat(specialdiscountAmount) || 0,
            parseFloat(totalItemPrice) || 0,
            parseFloat(TotalOrder) || 0,
            stID, expectedDate, specialNote, orderType, advance1, balance1
        ];

        await db.query(orderQuery, orderParams);

        if (stID) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.toLocaleString("default", { month: "long" }); // e.g., "May"

            const netTotal = parseFloat(totalItemPrice) || 0;

            const checkReviewQuery = `
        SELECT * FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?
    `;
            const [reviewResult] = await db.query(checkReviewQuery, [stID, currentYear, currentMonth]);

            if (reviewResult.length > 0) {
                // Record exists → update totalOrder
                const updateReviewQuery = `
            UPDATE ST_order_review 
            SET totalOrder = totalOrder + ? 
            WHERE stID = ? AND year = ? AND month = ?
        `;
                await db.query(updateReviewQuery, [netTotal, stID, currentYear, currentMonth]);
            } else {
                // Record does not exist → insert new row
                const insertReviewQuery = `
            INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued)
            VALUES (?, ?, ?, ?, 0)
        `;
                await db.query(insertReviewQuery, [stID, currentYear, currentMonth, netTotal]);
            }
        }

        if (issuable === 'Now'){
            // Expand each item into multiple rows based on its quantity
            const orderDetailValues = items.flatMap(item =>
                Array.from({ length: item.qty }).map(() => [
                    orID, item.I_Id, 1, parseFloat(item.price)/item.qty, parseFloat(item.discount), item.material
                ])
            );

            // Insert query
            const orderDetailQuery = `INSERT INTO Order_Detail (orID, I_Id, qty, tprice, discount, material) VALUES ?`;
            await db.query(orderDetailQuery, [orderDetailValues]);
        }
        
        if (dvStatus === "Delivery") {
            const dvID = `DLV_${Date.now()}`;
            const deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, c_ID, status, schedule_Date, type, driverBalance)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, 0)`;

            const addressToUse = isAddressChanged ? newAddress : address;
            await db.query(deliveryQuery, [dvID, orID, addressToUse, district, Cust_id, expectedDate, dvtype]);
        }

        if (couponCode) {
            const ocID = `OCP_${Date.now()}`;
            const couponQuery = `INSERT INTO order_coupon (ocID, orID, cpID) VALUES (?, ?, ?)`;
            await db.query(couponQuery, [ocID, orID, couponCode]);
        }
        const op_ID = await generateNewId("order_payment", "op_ID", "OP");
        // ✅ Insert cash balance if advance exists
        if (advance1 > 0) {

            // Insert into cash_balance and get insert ID
            const [cashResult] = await db.query(
                `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                VALUES (?, ?, 'order', NOW(), ?)`,
                ['Order Advance', orID, advance1]
            );

            const cashId = cashResult.insertId;
            if (customerBalanceDecision === "pass") {
                // Update customer balance by reducing it (payment made)
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
            } else if (customerBalanceDecision === "handover") {
                // Treat this like "pass" as well, unless logic differs
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
            } else if (customerBalanceDecision === "ignore") {
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
                // Insert a new row in cash_balance for the loss
                await db.query(
                    `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                    VALUES (?, ?, 'order', NOW(), ?)`,
                    ['Order Loss', orID, finalCustomerBalance]
                );
            }            

            // Insert into order_payment
            const [payTypeResult] =  await db.query(
                `INSERT INTO order_payment 
                    (op_ID, orID, amount, dateTime, or_status, netTotal, stID, issuable,c_ID, balance) 
                VALUES 
                    (?, ?, ?, NOW(), ?, ?, ?, ?)`,
                [op_ID,orID, advance1, orderStatus, parseFloat(totalItemPrice) || 0, stID, issuable,Cust_id,balance1]
            );

             // Additional insert for Cash - Transfer payment
            if (payment === 'Cash' && subPayment === 'Transfer' && tranferPayment) {
                // Insert into ord_Pay_type
                const [payTypeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const optId = payTypeResult.insertId; 

                // Insert into ord_Transfer_Pay
                await db.query(
                    `INSERT INTO ord_Transfer_Pay (optId, amount, bank) VALUES (?, ?, ?)`,
                    [optId, advance1, tranferPayment.bank]
                );

                // Update the correct order_payment row using op_ID or orID
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }
            // Additional insert for Cash - Cash payment
            if (payment === 'Cash' && subPayment === 'Cash') {
                // Insert into ord_Pay_type
                const [payTypeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                // Update the correct order_payment row using op_ID or orID
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }

           // Additional insert for Card payment
            if (payment === 'Card' && cardPayment) {
                // Insert into ord_Pay_type
                const [typeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const optId = typeResult.insertId;

                // Insert into ord_Card_Pay
                await db.query(
                    `INSERT INTO ord_Card_Pay (optId, type, amount, intrestValue)
                    VALUES (?, ?, ?, ?)`,
                    [optId, cardPayment.type, advance1, cardPayment.interestValue || 0]
                );

                // Update order_payment with interest & full amount
                await db.query(
                    `UPDATE order_payment SET otherCharges = ?, fullPaidAmount = ? WHERE op_ID = ?`,
                    [cardPayment.interestValue, cardPayment.netAmount, op_ID]
                );

                // 🔄 Update cash_balance with full paid amount
                await db.query(
                    `UPDATE cash_balance SET amount = ? WHERE Id = ?`,
                    [cardPayment.netAmount, cashId]
                );
            }

             // Additional insert for Cheque payment
            if (payment === 'Cheque' && chequePayment) {
                const [chequeTypeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );

                const chequeOptId = chequeTypeResult.insertId;

                // Insert all cheques from the array
                for (const chq of chequePayment.cheques || []) {
                    await db.query(
                        `INSERT INTO ord_Cheque_Pay (optId, amount, bank, branch, accountNumber, chequeNumber, date)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            chequeOptId,
                            chq.amount || 0,
                            chq.bank || '',
                            chq.branch || '',
                            chq.accountNumber || '',
                            chq.chequeNumber || '',
                            chq.chequeDate || null
                        ]
                    );
                }

                // Update the order_payment table
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }

             // Additional insert for Credit payment
            if (payment === 'Credit' && creditPayment) {
                const [creditResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const creditOptId = creditResult.insertId;

                // Assuming ord_Credit_Pay table exists for credit details
                await db.query(
                    `INSERT INTO ord_Credit_Pay (optId, amount, balance, c_ID, expectedDate)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        creditOptId,
                        creditPayment.amount || 0,
                        creditPayment.balance || 0,
                        Cust_id,
                        creditPayment.expectdate || null
                    ]
                );

                // Update order_payment
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }

            // Additional insert for Combined (Cash & Card) payment
            if (payment === 'Combined' && subPayment==='Cash & Card' && cashCardPayment) {
                // Insert into ord_Pay_type
                const [typeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const optId = typeResult.insertId;

                // Insert into ord_Card_Pay
                await db.query(
                    `INSERT INTO ord_Card_Pay (optId, type, amount, intrestValue)
                    VALUES (?, ?, ?, ?)`,
                    [optId, cashCardPayment.type, cashCardPayment.cardBalance, cashCardPayment.interestValue || 0]
                );
                // Update the correct order_payment row using op_ID or orID
                await db.query(
                    `UPDATE order_payment SET otherCharges = ?, fullPaidAmount = ? WHERE op_ID = ?`,
                    [cashCardPayment.interestValue, cashCardPayment.fullpaidAmount , op_ID]
                );
                // 🔄 Update cash_balance with full paid amount
                await db.query(
                    `UPDATE cash_balance SET amount = ? WHERE Id = ?`,
                    [cashCardPayment.fullpaidAmount, cashId]
                );
            }

            // Additional insert for Combined (Cash & Cheque) payment
            if (payment === 'Combined' && subPayment === 'Cash & Cheque' && combinedChequePayment) {
                const [chequeTypeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );

                const chequeOptId = chequeTypeResult.insertId;

                // Insert all cheques
                for (const chq of combinedChequePayment.cheques || []) {
                    await db.query(
                        `INSERT INTO ord_Cheque_Pay (optId, amount, bank, branch, accountNumber, chequeNumber, date)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            chequeOptId,
                            chq.amount || 0,
                            chq.bank || '',
                            chq.branch || '',
                            chq.accountNumber || '',
                            chq.chequeNumber || '',
                            chq.chequeDate || null
                        ]
                    );
                }

                // Update the order_payment row
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }

            // Additional insert for Combined (Cash & Credit) payment
            if (payment === 'Combined' && subPayment==='Cash & Credit' && combinedCreditPayment) {
                const [creditResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const creditOptId = creditResult.insertId;

                // Assuming ord_Credit_Pay table exists for credit details
                await db.query(
                    `INSERT INTO ord_Credit_Pay (optId, amount, balance, c_ID, expectedDate)
                    VALUES (?, ?, ?, ?, ?)`,
                    [
                        creditOptId,
                        combinedCreditPayment.creditBalance || 0,
                        combinedCreditPayment.cashBalance || 0,
                        Cust_id,
                        combinedCreditPayment.expectedDate || null
                    ]
                );

                // Update order_payment
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }
            // Additional insert for Combined (Cash & Transfer) payment
            if (payment === 'Combined' && subPayment === 'Cash & Transfer' && combinedTransferPayment) {
                // Insert into ord_Pay_type
                const [payTypeResult] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                const optId = payTypeResult.insertId; 

                // Insert into ord_Transfer_Pay
                await db.query(
                    `INSERT INTO ord_Transfer_Pay (optId, amount, bank) VALUES (?, ?, ?)`,
                    [optId, combinedTransferPayment.transferAmount, combinedTransferPayment.bank]
                );

                // Update the correct order_payment row using op_ID or orID
                await db.query(
                    `UPDATE order_payment SET otherCharges = 0, fullPaidAmount = ? WHERE op_ID = ?`,
                    [advance1, op_ID]
                );
            }
        }
        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: { orderId: orID,  orderDate, expectedDate }
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

router.post("/later-order", async (req, res) => {
    const {
        FtName, SrName, address, c_ID, category, newAddress, isAddressChanged,couponCode, deliveryPrice, discountAmount, district, dvStatus, orderDate,dvtype,
        expectedDate, id, isNewCustomer, items, occupation, otherNumber = "",phoneNumber = "", specialNote, title, totalItemPrice, type, workPlace, t_name, orderType, specialdiscountAmount,
        advance, balance, processedItems = [],payment,subPayment,cardPayment={},chequePayment={},cashCardPayment={},tranferPayment={},creditPayment={},combinedChequePayment={},
        combinedCreditPayment={},combinedTransferPayment={},issuable,customerBalanceDecision,finalCustomerBalance,paymentAmount,cashReturn
    } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ success: false, message: "Invalid or missing items." });
    }

    try {
        let Cust_id = c_ID;
        let Occupation = "-", WorkPlace = "-", tType = "-";
        let stID = null;

        if (type === 'Walking' || type === 'On-site') {
            Occupation = occupation;
            WorkPlace = workPlace;
        } else {
            tType = t_name;
        }

        const trimmedPhone = phoneNumber.trim();
        const trimmedOther = otherNumber.trim();

        if (isNewCustomer) {
            Cust_id = await generateNewId("Customer", "c_ID", "Cus");

            let customerSearchQuery = `SELECT c_ID FROM Customer WHERE `;
            let searchParams = [];

            if (trimmedPhone && trimmedOther) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ? OR contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedPhone, trimmedPhone, trimmedOther, trimmedOther];
            } else if (trimmedPhone) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedPhone, trimmedPhone];
            } else if (trimmedOther) {
                customerSearchQuery += `(contact1 = ? OR contact2 = ?) LIMIT 1`;
                searchParams = [trimmedOther, trimmedOther];
            }

            if (searchParams.length > 0) {
                const [existingCustomer] = await db.query(customerSearchQuery, searchParams);
                if (existingCustomer.length > 0) {
                    return res.status(400).json({ success: false, message: "Customer already exists." });
                }
            }

            const sqlInsertCustomer = `
                INSERT INTO Customer (c_ID, title, FtName, SrName, address, contact1, contact2, id, balance, type, category, t_name, occupation, workPlace)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const valuesCustomer = [
                Cust_id, title, FtName, SrName, address,
                trimmedPhone || "-", trimmedOther || "-", id,
                0, type, category, tType, Occupation, WorkPlace
            ];

            await db.query(sqlInsertCustomer, valuesCustomer);
        }

        const advance1 = parseFloat(advance) || 0;
        const balance1 = parseFloat(balance) || 0;
        const newTotalOrder = parseFloat(totalItemPrice) - parseFloat(discountAmount);
        const TotalOrder = parseFloat(totalItemPrice) + parseFloat(deliveryPrice);
        const customerBalance = parseFloat(finalCustomerBalance);

        const orID = `ORD_${Date.now()}`;

        if (couponCode) {
            const couponQuery = `SELECT stID FROM sales_coupon WHERE cpID = ?`;
            const [couponResult] = await db.query(couponQuery, [couponCode]);

            if (couponResult.length === 0) {
                return res.status(400).json({ success: false, message: "Invalid coupon code." });
            }

            stID = couponResult[0].stID;

            const updateSalesTeamQuery = `UPDATE sales_team SET totalOrder = totalOrder + ? WHERE stID = ?`;
            await db.query(updateSalesTeamQuery, [newTotalOrder, stID]);
        }
        
        // ✅ Determine order status based on items
        const hasProduction = processedItems.some(item => item.status === "Production");
        const orderStatus = hasProduction ? "Processing" : "Accepted";

        const orderQuery = `
            INSERT INTO Orders (OrID, orDate, c_ID, orStatus, delStatus, delPrice, discount, specialdic, netTotal, total, stID, expectedDate, specialNote, ordertype, advance, balance, payStatus)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending')
        `;

        const orderParams = [
            orID, orderDate, Cust_id, orderStatus, dvStatus,
            parseFloat(deliveryPrice) || 0,
            parseFloat(discountAmount) || 0,
            parseFloat(specialdiscountAmount) || 0,
            parseFloat(totalItemPrice) || 0,
            parseFloat(TotalOrder) || 0,
            stID, expectedDate, specialNote, orderType, advance1, balance1
        ];

        await db.query(orderQuery, orderParams);

        // 🔁 Handle Sales Team Order Review
        if (stID) {
            const currentDate = new Date();
            const currentYear = currentDate.getFullYear();
            const currentMonth = currentDate.toLocaleString("default", { month: "long" });

            const netTotal = parseFloat(totalItemPrice) || 0;
            const checkReviewQuery = `SELECT * FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?`;
            const [reviewResult] = await db.query(checkReviewQuery, [stID, currentYear, currentMonth]);

            if (reviewResult.length > 0) {
                await db.query(` UPDATE ST_order_review   SET totalOrder = totalOrder + ? WHERE stID = ? AND year = ? AND month = ?`, [netTotal, stID, currentYear, currentMonth]);
            } else {
                await db.query(`
                    INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued) VALUES (?, ?, ?, ?, 0)
                `, [stID, currentYear, currentMonth, netTotal]);
            }
        }
        
    // Store UID and new orderDetailId pairs
        const orderDetailMap = []; // Will hold { uid, orderDetailId }

        for (const item of processedItems) {
            const qty = parseInt(item.qty) || 1;
            const unitPrice = parseFloat(item.unitPrice || 0);
            const discount = parseFloat(item.discount || 0);
            const material = item.material;
            const uid = item.uid;

            const insertQuery = `
                INSERT INTO Order_Detail (orID, I_Id, qty, tprice, discount, material)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const [result] = await db.query(insertQuery, [
                orID,
                item.I_Id,
                qty,
                unitPrice,
                discount,
                material
            ]);

            // Store UID and the newly created orderDetail ID
            orderDetailMap.push({
                uid,
                orderDetailId: result.insertId // This is the auto-increment ID from Order_Detail
            });
        }
        const bookedItems = [];
        const reservedItems = [];
        const productionItems = [];

        processedItems.forEach(item => {
            const qty = item.qty || 1;
            const unitPrice = parseFloat(item.unitPrice || 0);
            const discount = parseFloat(item.discount) || 0;
            const material = item.material;

            const row = [orID, item.I_Id, qty, unitPrice, discount, material];

            switch (item.status) {
               case 'Booked':
                    bookedItems.push({
                        orID, I_Id: item.I_Id,qty, unitPrice, discount, material
                    });
                    break;

                case 'Reserved':
                    reservedItems.push({
                        orID, I_Id: item.I_Id,qty,unitPrice,discount,material, pid_Id: item.pid_Id,uid: item.uid
                    });
                    break;
                case 'Production':
                    const pd = item.productionData || {};
                    productionItems.push({
                        orID,I_Id: item.I_Id, qty,unitPrice,discount, material, uid: item.uid || null,
                        expectdate: pd.expectdate || null, itemId: pd.itemId || null,
                        supplierId: pd.supplierId || null, specialnote: pd.specialnote || null
                    });
                    break;
                default:
                    console.warn(`⚠️ Unknown status '${item.status}' for item:`, item);
                    break;
            }
        });
        if (bookedItems.length > 0) {
            const acceptItemQuery = `INSERT INTO accept_orders (orID, I_Id, itemReceived, status) VALUES ?`;
            const bookedItemQuery = `INSERT INTO booked_item (orID, I_Id, qty) VALUES ?`;

            const bookedItemValues1 = bookedItems.map(item => [
                item.orID,item.I_Id,'Yes','Complete'
            ]);

            const bookedItemValues2 = bookedItems.map(item => [
                item.orID,item.I_Id,item.qty || 1
            ]);


            // Insert into accept_orders
            await db.query(acceptItemQuery, [bookedItemValues1]);

            // Insert into booked_item
            await db.query(bookedItemQuery, [bookedItemValues2]);
                for (const item of bookedItems) {
                const qty = item.qty || 1;
                const I_Id = item.I_Id;

                const updateItemQuery = `UPDATE Item SET bookedQty = bookedQty + ?, availableQty = availableQty - ? WHERE I_Id = ? `;

                await db.query(updateItemQuery, [qty, qty, I_Id]);
            }

        }
        if (reservedItems.length > 0) {
            // Prepare values for accept_orders and booked_item
            const acceptItemValues = reservedItems.map(item => [
                item.orID, item.I_Id, 'Yes','Complete'
            ]);

            const bookedItemValues = reservedItems.map(item => [
                item.orID,item.I_Id,item.qty || 1
            ]);

            // Insert into accept_orders
            await db.query(`INSERT INTO accept_orders (orID, I_Id, itemReceived, status) VALUES ?`, [acceptItemValues]);

            // Insert into booked_item
            await db.query(`INSERT INTO booked_item (orID, I_Id, qty) VALUES ?`, [bookedItemValues]);

            // Handle Special_Reservation, p_i_detail update, and Order_Detail status
            for (const item of reservedItems) {
                const match = orderDetailMap.find(entry => entry.uid === item.uid);
                if (match) {
                    // Insert into Special_Reservation
                    await db.query(`
                        INSERT INTO Special_Reservation (orID, pid_Id, orderDetailId) VALUES (?, ?, ?)`,
                        [item.orID, item.pid_Id, match.orderDetailId]
                    );

                    // Update p_i_detail
                    await db.query(`
                        UPDATE p_i_detail SET status = 'Reserved', orID = ?, datetime = NOW() WHERE pid_Id = ?`,
                        [item.orID, item.pid_Id]
                    );

                    // Update Item stock
                    await db.query(` UPDATE Item SET bookedQty = bookedQty - ?, reservedQty = reservedQty + ? WHERE I_Id = ?`,
                        [item.qty, item.qty, item.I_Id]
                    );

                    // Update Order_Detail status
                    await db.query(` UPDATE Order_Detail  SET status = 'Reserved' WHERE id = ?`,
                        [match.orderDetailId]
                    );
                }
            }
        }
        if (productionItems.length > 0) {
            const acceptItemQuery = `INSERT INTO accept_orders (orID, I_Id, itemReceived, status) VALUES ?`;
            const acceptValues = productionItems.map(item => [
                item.orID,item.I_Id, 'No', 'Incomplete'
            ]);

            // Insert into accept_orders
            await db.query(acceptItemQuery, [acceptValues]);

            // Insert into production table
            const productionInsertQuery = `
                INSERT INTO production (p_ID, I_Id, qty, s_ID, expectedDate, specialNote, status) VALUES (?, ?, ?, ?, ?, ?, 'Incomplete')`;

            for (const item of productionItems) {
                const p_ID = `InP_${Date.now()}`; // Unique p_ID

                await db.query(productionInsertQuery, [
                    p_ID,item.I_Id,item.qty,item.supplierId,item.expectdate,item.specialnote
                ]);
            }
        }
        if (couponCode) {
            const ocID = `OCP_${Date.now()}`;
            const couponQuery = `INSERT INTO order_coupon (ocID, orID, cpID) VALUES (?, ?, ?)`;
            await db.query(couponQuery, [ocID, orID, couponCode]);
        }

        if (dvStatus === "Delivery") {
            const dvID = `DLV_${Date.now()}`;
            const deliveryQuery = `
                INSERT INTO delivery (dv_id, orID, address, district, c_ID, status, schedule_Date, type, driverBalance)
                VALUES (?, ?, ?, ?, ?, 'Pending', ?, ?, 0)`;

            const addressToUse = isAddressChanged ? newAddress : address;
            await db.query(deliveryQuery, [dvID, orID, addressToUse, district, Cust_id, expectedDate, dvtype]);
        }


        const op_ID = await generateNewId("order_payment", "op_ID", "OP");

        if (advance1 > 0) {
            // Insert into cash_balance
            const [cashResult] = await db.query(
                `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                VALUES (?, ?, 'order', NOW(), ?)`,
                ['Order Advance', orID, advance1]
            );
            const cashId = cashResult.insertId;

            if (customerBalanceDecision === "pass") {
                // Update customer balance by reducing it (payment made)
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
            } else if (customerBalanceDecision === "handover") {
                // Treat this like "pass" as well, unless logic differs
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
            } else if (customerBalanceDecision === "ignore") {
                await db.query(
                    `UPDATE Customer SET balance = ? WHERE c_ID = ?`,
                    [customerBalance, Cust_id]
                );
                // Insert a new row in cash_balance for the loss
                await db.query(
                    `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                    VALUES (?, ?, 'order', NOW(), ?)`,
                    ['Order Loss', orID, finalCustomerBalance]
                );
            }            

            // Insert into order_payment
            // await db.query(
            //     `INSERT INTO order_payment 
            //         (op_ID, orID, amount, dateTime, or_status, netTotal, stID, issuable,c_ID, balance) 
            //     VALUES 
            //         (?, ?, ?, NOW(), ?, ?, ?, ?)`,
            //     [op_ID, orID, advance1, orderStatus, parseFloat(totalItemPrice) || 0, stID, issuable,Cust_id,balance1]
            // );

            await db.query(
                `INSERT INTO order_payment 
                    (op_ID, orID, amount, dateTime, or_status, netTotal, stID, issuable, c_ID, balance, otherCharges, fullPaidAmount) 
                VALUES 
                    (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    op_ID,
                    orID,
                    advance1,
                    orderStatus,
                    parseFloat(totalItemPrice) || 0,
                    stID,
                    issuable,
                    Cust_id,
                    balance1,
                    0,  // otherCharges
                    advance1 // fullPaidAmount - assuming it's same as advance1 here
                ]
            );

            // Handle Payment Types
            const insertPayType = async () => {
                const [result] = await db.query(
                    `INSERT INTO ord_Pay_type (orID, type, subType) VALUES (?, ?, ?)`,
                    [orID, payment, subPayment]
                );
                return result.insertId;
            };

            const updateOrderPayment = async (amount, otherCharges = 0) => {
                await db.query(
                    `UPDATE order_payment SET otherCharges = ?, fullPaidAmount = ? WHERE op_ID = ?`,
                    [otherCharges, amount, op_ID]
                );
            };

            if (payment === 'Cash') {
                await insertPayType();
                await updateOrderPayment(advance1);
            }

            if (payment === 'Card' && cardPayment) {
                const optId = await insertPayType();
                await db.query(
                    `INSERT INTO ord_Card_Pay (optId, type, amount, intrestValue)
                    VALUES (?, ?, ?, ?)`,
                    [optId, cardPayment.type, advance1, cardPayment.interestValue || 0]
                );
                await updateOrderPayment(cardPayment.netAmount, cardPayment.interestValue || 0);
                await db.query(`UPDATE cash_balance SET amount = ? WHERE Id = ?`, [cardPayment.netAmount, cashId]);
            }

            if (payment === 'Cheque' && chequePayment) {
                const optId = await insertPayType();
                for (const chq of chequePayment.cheques || []) {
                    await db.query(
                        `INSERT INTO ord_Cheque_Pay (optId, amount, bank, branch, accountNumber, chequeNumber, date)
                        VALUES (?, ?, ?, ?, ?, ?, ?)`,
                        [
                            optId,
                            chq.amount || 0,
                            chq.bank || '',
                            chq.branch || '',
                            chq.accountNumber || '',
                            chq.chequeNumber || '',
                            chq.chequeDate || null
                        ]
                    );
                }
                await updateOrderPayment(advance1);
            }

            if (payment === 'Credit' && creditPayment) {
                const optId = await insertPayType();
                await db.query(
                    `INSERT INTO ord_Credit_Pay (optId, amount, balance, c_ID, expectedDate)
                    VALUES (?, ?, ?, ?, ?)`,
                    [optId, creditPayment.amount || 0, creditPayment.balance || 0, Cust_id, creditPayment.expectdate || null]
                );
                await updateOrderPayment(advance1);
            }

            if (payment === 'Combined') {
                if (subPayment === 'Cash & Card' && cashCardPayment) {
                    const optId = await insertPayType();
                    await db.query(
                        `INSERT INTO ord_Card_Pay (optId, type, amount, intrestValue)
                        VALUES (?, ?, ?, ?)`,
                        [optId, cashCardPayment.type, cashCardPayment.cardBalance, cashCardPayment.interestValue || 0]
                    );
                    await updateOrderPayment(cashCardPayment.fullpaidAmount, cashCardPayment.interestValue || 0);
                    await db.query(`UPDATE cash_balance SET amount = ? WHERE Id = ?`, [cashCardPayment.fullpaidAmount, cashId]);
                }

                if (subPayment === 'Cash & Cheque' && combinedChequePayment) {
                    const optId = await insertPayType();
                    for (const chq of combinedChequePayment.cheques || []) {
                        await db.query(
                            `INSERT INTO ord_Cheque_Pay (optId, amount, bank, branch, accountNumber, chequeNumber, date)
                            VALUES (?, ?, ?, ?, ?, ?, ?)`,
                            [
                                optId,
                                chq.amount || 0,
                                chq.bank || '',
                                chq.branch || '',
                                chq.accountNumber || '',
                                chq.chequeNumber || '',
                                chq.chequeDate || null
                            ]
                        );
                    }
                    await updateOrderPayment(advance1);
                }

                if (subPayment === 'Cash & Credit' && combinedCreditPayment) {
                    const optId = await insertPayType();
                    await db.query(
                        `INSERT INTO ord_Credit_Pay (optId, amount, balance, c_ID, expectedDate)
                        VALUES (?, ?, ?, ?, ?)`,
                        [
                            optId,
                            combinedCreditPayment.creditBalance || 0,
                            combinedCreditPayment.cashBalance || 0,
                            Cust_id,
                            combinedCreditPayment.expectedDate || null
                        ]
                    );
                    await updateOrderPayment(advance1);
                }

                if (subPayment === 'Cash & Transfer' && combinedTransferPayment) {
                    const optId = await insertPayType();
                    await db.query(
                        `INSERT INTO ord_Transfer_Pay (optId, amount, bank)
                        VALUES (?, ?, ?)`,
                        [optId, combinedTransferPayment.transferAmount, combinedTransferPayment.bank]
                    );
                    await updateOrderPayment(advance1);
                }
            }

            if (payment === 'Cash' && subPayment === 'Transfer' && tranferPayment) {
                const optId = await insertPayType();
                await db.query(
                    `INSERT INTO ord_Transfer_Pay (optId, amount, bank)
                    VALUES (?, ?, ?)`,
                    [optId, advance1, tranferPayment.bank]
                );
                await updateOrderPayment(advance1);
            }
        }


        return res.status(201).json({
            success: true,
            message: "Order placed successfully",
            data: { orderId: orID, orderDate, expectedDate }
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
            material:item.material, // Item material
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
            return res.status(200).json({ message: "No customers found",data:[] });
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
// Get all delivery notes for spefic driver
router.get("/alldeliverynotes-stid", async (req, res) => {
    try {
        const { eid } = req.query;
        let query = `
            SELECT dn.delNoID, dn.driverName, dn.date, dn.status, dn.district
            FROM delivery_note dn
            JOIN driver d ON dn.devID = d.devID
        `;

        const params = [];

        if (eid) {
            query += ` WHERE d.E_ID = ?`;
            params.push(eid);
        }

        const [deliveryNotes] = await db.query(query, params);

        if (deliveryNotes.length === 0) {
            return res.status(404).json({ message: "No deliveries found" });
        }

        const formattedDeliveryNotes = deliveryNotes.map(deliverynote => ({
            delNoID: deliverynote.delNoID,
            driverName: deliverynote.driverName,
            date: deliverynote.date,
            status: deliverynote.status,
            district: deliverynote.district
        }));

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
    const {
        title,
        FtName,
        SrName,
        id,
        email,
        contact,
        contact2,
        address,
        type,
        category,
        t_name,
        occupation,
        workPlace
    } = req.body;

    try {
        const c_ID = await generateNewId("Customer", "c_ID", "Cus");

        const sqlInsertCustomer = `
            INSERT INTO Customer (
                c_ID, title, FtName, SrName, address, contact1, contact2,
                email, id, balance, type, category, t_name, occupation, workPlace
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const valuesCustomer = [
            c_ID, title, FtName, SrName, address, contact, contact2 || "",
            email, id, 0, type, category, t_name, occupation, workPlace
        ];

        await db.query(sqlInsertCustomer, valuesCustomer);

        return res.status(201).json({
            success: true,
            message: "Customer added successfully",
            data: {
                c_ID,
                FtName,
                contact,
                contact2,
                id
            }
        });

    } catch (err) {
        console.error("Error inserting customer data:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error inserting data into database",
            details: err.message
        });
    }
});

// Get Customer Details 
router.get("/customer-details&orders", async (req, res) => {
    const { c_ID } = req.query;
    if (!c_ID) {
        return res.status(400).json({ message: "Missing customer ID (c_ID)" });
    }

    try {
        // Fetch customer details
        const [customerRows] = await db.query("SELECT * FROM Customer WHERE c_ID = ?", [c_ID]);

        if (customerRows.length === 0) {
            return res.status(404).json({ message: "Customer not found" });
        }

        const customer = customerRows[0];

        // Fetch order counts grouped by status
        const [orderCounts] = await db.query(`
            SELECT orStatus, COUNT(*) AS count
            FROM Orders
            WHERE c_ID = ?
            GROUP BY orStatus
        `, [c_ID]);

        // Initialize order status counts
        const statusCounts = {
            Accepted: 0,
            Pending: 0,
            Delivered: 0,
            Issued: 0,
            Production: 0
        };

        // Populate status counts with actual data
        orderCounts.forEach(row => {
            const status = row.orStatus;
            if (statusCounts.hasOwnProperty(status)) {
                statusCounts[status] = row.count;
            }
        });

        // Construct the response object
        const response = {
            c_ID: customer.c_ID,
            title: customer.title,
            FtName: customer.FtName,
            SrName: customer.SrName,
            id: customer.id,
            address: customer.address,
            contact1: customer.contact1,
            contact2: customer.contact2,
            balance: customer.balance,
            category: customer.category,
            type: customer.type,
            t_name: customer.t_name,
            occupation: customer.occupation,
            workPlace: customer.workPlace,
            orders: [statusCounts]
        };

        return res.status(200).json(response);
    } catch (error) {
        console.error("Error fetching customer details:", error.message);
        return res.status(500).json({ message: "Error fetching customer details" });
    }
});

// Check if customer exists by phone number
router.get("/customer/check-customer", async (req, res) => {
    const { phone } = req.query;

    if (!phone) {
        return res.status(400).json({
            exists: false,
            message: "Phone number is required.",
        });
    }

    try {
        const likePhone = `%${phone}%`; // Add wildcard for partial matching

        const [customer] = await db.query(
            `SELECT * FROM Customer WHERE contact1 LIKE ? OR contact2 LIKE ?`,
            [likePhone, likePhone]
        );

        if (customer.length > 0) {
            return res.status(200).json({
                exists: true,
                customerName: `${customer[0].FtName} ${customer[0].SrName}`,
                data: customer[0]
            });
        } else {
            return res.status(200).json({
                exists: false,
                message: "Customer not found.",
            });
        }
    } catch (err) {
        console.error("Error checking customer:", err.message);
        return res.status(500).json({
            exists: false,
            message: "Database error.",
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

        // 1️⃣ Fetch Order Info
        const orderQuery = `
            SELECT
                o.OrID, o.orDate, o.c_ID, c.title, c.FtName, c.SrName, c.address, c.contact1, c.contact2,o.netTotal,
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
                od.id, od.I_Id, i.I_name, i.color, od.qty, od.tprice,
                od.discount AS unitDiscount,
                i.price AS unitPrice,
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

        // 5️⃣ Format Customer Name
        const customerName = [orderData.title, orderData.FtName, orderData.SrName].filter(Boolean).join(" ");

        // 6️⃣ Base Order Object
        const orderResponse = {
            orderId: orderData.OrID,
            orderDate: formatDate(orderData.orDate),
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
            netTotal: orderData.netTotal,
            advance: orderData.advance,
            balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            salesTeam: orderData.salesEmployeeName ? { employeeName: orderData.salesEmployeeName } : null,
            items: itemsResult.map(item => ({
                id: item.id,
                itemId: item.I_Id,
                itemName: item.I_name,
                color: item.color,
                quantity: item.qty,
                unitPrice: item.unitPrice,
                discount: item.unitDiscount,
                amountBeforeDiscount: item.unitPrice * item.qty,
                totalDiscountAmount: item.unitDiscount * item.qty,
                amount: item.tprice,
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

        // 7️⃣ If Delivery, Fetch Delivery Info
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

        // 8️⃣ Fetch Payment History
        const paymentQuery = `
            SELECT op_ID, amount, netTotal, or_status, stID, dateTime, otherCharges,
                   fullPaidAmount, issuable, c_ID, balance
            FROM order_payment
            WHERE orID = ?
            ORDER BY dateTime ASC`;
        const [paymentResult] = await db.query(paymentQuery, [orID]);

        orderResponse.paymentHistory = paymentResult.map(p => ({
            paymentId: p.op_ID,
            amount: p.amount,
            netTotal: p.netTotal,
            orderStatus: p.or_status,
            salesTeamId: p.stID,
            dateTime: formatDateTime(p.dateTime),
            otherCharges: p.otherCharges,
            fullPaidAmount: p.fullPaidAmount,
            issuable: p.issuable,
            customerId: p.c_ID,
            balance: p.balance
        }));

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
                c.title, c.FtName, c.SrName, c.contact1, c.contact2, c.balance AS customerBalance,
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
                od.I_Id, i.I_name, i.color, od.qty, od.tprice,
                od.discount AS unitDiscount,
                i.price AS unitPrice,
                i.bookedQty, i.availableQty, i.stockQty
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
            orderId: orderData.OrID,orderDate: formatDate(orderData.orDate),
            customerId: orderData.c_ID, customerName: customerName,
            customerPhone: orderData.contact1,customerOptionalPhone: orderData.contact2,
            customerBalance: orderData.customerBalance,
            customerCategory: orderData.category,customerType: orderData.type,
            customerOccupation: orderData.occupation,customerWorkplace: orderData.workPlace,
            orderStatus: orderData.orStatus,
            deliveryStatus: orderData.delStatus,deliveryCharge: orderData.delPrice,
            discount: orderData.discount,specialdiscount: orderData.specialdic,
            totalPrice: orderData.total,netTotal: orderData.netTotal,
            advance: orderData.advance,balance: orderData.balance,
            payStatus: orderData.payStatus,
            expectedDeliveryDate: formatDate(orderData.expectedDate),
            specialNote: orderData.specialNote,
            items: itemsResult.map(item => {
                const { qty, unitPrice, unitDiscount } = item;
                const amountBeforeDiscount = unitPrice * qty;
                const totalDiscountAmount = unitDiscount * qty;
                const finalAmount = item.tprice;

                return {
                    itemId: item.I_Id,itemName: item.I_name,color: item.color,
                    quantity: qty,unitPrice: unitPrice,
                    discount: unitDiscount,amountBeforeDiscount: amountBeforeDiscount,
                    totalDiscountAmount: totalDiscountAmount,amount: finalAmount,
                    booked: item.bookedQty > 0,bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty, stockQuantity: item.stockQty
                };
            }),
            issuedItems: issuedItemsResult.map(item => ({
                pid_Id: item.pid_Id, stockId: item.stock_Id,
                BatchId: item.pc_Id,status: item.status,issuedDate: formatDate(item.issuedDate),
            })),
            paymentHistory: paymentHistoryResult.map(payment => ({
                paymentId: payment.op_ID,amount: payment.amount,paymentDate: formatDate(payment.dateTime)
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

        // 8️⃣ Fetch Payment Type and Sub Payment Details
        const payTypeQuery = `SELECT * FROM ord_Pay_type WHERE orID = ?`;
        const [payTypeResult] = await db.query(payTypeQuery, [orID]);

        const paymentDetails = [];

        for (const payType of payTypeResult) {
            const { optId, type, subType } = payType;
            const paymentInfo = { optId, type, subType };

            if (type === "Card") {
                const [cardRows] = await db.query(`SELECT * FROM ord_Card_Pay WHERE optId = ?`, [optId]);
                paymentInfo.card = cardRows;
            } else if (type === "Cheque") {
                const [chequeRows] = await db.query(`SELECT * FROM ord_Cheque_Pay WHERE optId = ?`, [optId]);
                paymentInfo.cheque = chequeRows;
            } else if (type === "Credit") {
                const [creditRows] = await db.query(`SELECT * FROM ord_Credit_Pay WHERE optId = ?`, [optId]);
                paymentInfo.credit = creditRows;
            } else if (type === "Transfer") {
                const [transferRows] = await db.query(`SELECT * FROM ord_Transfer_Pay WHERE optId = ?`, [optId]);
                paymentInfo.transfer = transferRows;
            } else if (type === "Combined") {
                // Depending on subType like "Cash & Card", fetch multiple sets
                if (subType.includes("Card")) {
                    const [cardRows] = await db.query(`SELECT * FROM ord_Card_Pay WHERE optId = ?`, [optId]);
                    paymentInfo.card = cardRows;
                }
                if (subType.includes("Cheque")) {
                    const [chequeRows] = await db.query(`SELECT * FROM ord_Cheque_Pay WHERE optId = ?`, [optId]);
                    paymentInfo.cheque = chequeRows;
                }
                if (subType.includes("Credit")) {
                    const [creditRows] = await db.query(`SELECT * FROM ord_Credit_Pay WHERE optId = ?`, [optId]);
                    paymentInfo.credit = creditRows;
                }
                if (subType.includes("Transfer")) {
                    const [transferRows] = await db.query(`SELECT * FROM ord_Transfer_Pay WHERE optId = ?`, [optId]);
                    paymentInfo.transfer = transferRows;
                }
            }

            paymentDetails.push(paymentInfo);
        }

        orderResponse.paymentDetails = paymentDetails;


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
                od.I_Id, i.I_name, i.color, od.qty, od.tprice,
                od.discount AS unitDiscount,
                i.price AS unitPrice,
                i.bookedQty, i.availableQty, i.stockQty
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
            items: itemsResult.map(item => {
                const { qty, unitPrice, unitDiscount } = item;
                const amountBeforeDiscount = unitPrice * qty;
                const totalDiscountAmount = unitDiscount * qty;
                const finalAmount = item.tprice;

                return {
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    color: item.color,
                    quantity: qty,
                    unitPrice: unitPrice,
                    discount: unitDiscount,
                    amountBeforeDiscount: amountBeforeDiscount,
                    totalDiscountAmount: totalDiscountAmount,
                    amount: finalAmount,
                    booked: item.bookedQty > 0,
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty,
                    stockQuantity: item.stockQty
                };
            }),
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
                od.id, od.I_Id, i.I_name, i.color, od.qty, od.tprice,
                od.discount AS unitDiscount,
                i.price AS unitPrice,
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
            items: itemsResult.map(item => {
                const { qty, unitPrice, unitDiscount } = item;
                const amountBeforeDiscount = unitPrice * qty;
                const totalDiscountAmount = unitDiscount * qty;
                const finalAmount = item.tprice;

                return {
                    id: item.id,
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    color: item.color,
                    quantity: qty,
                    unitPrice: unitPrice,
                    discount: unitDiscount,
                    amountBeforeDiscount: amountBeforeDiscount,
                    totalDiscountAmount: totalDiscountAmount,
                    amount: finalAmount,
                    booked: item.bookedQty > 0,
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty,
                    stockQuantity: item.stockQty
                };
            }),
        };

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

// Get all orders by status= pending
router.get("/orders-pending", async (req, res) => {
    try {
        // Join Orders with Customer to get contact numbers
        const query = `
            SELECT 
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, 
                o.delPrice, o.discount, o.total, o.advance, o.balance, o.payStatus,
                o.stID, o.expectedDate,
                c.contact1, c.contact2
            FROM Orders o
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'pending'
        `;

        const [orders] = await db.query(query);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No pending orders found" });
        }

        const formattedOrders = orders.map(order => ({
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
            expectedDeliveryDate: order.expectedDate,
            contact1: order.contact1,
            contact2: order.contact2
        }));

        return res.status(200).json({
            message: "Pending orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        return res.status(500).json({ message: "Error fetching pending orders", error: error.message });
    }
});

// Get all orders by status= pending & specific sale team
router.get("/orders-pending-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;

        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // Step 2: Get pending orders assigned to this sales team with customer contact info
        const [orders] = await db.query(
            `SELECT 
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus,
                o.delPrice, o.discount, o.total, o.advance, o.balance, o.payStatus,
                o.stID, o.expectedDate,
                c.contact1, c.contact2
             FROM Orders o
             JOIN Customer c ON o.c_ID = c.c_ID
             WHERE o.orStatus = 'pending' AND o.stID = ?`,
            [stID]
        );

        if (orders.length === 0) {
            return res.status(404).json({ message: "No pending orders found for this sales team." });
        }

        // Step 3: Format and send orders
        const formattedOrders = orders.map(order => ({
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
            expectedDeliveryDate: order.expectedDate,
            contact1: order.contact1,
            contact2: order.contact2,
        }));

        return res.status(200).json({
            message: "Pending orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching pending orders:", error.message);
        return res.status(500).json({ message: "Server error", error: error.message });
    }
});

// Get all orders by status= accepting
// 📌 Categorize orders into booked and unbooked
function categorizeOrders(orders) {
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
                contact1: order.contact1,
                contact2: order.contact2,
                acceptanceStatuses: []
            };
        }

        groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);
    });

    const bookedOrders = [];
    const unbookedOrders = [];

    Object.values(groupedOrders).forEach(order => {
        const allComplete = order.acceptanceStatuses.every(status => status === "Complete");
        order.acceptanceStatus = allComplete ? "Complete" : "Incomplete";

        if (allComplete) {
            bookedOrders.push(order);
        } else {
            unbookedOrders.push(order);
        }
    });

    return { bookedOrders, unbookedOrders };
}

router.get("/orders-accepting", async (req, res) => {
    try {
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus,
                o.delPrice, o.discount, o.advance, o.balance, o.payStatus,
                o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Accepted'
        `;

        const [orders] = await db.query(query);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found" });
        }

        const { bookedOrders, unbookedOrders } = categorizeOrders(orders);

        return res.status(200).json({
            message: "Accepted orders found.",
            data: { bookedOrders, unbookedOrders }
        });

    } catch (error) {
        console.error("Error fetching accepted orders:", error.message);
        return res.status(500).json({ message: "Error fetching accepted orders", error: error.message });
    }
});

//Get all orders by status= accepting & specific sale team
router.get("/orders-accepting-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;
        if (!Eid) return res.status(400).json({ message: "Missing 'eid' in query params" });

        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query("SELECT stID FROM sales_team WHERE E_Id = ?", [Eid]);
        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // Step 2: Fetch accepted orders assigned to this stID with customer contacts
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Accepted' AND o.stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No Accepted orders found for this sales team." });
        }

        const categorized = categorizeOrders(orders);

        return res.status(200).json({
            message: "Accepted orders found.",
            data: categorized
        });

    } catch (error) {
        console.error("Error fetching accepted orders:", error.message);
        return res.status(500).json({ message: "Error fetching accepted orders", error: error.message });
    }
});

// Get all orders by status= Processing
router.get("/orders-Processing", async (req, res) => {
    try {
        // Query to fetch processing orders with customer contacts
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Processing'
        `;

        const [orders] = await db.query(query);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No Processing orders found" });
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
                    contact1: order.contact1,
                    contact2: order.contact2,
                    acceptanceStatus: "Complete", // default
                    acceptanceStatuses: []
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        const formattedOrders = Object.values(groupedOrders);

        return res.status(200).json({
            message: "Processing orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching Processing orders:", error.message);
        return res.status(500).json({ message: "Error fetching Processing orders", error: error.message });
    }
});

// Get all orders by status= completed & specific sale team
router.get("/orders-Processing-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;

        if (!Eid) {
            return res.status(400).json({ message: "Missing 'eid' in query params" });
        }

        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query("SELECT stID FROM sales_team WHERE E_Id = ?", [Eid]);

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // Step 2: Query to fetch processing orders with customer contacts
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Processing' AND o.stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

        if (orders.length === 0) {
            return res.status(404).json({ message: "No Processing orders found" });
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
                    contact1: order.contact1,
                    contact2: order.contact2,
                    acceptanceStatus: "Complete",
                    acceptanceStatuses: []
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        const formattedOrders = Object.values(groupedOrders);

        return res.status(200).json({
            message: "Processing orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching Processing orders:", error.message);
        return res.status(500).json({ message: "Error fetching Processing orders", error: error.message });
    }
});

// Get all orders by status= completed
router.get("/orders-completed", async (req, res) => {
    try {
        // Query to fetch completed orders with customer contact information
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Completed'
        `;

        const [orders] = await db.query(query);

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
                    contact1: order.contact1,
                    contact2: order.contact2,
                    acceptanceStatus: "Complete",
                    acceptanceStatuses: []
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        const formattedOrders = Object.values(groupedOrders);

        return res.status(200).json({
            message: "Completed orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching completed orders:", error.message);
        return res.status(500).json({ message: "Error fetching completed orders", error: error.message });
    }
});

// Get all orders by status= completed & specific sale team
router.get("/orders-completed-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;

        if (!Eid) {
            return res.status(400).json({ message: "Missing 'eid' in query params" });
        }

        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // Query to fetch completed orders with customer contact info
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Completed' AND o.stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

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
                    contact1: order.contact1,
                    contact2: order.contact2,
                    acceptanceStatus: "Complete",
                    acceptanceStatuses: []
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        });

        const formattedOrders = Object.values(groupedOrders);

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
        // Query to fetch issued orders with their acceptance status from accept_orders table
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
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
                    contact1: order.contact1,
                    contact2: order.contact2,
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
            message: "Issued orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching issued orders:", error.message);
        return res.status(500).json({ message: "Error fetching issued orders", error: error.message });
    }
});

// Get all orders by status= issued & specific sale team
router.get("/orders-issued-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;
        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;
        // Query to fetch orders with their acceptance status from accept_orders table
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            JOIN Customer c ON o.c_ID = c.c_ID
            WHERE o.orStatus = 'Issued' AND stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

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
                    contact1: order.contact1,
                    contact2: order.contact2,
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
            message: "Issued orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching issued orders:", error.message);
        return res.status(500).json({ message: "Error fetching issued orders", error: error.message });
    }
});

// Get all orders by status= delivered
router.get("/orders-delivered", async (req, res) => {
    try {
        // Fetch delivered orders with acceptance statuses and customer contacts
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2 
            FROM Orders o
                LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                LEFT JOIN Customer c ON o.c_ID = c.c_ID  
            WHERE o.orStatus = 'Delivered'
        `;

        const [orders] = await db.query(query);

        if (!orders.length) {
            return res.status(404).json({ message: "No Delivered orders found" });
        }

        const groupedOrders = {};

        for (const order of orders) {
            const {
                OrID, orDate, c_ID, ordertype, orStatus, delStatus, delPrice,
                discount, advance, balance, payStatus, total, stID, expectedDeliveryDate,
                itemReceived, acceptanceStatus, contact1, contact2
            } = order;

            if (!groupedOrders[OrID]) {
                groupedOrders[OrID] = {
                    OrID,
                    orDate,
                    customer: c_ID,
                    ordertype,
                    orStatus,
                    dvStatus: delStatus,
                    dvPrice: delPrice,
                    disPrice: discount,
                    totPrice: total,
                    advance,
                    balance,
                    payStatus,
                    stID,
                    expectedDeliveryDate,
                    contact1,
                    contact2,
                    acceptanceStatuses: [],
                    acceptanceStatus: "Complete"
                };
            }

            // Track individual item statuses
            groupedOrders[OrID].acceptanceStatuses.push(acceptanceStatus);

            // Update to "Incomplete" if any item is not fully accepted
            if (acceptanceStatus === "In Production" || acceptanceStatus === "None") {
                groupedOrders[OrID].acceptanceStatus = "Incomplete";
            }
        }

        // Return structured response
        return res.status(200).json({
            message: "Delivered orders found.",
            data: Object.values(groupedOrders),
        });

    } catch (error) {
        console.error("❌ Error fetching delivered orders:", error.message);
        return res.status(500).json({
            message: "Error fetching delivered orders",
            error: error.message
        });
    }
});

// Get all orders by status= delivered
router.get("/orders-delivered-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;
        if (!Eid) {
            return res.status(400).json({ message: "Employee ID (eid) is required" });
        }

        // 🔍 Step 1: Get sales team ID (stID) for the employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (!salesResult.length) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // 📦 Step 2: Fetch Delivered Orders belonging to this stID
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived,
                ao.status AS acceptanceStatus,
                c.contact1, c.contact2 
            FROM Orders o
            LEFT JOIN accept_orders ao ON o.OrID = ao.orID
            LEFT JOIN Customer c ON o.c_ID = c.c_ID  
            WHERE o.orStatus = 'Delivered' AND o.stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

        if (!orders.length) {
            return res.status(404).json({ message: "No Delivered orders found" });
        }

        // 🧠 Step 3: Group by Order ID
        const groupedOrders = {};

        for (const order of orders) {
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
                    contact1: order.contact1,
                    contact2: order.contact2,
                    acceptanceStatus: "Complete",
                    acceptanceStatuses: []
                };
            }

            groupedOrders[order.OrID].acceptanceStatuses.push(order.acceptanceStatus);

            if (order.acceptanceStatus === "In Production" || order.acceptanceStatus === "None") {
                groupedOrders[order.OrID].acceptanceStatus = "Incomplete";
            }
        }

        // 🧾 Step 4: Format response
        return res.status(200).json({
            message: "Delivered orders found.",
            data: Object.values(groupedOrders),
        });

    } catch (error) {
        console.error("❌ Error fetching delivered orders by stID:", error.message);
        return res.status(500).json({
            message: "Error fetching delivered orders",
            error: error.message
        });
    }
});

// Get all orders by status= delivered & specific sale team
router.get("/orders-returned", async (req, res) => {
    try {
        // Query to fetch returned orders with their acceptance status, return reason, and customer contact numbers
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason,
                c.contact1, c.contact2  -- Add customer contact numbers
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
                     LEFT JOIN customers c ON o.c_ID = c.c_ID  -- Join customers table to fetch contact numbers
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
                    contact1: order.contact1,  // Add contact1 to the response
                    contact2: order.contact2,  // Add contact2 to the response
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

// Get all orders by status= returned & specific sale team
router.get("/orders-returned-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;
        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;
        
        // Query to fetch returned orders with their acceptance status, return reason, and customer contact numbers
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason,
                c.contact1, c.contact2  -- Add customer contact numbers
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
                     LEFT JOIN customers c ON o.c_ID = c.c_ID  -- Join customers table to fetch contact numbers
            WHERE o.orStatus = 'Returned' AND o.stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

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
                    contact1: order.contact1,  // Add contact1 to the response
                    contact2: order.contact2,  // Add contact2 to the response
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
        // Query to fetch canceled orders with their acceptance status, return reason, and customer contact numbers
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason,
                c.contact1, c.contact2  -- Add customer contact numbers
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
                     LEFT JOIN customers c ON o.c_ID = c.c_ID  -- Join customers table to fetch contact numbers
            WHERE o.orStatus = 'Cancelled'
        `;

        const [orders] = await db.query(query);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No canceled orders found" });
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
                    contact1: order.contact1,  // Add contact1 to the response
                    contact2: order.contact2,  // Add contact2 to the response
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
            message: "Canceled orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching canceled orders:", error.message);
        return res.status(500).json({ message: "Error fetching canceled orders", error: error.message });
    }
});

// Get all orders by status= canceled & specific sale team
router.get("/orders-canceled-stid", async (req, res) => {
    try {
        const Eid = req.query.eid;
        // Step 1: Get sales team ID (stID) for this employee
        const [salesResult] = await db.query(
            "SELECT stID FROM sales_team WHERE E_Id = ?",
            [Eid]
        );

        if (salesResult.length === 0) {
            return res.status(404).json({ message: "No sales team entry found for this employee." });
        }

        const stID = salesResult[0].stID;

        // Query to fetch canceled orders with their acceptance status, return reason, and customer contact numbers
        const query = `
            SELECT
                o.OrID, o.orDate, o.c_ID, o.ordertype, o.orStatus, o.delStatus, o.delPrice,
                o.discount, o.advance, o.balance, o.payStatus, o.total, o.stID, o.expectedDate AS expectedDeliveryDate,
                ao.itemReceived, ao.status AS acceptanceStatus,
                ro.detail AS returnReason,
                c.contact1, c.contact2  -- Add customer contact numbers
            FROM Orders o
                     LEFT JOIN accept_orders ao ON o.OrID = ao.orID
                     LEFT JOIN return_orders ro ON o.OrID = ro.OrID
                     LEFT JOIN customers c ON o.c_ID = c.c_ID  -- Join customers table to fetch contact numbers
            WHERE o.orStatus = 'Cancelled' AND stID = ?
        `;

        const [orders] = await db.query(query, [stID]);

        // If no orders found, return a 404 status
        if (orders.length === 0) {
            return res.status(404).json({ message: "No canceled orders found" });
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
                    contact1: order.contact1,  // Add contact1 to the response
                    contact2: order.contact2,  // Add contact2 to the response
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
            message: "Canceled orders found.",
            data: formattedOrders,
        });

    } catch (error) {
        console.error("Error fetching canceled orders:", error.message);
        return res.status(500).json({ message: "Error fetching canceled orders", error: error.message });
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
                Item.img,
                Item.material,
                Item.price
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

// Get employee full details
router.get("/employee-details", async (req, res) => {
    try {
        const { E_Id } = req.query;
        if (!E_Id) return res.status(400).json({ message: "Missing E_Id parameter." });

        // 1. Basic Employee Info
        const empQuery = `SELECT * FROM Employee WHERE E_Id = ?`;
        const [empResults] = await db.execute(empQuery, [E_Id]);

        if (empResults.length === 0) {
            return res.status(404).json({ message: "Employee not found." });
        }

        const employee = empResults[0];

        // 2. Check if Driver
        const driverQuery = `
            SELECT devID, balance, dailyTarget, monthlyTarget, lincenseDate, lincense
            FROM driver
            WHERE E_ID = ?
        `;
        const [driverResults] = await db.execute(driverQuery, [E_Id]);

        let driverDetails = null;
        if (driverResults.length > 0) {
            const d = driverResults[0];
            driverDetails = {
                ...d,
                lincense: d.lincense ? Buffer.from(d.lincense).toString("base64") : null
            };
        }

        // 3. Check if Sales Team Member
        const salesQuery = `
            SELECT stID, orderTarget, issuedTarget, totalOrder, totalIssued
            FROM sales_team
            WHERE E_Id = ?
        `;
        const [salesResults] = await db.execute(salesQuery, [E_Id]);

        const salesDetails = salesResults.length > 0 ? salesResults[0] : null;

        // 4. Compose response
        const response = {
            ...employee,
            role: employee.job.toLowerCase(), // optional
            driver: driverDetails,
            sales: salesDetails
        };

        return res.status(200).json({ success: true, data: response });

    } catch (error) {
        console.error("Error fetching employee details:", error.message);
        return res.status(500).json({ message: "Error fetching employee details." });
    }
});

// Update employee detail
router.put("/employees/:id", async (req, res) => {
    const E_Id = req.params.id;
    console.log(E_Id);
    const {
        name,address,nic,dob,contact,job, basic,type,driver, sales} = req.body;

    try {
        // 1. Update Employee table
        const updateEmployeeQuery = `
            UPDATE Employee
            SET name = ?, address = ?, nic = ?, dob = ?, contact = ?, job = ?, basic = ?, type = ?
            WHERE E_Id = ?
        `;
        await db.execute(updateEmployeeQuery, [
            name,
            address,
            nic,
            dob,
            contact,
            job,
            basic,
            type,
            E_Id
        ]);

        // 2. Handle driver role
        if (job.toLowerCase() === "driver" && driver) {
            const { devID, balance, dailyTarget, monthlyTarget } = driver;

            const [driverCheck] = await db.execute(`SELECT * FROM driver WHERE E_ID = ?`, [E_Id]);

            if (driverCheck.length > 0) {
                const updateDriver = `
                    UPDATE driver
                    SET  balance = ?, dailyTarget = ?, monthlyTarget = ?
                    WHERE devID = ?
                `;
                await db.execute(updateDriver, [ balance, dailyTarget, monthlyTarget, devID]);
            } else {
                const insertDriver = `
                    INSERT INTO driver (devID, E_ID, balance, dailyTarget, monthlyTarget)
                    VALUES (?, ?, ?, ?, ?)
                `;
                await db.execute(insertDriver, [devID, E_Id, balance, dailyTarget, monthlyTarget]);
            }
        } else {
            // Optional: Delete driver if not a driver anymore
            await db.execute(`DELETE FROM driver WHERE E_ID = ?`, [E_Id]);
        }

        // 3. Handle sales role
        if (job.toLowerCase() === "sales" && sales) {
            const { stID, orderTarget, issuedTarget, totalOrder, totalIssued } = sales;

            const [salesCheck] = await db.execute(`SELECT * FROM sales_team WHERE E_Id = ?`, [E_Id]);

            if (salesCheck.length > 0) {
                const updateSales = `
                    UPDATE sales_team
                    SET  orderTarget = ?, issuedTarget = ?
                    WHERE stID = ?
                `;
                await db.execute(updateSales, [orderTarget, issuedTarget, stID]);
            } else {
                const insertSales = `
                    INSERT INTO sales_team (stID, E_Id, orderTarget, issuedTarget, totalOrder, totalIssued)
                    VALUES (?, ?, ?, ?, 0,0)
                `;
                await db.execute(insertSales, [stID, E_Id, orderTarget, issuedTarget]);
            }
        } else {
            // Optional: Delete sales data if not in sales anymore
            await db.execute(`DELETE FROM sales_team WHERE E_Id = ?`, [E_Id]);
        }

        return res.status(200).json({ success: true, message: "Employee updated successfully." });

    } catch (error) {
        console.error("Error updating employee:", error.message);
        return res.status(500).json({ success: false, message: "Failed to update employee", error: error.message });
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
        const {
            orID,
            isPickup,
            netTotal,
            totalAdvance,
            previousAdvance,
            balance,
            addedAdvance,
            updatedDeliveryCharge,
            updatedDiscount,
        } = req.body;

        if (!orID) {
            return res.status(400).json({
                success: false,
                message: "Order ID is required",
            });
        }

        const op_ID = await generateNewId("order_payment", "op_ID", "OP");

        // 🔍 Fetch order details
        const [orderResult] = await db.query(
            `SELECT OrID, orStatus, stID, c_ID FROM Orders WHERE OrID = ?`,
            [orID]
        );

        if (orderResult.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Order not found",
            });
        }

        const { orStatus, stID, c_ID } = orderResult[0];

        // 🔄 Determine Payment Status
        let payStatus = "Pending";
        if (totalAdvance > 0) payStatus = "Advanced";
        if (balance === 0) payStatus = "Settled";

        // 🔄 Update Orders table
        const orderUpdateQuery = `
            UPDATE Orders
            SET total = ?, discount = ?, delPrice = ?, advance = ?, balance = ?, payStatus = ?
            WHERE OrID = ?`;
        await db.query(orderUpdateQuery, [
            netTotal,
            updatedDiscount,
            updatedDeliveryCharge,
            totalAdvance,
            balance,
            payStatus,
            orID,
        ]);

        // 🛑 If pickup, remove delivery record
        if (isPickup) {
            await db.query(`DELETE FROM delivery WHERE orID = ?`, [orID]);
        }

        // 💰 Insert order payment + cash record
        if (addedAdvance > 0) {
            const fullPaid = parseFloat(previousAdvance || 0) + parseFloat(addedAdvance || 0);

            await db.query(
                `INSERT INTO order_payment (
                    op_ID, orID, amount, dateTime, or_status, netTotal, stID,
                    fullPaidAmount, balance, c_ID, issuable
                )
                VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?, ?, ?)`,
                [
                    op_ID,
                    orID,
                    addedAdvance,
                    orStatus,
                    netTotal,
                    stID,
                    fullPaid,
                    balance,
                    c_ID,
                    'Now' // or another value depending on logic
                ]
            );

            await db.query(
                `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                 VALUES (?, ?, ?, NOW(), ?)`,
                ["Order payment", op_ID, "order", addedAdvance]
            );
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

        const [existingRecords] = await db.query(
            `SELECT I_Id FROM Order_Detail WHERE orID = ?`,
            [orderId]
        );
        const existingItemIds = existingRecords.map(item => item.I_Id);
        const newItemIds = items.map(item => item.itemId);

        const itemsToRemove = existingItemIds.filter(id => !newItemIds.includes(id));

        for (const itemId of itemsToRemove) {
            await db.query(`DELETE FROM Order_Detail WHERE orID = ? AND I_Id = ?`, [orderId, itemId]);
            await db.query(`DELETE FROM accept_orders WHERE orID = ? AND I_Id = ?`, [orderId, itemId]);
        }

        for (const item of items) {
            const { itemId, quantity, amount, originalQuantity, originalAmount } = item;
            const safePrice = amount !== undefined && amount !== null ? amount : 0;

            const [orderDetailRecord] = await db.query(
                `SELECT * FROM Order_Detail WHERE orID = ? AND I_Id = ?`,
                [orderId, itemId]
            );

            if (orderDetailRecord.length > 0) {
                const existingItem = orderDetailRecord[0];

                // Only update qty and tprice if quantity or amount has changed
                if (quantity !== existingItem.qty || safePrice !== existingItem.tprice) {
                    await db.query(
                        `UPDATE Order_Detail SET qty = ?, tprice = ? WHERE orID = ? AND I_Id = ?`,
                        [quantity, safePrice, orderId, itemId]
                    );
                }
            } else {
                await db.query(
                    `INSERT INTO Order_Detail (orID, I_Id, qty, tprice) VALUES (?, ?, ?, ?)`,
                    [orderId, itemId, quantity, safePrice]
                );
            }
        }

        const isAnyItemBooked = items.some(item => item.booked);
        if (isAnyItemBooked && orderStatus !== "Accepted") {
            return res.status(400).json({ success: false, message: "Order status must be 'Accepted' if any item is booked." });
        }

        // Now booking / unbooking logic
        for (const item of items) {
            const { itemId, quantity, booked } = item;
            const itemReceived = booked ? "Yes" : "No";
            const itemStatus = booked ? "Complete" : "Incomplete";

            const [acceptRecord] = await db.query(
                `SELECT * FROM accept_orders WHERE orID = ? AND I_Id = ?`,
                [orderId, itemId]
            );

            if (acceptRecord.length > 0) {
                await db.query(
                    `UPDATE accept_orders SET itemReceived = ?, status = ? WHERE orID = ? AND I_Id = ?`,
                    [itemReceived, itemStatus, orderId, itemId]
                );
            } else {
                await db.query(
                    `INSERT INTO accept_orders (orID, I_Id, itemReceived, status) VALUES (?, ?, ?, ?)`,
                    [orderId, itemId, itemReceived, itemStatus]
                );
            }

            if (booked) {
                const [bookedItem] = await db.query(
                    `SELECT * FROM booked_item WHERE orID = ? AND I_Id = ?`,
                    [orderId, itemId]
                );

                if (bookedItem.length === 0) {
                    await db.query(
                        `INSERT INTO booked_item (orID, I_Id, qty) VALUES (?, ?, ?)`,
                        [orderId, itemId, quantity]
                    );
                    await db.query(
                        `UPDATE Item SET bookedQty = bookedQty + ?, availableQty = availableQty - ? WHERE I_Id = ?`,
                        [quantity, quantity, itemId]
                    );
                }
            } else {
                await db.query(
                    `DELETE FROM booked_item WHERE orID = ? AND I_Id = ?`,
                    [orderId, itemId]
                );
                const [bookedCheck] = await db.query(
                    `SELECT * FROM Item WHERE I_Id = ? AND bookedQty >= ?`,
                    [itemId, quantity]
                );

                if (bookedCheck.length > 0) {
                    await db.query(
                        `UPDATE Item SET bookedQty = bookedQty - ?, availableQty = availableQty + ? WHERE I_Id = ?`,
                        [quantity, quantity, itemId]
                    );
                }
            }
        }

        return res.status(200).json({ success: true, message: "Order items updated successfully." });

    } catch (error) {
        console.error("Error updating order items:", error.message);
        return res.status(500).json({ success: false, message: "Database update failed.", details: error.message });
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
                d.devID,d.balance,e.E_Id,
                e.name AS employeeName,e.address,
                e.nic,e.dob,e.contact,e.job,e.basic
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

// Get All other employee
router.get("/grouped-employees", async (req, res) => {
    try {
        // Get employees with job IN ('It', 'HR', 'Admin')
        const [rows] = await db.query(
            "SELECT * FROM Employee WHERE job IN ('It', 'HR', 'Admin')"
        );

        // Return all employees in a single array
        return res.status(200).json({
            success: true,
            employees: rows // Send all employees regardless of their job type
        });
    } catch (error) {
        console.error("Error fetching grouped employees:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
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

        // Fetch coupon separately for the sales team
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
                coupons: coupons.length > 0 ? coupons : [], // Return all coupons, not just one
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
        if (!devID) return res.status(400).json({ message: "Missing devID parameter." });

        // 1. Driver and Employee Info (now includes license-related fields)
        const driverQuery = `
            SELECT d.devID, d.balance, d.dailyTarget, d.monthlyTarget, d.lincenseDate, d.lincense,
                   e.E_Id, e.name, e.address, e.nic, e.dob, e.contact, e.job, e.basic
            FROM driver d
            INNER JOIN Employee e ON d.E_ID = e.E_Id
            WHERE d.devID = ?;
        `;
        const [driverResults] = await db.execute(driverQuery, [devID]);
        if (driverResults.length === 0) return res.status(404).json({ message: "Driver not found." });

        const employeeId = driverResults[0].E_Id;

        // Convert license blob to base64 if available
        let licenseBase64 = null;
        if (driverResults[0].lincense) {
            licenseBase64 = Buffer.from(driverResults[0].lincense).toString("base64");
        }

        // 2. Delivery Charges
        const chargeQuery = `
            SELECT dv_id AS deliveryId, delivery_Date AS date, driverBalance AS amount
            FROM delivery
            WHERE devID = ? AND driverBalance > 0
              AND (
                (MONTH(delivery_Date) = MONTH(CURDATE()) AND YEAR(delivery_Date) = YEAR(CURDATE()))
                OR (MONTH(delivery_Date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(delivery_Date) = YEAR(CURDATE()))
              );
        `;
        const [chargeDetails] = await db.execute(chargeQuery, [devID]);

        const today = new Date().toDateString();
        const thisMonth = new Date().getMonth() + 1;
        const lastMonth = new Date().getMonth();

        const dailyCharges = chargeDetails.filter(c => new Date(c.date).toDateString() === today);
        const monthlyCharges = chargeDetails.filter(c => new Date(c.date).getMonth() + 1 === thisMonth);

        const dailyChargeTotal = dailyCharges.reduce((sum, c) => sum + c.amount, 0);
        const monthlyChargeTotal = monthlyCharges.reduce((sum, c) => sum + c.amount, 0);

        // 3. Delivery Notes
        const deliveryNoteQuery = `
            SELECT delNoID, district, hire, MONTH(date) AS month, YEAR(date) AS year
            FROM delivery_note
            WHERE devID = ? AND status = 'complete'
              AND (
                (MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE()))
                OR (MONTH(date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(date) = YEAR(CURDATE()))
              );
        `;
        const [deliveryNotes] = await db.execute(deliveryNoteQuery, [devID]);

        const thisMonthNotes = deliveryNotes.filter(note => note.month === thisMonth);
        const lastMonthNotes = deliveryNotes.filter(note => note.month === lastMonth);

        const thisMonthNoteHireTotal = thisMonthNotes.reduce((sum, n) => sum + n.hire, 0);
        const lastMonthNoteHireTotal = lastMonthNotes.reduce((sum, n) => sum + n.hire, 0);

        // 4. Other Hires
        const hireQuery = `
            SELECT id, date, hire, MONTH(date) AS month
            FROM otherHire
            WHERE driverId = ?
              AND (
                (MONTH(date) = MONTH(CURDATE()) AND YEAR(date) = YEAR(CURDATE()))
                OR (MONTH(date) = MONTH(CURDATE() - INTERVAL 1 MONTH) AND YEAR(date) = YEAR(CURDATE()))
              );
        `;
        const [hires] = await db.execute(hireQuery, [devID]);

        const thisMonthHires = hires.filter(h => h.month === thisMonth);
        const lastMonthHires = hires.filter(h => h.month === lastMonth);

        const thisMonthHireTotal = thisMonthHires.reduce((sum, h) => sum + h.hire, 0);
        const lastMonthHireTotal = lastMonthHires.reduce((sum, h) => sum + h.hire, 0);

        // 5. Advances
        const advanceQuery = `
            SELECT ad_ID AS advanceId, amount, dateTime
            FROM salary_advance
            WHERE E_Id = ?
              AND MONTH(dateTime) = MONTH(CURDATE())
              AND YEAR(dateTime) = YEAR(CURDATE());
        `;
        const [advanceDetails] = await db.execute(advanceQuery, [employeeId]);
        const totalAdvance = advanceDetails.reduce((sum, a) => sum + a.amount, 0);

        // 6. Loan Info
        const loanQuery = `SELECT * FROM salary_loan WHERE E_Id = ?`;
        const [loanDetails] = await db.execute(loanQuery, [employeeId]);

        const responseData = {
            ...driverResults[0],
            lincense: licenseBase64,
            deliveryCharges: {
                dailyChargeTotal,
                dailyCharges,
                monthlyChargeTotal,
                monthlyCharges
            },
            deliveryNotes: {
                thisMonth: thisMonthNotes,
                lastMonth: lastMonthNotes,
                thisMonthNoteHireTotal,
                lastMonthNoteHireTotal
            },
            hires: {
                thisMonth: thisMonthHires,
                lastMonth: lastMonthHires,
                thisMonthHireTotal,
                lastMonthHireTotal
            },
            advanceDetails,
            totalAdvance,
            loans: loanDetails
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

// add purchase note and add stock- Generate barcodes for each stock
router.post("/addStock", upload.single("image"), async (req, res) => {
    try {
        const { purchase_id, supplier_id, date, itemTotal, delivery, invoice, items } = req.body;
        console.log(req.body);
        const imageFile = req.file;

        const total = Number(itemTotal) || 0;
        const deliveryPrice = Number(delivery) || 0;

        if (!supplier_id || !itemTotal || !date || !purchase_id || !items) {
            return res.status(400).json({ success: false, message: "All fields are required!" });
        }

        let imagePath = null;
        if (imageFile) {
            const imageName = `item_${purchase_id}_${Date.now()}.${imageFile.mimetype.split("/")[1]}`;
            const savePath = path.join("./uploads/images", imageName);
            fs.writeFileSync(savePath, imageFile.buffer);
            imagePath = `/uploads/images/${imageName}`;
        }
        const formattedDate = moment(date, ['D/M/YYYY', 'M/D/YYYY']).format('YYYY-MM-DD');
        const insertQuery = `
            INSERT INTO purchase (pc_Id, s_ID, rDate, total, pay, balance, deliveryCharge, invoiceId)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(insertQuery, [purchase_id, supplier_id, formattedDate, total, 0, total, deliveryPrice, invoice]);

        const stockCount = items.length;
        const stockDetails = [];

        for (let i = 0; i < stockCount; i++) {
            const { I_Id, unit_price, quantity,material,price } = items[i];
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

            stockDetails.push({ I_Id, quantity ,material,price});
        }

        const insertBarcodeQuery = `
            INSERT INTO p_i_detail (pc_Id, I_Id, stock_Id, barcode_img, status, orID, datetime,material,price)
            VALUES (?, ?, ?, ?, ?, ?, ?,?,?)`;

        const barcodeFolderPath = path.join("./uploads/barcodes");
        if (!fs.existsSync(barcodeFolderPath)) {
            fs.mkdirSync(barcodeFolderPath, { recursive: true });
        }

        const stockRanges = [];

        for (let i = 0; i < stockCount; i++) {
            const { I_Id, quantity,material,price } = stockDetails[i];

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

                const pngBuffer = await bwipjs.toBuffer({bcid: "code128", text: barcodeData, scale: 3, height: 10, includetext: true, textxalign: "center",});

                fs.writeFileSync(barcodeImagePath, pngBuffer);

                await db.query(insertBarcodeQuery, [purchase_id, I_Id, lastStockId, barcodeImagePath, "Available", null,  mysql.raw('NOW()'),material,price]);

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

        // Ensure date is valid
        const parsedDate = parseDate(date);
        if (!parsedDate) {
            return res.status(400).json({ success: false, message: "Invalid date format. Use DD/MM/YYYY or YYYY-MM-DD." });
        }

        // Fetch completed orders with delivery, sales team and customer info
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

        const orderDetails = await Promise.all(orders.map(async (order) => {
            // 🔥 Fetch items with tprice and discount now
            const itemsQuery = `
                SELECT 
                    od.I_Id, i.I_name, i.color, od.qty, od.tprice, od.discount AS itemDiscount,
                    i.price AS unitPrice, i.bookedQty, i.availableQty
                FROM Order_Detail od
                JOIN Item i ON od.I_Id = i.I_Id
                WHERE od.orID = ?
            `;

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
                    price: item.tprice, // total price after discount
                    unitPrice: item.unitPrice, // original unit price
                    discount: item.itemDiscount || 0, // 🔥 added item discount
                    bookedQuantity: item.bookedQty,
                    availableQuantity: item.availableQty,
                })),
                salesTeam: {
                    stID: order.stID,
                    employeeName: order.salesEmployeeName,
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
            return res.status(200).json({ success: false, message: "No coupon details found" ,data:[],});
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
    const { orID, selectedItems, Oid } = req.body;

    if (!orID || !selectedItems || selectedItems.length === 0 || !Oid) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        for (const item of selectedItems) {
            // ✅ Update p_i_detail status to 'Reserved' and set orID
            await db.query(
                `UPDATE p_i_detail
                 SET status = 'Reserved', orID = ?, datetime = NOW()
                 WHERE pid_Id = ?`,
                [orID, item.pid_Id]
            );

            // ✅ Update Item stock: bookedQty -1, reservedQty +1
            await db.query(
                `UPDATE Item
                 SET bookedQty = bookedQty - 1,
                     reservedQty = reservedQty + 1
                 WHERE I_Id = ?`,
                [item.I_Id]
            );

            // ✅ Insert into Special_Reservation with orID, pid_Id, and OrderDetailId (Oid)
            await db.query(
                `INSERT INTO Special_Reservation (orID, pid_Id, orderDetailId)
                 VALUES (?, ?, ?)`,
                [orID, item.pid_Id, Oid]
            );

            // ✅ Update Order_Detail status to 'Reserved'
            await db.query(
                `UPDATE Order_Detail
                 SET status = 'Reserved'
                 WHERE id = ?`,
                [Oid]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Items reserved and Special_Reservation updated successfully"
        });

    } catch (error) {
        console.error("Error updating reservation:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// GET reserved items for an order
router.post("/get-special-reserved", async (req, res) => {
    try {
        const { orID, itemIds } = req.body;

        if (!orID || !Array.isArray(itemIds) || itemIds.length === 0) {
            return res.status(400).json({ error: "Invalid request. Provide orID and itemIds array." });
        }

        // Construct placeholders for itemIds
        const placeholders = itemIds.map(() => '?').join(', ');

        const sql = `
            SELECT 
                sr.srID,sr.orID, sr.pid_Id,sr.orderDetailId, p.*
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

router.get("/special-reserved-details", async (req, res) => {
    const { orID } = req.query;

    if (!orID) {
        return res.status(400).json({ success: false, message: "Order ID (orID) is required" });
    }

    try {
        const query = `
            SELECT 
                sr.srID,
                sr.orID,
                sr.orderDetailId,
                sr.pid_Id,
                pid.I_Id,
                pid.status AS pi_status,
                pid.datetime,
                i.I_name,
                i.color,
                i.price
            FROM Special_Reservation sr
            JOIN p_i_detail pid ON sr.pid_Id = pid.pid_Id
            LEFT JOIN Item i ON pid.I_Id = i.I_Id
            WHERE sr.orID = ?
        `;

        const [results] = await db.query(query, [orID]);

        if (results.length === 0) {
            return res.status(404).json({ success: false, message: "No special reserved items found for this order." });
        }

        return res.status(200).json({
            success: true,
            message: "Special reserved items fetched successfully",
            data: results
        });

    } catch (error) {
        console.error("Error fetching special reserved items:", error);
        return res.status(500).json({ success: false, message: "Server error", error: error.message });
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
                `UPDATE issued_items SET status = 'Issued', date = NOW() WHERE orID = ? AND pid_Id = ?`,
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
    const { orID, payStatus, selectedItems, deliveryStatus } = req.body;

    if (!orID || !payStatus || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // 1. Update Orders table only if it's a Delivery
        if (deliveryStatus === "Delivery") {
            await db.query(
                `UPDATE Orders SET orStatus = 'Delivered', payStatus = ? WHERE OrID = ?`,
                [payStatus, orID]
            );
        } else {
            await db.query(
                `UPDATE Orders SET payStatus = ? WHERE OrID = ?`,
                [payStatus, orID]
            );
        }

        // 2. Update p_i_detail and issued_items
        const itemStatus = deliveryStatus === "Delivery" ? "Dispatched" : "Issued";

        for (const item of selectedItems) {
            await db.query(
                `UPDATE p_i_detail
                 SET status = ?, orID = ?, datetime = NOW(), price = ?
                 WHERE pid_Id = ?`,
                [itemStatus, orID, item.price, item.pid_Id]
            );

            await db.query(
                `INSERT INTO issued_items (orID, pid_Id, status, date)
                 VALUES (?, ?, ?, NOW())`,
                [orID, item.pid_Id, itemStatus]
            );
        }

        if (!deliveryStatus === "Delivery") {
             // 3. Update Item stock quantities
            const [orderItems] = await db.query(
                `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
                [orID]
            );
    
            for (const item of orderItems) {
                console.log(item);
                await db.query(
                    `UPDATE Item
                     SET bookedQty = bookedQty - ?, dispatchedQty = dispatchedQty + ?
                     WHERE I_Id = ?`,
                    [item.qty, item.qty, item.I_Id]
                );
            }
    
            // 4. Cleanup
            await db.query(`DELETE FROM booked_item WHERE orID = ?`, [orID]);
            await db.query(`DELETE FROM accept_orders WHERE orID = ?`, [orID]);

            // Step 2: Update ST_order_review
            const totalIssued = selectedItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

            // Assuming orID is linked to a sales team ID (you may adjust where to fetch stID from)
            const [[{ stID }]] = await db.query(`SELECT stID FROM Orders WHERE OrID = ?`, [orID]);

            // 🧮 Extract year and month from deliveryDate (or current date if missing)
            const dateObj = new Date();
            const year = dateObj.getFullYear();
            const month = dateObj.toLocaleString('default', { month: 'long' }); // e.g., 'May'


            // Check if record exists
            const [[existingReview]] = await db.query(
                `SELECT totalIssued FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?`,
                [stID, year, month]
            );

            if (existingReview) {
                // Update totalIssued
                await db.query(
                    `UPDATE ST_order_review
                    SET totalIssued = totalIssued + ?
                    WHERE stID = ? AND year = ? AND month = ?`,
                    [totalIssued, stID, year, month]
                );
            } else {
                // Insert new row
                await db.query(
                    `INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued)
                    VALUES (?, ?, ?, 0, ?)`,
                    [stID, year, month, totalIssued]
                );
            }
    
        }
        return res.status(200).json({
            success: true,
            message: `Order processed as ${itemStatus}`,
        });

    } catch (error) {
        console.error("Error updating order:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Issued item in now order
router.post("/issued-items-Now", async (req, res) => {
    const { orID, payStatus, selectedItems, deliveryStatus } = req.body;

    if (!orID || !payStatus || !selectedItems || selectedItems.length === 0) {
        return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    try {
        // 1. Update Orders table only if it's a Delivery
        if (deliveryStatus === "Delivery") {
            await db.query(
                `UPDATE Orders SET orStatus = 'Delivered', payStatus = ? WHERE OrID = ?`,
                [payStatus, orID]
            );
        } else {
            await db.query(
                `UPDATE Orders SET payStatus = ? WHERE OrID = ?`,
                [payStatus, orID]
            );
        }

        // 2. Update p_i_detail and issued_items
        const itemStatus = deliveryStatus === "Delivery" ? "Dispatched" : "Issued";

        for (const item of selectedItems) {
            await db.query(
                `UPDATE p_i_detail
                 SET status = ?, orID = ?, datetime = NOW(), price = ?
                 WHERE pid_Id = ?`,
                [itemStatus, orID, item.price, item.pid_Id]
            );

            await db.query(
                `INSERT INTO issued_items (orID, pid_Id, status, date)
                 VALUES (?, ?, ?, NOW())`,
                [orID, item.pid_Id, itemStatus]
            );
        }

        if (deliveryStatus === "Delivery") {
             // 3. Update Item stock quantities
            const [orderItems] = await db.query(
                `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
                [orID]
            );
    
            for (const item of orderItems) {
                console.log(item);
                await db.query(
                    `UPDATE Item
                     SET availableQty = availableQty - ?, dispatchedQty = dispatchedQty + ?
                     WHERE I_Id = ?`,
                    [item.qty, item.qty, item.I_Id]
                );
            }
    
            // 4. Cleanup
            await db.query(`DELETE FROM booked_item WHERE orID = ?`, [orID]);
            await db.query(`DELETE FROM accept_orders WHERE orID = ?`, [orID]);
    
        }

        if (deliveryStatus !== "Delivery") {
        // Step 1: Update stock quantities
        const [orderItems] = await db.query(
            `SELECT I_Id, qty FROM Order_Detail WHERE orID = ?`,
            [orID]
        );

        for (const item of orderItems) {
            await db.query(
                `UPDATE Item
                SET availableQty = availableQty - ?, stockQty = stockQty - ?
                WHERE I_Id = ?`,
                [item.qty, item.qty, item.I_Id]
            );
        }

        // Step 2: Update ST_order_review
        const totalIssued = selectedItems.reduce((sum, item) => sum + parseFloat(item.price || 0), 0);

        // Assuming orID is linked to a sales team ID (you may adjust where to fetch stID from)
        const [[{ stID }]] = await db.query(`SELECT stID FROM Orders WHERE OrID = ?`, [orID]);

        // 🧮 Extract year and month from deliveryDate (or current date if missing)
        const dateObj = new Date();
        const year = dateObj.getFullYear();
        const month = dateObj.toLocaleString('default', { month: 'long' }); // e.g., 'May'


        // Check if record exists
        const [[existingReview]] = await db.query(
            `SELECT totalIssued FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?`,
            [stID, year, month]
        );

        if (existingReview) {
            // Update totalIssued
            await db.query(
                `UPDATE ST_order_review
                SET totalIssued = totalIssued + ?
                WHERE stID = ? AND year = ? AND month = ?`,
                [totalIssued, stID, year, month]
            );
        } else {
            // Insert new row
            await db.query(
                `INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued)
                VALUES (?, ?, ?, 0, ?)`,
                [stID, year, month, totalIssued]
            );
        }
    }

        return res.status(200).json({
            success: true,
            message: `Order processed as ${itemStatus}`,
        });

    } catch (error) {
        console.error("Error updating order:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
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
router.post("/employees", upload.single("lincenseimg"), async (req, res) => {
    try {
        const {
            name, address, nic, dob, contact, job, basic,
            type, orderTarget, issuedTarget, lincenseDate,monthlyTarget,dailyTarget
        } = req.body;

        const lincenseimg = req.file ? req.file.buffer : null;

        if (!name || !address || !nic || !dob || !contact || !job || !basic) {
            return res.status(400).json({
                success: false,
                message: "All fields are required except targets/license (Sales or Driver)."
            });
        }

        const E_Id = await generateNewId("Employee", "E_Id", "E");

        const sql = `INSERT INTO Employee (E_Id, name, address, nic, dob, contact, job, basic, type)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        await db.query(sql, [E_Id, name, address, nic, dob, contact, job, basic, type]);

        let Data = null;

        if (job === "Sales" && orderTarget && issuedTarget) {
            const stID = await generateNewId("sales_team", "stID", "ST");
            const sqlSales = `INSERT INTO sales_team (stID, E_Id, orderTarget, issuedTarget, totalOrder, totalIssued)
                              VALUES (?, ?, ?, ?, '0', '0')`;
            await db.query(sqlSales, [stID, E_Id, orderTarget, issuedTarget]);
            Data = { stID, orderTarget, issuedTarget };
        }

        if (job === "Driver") {
            const devID = await generateNewId("driver", "devID", "DI");

            const sqlDriver = `INSERT INTO driver (devID, E_ID, balance, lincenseDate, lincense,dailyTarget,monthlyTarget)
                               VALUES (?, ?, '0', ?, ?)`;
            await db.query(sqlDriver, [devID, E_Id, lincenseDate, lincenseimg,dailyTarget,monthlyTarget]);

            Data = { devID, E_Id };
        }

        return res.status(201).json({
            success: true,
            message: "Employee added successfully",
            data: { E_Id, ...Data },
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

// Save Delivery Notes with mulitiple orders
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

// Save delivery note with one order
router.post("/create-delivery-note-now", async (req, res) => {
    try {
        const {driverName, driverId, vehicleName, hire, date, district, order, balanceToCollect} = req.body;

        // Validate required fields
        if (!driverName || !vehicleName || !date || !hire || !order || !order.orderId) {
            return res.status(400).json({
                message: "Driver name, vehicle name, hire, date, and a valid order are required."
            });
        }

        const { orderId, balance = 0 } = order;

        // Insert into delivery_note table
        const [result] = await db.query(`
            INSERT INTO delivery_note (driverName, devID, vehicalName, date, hire, district, balanceToCollect, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'Incomplete')
        `, [driverName, driverId, vehicleName, date, hire, district, balanceToCollect]);

        const delNoID = result.insertId;

        // Insert the single order into delivery_note_orders
        await db.query(`
            INSERT INTO delivery_note_orders (delNoID, orID, balance)
            VALUES (?, ?, ?)
        `, [delNoID, orderId, balance]);

        // Update delivery status for the order
        await db.query(`
            UPDATE delivery
            SET status = 'Delivered', delivery_Date = ?
            WHERE orID = ?
        `, [date, orderId]);

        return res.status(201).json({
            message: "Delivery note created successfully",
            delNoID
        });

    } catch (error) {
        console.error("Error creating delivery note:", error);
        return res.status(500).json({
            message: "Error creating delivery note",
            details: error.message
        });
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

// Save shop banks
router.post('/shop-banks', async (req, res) => {
    const { bank, branch } = req.body;

    if (!bank || !branch) {
        return res.status(400).json({ error: 'Bank and branch are required' });
    }

    try {
        const [result] = await db.query(
            'INSERT INTO shop_Banks (Bank, branch) VALUES (?, ?)',
            [bank, branch]
        );
        res.status(201).json({ message: 'Bank added successfully', sbID: result.insertId });
    } catch (error) {
        console.error('Error inserting shop_Banks:', error);
        res.status(500).json({ error: 'Failed to add bank' });
    }
});

// save Account numbers 
router.post('/account-numbers', async (req, res) => {
    const { sbID, number } = req.body;

    if (!sbID || !number) {
        return res.status(400).json({ error: 'sbID and account number are required' });
    }

    try {
        const [bankExists] = await db.query('SELECT sbID FROM shop_Banks WHERE sbID = ?', [sbID]);
        if (bankExists.length === 0) {
            return res.status(404).json({ error: 'Bank not found' });
        }

        const [result] = await db.query(
            'INSERT INTO accountNumbers (sbID, number) VALUES (?, ?)',
            [sbID, number]
        );
        res.status(201).json({ message: 'Account number added successfully', acnID: result.insertId });
    } catch (error) {
        console.error('Error inserting accountNumbers:', error);
        res.status(500).json({ error: 'Failed to add account number' });
    }
});

// Get all banks 
router.get('/shop-banks', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM shop_Banks');
        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching shop_Banks:', error);
        res.status(500).json({ error: 'Failed to fetch banks' });
    }
});

// Get All account by sbid 
router.post('/account-numbers/by-id', async (req, res) => {
    const { sbID } = req.body;

    try {
        const [rows] = await db.query(
            'SELECT * FROM accountNumbers WHERE sbID = ?',
            [sbID]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('Error fetching account numbers:', error);
        res.status(500).json({ error: 'Failed to fetch account numbers' });
    }
});

//Get All Account Numbers Grouped by sbID
router.get('/account-numbers/grouped', async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                shop_Banks.sbID,
                shop_Banks.Bank,
                shop_Banks.branch,
                accountNumbers.acnID,
                accountNumbers.number
            FROM 
                shop_Banks
            LEFT JOIN 
                accountNumbers ON shop_Banks.sbID = accountNumbers.sbID
            ORDER BY shop_Banks.sbID
        `);

        const grouped = {};

        for (const row of rows) {
            if (!grouped[row.sbID]) {
                grouped[row.sbID] = {
                    sbID: row.sbID,
                    Bank: row.Bank,
                    branch: row.branch,
                    accountNumbers: []
                };
            }

            if (row.acnID) {
                grouped[row.sbID].accountNumbers.push({
                    acnID: row.acnID,
                    number: row.number
                });
            }
        }

        const result = Object.values(grouped);
        res.status(200).json(result);

    } catch (error) {
        console.error('Error fetching grouped account numbers:', error);
        res.status(500).json({ error: 'Failed to fetch grouped account numbers' });
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

// POST: Create a new request
router.post('/request', async (req, res) => {
    const { E_Id, reason, status } = req.body;

    // ✅ Validation
    if (!E_Id || !reason || !status) {
        return res.status(400).json({
            success: false,
            message: 'All fields (E_Id, reason, status) are required.'
        });
    }

    try {
        const sql = `
            INSERT INTO Request (E_Id, reason, status)
            VALUES (?, ?, ?)
        `;

        const [result] = await db.query(sql, [E_Id, reason, status]);

        res.status(201).json({
            success: true,
            message: 'Request submitted successfully.',
            data: { id: result.insertId, E_Id, reason, status }
        });
    } catch (error) {
        console.error('Error inserting request:', error.message);
        res.status(500).json({
            success: false,
            message: 'Internal server error.',
            error: error.message
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
    const { customReason, deliveryStatus, driver, driverId, deliveryDate, orderId, orderStatus, paymentDetails, reason, rescheduledDate, issuedItems, returnedItems, cancelledItems } = req.body;
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

        const { orID, c_ID, balance, advance, total, netTotal, discount, delPrice, stID } = Orderpayment[0];
        let NetTotal1 = Math.max(0, Number(netTotal) || 0);
        let totalAmount = Math.max(0, Number(total) || 0);
        let discountAmount = Number(discount) || 0;
        let deliveryCharge = Number(delPrice) || 0;
        let previousAdvance = Number(advance) || 0;

        // Fetch delivery
        const [deliveryData] = await db.query("SELECT dv_id FROM delivery WHERE orID = ?", [orderId]);
        const dv_id = deliveryData?.[0]?.dv_id || null;

        // Fetch customer and driver balance
        const [customerData] = await db.query("SELECT balance FROM Customer WHERE c_ID = ?", [c_ID]);
        let customerBalance = Number(customerData?.[0]?.balance || 0) + CustBalance;

        const [driverData] = await db.query("SELECT balance FROM Driver WHERE devID = ?", [driverId]);
        let driverNewBalance = Number(driverData?.[0]?.balance || 0) + DrivBalance;

        // Calculate new advance and balance
        let advance1 = previousAdvance + receivedPayment;
        let balance1 = Math.max(0, totalAmount - advance1);

        /** ------------------- Process Returned Items --------------------- */
        if (returnedItems && Array.isArray(returnedItems)) {
            for (const item of returnedItems) {
                if (!item.itemId || !item.stockId) continue;

                await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?", [item.status, item.itemId, item.stockId]);

                const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?", [item.itemId, item.stockId]);
                const srdId = srdData?.[0]?.pid_Id || null;

                if (srdId !== null) {
                    await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?", [item.status, srdId, orderId]);
                }

                if (item.status === "Available") {
                    await db.query("UPDATE Item SET dispatchedQty = dispatchedQty - 1, availableQty = availableQty + 1 WHERE I_Id = ?", [item.itemId]);
                } else if (item.status === "Reserved") {
                    if (srdId !== null) {
                        await db.query("INSERT INTO Special_Reservation (orID, pid_Id) VALUES (?, ?)", [orderId, srdId]);
                    }
                    await db.query("UPDATE Item SET reservedQty = reservedQty + 1, dispatchedQty = dispatchedQty - 1 WHERE I_Id = ?", [item.itemId]);
                } else if (item.status === "Damaged") {
                    await db.query("UPDATE Item SET dispatchedQty = dispatchedQty - 1, damageQty = damageQty + 1 WHERE I_Id = ?", [item.itemId]);
                }
            }
        }

        /** ------------------- Process Cancelled Items --------------------- */
        if (cancelledItems && Array.isArray(cancelledItems)) {
            for (const item of cancelledItems) {
                if (!item.itemId || !item.stockId) continue;

                await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?", [item.status, item.itemId, item.stockId]);

                const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?", [item.itemId, item.stockId]);
                const srdId = srdData?.[0]?.pid_Id || null;

                if (srdId !== null) {
                    await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?", [item.status, srdId, orderId]);
                }

                if (item.status === "Available") {
                    await db.query("UPDATE Item SET dispatchedQty = dispatchedQty - 1, availableQty = availableQty + 1 WHERE I_Id = ?", [item.itemId]);
                } else if (item.status === "Damaged") {
                    await db.query("UPDATE Item SET dispatchedQty = dispatchedQty - 1, damageQty = damageQty + 1 WHERE I_Id = ?", [item.itemId]);
                }
            }
        }

        /** ------------------- Process Issued Items --------------------- */
        if (issuedItems && Array.isArray(issuedItems)) {
            for (const item of issuedItems) {
                if (!item.I_Id || !item.stock_Id) continue;

                const [itemData] = await db.query("SELECT status FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?", [item.I_Id, item.stock_Id]);
                const currentStatus = itemData?.[0]?.status || "";

                if (currentStatus === "Dispatched") {  // Only update if still Dispatched
                    await db.query("UPDATE p_i_detail SET status = ? WHERE I_Id = ? AND stock_Id = ?", ["Issued", item.I_Id, item.stock_Id]);
                    await db.query("UPDATE Item SET dispatchedQty = dispatchedQty - 1, stockQty = stockQty - 1 WHERE I_Id = ?", [item.itemId]);
                    const [srdData] = await db.query("SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?", [item.I_Id, item.stock_Id]);
                    const srdId = srdData?.[0]?.pid_Id || null;

                    if (srdId !== null) {
                        await db.query("UPDATE issued_items SET status = ? WHERE pid_Id = ? AND orID = ?", ["Issued", srdId, orderId]);
                    }
                }
            }
        }

        /** ------------------- Update Order and Balances --------------------- */
        NetTotal1 = Math.max(0, NetTotal1);
        const payStatus = (balance1 === 0) ? "Settled" : "N-Settled";
        let newTotal = Math.max(0, (NetTotal1 - discountAmount) + deliveryCharge);
        let reducePrice = newTotal - totalAmount;
        customerBalance += (NetTotal1 === 0 ? receivedPayment : reducePrice);

        const op_ID = await generateNewId("order_payment", "op_ID", "OP");

        await db.query("UPDATE Customer SET balance = ? WHERE c_ID = ?", [customerBalance, c_ID]);
        await db.query("UPDATE Driver SET balance = ? WHERE devID = ?", [driverNewBalance, driverId]);

        if (orderStatus === "Delivered") {
            await db.query("UPDATE Orders SET balance = ?, advance = ?, orStatus = ?, total = ?, netTotal = ?, delStatus = ?, payStatus = ? WHERE OrID = ?",
                [balance1, advance1, "Issued", newTotal, NetTotal1, deliveryStatus, payStatus, orderId]);
        } else {
            await db.query("UPDATE Orders SET balance = ?, advance = ?, orStatus = ?, total = ?, netTotal = ?, delStatus = ?, payStatus = ? WHERE OrID = ?",
                [balance1, advance1, orderStatus, newTotal, NetTotal1, deliveryStatus, payStatus, orderId]);
        }

        if (dv_id) {
            await db.query("UPDATE delivery SET delivery_Date = ?, status = ?, driverBalance = ?, devID = ? WHERE dv_id = ?",
                [deliveryDate, deliveryStatus, DrivBalance, driverId, dv_id]);
        }

        await db.query("UPDATE delivery_note_orders SET balance = ? WHERE orID = ?", [balance1, orderId]);

        if (receivedPayment !== 0) {
            const netValue = (advance1 - deliveryCharge) - Loss;

            if (orderStatus === "Delivered") {
                await db.query(
                    "INSERT INTO order_payment (op_ID, orID, amount, dateTime, or_status, netTotal, stID) VALUES (?, ?, ?, NOW(), ?, ?, ?)",
                    [op_ID, orderId, receivedPayment, "Issued", netValue, stID]
                );
                await db.query(
                    "UPDATE order_payment SET or_status = ? WHERE orID = ?",
                    ["Issued", orderId]
                );
            } else {
                await db.query(
                    "INSERT INTO order_payment (op_ID, orID, amount, dateTime, or_status, netTotal, stID) VALUES (?, ?, ?, NOW(), ?, ?, ?)",
                    [op_ID, orderId, receivedPayment, orderStatus, netValue, stID]
                );
            }

            await db.query(
                "INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)",
                ["Order payment", op_ID, "order", receivedPayment]
            );
        }


        if (orderStatus === "Delivered") {
            await db.query("UPDATE sales_team SET totalIssued = totalIssued + ? WHERE stID = ?", [advance1 - deliveryCharge, stID]);

            // 🧮 Extract year and month from deliveryDate (or current date if missing)
            const dateObj = deliveryDate ? new Date(deliveryDate) : new Date();
            const year = dateObj.getFullYear();
            const month = dateObj.toLocaleString('default', { month: 'long' }); // e.g., 'May'

            const netValue = (advance1 - deliveryCharge) - Loss;

            // 📌 Check if ST_order_review row exists
            const [reviewRows] = await db.query(
                "SELECT * FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?",
                [stID, year, month]
            );

            if (reviewRows.length > 0) {
                // ✅ Update existing totalIssued
                await db.query(
                    "UPDATE ST_order_review SET totalIssued = totalIssued + ? WHERE stID = ? AND year = ? AND month = ?",
                    [netValue, stID, year, month]
                );
            } else {
                // 🆕 Insert new row
                await db.query(
                    "INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued) VALUES (?, ?, ?, 0, ?)",
                    [stID, year, month, netValue]
                );
            }
        }

        if (Loss !== 0) {
            const op_ID1 = await generateNewId("order_payment", "op_ID", "OP");
            await db.query("INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount) VALUES (?, ?, ?, NOW(), ?)", ["Ignore Balance", op_ID1, "Loss", -Loss]);
        }

        if (orderStatus === "Returned" || orderStatus === "Cancelled") {
            const reasonTable = orderStatus === "Returned" ? "return_orders" : "canceled_orders";
            await db.query(`INSERT INTO ${reasonTable} (orID, detail) VALUES (?, ?)`, [orID, reason]);
        }

        if (rescheduledDate !== null) {
            await db.query("UPDATE Orders SET expectedDate = ? WHERE orID = ?", [rescheduledDate, orderId]);
            await db.query("UPDATE delivery SET schedule_Date = ? WHERE orID = ?", [rescheduledDate, orderId]);
        }

        res.json({ success: true, message: "Payment processed successfully.", paymentStatus: payStatus });

    } catch (error) {
        console.error("Error processing delivery payment:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});
router.post("/delivery-update", async (req, res) => {
    const {
        deliveryStatus,
        driverId,
        deliveryDate,
        orderId,
        orderStatus,
        issuedItems,
        rescheduledDate
    } = req.body;

    try {
        // Fetch order and required details
        const [orderResult] = await db.query(
            "SELECT OrID, stID, netTotal FROM Orders WHERE OrID = ?",
            [orderId]
        );

        if (!orderResult.length) {
            return res.status(404).json({ error: "Order not found." });
        }

        const { OrID, stID, netTotal } = orderResult[0];
        const orderNetTotal = Number(netTotal) || 0;

        // Fetch delivery ID
        const [deliveryData] = await db.query(
            "SELECT dv_id FROM delivery WHERE orID = ?",
            [orderId]
        );
        const dv_id = deliveryData?.[0]?.dv_id || null;

        /** ------------------- Process Issued Items --------------------- */
        if (issuedItems && Array.isArray(issuedItems)) {
            for (const item of issuedItems) {
                if (!item.I_Id || !item.stock_Id) continue;

                const [itemData] = await db.query(
                    "SELECT status FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?",
                    [item.I_Id, item.stock_Id]
                );
                const currentStatus = itemData?.[0]?.status || "";

                if (currentStatus === "Dispatched") {
                    await db.query(
                        "UPDATE p_i_detail SET status = 'Issued' WHERE I_Id = ? AND stock_Id = ?",
                        [item.I_Id, item.stock_Id]
                    );
                    await db.query(
                        "UPDATE Item SET dispatchedQty = dispatchedQty - 1, stockQty = stockQty - 1 WHERE I_Id = ?",
                        [item.itemId]
                    );

                    const [srdData] = await db.query(
                        "SELECT pid_Id FROM p_i_detail WHERE I_Id = ? AND stock_Id = ?",
                        [item.I_Id, item.stock_Id]
                    );
                    const srdId = srdData?.[0]?.pid_Id || null;

                    if (srdId !== null) {
                        await db.query(
                            "UPDATE issued_items SET status = 'Issued' WHERE pid_Id = ? AND orID = ?",
                            [srdId, orderId]
                        );
                    }
                }
            }
        }

        /** ------------------- Update Order Status --------------------- */
        const newOrderStatus = (orderStatus === "Delivered") ? "Issued" : orderStatus;

        await db.query(
            "UPDATE Orders SET orStatus = ?, delStatus = ? WHERE OrID = ?",
            [newOrderStatus, deliveryStatus, orderId]
        );

        if (dv_id) {
            await db.query(
                "UPDATE delivery SET delivery_Date = ?, status = ?, devID = ? WHERE dv_id = ?",
                [deliveryDate, deliveryStatus, driverId, dv_id]
            );
        }

        /** ------------------- Update sales_team (add netTotal) --------------------- */
        if (orderStatus === "Delivered" && stID) {
            await db.query(
                "UPDATE sales_team SET totalIssued = totalIssued + ? WHERE stID = ?",
                [orderNetTotal, stID]
            );

            // 🧮 Extract year and month from deliveryDate (or current date if missing)
            const dateObj = deliveryDate ? new Date(deliveryDate) : new Date();
            const year = dateObj.getFullYear();
            const month = dateObj.toLocaleString('default', { month: 'long' }); // e.g., 'May'

            // 📌 Check if ST_order_review row exists
            const [reviewRows] = await db.query(
                "SELECT * FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?",
                [stID, year, month]
            );

            if (reviewRows.length > 0) {
                // ✅ Update existing totalIssued
                await db.query(
                    "UPDATE ST_order_review SET totalIssued = totalIssued + ? WHERE stID = ? AND year = ? AND month = ?",
                    [orderNetTotal, stID, year, month]
                );
            } else {
                // 🆕 Insert new row
                await db.query(
                    "INSERT INTO ST_order_review (stID, year, month, totalOrder, totalIssued) VALUES (?, ?, ?, 0, ?)",
                    [stID, year, month, orderNetTotal]
                );
            }
        }

        /** ------------------- Handle Rescheduling --------------------- */
        if (rescheduledDate !== null) {
            await db.query(
                "UPDATE Orders SET expectedDate = ? WHERE orID = ?",
                [rescheduledDate, orderId]
            );
            await db.query(
                "UPDATE delivery SET schedule_Date = ? WHERE orID = ?",
                [rescheduledDate, orderId]
            );
        }

        /** ------------------- Update order_payment.or_status --------------------- */
        await db.query(
            "UPDATE order_payment SET or_status = ? WHERE orID = ?",
            [orderStatus, orderId]
        );

        res.json({ success: true, message: "Order, delivery, and payment status updated successfully." });

    } catch (error) {
        console.error("Error processing delivery update:", error);
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

// Get E_Id by contact number
router.post('/get-eid-by-contact', async (req, res) => {
    const { contact } = req.body;

    if (!contact) {
        return res.status(400).json({
            success: false,
            message: "Contact number is required.",
        });
    }

    try {
        const [rows] = await db.query(`SELECT E_Id FROM user WHERE contact = ?`, [contact]);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "No user found with this contact number.",
            });
        }

        return res.status(200).json({
            success: true,
            E_Id: rows[0].E_Id,
        });
    } catch (err) {
        console.error("Error fetching E_Id by contact:", err);
        return res.status(500).json({
            success: false,
            message: "Internal server error.",
        });
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

// Get Today sales income
router.get("/today-order-income", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0]; // 86400000 ms = 1 day

        const sql = `
            SELECT
                IFNULL(SUM(CASE WHEN DATE(dateTime) = ? THEN amount END), 0) AS todayIncome,
                IFNULL(SUM(CASE WHEN DATE(dateTime) = ? THEN amount END), 0) AS yesterdayIncome
            FROM cash_balance
            WHERE ref_type = 'order'
        `;

        const [rows] = await db.query(sql, [today, yesterday]);
        const todayIncome = rows[0].todayIncome;
        const yesterdayIncome = rows[0].yesterdayIncome;

        const incomeIncreased = todayIncome > yesterdayIncome ? "yes" : "no";

        return res.status(200).json({
            success: true,
            message: "Today's order income retrieved successfully",
            data: {
                totalIncome: todayIncome,
                incomeIncreased: incomeIncreased,
            },
        });
    } catch (err) {
        console.error("Error fetching today's order income:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while retrieving income",
            error: err.message,
        });
    }
});

// Get Daily in & out order count
router.get("/today-order-counts", async (req, res) => {
    try {
        const today = new Date().toISOString().split("T")[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

        const sql = `
            SELECT 
                -- Today
                (SELECT IFNULL(SUM(CASE WHEN orStatus IN ('Pending', 'Accepted', 'Completed') THEN 1 ELSE 0 END), 0)
                 FROM Orders WHERE orDate = ?) AS todayIn,

                (SELECT IFNULL(SUM(CASE WHEN orStatus IN ('Issued', 'Delivered') THEN 1 ELSE 0 END), 0)
                 FROM Orders WHERE orDate = ?) AS todayOut,

                -- Yesterday
                (SELECT IFNULL(SUM(CASE WHEN orStatus IN ('Pending', 'Accepted', 'Completed') THEN 1 ELSE 0 END), 0)
                 FROM Orders WHERE orDate = ?) AS yesterdayIn,

                (SELECT IFNULL(SUM(CASE WHEN orStatus IN ('Issued', 'Delivered') THEN 1 ELSE 0 END), 0)
                 FROM Orders WHERE orDate = ?) AS yesterdayOut
        `;

        const [rows] = await db.query(sql, [today, today, yesterday, yesterday]);
        const {
            todayIn,
            todayOut,
            yesterdayIn,
            yesterdayOut
        } = rows[0];

        return res.status(200).json({
            success: true,
            message: "Today's IN/OUT order counts compared with yesterday",
            data: {
                inOrders: todayIn,
                outOrders: todayOut,
                inOrdersIncreased: todayIn > yesterdayIn ? "yes" : "no",
                outOrdersIncreased: todayOut > yesterdayOut ? "yes" : "no"
            }
        });
    } catch (err) {
        console.error("Error comparing today's order counts:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while retrieving order comparison",
            error: err.message
        });
    }
});

router.get("/order-summary", async (req, res) => {
    try {
        const today = moment().format("YYYY-MM-DD");
        const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");

        const startOfThisMonth = moment().startOf("month").format("YYYY-MM-DD");
        const startOfLastMonth = moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        const endOfLastMonth = moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");

        const sql = `
            SELECT
                -- TODAY
                (SELECT COUNT(*) FROM Orders WHERE orDate = ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS todayInCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate = ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS todayInTotal,
                (SELECT COUNT(*) FROM Orders WHERE orDate = ? AND orStatus IN ('Issued', 'Delivered')) AS todayOutCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate = ? AND orStatus IN ('Issued', 'Delivered')) AS todayOutTotal,

                -- YESTERDAY
                (SELECT COUNT(*) FROM Orders WHERE orDate = ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS yesterdayInCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate = ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS yesterdayInTotal,
                (SELECT COUNT(*) FROM Orders WHERE orDate = ? AND orStatus IN ('Issued', 'Delivered')) AS yesterdayOutCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate = ? AND orStatus IN ('Issued', 'Delivered')) AS yesterdayOutTotal,

                -- THIS MONTH
                (SELECT COUNT(*) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS thisMonthInCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS thisMonthInTotal,
                (SELECT COUNT(*) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Issued', 'Delivered')) AS thisMonthOutCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Issued', 'Delivered')) AS thisMonthOutTotal,

                -- LAST MONTH
                (SELECT COUNT(*) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS lastMonthInCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Pending', 'Accepted', 'Completed')) AS lastMonthInTotal,
                (SELECT COUNT(*) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Issued', 'Delivered')) AS lastMonthOutCount,
                (SELECT IFNULL(SUM(netTotal), 0) FROM Orders WHERE orDate BETWEEN ? AND ? AND orStatus IN ('Issued', 'Delivered')) AS lastMonthOutTotal
        `;

        const params = [
            today, today, today, today,
            yesterday, yesterday, yesterday, yesterday,
            startOfThisMonth, today, startOfThisMonth, today,
            startOfThisMonth, today, startOfThisMonth, today,
            startOfLastMonth, endOfLastMonth, startOfLastMonth, endOfLastMonth,
            startOfLastMonth, endOfLastMonth, startOfLastMonth, endOfLastMonth
        ];

        const [rows] = await db.query(sql, params);
        const r = rows[0];

        return res.status(200).json({
            success: true,
            message: "Today's and this month's order summary with comparisons",
            today: {
                in: { count: r.todayInCount, total: r.todayInTotal },
                out: { count: r.todayOutCount, total: r.todayOutTotal },
                compare: {
                    inIncreased: r.todayInCount > r.yesterdayInCount ? "yes" : "no",
                    outIncreased: r.todayOutCount > r.yesterdayOutCount ? "yes" : "no"
                }
            },
            thisMonth: {
                in: { count: r.thisMonthInCount, total: r.thisMonthInTotal },
                out: { count: r.thisMonthOutCount, total: r.thisMonthOutTotal },
                compare: {
                    inIncreased: r.thisMonthInCount > r.lastMonthInCount ? "yes" : "no",
                    outIncreased: r.thisMonthOutCount > r.lastMonthOutCount ? "yes" : "no"
                }
            }
        });
    } catch (err) {
        console.error("Error fetching order summary:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching summary",
            error: err.message
        });
    }
});

// Get advance and loan amount for a month by employee id
router.get("/advance&loan", async (req, res) => {
    try {
        const { eid } = req.query;

        if (!eid) {
            return res.status(400).json({ success: false, message: "Employee ID (eid) is required" });
        }

        const startOfMonth = moment().startOf("month").format("YYYY-MM-DD HH:mm:ss");
        const endOfMonth = moment().endOf("month").format("YYYY-MM-DD HH:mm:ss");
        const startOfLastMonth = moment().subtract(1, "months").startOf("month").format("YYYY-MM-DD");
        const endOfLastMonth = moment().subtract(1, "months").endOf("month").format("YYYY-MM-DD");

        // Salary Advances (Current Month)
        const [advances] = await db.query(
            "SELECT * FROM salary_advance WHERE E_Id = ? AND dateTime BETWEEN ? AND ?",
            [eid, startOfMonth, endOfMonth]
        );

        // Unpaid Loan Installment from Last Month
        const [lastMonthLoan] = await db.query(
            `SELECT d.*, l.skip, l.E_Id
             FROM sal_loan_detail d
             JOIN salary_loan l ON d.sl_ID = l.sl_ID
             WHERE l.E_Id = ? 
               AND l.status = 'Unfinished'
               AND d.status = 'Unpaid'
               AND d.date BETWEEN ? AND ?
             ORDER BY d.date ASC
             LIMIT 1`,
            [eid, startOfLastMonth, endOfLastMonth]
        );

        // Format Advances
        const advancePayments = advances.map(adv => ({
            ...adv,
            dateTime: moment(adv.dateTime).format("YYYY-MM-DD")
        }));

        // Format Last Month Installment
        const lastMonthUnpaidInstallment = lastMonthLoan.length > 0
            ? {
                id: lastMonthLoan[0].Id,
                date: moment(lastMonthLoan[0].date).format("YYYY-MM-DD"),
                installment: lastMonthLoan[0].installment,
                sl_ID: lastMonthLoan[0].sl_ID,
                skip: lastMonthLoan[0].skip,
                E_Id: lastMonthLoan[0].E_Id
            }
            : null;

        return res.status(200).json({
            success: true,
            advancePayments,
            lastMonthUnpaidInstallment
        });

    } catch (error) {
        console.error("Error fetching salary payments:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get leave count for a month by employee id
router.get("/leave-count", async (req, res) => {
    try {
        const { eid } = req.query;

        if (!eid) {
            return res.status(400).json({ success: false, message: "Employee ID (eid) is required" });
        }

        // Define last month's start and end dates
        const startOfLastMonth = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        const endOfLastMonth = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');

        // Query leave counts grouped by leave_type
        const [leaveCounts] = await db.query(
            `SELECT leave_type, COUNT(*) AS count
             FROM emp_leaves
             WHERE E_Id = ? AND date BETWEEN ? AND ?
             GROUP BY leave_type`,
            [eid, startOfLastMonth, endOfLastMonth]
        );

        let informedCount = 0;
        let uninformedCount = 0;

        leaveCounts.forEach(leave => {
            if (leave.leave_type === "Informed") {
                informedCount = leave.count;
            } else if (leave.leave_type === "Uninformed") {
                uninformedCount = leave.count;
            }
        });

        const totalLeave = informedCount + uninformedCount;
        const deduction = (informedCount * 1000) + (uninformedCount * 2000);

        return res.status(200).json({
            success: true,
            informedLeave: informedCount,
            uninformedLeave: uninformedCount,
            totalLeave,
            attendanceDeduction: deduction
        });

    } catch (error) {
        console.error("Error counting leaves:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Get driver hire summary
router.get("/hire-summary", async (req, res) => {
    try {
        const { eid } = req.query;

        if (!eid) {
            return res.status(400).json({ success: false, message: "Employee ID (eid) is required" });
        }

        const [driverResult] = await db.query("SELECT devID,balance FROM driver WHERE E_ID = ?", [eid]);
        if (!driverResult.length) {
            return res.status(404).json({ success: false, message: "Driver not found for given E_ID" });
        }

        const { devID, balance } = driverResult[0];

        // const startOfLastMonth = moment().subtract(1, 'months').startOf('month').format('YYYY-MM-DD');
        // const endOfLastMonth = moment().subtract(1, 'months').endOf('month').format('YYYY-MM-DD');
        const startOfLastMonth = moment().startOf('month').format('YYYY-MM-DD');
        const endOfLastMonth = moment().endOf('month').format('YYYY-MM-DD');


        const [hireRows] = await db.query(
            `SELECT date, SUM(hire) AS total
             FROM otherHire
             WHERE driverId = ? AND date BETWEEN ? AND ?
             GROUP BY date`,
            [devID, startOfLastMonth, endOfLastMonth]
        );

        const [deliveryRows] = await db.query(
            `SELECT date, SUM(hire) AS total
             FROM delivery_note
             WHERE devID = ? AND date BETWEEN ? AND ?
             GROUP BY date`,
            [devID, startOfLastMonth, endOfLastMonth]
        );

        const [bonusRates] = await db.query(
            `SELECT targetRate, bonus, type FROM delivery_target_bonus`
        );

        let lastMonthHireTotal = 0;
        let lastMonthDeliveryTotal = 0;
        const dailyMap = {};

        hireRows.forEach(row => {
            const day = new Date(row.date).getDate();
            const total = parseFloat(row.total || 0);
            lastMonthHireTotal += total;
            dailyMap[day] = (dailyMap[day] || 0) + total;
        });

        deliveryRows.forEach(row => {
            const day = new Date(row.date).getDate();
            const total = parseFloat(row.total || 0);
            lastMonthDeliveryTotal += total;
            dailyMap[day] = (dailyMap[day] || 0) + total;
        });

        // Daily Summary with bonus
        const dailySummary = Object.entries(dailyMap).map(([day, total]) => {
            const totalNum = parseFloat(total.toFixed(2));
            const dailyBonus = bonusRates
                .filter(rate => rate.type === "Daily" && totalNum >= rate.targetRate)
                .sort((a, b) => b.targetRate - a.targetRate)[0];

            return {
                day: parseInt(day),
                total: totalNum,
                bonus: dailyBonus ? dailyBonus.bonus : 0
            };
        }).sort((a, b) => a.day - b.day);

        const totalMonthlyEarnings = lastMonthHireTotal + lastMonthDeliveryTotal;

        // Monthly bonus
        const monthlyBonus = bonusRates
            .filter(rate => rate.type === "Monthly" && totalMonthlyEarnings >= rate.targetRate)
            .sort((a, b) => b.targetRate - a.targetRate)[0];

        return res.status(200).json({
            success: true,
            devID,balance:parseFloat(balance.toFixed(2)),
            lastMonthHireTotal: parseFloat(lastMonthHireTotal.toFixed(2)),
            lastMonthDeliveryTotal: parseFloat(lastMonthDeliveryTotal.toFixed(2)),
            totalMonthlyEarnings: parseFloat(totalMonthlyEarnings.toFixed(2)),
            monthlyBonus: monthlyBonus ? {
                targetRate: monthlyBonus.targetRate,
                bonus: monthlyBonus.bonus
            } : null,
            dailySummary
        });

    } catch (error) {
        console.error("Error generating hire summary:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get sale-team order payment summary
router.get("/sales-summary", async (req, res) => {
    try {
        const { eid } = req.query;
        if (!eid) {
            return res.status(400).json({ success: false, message: "eid is required" });
        }

        // 1. Get stID and targets from sales_team
        const [teamRows] = await db.query(
            `SELECT stID, orderTarget, issuedTarget FROM sales_team WHERE E_Id = ?`,
            [eid]
        );

        if (teamRows.length === 0) {
            return res.status(404).json({ success: false, message: "Sales team member not found for given eid" });
        }

        const { stID, orderTarget, issuedTarget } = teamRows[0];

        // 2. Get last month year + name
        // const now = moment();
        // const lastMonthYear = now.subtract(1, 'month').year();
        // const lastMonthName = now.format("MMMM");
        const now = moment();
        const lastMonthYear = now.year(); // e.g., 2025
        const lastMonthName = now.format("MMMM"); // e.g., "June"


        // 3. Get order review data
        const [reviewRows] = await db.query(
            `SELECT totalOrder, totalIssued FROM ST_order_review WHERE stID = ? AND year = ? AND month = ?`,
            [stID, lastMonthYear, lastMonthName]
        );

        if (reviewRows.length === 0) {
            return res.status(404).json({ success: false, message: "No order review found for last month" });
        }

        const { totalOrder, totalIssued } = reviewRows[0];

        // 4. Get OrdersIn Target bonus
        let orderBonus = 0;
        if (totalOrder > orderTarget) {
            const [bonusRow] = await db.query(
                `SELECT bonus FROM sale_target WHERE targetType = 'OrdersIn Target' LIMIT 1`
            );
            if (bonusRow.length) {
                orderBonus = bonusRow[0].bonus;
            }
        }

        // 5. Get Issued Target bonus from order_target_bonus
        let issuedBonus = 0;
        const [issuedBonusRows] = await db.query(
            `SELECT bonus FROM order_target_bonus WHERE targetRate <= ? ORDER BY targetRate DESC LIMIT 1`,
            [totalIssued]
        );
        if (issuedBonusRows.length > 0) {
            issuedBonus = issuedBonusRows[0].bonus;
        }

        // 6. Check if this user has highest issued among all STs that month
        const [allIssuedRows] = await db.query(
            `SELECT stID, totalIssued FROM ST_order_review WHERE year = ? AND month = ?`,
            [lastMonthYear, lastMonthName]
        );

        const maxIssued = Math.max(...allIssuedRows.map(row => row.totalIssued));
        let highestBonus = 0;
        if (totalIssued === maxIssued) {
            const [highBonusRows] = await db.query(
                `SELECT bonus FROM sale_target WHERE targetType = 'Highest Target' LIMIT 1`
            );
            if (highBonusRows.length > 0) {
                highestBonus = highBonusRows[0].bonus;
            }
        }

        // Total Bonus
        const totalBonus = parseFloat((orderBonus + issuedBonus + highestBonus).toFixed(2));

        // 7. Final Response
        return res.status(200).json({
            success: true,
            eid,
            stID,
            year: lastMonthYear,
            month: lastMonthName,
            totalOrder: parseFloat(totalOrder.toFixed(2)),
            totalIssued: parseFloat(totalIssued.toFixed(2)),
            orderTarget,
            issuedTarget,
            bonuses: {
                orderBonus,
                issuedBonus,
                highestBonus,
                totalBonus
            }
        });

    } catch (err) {
        console.error("Sales summary error:", err.message);
        return res.status(500).json({ success: false, message: "Server error", error: err.message });
    }
});

//  Get Sales Team Targets
router.get("/sales-team-targets", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT st.stID, st.E_Id, emp.name, st.orderTarget, st.issuedTarget
            FROM sales_team st
            JOIN employee emp ON st.E_Id = emp.E_Id
        `);

        return res.status(200).json({
            success: true,
            salesTeam: results
        });
    } catch (error) {
        console.error("Error fetching sales team targets:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get Driver's Targets
router.get("/drivers-targets", async (req, res) => {
    try {
        const [results] = await db.query(`
            SELECT d.devID, d.E_ID, emp.name, d.dailyTarget, d.monthlyTarget
            FROM driver d
            JOIN Employee emp ON d.E_ID = emp.E_Id
        `);

        return res.status(200).json({
            success: true,
            drivers: results
        });
    } catch (error) {
        console.error("Error fetching driver targets:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Save leave form
router.post("/add-leave", async (req, res) => {
    try {
        const { id, date, type, reason } = req.body;

        if (!id || !date || !type || !reason) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields (id, date, type, reason)"
            });
        }

        // Format the date for SQL DATETIME
        const formattedDate = moment(date).format("YYYY-MM-DD HH:mm:ss");

        // Insert into Emp_leaves
        await db.query(
            "INSERT INTO Emp_leaves (E_Id, date, leave_type,duration_type, reason,status) VALUES (?, ?, 'Uninformed', ?,?,'Applied')",
            [id, formattedDate, type, reason]
        );

        return res.status(200).json({
            success: true,
            message: "Leave successfully recorded"
        });

    } catch (error) {
        console.error("Error adding leave:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get All Applied Leaves
router.get("/applied-leaves", async (req, res) => {
    try {
        const query = `
            SELECT
                el.id, el.E_Id, e.name, el.date, el.leave_type, el.duration_type, el.reason, el.status
            FROM Emp_leaves el
                     JOIN Employee e ON el.E_Id = e.E_Id
            WHERE el.status = 'Applied'
            ORDER BY el.date DESC
        `;

        const [leaves] = await db.query(query);
        const count = leaves.length;

        if (count === 0) {
            return res.status(404).json({
                success: false,
                message: "No applied leaves found",
                count: 0,
                data: []
            });
        }

        return res.status(200).json({
            success: true,
            message: "Applied leaves fetched successfully",
            count,
            data: leaves
        });
    } catch (error) {
        console.error("Error fetching applied leaves:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Get Applied Leaves and Pending Requests
router.get("/applied-leaves-and-requests", async (req, res) => {
    try {
        // Fetch Applied Leaves
        const leavesQuery = `
            SELECT
                el.id, el.E_Id, e.name, el.date, el.leave_type, el.duration_type, el.reason, el.status
            FROM Emp_leaves el
            JOIN Employee e ON el.E_Id = e.E_Id
            WHERE el.status = 'Applied'
            ORDER BY el.date DESC
        `;

        const [appliedLeaves] = await db.query(leavesQuery);

        // Fetch Pending Requests
        const requestsQuery = `
            SELECT
                r.id, r.E_Id, e.name, r.reason, r.status
            FROM Request r
            JOIN Employee e ON r.E_Id = e.E_Id
            WHERE r.status = 'Pending'
            ORDER BY r.id DESC
        `;

        const [pendingRequests] = await db.query(requestsQuery);

        return res.status(200).json({
            success: true,
            message: "Fetched applied leaves and pending requests",
            data: {
                appliedLeaves,
                pendingRequests
            },
            counts: {
                appliedLeaves: appliedLeaves.length,
                pendingRequests: pendingRequests.length
            }
        });

    } catch (error) {
        console.error("Error fetching applied leaves and pending requests:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Approve a leave by ID
router.put("/approve-leave/:id", async (req, res) => {
    try {
        const leaveId = req.params.id;

        const [result] = await db.query(
            "UPDATE Emp_leaves SET leave_type = 'Informed', status = 'Approved' WHERE id = ?",
            [leaveId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Leave not found or already approved",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Leave approved successfully",
        });
    } catch (error) {
        console.error("Error approving leave:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message,
        });
    }
});

// Get This Month's Leaves for an Employee
router.get("/monthly-leaves/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Get first and last day of the current month
        const startOfMonth = moment().startOf('month').format('YYYY-MM-DD');
        const endOfMonth = moment().endOf('month').format('YYYY-MM-DD');

        const query = `
            SELECT id, E_Id, date, leave_type, duration_type, reason, status
            FROM Emp_leaves
            WHERE E_Id = ?
              AND date BETWEEN ? AND ?
            ORDER BY date DESC
        `;

        const [leaves] = await db.query(query, [id, startOfMonth, endOfMonth]);

        res.status(200).json({
            success: true,
            message: "Monthly leaves fetched successfully",
            data: leaves,
            count: leaves.length
        });

    } catch (error) {
        console.error("Error fetching monthly leaves:", error.message);
        res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Save a new order target
router.post("/order-targets", async (req, res) => {
    try {
        const { target, bonus } = req.body;

        if (!target || !bonus) {
            return res.status(400).json({ success: false, message: "Target and bonus are required" });
        }

        await db.query(
            "INSERT INTO order_target_bonus (targetRate, bonus) VALUES (?, ?)",
            [target, bonus]
        );

        return res.status(200).json({ success: true, message: "Target added successfully" });
    } catch (error) {
        console.error("Error saving target:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Save a new sale target
router.post("/sale-targets", async (req, res) => {
    try {
        const { target, bonus } = req.body;

        if (!target || !bonus) {
            return res.status(400).json({ success: false, message: "Target and bonus are required" });
        }

        await db.query(
            "INSERT INTO sale_target (targetType, bonus) VALUES (?, ?)",
            [target, bonus]
        );

        return res.status(200).json({ success: true, message: "Target added successfully" });
    } catch (error) {
        console.error("Error saving target:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Save a new delivery target
router.post("/delivery-target", async (req, res) => {
    try {
        const { target, bonus, type } = req.body;

        if (!target || !bonus || !type) {
            return res.status(400).json({ success: false, message: "Target, bonus, and type are required" });
        }

        await db.query(
            "INSERT INTO delivery_target_bonus (targetRate, bonus, type) VALUES (?, ?, ?)",
            [parseFloat(target), parseFloat(bonus), type]
        );

        return res.status(200).json({ success: true, message: "Delivery target bonus added successfully" });
    } catch (error) {
        console.error("Error saving delivery target bonus:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

//Get all order targets bonus
router.get("/order-targets", async (req, res) => {
    try {
        const [targets] = await db.query("SELECT id, targetRate AS target, bonus FROM order_target_bonus");

        return res.status(200).json({
            success: true,
            targets
        });
    } catch (error) {
        console.error("Error fetching targets:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// GEt all delivery target bonus
router.get("/delivery-targets", async (req, res) => {
    try {
        const [targets] = await db.query(
            "SELECT id, targetRate AS target, bonus, type FROM delivery_target_bonus"
        );

        return res.status(200).json({
            success: true,
            targets
        });
    } catch (error) {
        console.error("Error fetching delivery targets:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: error.message
        });
    }
});

// Update sale team target values
router.put("/update-sales-target", async (req, res) => {
    try {
        const { stID, totalOrder, totalIssued } = req.body;

        if (!stID || totalOrder == null || totalIssued == null) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const [result] = await db.query(
            `UPDATE sales_team
             SET orderTarget = ?, issuedTarget = ?
             WHERE stID = ?`,
            [parseFloat(totalOrder), parseFloat(totalIssued), stID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: "Sales team member not found" });
        }

        return res.status(200).json({ success: true, message: "Sales target updated successfully" });

    } catch (err) {
        console.error("Error updating sales target:", err.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// Update driver target values
router.put("/update-driver-target", async (req, res) => {
    try {
        const { devID, dailyTarget, monthlyTarget } = req.body;

        if (!devID || dailyTarget == null || monthlyTarget == null) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const [result] = await db.query(
            `UPDATE driver
             SET dailyTarget = ?, monthlyTarget = ?
             WHERE devID = ?`,
            [parseFloat(dailyTarget), parseFloat(monthlyTarget), devID]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Driver not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Driver target updated successfully"
        });

    } catch (err) {
        console.error("Error updating driver target:", err.message);
        return res.status(500).json({
            success: false,
            message: "Server error",
            error: err.message
        });
    }
});

// Summing Total salling price of items for each category
router.get("/monthly-issued-material-prices", async (req, res) => {
    try {
        const startOfThisMonth = moment().startOf("month").format("YYYY-MM-DD");
        const endOfThisMonth = moment().endOf("month").format("YYYY-MM-DD");

        const startOfLastMonth = moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        const endOfLastMonth = moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");

        const sql = `
            SELECT
                materialGroup,
                SUM(tprice) AS totalPrice
            FROM (
                SELECT 
                    CASE
                        WHEN material IN ('Teak', 'Mahogani', 'Mara', 'Attoriya', 'Sapu') THEN 'Furniture'
                        ELSE material
                    END AS materialGroup,
                    tprice,
                    o.orDate
                FROM Order_Detail od
                JOIN Orders o ON od.orID = o.orID
                WHERE o.orDate IS NOT NULL
            ) AS sub
            WHERE DATE(orDate) BETWEEN ? AND ?
            GROUP BY materialGroup
        `;

        const [thisMonthRows] = await db.query(sql, [startOfThisMonth, endOfThisMonth]);
        const [lastMonthRows] = await db.query(sql, [startOfLastMonth, endOfLastMonth]);

        const toPriceMap = (rows) =>
            rows.reduce((acc, row) => {
                acc[row.materialGroup] = parseFloat(row.totalPrice || 0);
                return acc;
            }, {});

        const thisMonthMap = toPriceMap(thisMonthRows);
        const lastMonthMap = toPriceMap(lastMonthRows);

        const materials = ['MDF', 'MM', 'Mattress', 'Furniture'];

        const data = materials.map(material => {
            const current = thisMonthMap[material] || 0;
            const previous = lastMonthMap[material] || 0;
            return {
                material,
                totalPrice: current,
                lastMonthTotal: previous,
                increased: current > previous ? "yes" : "no"
            };
        });

        return res.status(200).json({
            success: true,
            message: "Monthly issued material total price comparison",
            data,
            // Optionally keep backward-compatible format:
            MDF: [data.find(d => d.material === 'MDF')],
            MM: [data.find(d => d.material === 'MM')],
            Mattress: [data.find(d => d.material === 'Mattress')],
            Furniture: [data.find(d => d.material === 'Furniture')]
        });
    } catch (err) {
        console.error("Error retrieving material prices:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while retrieving material price comparison",
            error: err.message
        });
    }
});

// Get Monthly Net Total for walking and onsite orders
router.get("/monthly-net-total-summary", async (req, res) => {
    try {
        const startOfThisMonth = moment().startOf("month").format("YYYY-MM-DD");
        const startOfLastMonth = moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        const endOfLastMonth = moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");

        const sql = `
            SELECT
                -- This month net total for walking orders
                (SELECT IFNULL(SUM(netTotal), 0) 
                 FROM Orders 
                 WHERE orDate BETWEEN ? AND ? 
                 AND ordertype = 'walking' 
                 AND orStatus != 'cancel') AS thisMonthWalkingTotal,
                 
                -- This month net total for onsite orders
                (SELECT IFNULL(SUM(netTotal), 0) 
                 FROM Orders 
                 WHERE orDate BETWEEN ? AND ? 
                 AND ordertype = 'On-site' 
                 AND orStatus != 'cancel') AS thisMonthOnsiteTotal,
                 
                -- Last month net total for walking orders
                (SELECT IFNULL(SUM(netTotal), 0) 
                 FROM Orders 
                 WHERE orDate BETWEEN ? AND ? 
                 AND ordertype = 'walking' 
                 AND orStatus != 'cancel') AS lastMonthWalkingTotal,
                 
                -- Last month net total for onsite orders
                (SELECT IFNULL(SUM(netTotal), 0) 
                 FROM Orders 
                 WHERE orDate BETWEEN ? AND ? 
                 AND ordertype = 'On-site' 
                 AND orStatus != 'cancel') AS lastMonthOnsiteTotal
        `;

        const [rows] = await db.query(sql, [
            startOfThisMonth, moment().format("YYYY-MM-DD"),
            startOfThisMonth, moment().format("YYYY-MM-DD"),
            startOfLastMonth, endOfLastMonth,
            startOfLastMonth, endOfLastMonth
        ]);

        const result = rows[0];

        return res.status(200).json({
            success: true,
            message: "Monthly net total comparison for walking and onsite orders",
            walking: {
                thisMonthTotal: result.thisMonthWalkingTotal,
                lastMonthTotal: result.lastMonthWalkingTotal,
                compare: {
                    increased: result.thisMonthWalkingTotal > result.lastMonthWalkingTotal ? "yes" : "no"
                }
            },
            onsite: {
                thisMonthTotal: result.thisMonthOnsiteTotal,
                lastMonthTotal: result.lastMonthOnsiteTotal,
                compare: {
                    increased: result.thisMonthOnsiteTotal > result.lastMonthOnsiteTotal ? "yes" : "no"
                }
            }
        });
    } catch (err) {
        console.error("Error fetching monthly net total summary:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching monthly net total data",
            error: err.message
        });
    }
});

// Get sales team monthly order summary for current year
router.get("/sales-team-monthly-summary", async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();

        const sql = `
            SELECT
                s.stID,
                e.name AS employeeName,
                sr.month,
                sr.totalOrder,
                sr.totalIssued
            FROM ST_order_review sr
            INNER JOIN sales_team s ON sr.stID = s.stID
            INNER JOIN Employee e ON s.E_Id = e.E_Id
            WHERE sr.year = ?
            ORDER BY s.stID, sr.month
        `;

        const [rows] = await db.query(sql, [currentYear]);

        // Group by sales team member
        const result = {};

        rows.forEach(row => {
            if (!result[row.stID]) {
                result[row.stID] = {
                    employeeName: row.employeeName,
                    stID: row.stID,
                    monthlyData: []
                };
            }
            result[row.stID].monthlyData.push({
                month: row.month,
                totalOrder: row.totalOrder,
                totalIssued: row.totalIssued
            });
        });

        return res.status(200).json({
            success: true,
            message: "Monthly summary of orders and issues for each sales team member",
            data: Object.values(result)
        });

    } catch (err) {
        console.error("❌ Error fetching sales team monthly summary:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching sales team monthly data",
            error: err.message
        });
    }
});

// Get Total hire daily & monthly
router.get("/monthly-hire-summary", async (req, res) => {
    try {
        const today = moment().format("YYYY-MM-DD");
        const yesterday = moment().subtract(1, "day").format("YYYY-MM-DD");
        const startOfThisMonth = moment().startOf("month").format("YYYY-MM-DD");
        const startOfLastMonth = moment().subtract(1, "month").startOf("month").format("YYYY-MM-DD");
        const endOfLastMonth = moment().subtract(1, "month").endOf("month").format("YYYY-MM-DD");

        const sql = `
            SELECT
                -- Today Hire Total
                (
                    (SELECT IFNULL(SUM(hire), 0) FROM delivery_note 
                     WHERE date = ? AND status = 'complete')
                    +
                    (SELECT IFNULL(SUM(payment), 0) FROM otherHire 
                     WHERE bookingDate = ? AND status = 'Done')
                ) AS todayHire,

                -- Yesterday Hire Total
                (
                    (SELECT IFNULL(SUM(hire), 0) FROM delivery_note 
                     WHERE date = ? AND status = 'complete')
                    +
                    (SELECT IFNULL(SUM(payment), 0) FROM otherHire 
                     WHERE bookingDate = ? AND status = 'Done')
                ) AS yesterdayHire,

                -- This Month Total
                (
                    (SELECT IFNULL(SUM(hire), 0) FROM delivery_note 
                     WHERE date BETWEEN ? AND ? AND status = 'complete')
                    +
                    (SELECT IFNULL(SUM(payment), 0) FROM otherHire 
                     WHERE bookingDate BETWEEN ? AND ? AND status = 'Done')
                ) AS thisMonthHire,

                -- Last Month Total
                (
                    (SELECT IFNULL(SUM(hire), 0) FROM delivery_note 
                     WHERE date BETWEEN ? AND ? AND status = 'complete')
                    +
                    (SELECT IFNULL(SUM(payment), 0) FROM otherHire 
                     WHERE bookingDate BETWEEN ? AND ? AND status = 'Done')
                ) AS lastMonthHire
        `;

        const [rows] = await db.query(sql, [
            today, today,           // Today's
            yesterday, yesterday,   // Yesterday's
            startOfThisMonth, today, startOfThisMonth, today,   // This Month
            startOfLastMonth, endOfLastMonth, startOfLastMonth, endOfLastMonth // Last Month
        ]);

        const result = rows[0];

        return res.status(200).json({
            success: true,
            message: "Hire summary: daily and monthly comparison",
            todayHire: result.todayHire,
            todayIncreased: result.todayHire > result.yesterdayHire ? "yes" : "no",
            thisMonthHire: result.thisMonthHire,
            hireIncreased: result.thisMonthHire > result.lastMonthHire ? "yes" : "no"
        });

    } catch (err) {
        console.error("Error fetching hire summary:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching hire data",
            error: err.message
        });
    }
});

//get year totals month by month
router.get("/monthly-order-income", async (req, res) => {
    try {
        const currentYear = moment().year();

        const sql = `
            SELECT 
                MONTH(orDate) AS month,
                ordertype,
                SUM(total) AS monthlyTotal
            FROM Orders
            WHERE orStatus != 'cancel' AND YEAR(orDate) = ?
            GROUP BY MONTH(orDate), ordertype
            ORDER BY MONTH(orDate), ordertype
        `;

        const [rows] = await db.query(sql, [currentYear]);

        const totalIncome = Array(12).fill(0);
        const walkingIncome = Array(12).fill(0);
        const onsiteIncome = Array(12).fill(0);

        rows.forEach(row => {
            const index = row.month - 1;
            const income = parseFloat(row.monthlyTotal);

            // Sum to total regardless of type
            totalIncome[index] += income;

            if (row.ordertype === 'Walking') {
                walkingIncome[index] = income;
            } else if (row.ordertype === 'On-site') {
                onsiteIncome[index] = income;
            }
        });

        return res.status(200).json({
            success: true,
            year: currentYear,
            totalIncome,
            walkingIncome,
            onsiteIncome
        });

    } catch (err) {
        console.error("Error fetching monthly order income:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching monthly order income",
            error: err.message
        });
    }
});

// get month total day by day
router.get("/daily-order-income", async (req, res) => {
    try {
        // Use moment to get the current year and month
        const year = moment().year();
        const month = moment().month() + 1; // month() is 0-based, so add 1

        const sql = `
            SELECT 
                DAY(orDate) AS day,
                ordertype,
                SUM(total) AS dailyTotal
            FROM Orders
            WHERE orStatus != 'cancel' AND YEAR(orDate) = ? AND MONTH(orDate) = ?
            GROUP BY DAY(orDate), ordertype
            ORDER BY DAY(orDate), ordertype
        `;

        const [rows] = await db.query(sql, [year, month]);

        const daysInMonth = moment(`${year}-${month}`, "YYYY-MM").daysInMonth();
        const totalIncome = Array(daysInMonth).fill(0);
        const walkingIncome = Array(daysInMonth).fill(0);
        const onsiteIncome = Array(daysInMonth).fill(0);

        rows.forEach(row => {
            const index = row.day - 1;
            const amount = parseFloat(row.dailyTotal);

            totalIncome[index] += amount;

            if (row.ordertype === "Walking") {
                walkingIncome[index] = amount;
            } else if (row.ordertype === "On-site") {
                onsiteIncome[index] = amount;
            }
        });

        return res.status(200).json({
            success: true,
            year,
            month,
            totalIncome,
            walkingIncome,
            onsiteIncome
        });

    } catch (err) {
        console.error("Error fetching daily income:", err.message);
        return res.status(500).json({
            success: false,
            message: "Database error while fetching daily order income",
            error: err.message
        });
    }
});

// Daily Issued Material Prices
router.get("/daily-issued-material-prices", async (req, res) => {
    try {
        // Use moment to get the current year and month if not passed in the request
        const year =  moment().year(); // Default to current year if not provided
        const month = moment().month() + 1; // Default to current month (moment() returns 0-based month, so add 1)

        // Ensure year and month are valid
        if (!year || !month) {
            return res.status(400).json({ success: false, message: "Year and month are required." });
        }

        // Get the start and end date for the selected month
        const startOfMonth = moment(`${year}-${month}-01`).startOf("month").format("YYYY-MM-DD");
        const endOfMonth = moment(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD");

        // SQL query to fetch data
        const sql = `
            SELECT 
                CASE
                    WHEN pid.material IN ('Teak', 'Mahogani', 'Mara', 'Attoriya', 'Sapu') THEN 'Furniture'
                    ELSE pid.material
                END AS materialGroup,
                DAY(pid.datetime) AS day,
                SUM(pid.price) AS totalPrice
            FROM p_i_detail pid
            WHERE pid.status = 'Issued' 
            AND pid.datetime BETWEEN ? AND ?
            GROUP BY materialGroup, day
            ORDER BY day
        `;

        const [rows] = await db.query(sql, [startOfMonth, endOfMonth]);

        // Initialize arrays for each material group (31 days for the month)
        const data = {
            "MDF": Array(31).fill(0),
            "MM": Array(31).fill(0),
            "Mattress": Array(31).fill(0),
            "Furniture": Array(31).fill(0),
        };

        // Populate the data with the queried values
        rows.forEach(row => {
            data[row.materialGroup][row.day - 1] = parseFloat(row.totalPrice);
        });

        // Return the data in the response
        return res.status(200).json({
            success: true,
            year,
            month,
            data: data
        });

    } catch (err) {
        console.error("Error retrieving daily issued material prices:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error retrieving material price data for the day",
            error: err.message
        });
    }
});
// Yearly Issued Material Prices
router.get("/yearly-issued-material-prices", async (req, res) => {
    try {
        // Use query year if provided, otherwise use current year
        const year = req.query.year ? parseInt(req.query.year) : moment().year();

        // Validate the year
        if (isNaN(year) || year < 1900 || year > 2100) {
            return res.status(400).json({ success: false, message: "Valid year is required." });
        }

        // Get start and end of the year
        const startOfYear = moment(`${year}-01-01`).startOf("year").format("YYYY-MM-DD");
        const endOfYear = moment(`${year}-12-31`).endOf("year").format("YYYY-MM-DD");

        // SQL to aggregate material prices per month
        const sql = `
            SELECT
                sub.materialGroup,
                MONTH(sub.datetime) AS month,
                SUM(sub.price) AS totalPrice
            FROM (
                SELECT
                CASE
                WHEN material IN ('Teak', 'Mahogani', 'Mara', 'Attoriya', 'Sapu') THEN 'Furniture'
                ELSE material
                END AS materialGroup,
                price,
                datetime
                FROM p_i_detail
                WHERE datetime BETWEEN ? AND ? AND status = 'Issued'
                ) AS sub
            GROUP BY sub.materialGroup, month
            ORDER BY month
        `;


        const [rows] = await db.query(sql, [startOfYear, endOfYear]);

        // Initialize data containers
        const data = {
            "MDF": Array(12).fill(0),
            "MM": Array(12).fill(0),
            "Mattress": Array(12).fill(0),
            "Furniture": Array(12).fill(0),
        };

        // Populate data with results
        rows.forEach(row => {
            if (data[row.materialGroup]) {
                data[row.materialGroup][row.month - 1] = parseFloat(row.totalPrice);
            }
        });

        return res.status(200).json({
            success: true,
            year,
            data
        });

    } catch (err) {
        console.error("Error retrieving yearly issued material prices:", err.message);
        return res.status(500).json({
            success: false,
            message: "Error retrieving material price data for the year",
            error: err.message
        });
    }
});

// Save Vehicle
router.post("/vehicle", async (req, res) => {
    try {
        const {registration_no, brand, model, color, year, license_Date, insurance_Date, fuel_type, size, status} = req.body;

        if (!registration_no || !brand || !model || !status) {
            return res.status(400).json({ success: false, message: "Required fields missing" });
        }

        const sql = `
            INSERT INTO vehicle (
                registration_no, brand, model, color, year,
                license_Date, insurance_Date, fuel_type, size, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const [result] = await db.query(sql, [
            registration_no, brand, model, color, year,
            license_Date, insurance_Date, fuel_type, size, status
        ]);

        res.status(201).json({
            success: true,
            message: "Vehicle saved successfully",
            vehicleId: result.insertId
        });

    } catch (err) {
        console.error("Error saving vehicle:", err.message);
        res.status(500).json({
            success: false,
            message: "Error saving vehicle",
            error: err.message
        });
    }
});

// Get All Vehicles
router.get("/vehicles", async (req, res) => {
    try {
        const sql = `SELECT * FROM vehicle ORDER BY id DESC`;
        const [rows] = await db.query(sql);

        res.status(200).json({
            success: true,
            data: rows
        });

    } catch (err) {
        console.error("Error fetching vehicles:", err.message);
        res.status(500).json({
            success: false,
            message: "Error fetching vehicles",
            error: err.message
        });
    }
});

// Save New Hire
// POST: Create a new hire
router.post("/other-hire", async (req, res) => {
    try {
        const { title, FtName, SrName, phoneNumber, otherNumber, date, pickup, destination, distance, hire, driverId, vehicleID } = req.body;

        const Cust_id = await generateNewId("Customer", "c_ID", "Cus");
        const trimmedPhone = phoneNumber.trim();
        const trimmedOther = otherNumber.trim();

        // ✅ Set bookingDate to current system date
        const placeDate = moment().format("YYYY-MM-DD");

        const sqlInsertCustomer = `
            INSERT INTO Customer (c_ID, title, FtName, SrName, address, contact1, contact2, id, balance, type, category, t_name, occupation, workPlace)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

        const valuesCustomer = [
            Cust_id, title, FtName, SrName, '', trimmedPhone || "-", trimmedOther || "-", '', 0, "Transport", '', '', '', ''
        ];

        await db.query(sqlInsertCustomer, valuesCustomer);

        // Insert into otherHire
        const insertHire = `
            INSERT INTO otherHire (
                customer, date, bookingDate, pickup, destination,
                distance, hire, driverId, vehicleID, status, payment
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Booked', 0)
        `;

        await db.query(insertHire, [
            Cust_id, placeDate, date, pickup, destination,
            distance, hire, driverId, vehicleID
        ]);

        return res.status(201).json({
            success: true,
            message: "New hire entry saved successfully."
        });

    } catch (err) {
        console.error("❌ Error saving new hire:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to save hire entry.",
            error: err.message
        });
    }
});

// GET: All hire entries
router.get("/other-hires", async (req, res) => {
    try {
        const sql = `
            SELECT
                oh.*,
                CONCAT(c.title, ' ', c.FtName) AS custname,
                c.contact1 AS phoneNumber,
                c.contact2 AS otherNumber,
                c.balance AS customerBalance,
                v.registration_no,
                e.name AS driverName
            FROM otherHire oh
                     LEFT JOIN Customer c ON oh.customer = c.c_ID
                     LEFT JOIN vehicle v ON oh.vehicleID = v.id
                     LEFT JOIN driver d ON oh.driverId = d.devID
                     LEFT JOIN Employee e ON d.E_ID = e.E_Id
            ORDER BY oh.date DESC
        `;

        const [rows] = await db.query(sql);

        // Separate into two arrays based on status
        const booked = rows.filter(item => item.status === 'Booked');
        const done = rows.filter(item => item.status === 'Done');

        return res.status(200).json({
            success: true,
            booked,
            done
        });

    } catch (err) {
        console.error("❌ Error fetching hires:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve hire entries.",
            error: err.message
        });
    }
});
// Get all hire for specific employee
router.get("/other-hires-stid", async (req, res) => {
    try {
        const { eid } = req.query;
        let sql = `
            SELECT
                oh.*,
                CONCAT(c.title, ' ', c.FtName) AS custname,
                c.contact1 AS phoneNumber,
                c.contact2 AS otherNumber,
                c.balance AS customerBalance,
                v.registration_no,
                e.name AS driverName
            FROM otherHire oh
            LEFT JOIN Customer c ON oh.customer = c.c_ID
            LEFT JOIN vehicle v ON oh.vehicleID = v.id
            LEFT JOIN driver d ON oh.driverId = d.devID
            LEFT JOIN Employee e ON d.E_ID = e.E_Id
        `;

        const params = [];

        if (eid) {
            sql += ` WHERE d.E_ID = ?`;
            params.push(eid);
        }

        sql += ` ORDER BY oh.date DESC`;

        const [rows] = await db.query(sql, params);

        const booked = rows.filter(item => item.status === 'Booked');
        const done = rows.filter(item => item.status === 'Done');

        return res.status(200).json({
            success: true,
            booked,
            done
        });

    } catch (err) {
        console.error("❌ Error fetching hires:", err.message);
        return res.status(500).json({
            success: false,
            message: "Failed to retrieve hire entries.",
            error: err.message
        });
    }
});

// Update Hire payments
router.put("/other-hire/payment", async (req, res) => {
    const {customer, customerPayment, customerBalance, driver, driverHandover, driverBalance, profitOrLoss, lossBy} = req.body;

    try {
        const currentDateTime = new Date();

        // 1️⃣ Update hire status to 'Done'
        await db.query(
            `UPDATE otherHire
             SET status = 'Done', payment=?
             WHERE customer = ? AND driverId = ? AND status != 'Done'`,
            [customerPayment,customer, driver]
        );

        // 2️⃣ Insert customer payment into cash_balance
        await db.query(
            `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
             VALUES (?, ?, 'Hire', ?, ?)`,
            ['Hire payment from customer', customer, currentDateTime, customerPayment]
        );

        // 3️⃣ If loss exists, insert as negative cash_balance
        if (profitOrLoss > 0 && lossBy) {
            await db.query(
                `INSERT INTO cash_balance (reason, ref, ref_type, dateTime, amount)
                 VALUES (?, ?, 'loss', ?, ?)`,
                [`Loss by ${lossBy}`, customer, currentDateTime, -Math.abs(profitOrLoss)]
            );
        }

        // 4️⃣ Update customer balance if needed
        if (customerBalance !== 0) {
            await db.query(
                `UPDATE hireCustomer SET balance = ? WHERE custID = ?`,
                [customerBalance, customer]
            );
        }

        // 5️⃣ Update driver balance if needed
        if (driverBalance !== 0) {
            await db.query(
                `UPDATE driver SET balance = ? WHERE devID = ?`,
                [driverBalance, driver]
            );
        }

        return res.status(200).json({
            success: true,
            message: "Hire payment processed successfully."
        });

    } catch (error) {
        console.error("❌ Error in hire payment update:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process hire payment.",
            error: error.message
        });
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
const formatDateTime = (datetime) => {
    return new Date(datetime).toLocaleString("en-US", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
    });
};


export default router;
