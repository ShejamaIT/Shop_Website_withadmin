import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/orderDetails.css";

const OrderDetails = () => {
    const { id } = useParams(); // Get order ID from URL
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({}); // Stores editable fields
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/admin/main/order-details?orID=${id}`);
                if (!response.ok) throw new Error("Failed to fetch order details.");

                const data = await response.json();
                setOrder(data.order);
                setFormData(data.order); // Copy order details for editing
                setLoading(false);
            } catch (err) {
                console.error("Error fetching order details:", err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    // Handle input changes for edit mode
    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.startsWith("itemQuantity_")) {
            // Update the specific item quantity
            const index = name.split("_")[1]; // Extract index from the name attribute
            const updatedItems = [...formData.items];
            updatedItems[index].orderedQuantity = value;
            setFormData({ ...formData, items: updatedItems });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    // Save changes (API request needed)
    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5000/api/admin/main/update-order`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update order.");

            const updatedOrder = await response.json();
            setOrder(updatedOrder.order);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating order:", err);
            alert("Failed to update order!");
        }
    };

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
                            <h4 className="mb-3 text-center">Order #{order.orderId} Details</h4>
                            <div className="order-details">

                                {/* General Order Info */}
                                <div className="order-header">
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                                        <p><strong>Customer Email:</strong> {order.customerEmail}</p>

                                        {/* Order Status */}
                                        {!isEditing ? (
                                            <p><strong>Order Status:</strong>
                                                <span className={`status ${order.orderStatus.toLowerCase()}`}>
                                                    {order.orderStatus}
                                                </span>
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Order Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="orderStatus"
                                                    value={formData.orderStatus}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Input>
                                            </FormGroup>
                                        )}

                                        {/* Delivery Status */}
                                        {!isEditing ? (
                                            <p><strong>Delivery Status:</strong>
                                                <span className={`status ${order.deliveryStatus.toLowerCase()}`}>
                                                    {order.deliveryStatus}
                                                </span>
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Delivery Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="deliveryStatus"
                                                    value={formData.deliveryStatus}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Not Shipped">Not Shipped</option>
                                                    <option value="Shipped">Shipped</option>
                                                    <option value="Delivered">Delivered</option>
                                                </Input>
                                            </FormGroup>
                                        )}
                                    </div>
                                </div>

                                {/* Order Summary */}
                                <div className="order-summary">
                                    <p><strong>Expected Delivery Date:</strong> {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                                    <p><strong>Special Note:</strong> {order.specialNote}</p>
                                    <p><strong>Total Price:</strong> Rs. {order.totalPrice}</p>
                                </div>
                                <h5>Delivery Details</h5>
                                {/* Delivery Details - Show only if dvStatus is "Delivery" */}
                                {order.deliveryStatus === "Delivery" && order.deliveryInfo && (

                                    <div className="order-general">
                                        {/*<h5>Delivery Details</h5><br/>*/}
                                        <p><strong>Address:</strong> {order.deliveryInfo.address}</p>
                                        <p><strong>District:</strong> {order.deliveryInfo.district}</p>
                                        <p><strong>Contact:</strong> {order.deliveryInfo.contact}</p>
                                        <p><strong>Status:</strong> {order.deliveryInfo.status}</p>
                                        <p><strong>Scheduled Date:</strong> {new Date(order.deliveryInfo.scheduleDate).toLocaleDateString()}</p>
                                        {/*<p><strong>Delivery Date:</strong> {order.deliveryInfo.deliveryDate !== "none" ? new Date(order.deliveryInfo.deliveryDate).toLocaleDateString() : "Not delivered yet"}</p>*/}
                                    </div>
                                )}

                                {/* Ordered Items */}
                                <h5 className="mt-4">Ordered Items</h5>
                                <ul className="order-items">
                                    {order.items.map((item, index) => (

                                        <li key={index}>
                                            <p><strong>Item:</strong> {item.itemName}</p>
                                            <p><strong>Requested Quantity:</strong>
                                                {!isEditing ? (
                                                    item.quantity
                                                ) : (
                                                    <Input
                                                        type="number"
                                                        name={`itemQuantity_${index}`}
                                                        value={formData.items[index].quantity}
                                                        onChange={handleChange}
                                                        min="1"
                                                    />
                                                )}
                                            </p>
                                            <p><strong>Stock Quantity:</strong> {item.quantity}</p>
                                            <p><strong>Price:</strong> Rs. {item.price}</p>
                                        </li>
                                    ))}
                                </ul>

                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <Button color="primary" onClick={() => setIsEditing(true)}>Edit Order</Button>
                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default OrderDetails;
