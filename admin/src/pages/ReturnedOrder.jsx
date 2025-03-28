import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Helmet from "../components/Helmet/Helmet";
import {Container, Row, Col, Button, Input, FormGroup, Label, ModalHeader, ModalBody, ModalFooter, Modal} from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/orderDetails.css";

const ReturnedOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        console.log(id);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/returned-order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            console.log(data);
            setOrder(data.order);
            setFormData({
                orderStatus: data.order.orderStatus,
                deliveryStatus: data.order.deliveryStatus
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));
    };

    const handleSave = async () => {
        try {
            const updatedData = {
                orderId: order.orderId,
                orderStatus: formData.orderStatus,
                deliveryStatus: formData.deliveryStatus
            };
            console.log(updatedData);
            const response = await fetch(`http://localhost:5001/api/admin/main/updateReturnOrder`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();
            if (!response.ok || !result.success) {
                toast.error(result.message || "Failed to update order.");
                return;
            }

            await fetchOrder();
            setIsEditing(false);
            toast.success("Order updated successfully.");

            const orderRoutes = {
                Completed: `/complete-order-detail/${order.orderId}`,
            };
            navigate(orderRoutes[formData.orderStatus] || "/dashboard");
        } catch (err) {
            console.error("Error updating order:", err);
            toast.error(`Error: ${err.message}`);
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
                            <h4 className="mb-3 text-center topic">Returned Order Details</h4>
                            <h4 className="mb-3 text-center topic">#{order.orderId}</h4>
                            <div className="order-details">
                                <div className="order-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {order.orderDate}</p>
                                        <p><strong>Customer Email:</strong> {order.customerEmail}</p>

                                        {/* Order Status - Editable */}
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
                                                    <option value="Completed">Completed</option>
                                                    <option value="Returned">Returned</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Input>
                                            </FormGroup>
                                        )}

                                        {/* Delivery Status - Editable */}
                                        {!isEditing ? (
                                            <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Delivery Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="deliveryStatus"
                                                    value={formData.deliveryStatus}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Out for Delivery">Out for Delivery</option>
                                                    <option value="Delivered">Delivered</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Input>
                                            </FormGroup>
                                        )}

                                        <p><strong>Payment Status:</strong> {order.payStatus}</p>
                                        <p><strong>Expected Delivery Date:</strong> {order.expectedDeliveryDate}</p>
                                        <p><strong>Contact:</strong> {order.phoneNumber}</p>
                                        <p><strong>Optional Contact:</strong> {order.optionalNumber}</p>
                                        <p><strong>Special Note:</strong> {order.specialNote}</p>
                                        <p><strong>Sale By:</strong> {order.salesTeam.employeeName}</p>
                                        <p><strong>Reason to Return:</strong> {order.returnReason}</p>
                                    </div>

                                    {/* Ordered Items */}
                                    <div>
                                        <h5 className="mt-4">Ordered Items</h5>
                                        <ul className="order-items">
                                            <div className="order-general">
                                                {order.items.map((item, index) => (
                                                    <li key={index}>
                                                        <p><strong>Item:</strong> {item.itemName}</p>
                                                        <p><strong>Color:</strong> {item.color}</p>
                                                        <p><strong>Requested Quantity:</strong> {item.quantity}</p>
                                                        <p><strong>Amount:</strong> Rs. {item.totalPrice}</p>
                                                        <p><strong>Unit Price:</strong> Rs. {item.unitPrice}</p>
                                                    </li>
                                                ))}
                                            </div>
                                        </ul>
                                    </div>


                                    {/* Issued Items */}
                                    <div className="mt-4">
                                        <h5 className="mt-4">Issued Items</h5>
                                        <ul className="order-items">
                                            <div className="order-general">
                                                {order.issuedItems.map((item, index) => (
                                                    <li key={index}>
                                                        <p><strong>Stock ID:</strong> {item.stockId}</p>
                                                        <p><strong>Batch ID:</strong> {item.BatchId}</p>
                                                        <p><strong>Status:</strong> {item.status}</p>
                                                        <p><strong>Issued On:</strong> {item.issuedDate}</p>
                                                    </li>
                                                ))}
                                            </div>
                                        </ul>

                                    </div>

                                    {/* Buttons */}
                                    <div className="text-center mt-4">
                                        {!isEditing ? (
                                            <Button color="primary" onClick={() => setIsEditing(true)} disabled={loading}>
                                                {loading ? "Loading..." : "Edit Order"}
                                            </Button>
                                        ) : (
                                            <>
                                                <Button color="success" onClick={handleSave} disabled={loading}>
                                                    {loading ? "Saving..." : "Save Changes"}
                                                </Button>
                                                <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)} disabled={loading}>
                                                    Cancel
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ReturnedOrderDetails;


