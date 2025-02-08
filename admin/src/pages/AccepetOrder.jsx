import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
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
        fetchOrder();
    }, [id]);

    let isbooked = "No";  // Use 'let' instead of 'const'

    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/accept-order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            setOrder(data.order);
            setFormData(data.order); // Copy order details for editing
            setLoading(false);

            // ✅ Use `data.order.acceptedOrders` directly
            if (data.order.acceptedOrders.length === 0) {
                console.log(isbooked); // Still "No"
            } else {
                isbooked = "Yes";  // Update the variable correctly
                console.log(isbooked);
            }
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e, index) => {
        const { name, value } = e.target;
        const stockCount = order.items[index]?.stockCount; // Get stock count for the item

        // Handle the 'orderStatus' field
        if (name === "orderStatus") {
            // If the user is changing the order status to "Accepted"
            if (value === "Accepted") {
                Swal.fire({
                    title: 'Have you received the items?',
                    text: "Please confirm if the items have been received before marking the order as accepted.",
                    icon: 'question',
                    showCancelButton: true,
                    confirmButtonText: 'Yes',
                    cancelButtonText: 'No',
                }).then((result) => {
                    if (result.isConfirmed) {
                        // If user confirms "Yes", set the booked field to "Yes" and update the order status
                        setFormData((prevFormData) => ({
                            ...prevFormData,
                            orderStatus: "Accepted", // Update the order status to "Accepted"
                            booked: "Yes", // Add a new field 'booked' and set it to "Yes"
                        }));
                    } else {
                        // If user selects "No", set the booked field to "No" and update the order status to "Accepted"
                        setFormData((prevFormData) => ({
                            ...prevFormData,
                            orderStatus: "Accepted", // Ensure status is set to "Accepted"
                            booked: "No", // Set booked to "No"
                        }));
                    }
                });
            } else {
                // If the status is not being changed to "Accepted", simply update the order status
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    orderStatus: value, // Update the order status when it's changed
                }));
            }
        } else {
            setFormData((prevFormData) => {
                const updatedItems = [...prevFormData.items];

                if (name === "discount" || name === "deliveryCharge") {
                    const updatedValue = value === "" ? 0 : parseFloat(value);
                    if (!isNaN(updatedValue) && updatedValue >= 0) {
                        const updatedFormData = {
                            ...prevFormData,
                            [name]: updatedValue
                        };

                        updatedFormData.totalPrice = updatedFormData.items.reduce((total, item) => {
                            return total + item.price;
                        }, 0) + updatedFormData.deliveryCharge - updatedFormData.discount;

                        return updatedFormData;
                    }
                } else {
                    const newQuantity = value === "" ? 0 : parseInt(value, 10);

                    if (newQuantity > stockCount) {
                        Swal.fire({
                            icon: 'warning',
                            title: 'Quantity Exceeds Stock!',
                            text: `The quantity you selected exceeds the available stock for ${order.items[index].itemName}. Please choose a quantity less than or equal to ${stockCount}.`,
                            confirmButtonText: 'Okay',
                        }).then(() => {
                            document.getElementsByName("quantity")[index].focus();
                        });
                        return prevFormData; // Don't update the form if quantity exceeds stock
                    }

                    if (!isNaN(newQuantity) && newQuantity >= 0) {
                        updatedItems[index] = {
                            ...updatedItems[index],
                            quantity: newQuantity,
                            price: newQuantity * updatedItems[index].unitPrice,
                        };
                    }

                    const newTotalPrice = updatedItems.reduce((total, item) => {
                        return total + item.price;
                    }, 0) + (prevFormData.deliveryCharge || 0) - (prevFormData.discount || 0);

                    return {
                        ...prevFormData,
                        items: updatedItems,
                        totalPrice: newTotalPrice
                    };
                }
            });
        }
    };


    // Save changes (API request needed)
    const handleSave = async () => {
        try {
            console.log(JSON.stringify(formData));
            const response = await fetch(`http://localhost:5001/api/admin/main/update-order`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update order.");

            const updatedOrder = await response.json();

            if (updatedOrder.data.orderId === formData.orderId){
                // Fetch the updated order details after update
                await fetchOrder();  // Call fetchOrder to get the updated order
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

                                {/* General Order Info */}
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
                                        {!isEditing ? (
                                            <p><strong>Contact:</strong> {order.phoneNumber}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Contact:</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={formData.phoneNumber ?? order.phoneNumber}
                                                    onChange={handleChange}
                                                />
                                            </FormGroup>
                                        )}
                                        {!isEditing ? (
                                            <p><strong>Optional Contact:</strong> {order.optionalNumber}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Optional Contact:</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="optionalNumber"
                                                    value={formData.optionalNumber ?? order.optionalNumber}
                                                    onChange={handleChange}
                                                />
                                            </FormGroup>
                                        )}
                                        <p><strong>Special Note:</strong> {order.specialNote}</p>
                                        <p><strong>Sale By:</strong> {order.salesTeam.employeeName}</p>
                                        <p><strong>Is Booked:</strong> {isbooked}</p>
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
                                                <p><strong>Stock Quantity:</strong> {item.stockCount}</p>
                                                <p><strong>Unit Price:</strong> Rs. {item.unitPrice}</p>
                                            </li>
                                        ))}
                                    </div>
                                </ul>

                                {/* Order Summary */}
                                <div className="order-summary">
                                    {!isEditing ? (
                                        <p><strong>Discount Price:</strong> Rs. {formData.discount ?? order.discount}</p>
                                    ) : (
                                        <FormGroup>
                                            <Label><strong>Discount Price:</strong></Label>
                                            <Input
                                                type="text"
                                                name="discount"
                                                value={formData.discount ?? order.discount}
                                                onChange={handleChange}
                                            />
                                        </FormGroup>
                                    )}

                                    {!isEditing ? (
                                        <p><strong>Delivery Amount:</strong> Rs. {formData.deliveryCharge ?? order.deliveryCharge}</p>
                                    ) : (
                                        <FormGroup>
                                            <Label><strong>Delivery Amount:</strong></Label>
                                            <Input
                                                type="text"
                                                name="deliveryCharge"
                                                value={formData.deliveryCharge ?? order.deliveryCharge}
                                                onChange={handleChange}
                                            />
                                        </FormGroup>
                                    )}

                                    <p><strong>Total Amount:</strong> Rs. {formData.totalPrice ?? order.totalPrice}</p>
                                </div>

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
