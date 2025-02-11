import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/orderDetails.css";
import BillInvoice from "./AccpetBillInvoice";
import ChangeQty from "./changeQty";

const OrderDetails = () => {
    const { id } = useParams(); // Get order ID from URL
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({}); // Stores editable fields
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            setOrder(data.order);
            setFormData({
                ...data.order,
                items: data.order.items.map(item => ({
                    ...item,
                    booked: item.booked || false // Ensure booked field is included
                }))
            });
            setLoading(false);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };
    const calculateTotal = () => {
        const itemTotal = formData.items?.reduce((total, item) => total + (item.quantity * item.unitPrice), 0) || 0;
       const delivery = Number(formData.deliveryCharge || 0);
       const discount = Number(formData.discount || 0);
        return itemTotal + delivery - discount;
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
                updatedItems[index] = {
                    ...updatedItems[index],
                    booked: checked
                };
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
                        totalPrice: prevFormData.items.reduce((total, item) => total + item.price, 0) + (prevFormData.deliveryCharge || 0) - (prevFormData.discount || 0)
                    };
                }
            }

            return prevFormData;
        });
    };

    const handleSave = async () => {
        const updatedTotal = calculateTotal();
        const updatedData = { ...formData, totalPrice: updatedTotal };
        console.log(updatedData);
        try {

            const response = await fetch(`http://localhost:5001/api/admin/main/update-order`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updatedData),
            });

            if (!response.ok) throw new Error("Failed to update order.");

            const updatedOrder = await response.json();

            if (updatedOrder.data.orderId === updatedData.orderId){
                // Fetch the updated order details after update
                if (updatedData.orderStatus === 'Accepted'){
                    navigate(`/accept-order-detail/${updatedData.orderId}`);
                }else {
                    navigate("/dashboard");
                }

            }

        } catch (err) {
            console.error("Error updating order:", err);
            alert("Failed to update order!");
        }
    };
    const handleEditClick = (item) => {
        if (!item) return; // Prevent issues if item is undefined
        console.log("Opening modal for order:", item);
        setSelectedItem(item);
        setShowModal(true);
    };
    const handleSubmit2 = async (formData) => {
        console.log("Submitting form data:", formData);
    }

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
                                                    <option value="Accepted">Accepted</option>
                                                    <option value="Processing">Processing</option>
                                                    <option value="Completed">Completed</option>
                                                    <option value="Cancelled">Cancelled</option>
                                                </Input>
                                            </FormGroup>
                                        )}
                                        {!isEditing ? (
                                            <p><strong>Delivery Status:</strong>
                                                {order.deliveryStatus}
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
                                                    <option value="Delivery">Delivery</option>
                                                    <option value="Pick up">Pick up</option>
                                                </Input>
                                            </FormGroup>
                                        )}
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
                                    </div>
                                    {order.deliveryInfo && (
                                        <>
                                            <h5 className="mt-4">Delivery Details</h5>
                                            <div className="order-general">
                                                <p><strong>Delivery ID:</strong> {order.deliveryInfo.deliveryId}</p>
                                                {!isEditing ? (
                                                    <p><strong>Address:</strong> {order.deliveryInfo.address}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Address:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="address"
                                                            value={formData.deliveryInfo.address ?? order.deliveryInfo.address}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>District:</strong> {order.deliveryInfo.district}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>District:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="district"
                                                            value={formData.deliveryInfo.district ?? order.deliveryInfo.district}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                <p><strong>Delivery Status:</strong> {order.deliveryInfo.status}</p>
                                                <p><strong>Scheduled Date:</strong> {new Date(order.deliveryInfo.scheduleDate).toLocaleDateString()}</p>
                                            </div>
                                        </>
                                    )}
                                </div>

                                <h5 className="mt-4">Ordered Items</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {order.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>
                                                <p><strong>Requested Quantity:</strong> {item.quantity}</p>
                                                <p><strong>Amount:</strong> Rs. {item.price}</p>
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
                                                        <Button
                                                            color="secondary"
                                                            className="ms-4"
                                                            onClick={() => handleEditClick(item)} // Ensure this is not treating `selectedItem` as a function
                                                            disabled={loading}
                                                        >
                                                            Change Qty
                                                        </Button>
                                                    </FormGroup>
                                                )}

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

                                    {formData.deliveryStatus === "Pick up" ? (
                                        <p><strong>Delivery Amount:</strong> Rs. {formData.deliveryCharge ?? order.deliveryCharge}</p>
                                    ) : (
                                        !isEditing ? (
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
                                        )
                                    )}

                                    {/*<p><strong>Total Amount:</strong> Rs. {formData.totalPrice ?? order.totalPrice}</p>*/}
                                    <p><strong>Total Amount:</strong> Rs. {calculateTotal()}</p>
                                </div>

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

                            {showModal && selectedItem && (
                                <ChangeQty
                                    selectedItem={selectedItem} // Pass selectedItem as an object
                                    setShowModal={setShowModal}
                                    handleSubmit2={handleSubmit2}
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
