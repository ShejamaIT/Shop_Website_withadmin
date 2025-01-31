import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import "../style/checkout.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const Checkout = () => {
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const navigate = useNavigate();

    const [delivery, setDelivery] = useState(false);
    const [pickup, setPickup] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [address, setAddress] = useState("");
    const [city, setCity] = useState("");
    const [postalcode, setPostalcode] = useState("");
    const [coupon, setCoupon] = useState("");
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [discount, setDiscount] = useState(0);

    // Handle checkbox selection
    const handleDeliveryChange = (e) => {
        setDelivery(e.target.checked);
        setPickup(false); // Ensure pickup is unselected
        setDeliveryCharge(0);
    };

    const handlePickupChange = (e) => {
        setPickup(e.target.checked);
        setDelivery(false); // Ensure delivery is unselected
        setDeliveryCharge(0); // No delivery charge for pickup
        setAddress("");
        setCity("");
        setPostalcode("");
    };

    // Function to calculate delivery price based on postal code
    const handlePostalCodeChange = (e) => {
        const code = e.target.value;
        setPostalcode(code);

        if (delivery) {
            if (code.startsWith("12500")) {
                setDeliveryCharge(500);
            } else if (code.startsWith("16700")) {
                setDeliveryCharge(800);
            } else {
                setDeliveryCharge(1000);
            }
        } else {
            setDeliveryCharge(0);
        }
    };

    // Function to validate and apply a discount using a coupon code
    const handleCouponChange = async (e) => {
        const code = e.target.value;
        console.log(coupon);
        setCoupon(code);

        if (!code) {
            setDiscount(0);
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/coupone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpID: code }), // Sending coupon code in request body
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Invalid coupon code");
            }

            // If coupon is found, apply discount
            if (result.success && result.data.length > 0) {
                setDiscount(result.data[0].discount); // Set discount amount from API response
                toast.success(`Coupon applied! Discount: Rs. ${result.data[0].discount}`);
            } else {
                setDiscount(0);
                toast.error("Invalid or expired coupon.");
            }
        } catch (error) {
            console.error("Coupon validation error:", error);
            setDiscount(0);
            toast.error(error.message || "Failed to validate coupon.");
        }
    };



    const placeOrder = () => {
        // Check if user is logged in
        const token = localStorage.getItem("token");
        if (!token) {
            toast.warning("Please log in to place an order.");
            navigate("/signin");
            return;
        }

        const headers = {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        };

        const finalTotal = totalAmount + deliveryCharge - discount; // Calculate final total

        const orderDetails = {
            customerName: name,
            customerAddress: delivery ? address : "N/A",
            city: delivery ? city : "N/A",
            postalCode: delivery ? postalcode : "N/A",
            email: email,
            phoneNumber: number,
            cartItems: cartItems,
            totalAmount: finalTotal,
            deliveryCharge: delivery ? deliveryCharge : 0,
            discount: discount,
            deliveryMethod: delivery ? "Delivery" : "Pick Up",
        };
        console.log(orderDetails);
    };

    return (
        <Helmet title={"Checkout"}>
            <CommonSection title={"Checkout"} />
            <section>
                <Container>
                    <Row>
                        <Col lg={8}>
                            <h6 className={"mb-4 fw-bold"}>Billing Information</h6>
                            <Form className={"billing__form"}>
                                <FormGroup className="form__group">
                                    <div className="delivery-options">
                                        <input id="delivery" type="checkbox" checked={delivery} onChange={handleDeliveryChange} />
                                        <label htmlFor="delivery" className="text-small">Delivery</label>

                                        <input id="pickup" type="checkbox" checked={pickup} onChange={handlePickupChange} />
                                        <label htmlFor="pickup" className="text-small">Pick Up</label>
                                    </div>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text" placeholder={"Enter your name"} onChange={(e) => setName(e.target.value)} />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="email" placeholder={"Enter your email"} onChange={(e) => setEmail(e.target.value)} />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="number" placeholder={"Phone number"} onChange={(e) => setNumber(e.target.value)} />
                                </FormGroup>
                                {delivery && (
                                    <>
                                        <FormGroup className="form__group">
                                            <input type="text" placeholder={"Address"} onChange={(e) => setAddress(e.target.value)} />
                                        </FormGroup>
                                        <FormGroup className="form__group">
                                            <input type="text" placeholder={"City"} onChange={(e) => setCity(e.target.value)} />
                                        </FormGroup>
                                        <FormGroup className="form__group">
                                            <input type="text" placeholder={"Postal code"} value={postalcode} onChange={handlePostalCodeChange} />
                                        </FormGroup>
                                    </>
                                )}
                                <FormGroup className="form__group">
                                    <input type="text" placeholder={"Coupon code"} value={coupon} onChange={handleCouponChange} />
                                </FormGroup>
                            </Form>
                        </Col>
                        <Col lg={4}>
                            <div className="checkout__cart">
                                <h6>
                                    Total Qty: <span>{totalQty} items</span>
                                </h6>
                                <h6>
                                    Subtotal: <span>Rs.{totalAmount}</span>
                                </h6>
                                <h6>
                                    Delivery: <span>Rs.{deliveryCharge}</span>
                                </h6>
                                <h6>
                                    Discount: <span>Rs.{discount}</span>
                                </h6>
                                <h4>
                                    Total cost: <span>Rs.{totalAmount + deliveryCharge - discount}</span>
                                </h4>

                                <button className="buy_btn auth__btn w-100" onClick={placeOrder}>
                                    Place an order
                                </button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Checkout;
