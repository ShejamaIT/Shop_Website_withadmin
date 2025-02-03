import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import "../style/orderDetails.css";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";

const OrderDetails = () => {
    const { id } = useParams(); // Get order ID from URL
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/admin/main/order-details?orID=${id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch order details.");
                }

                const data = await response.json();
                setOrder(data.order); // Set only the order object from API response
                setLoading(false);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!order) return <p>Order not found</p>;

    return (
        <Helmet title={`Order Details - ${order.orderId}`}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h4 className="mb-5 text-center">Order #{order.orderId} Details</h4>
                            <div className="order-details">

                                {/* General Order Info & Sales Team in One Line */}
                                <div className="order-header">
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                                        <p><strong>Customer:</strong> {order.customerEmail}</p>
                                        <p><strong>Order Status:</strong>
                                            <span className={`status ${order.orderStatus.toLowerCase()}`}>
                                                {order.orderStatus}
                                            </span>
                                        </p>
                                        <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                    </div>
                                    {order.salesTeam && (
                                        <div className="sales-team">
                                            <p><strong>Sales Team ID:</strong> {order.salesTeam.stID}</p>
                                            <p><strong>Employee ID:</strong> {order.salesTeam.employeeID}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Order Summary */}
                                <div className="order-summary">
                                    <p><strong>Expected Delivery Date:</strong> {new Date(order.expectedDeliveryDate).toLocaleDateString() || "Not Available"}</p>
                                    <p><strong>Special Note:</strong> {order.specialNote || "None"}</p>
                                    <p><strong>Delivery Price:</strong> Rs. {order.deliveryCharge}</p>
                                    <p><strong>Discount:</strong> Rs. {order.discount}</p>
                                    <p><strong>Total Price:</strong> Rs. {order.totalPrice}</p>
                                </div>

                                {/* Ordered Items */}
                                <h5 className="mt-4">Ordered Items</h5>
                                {order.items.length > 0 ? (
                                    <ul className="order-items">
                                        {order.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>
                                                <p><strong>Quantity:</strong> {item.quantity}</p>
                                                <p><strong>Price:</strong> Rs. {item.price}</p>
                                            </li>
                                        ))}
                                    </ul>
                                ) : (
                                    <p>No items found in this order.</p>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default OrderDetails;
