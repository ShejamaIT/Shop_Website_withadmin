import Order from "../models/Order.js";

// Save order
export const createOrder = async (req, res) => {
    console.log("Request Body...");
    console.log(req.body);

    const newOrder = new Order({
        customerName: req.body.customerName,
        customerAddress: req.body.customerAddress,
        city: req.body.city,
        postalCode: req.body.postalCode,
        email: req.body.email,
        phoneNumber: req.body.phoneNumber,
        cartItems: req.body.cartItems,
        totalAmount: req.body.totalAmount // Ensure this is calculated and passed from the frontend
    });

    console.log("New Order.....");
    console.log(newOrder);

    try {
        const savedOrder = await newOrder.save();
        res.status(200).json({ success: true, message: 'Order placed successfully.', data: savedOrder });
    } catch (err) {
        console.error(err); // Log the error for debugging
        res.status(500).json({ success: false, message: 'Failed to place order.', error: err.message });
    }
};

// get all orders
export const getAllOrders = async (req, res) => {
    const page = parseInt(req.query.page) || 1; // Default to page 1 if not provided
    const limit = parseInt(req.query.limit) || 10; // Default to 10 items per page if not provided

    try {
        const totalOrders = await Order.countDocuments({});
        const totalPages = Math.ceil(totalOrders / limit);

        const orders = await Order.find({})
            .skip((page - 1) * limit)
            .limit(limit);

        res.status(200).json({
            success: true,
            message: 'Orders successfully found.',
            data: orders,
            pagination: {
                currentPage: page,
                totalPages: totalPages,
                totalOrders: totalOrders
            }
        });
    } catch (err) {
        console.error(err);
        res.status(404).json({ success: false, message: 'Orders not found.', error: err.message });
    }
};
