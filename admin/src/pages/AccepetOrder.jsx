import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/orderDetails.css";
import BillInvoice from "./AccpetBillInvoice";

const OrderDetails = () => {
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    let isBooked = "No";

    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/accept-order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            setOrder(data.order);
            setFormData(data.order);
            setLoading(false);
            console.log(data.order);
            if (data.order.acceptedOrders.length > 0) {
                isBooked = "Yes";
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevFormData) => {
            if (name in prevFormData) {
                return { ...prevFormData, [name]: value };
            }

            if (prevFormData.deliveryInfo && name in prevFormData.deliveryInfo) {
                return {
                    ...prevFormData,
                    deliveryInfo: {
                        ...prevFormData.deliveryInfo,
                        [name]: value,
                    },
                };
            }

            if (name === "booked") {
                const updatedItems = [...prevFormData.items];
                updatedItems[index] = { ...updatedItems[index], booked: checked };
                return { ...prevFormData, items: updatedItems };
            }

            if (name === "quantity") {
                const updatedItems = [...prevFormData.items];
                const newQuantity = value === "" ? 0 : parseInt(value, 10);
                if (!isNaN(newQuantity) && newQuantity >= 0) {
                    updatedItems[index] = {
                        ...updatedItems[index],
                        quantity: newQuantity,
                        price: newQuantity * updatedItems[index].unitPrice,
                    };
                }
                return { ...prevFormData, items: updatedItems };
            }

            if (name === "discount" || name === "deliveryCharge") {
                const updatedValue = value === "" ? 0 : parseFloat(value);
                if (!isNaN(updatedValue) && updatedValue >= 0) {
                    return {
                        ...prevFormData,
                        [name]: updatedValue,
                        totalPrice: prevFormData.items.reduce((total, item) => total + item.price, 0) +
                            (prevFormData.deliveryCharge || 0) - (prevFormData.discount || 0)
                    };
                }
            }
            return prevFormData;
        });
    };

    const handleEditClick = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/update-order`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update order.");

            const updatedOrder = await response.json();

            if (updatedOrder.data.orderId === formData.orderId) {
                await fetchOrder();
                setIsEditing(false);
            }
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
                            <h4 className="mb-3 text-center topic">Order #{order.orderId} Details</h4>
                            <div className="order-details">
                                <div className="order-header">
                                    <h5 className="mt-4">General Details</h5>
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
                                                    value={formData.orderStatus} // Bind order status to formData
                                                    onChange={handleChange} // Ensure handleChange updates formData correctly
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Input>
                                            </FormGroup>
                                        )}
                                        <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                        <p><strong>Expected Delivery Date:</strong> {new Date(order.expectedDeliveryDate).toLocaleDateString()}</p>
                                        <p><strong>Contact:</strong> {order.phoneNumber}</p>
                                        <p><strong>Optional Contact:</strong> {order.optionalNumber}</p>
                                        <p><strong>Special Note:</strong> {order.specialNote}</p>
                                        <p><strong>Sale By:</strong> {order.salesTeam.employeeName}</p>
                                        <p><strong>Is Booked:</strong> {isBooked}</p>
                                    </div>
                                </div>

                                {/* Ordered Items */}
                                <h5 className="mt-4">Ordered Items</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {order.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>

                                                <p><strong>Requested Quantity:</strong>
                                                    {!isEditing ? (
                                                        item.quantity
                                                    ) : (
                                                        <Input
                                                            type="number"
                                                            value={formData.items[index]?.quantity || ""}
                                                            onChange={(e) => handleChange(e, index)}
                                                            min="0"
                                                        />
                                                    )}
                                                </p>
                                                <p><strong>Amount:</strong> Rs. {formData.items[index]?.price || 0}</p>
                                                <p><strong>Available Quantity:</strong> {item.availableQuantity}</p>
                                                <p><strong>Unit Price:</strong> Rs. {item.unitPrice}</p>
                                                {isEditing && (
                                                    <FormGroup check>
                                                        <Label check>
                                                            <Input
                                                                type="checkbox"
                                                                name="booked"
                                                                checked={formData.items[index]?.booked || false}
                                                                onChange={(e) => handleChange(e, index)}
                                                            />
                                                            Mark as Booked
                                                        </Label>
                                                    </FormGroup>
                                                )}
                                            </li>
                                        ))}
                                    </div>
                                </ul>

                                <div className="order-summary">
                                    <p><strong>Discount Price:</strong> Rs. {order.discount}</p>
                                    <p><strong>Delivery Amount:</strong> Rs. {order.deliveryCharge}</p>
                                    <p><strong>Total Amount:</strong> Rs. {order.totalPrice}</p>
                                </div>

                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <>
                                            <Button color="primary" onClick={() => setIsEditing(true)}>Edit Order</Button>
                                            <Button color="success" className="ms-3" onClick={() => handleEditClick(order)}>Print Invoice</Button>
                                        </>

                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {showModal && selectedOrder && (
                                <BillInvoice
                                    selectedOrder={selectedOrder}
                                    setShowModal={setShowModal}
                                />
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default OrderDetails;
