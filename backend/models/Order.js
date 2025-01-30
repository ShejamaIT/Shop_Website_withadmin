import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            type: Number,
            required: true
        }
    },
    { _id: false }
);

const orderSchema = new mongoose.Schema(
    {
        customerName: {
            type: String,
            required: true
        },
        customerAddress: {
            type: String,
            required: true
        },
        city: {
            type: String,
            required: true
        },
        postalCode: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        phoneNumber: {
            type: String,
            required: true
        },
        cartItems: [cartItemSchema],
        totalAmount: {
            type: Number,
            required: true
        }
    },
    { timestamps: true }
);

export default mongoose.model("Order", orderSchema);
