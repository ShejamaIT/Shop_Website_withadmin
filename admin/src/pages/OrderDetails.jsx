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
    const { id } = useParams();
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
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
                    booked: item.booked || false,
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

    const handleAddItem = () => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            items: [
                ...prevFormData.items,
                {
                    itemId: `temp-${Date.now()}`, // Temporary ID for frontend use
                    itemName: "",
                    color: "",
                    quantity: 1,
                    unitPrice: 0,
                    price: 0,
                    booked: false,
                    newItem: true, // Flag to indicate a new item
                },
            ],
        }));
    };

    const handleRemoveItem = (index, item) => {
        if (item.newItem) {
            // Remove unsaved items from UI
            setFormData((prevFormData) => ({
                ...prevFormData,
                items: prevFormData.items.filter((_, i) => i !== index),
            }));
        } else {
            // Remove item from the backend
            // fetch(`http://localhost:5001/api/admin/main/remove-item`, {
            //     method: "DELETE",
            //     headers: { "Content-Type": "application/json" },
            //     body: JSON.stringify({ orId: order.orderId, itemId: item.itemId }),
            // })
            //     .then((response) => response.json())
            //     .then((data) => {
            //         if (data.success) {
            //             fetchOrder();
            //         } else {
            //             alert(`Failed to remove item: ${data.message}`);
            //         }
            //     })
            //     .catch((error) => {
            //         console.error("Error removing item:", error);
            //         alert(`Error removing item: ${error.message}`);
            //     });
        }
    };

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        setFormData((prevFormData) => {
            let updatedFormData = { ...prevFormData };

            if (["deliveryStatus", "orderStatus", "payStatus"].includes(name)) {
                updatedFormData[name] = value; // ✅ Handles payStatus update
            } else if (name in prevFormData) {
                updatedFormData[name] = value;
            } else if (prevFormData.deliveryInfo && name in prevFormData.deliveryInfo) {
                updatedFormData.deliveryInfo = {
                    ...prevFormData.deliveryInfo,
                    [name]: value,
                };
            } else if (name === "booked") {
                updatedFormData.items = prevFormData.items.map((item, i) =>
                    i === index ? { ...item, booked: checked } : item
                );
            } else if (name === "quantity") {
                const newQuantity = value === "" ? 0 : parseInt(value, 10);
                if (!isNaN(newQuantity) && newQuantity >= 0) {
                    updatedFormData.items = prevFormData.items.map((item, i) =>
                        i === index
                            ? { ...item, quantity: newQuantity, price: newQuantity * item.unitPrice }
                            : item
                    );
                }
            } else if (["discount", "deliveryCharge"].includes(name)) {
                const updatedValue = value === "" ? 0 : parseFloat(value);
                if (!isNaN(updatedValue) && updatedValue >= 0) {
                    updatedFormData[name] = updatedValue;
                    updatedFormData.totalPrice =
                        updatedFormData.items.reduce((total, item) => total + item.price, 0) +
                        (updatedFormData.deliveryCharge || 0) -
                        (updatedFormData.discount || 0);
                }
            }

            return updatedFormData;
        });
    };

    const handleSave = async () => {
        const updatedTotal = calculateTotal();
        const updatedData = { ...formData, totalPrice: updatedTotal };
        let updatedGeneralOrder = null;
        let allUpdatesSuccessful = true; // ✅ Track if all updates pass

        try {
            // Step 1: Update order general details only if changed
            if (hasGeneralDetailsChanged(updatedData)) {
                const generalResponse = await fetch(`http://localhost:5001/api/admin/main/update-order-details`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                if (!generalResponse.ok) {
                    allUpdatesSuccessful = false;
                    throw new Error("Failed to update order general detail.");
                }

                updatedGeneralOrder = await generalResponse.json();

                if (!updatedGeneralOrder.success) {
                    allUpdatesSuccessful = false;
                    toast.error(updatedGeneralOrder.message || "Failed to update order general detail.");
                    return;
                }
            }

            // Step 2: Update order items only if changed
            if (hasItemsChanged(updatedData)) {
                const itemsResponse = await fetch(`http://localhost:5001/api/admin/main/update-order-items`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                if (!itemsResponse.ok) {
                    allUpdatesSuccessful = false;
                    throw new Error("Failed to update order item detail.");
                }

                const updatedItemsOrder = await itemsResponse.json();

                if (!updatedItemsOrder.success) {
                    allUpdatesSuccessful = false;
                    toast.error(updatedItemsOrder.message || "Failed to update order item detail.");
                    return;
                }
            }

            // Step 3: Update delivery information only if changed
            if (hasDeliveryChanged(updatedData)) {
                const deliveryResponse = await fetch(`http://localhost:5001/api/admin/main/update-delivery`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                if (!deliveryResponse.ok) {
                    allUpdatesSuccessful = false;
                    throw new Error("Failed to update delivery information.");
                }

                const updatedDeliveryOrder = await deliveryResponse.json();

                if (!updatedDeliveryOrder.success) {
                    allUpdatesSuccessful = false;
                    toast.error(updatedDeliveryOrder.message || "Failed to update delivery information.");
                    return;
                }
            }

            // ✅ Show success message ONLY if all updates were successful
            if (allUpdatesSuccessful) {
                await fetchOrder();
                setIsEditing(false);

                // Fetch updated order details
                if (updatedData.orderId) {
                    // Fetch the updated order details after update
                    if (updatedData.orderStatus === 'Accepted') {
                        navigate(`/accept-order-detail/${updatedData.orderId}`);
                    } else if (updatedData.orderStatus === 'Pending') {
                        // Navigate to a specific page for Pending status
                        navigate(`/order-detail/${updatedData.orderId}`);
                    } else if (updatedData.orderStatus === 'Completed') {
                        // Navigate to a page where Shipped orders are detailed
                        navigate(`/complete-order-detail/${updatedData.orderId}`);
                    } else {
                        // Default redirect when no specific status matches
                        navigate("/dashboard");
                    }
                }
            }

        } catch (err) {
            console.error("Error updating order:", err);
            toast.error(`Error: ${err.message}`);
        }
    };


    // Helper functions to check for changes
    const hasGeneralDetailsChanged = (updatedData) => {
        return updatedData.orderDate !== order.orderDate ||
            updatedData.phoneNumber !== order.phoneNumber ||
            updatedData.optionalNumber !== order.optionalNumber ||
            updatedData.orderStatus !== order.orderStatus ||
            updatedData.deliveryStatus !== order.deliveryStatus ||
            updatedData.deliveryCharge !== order.deliveryCharge ||
            updatedData.discount !== order.discount ||
            updatedData.totalPrice !== order.totalPrice ||
            updatedData.payStatus !== order.payStatus ||
            updatedData.expectedDeliveryDate !== order.expectedDeliveryDate ||
            updatedData.specialNote !== order.specialNote;
    };

    const hasItemsChanged = (updatedData) => {
        return updatedData.orderStatus !== order.orderStatus ||  // Check for orderStatus change
            updatedData.items.some((item, index) => {
                const originalItem = order.items[index];
                return item.quantity !== originalItem.quantity ||
                    item.price !== originalItem.price ||
                    item.booked !== originalItem.booked;
            });
    };


    const hasDeliveryChanged = (updatedData) => {
        return updatedData.deliveryStatus !== order.deliveryStatus ||
            updatedData.deliveryInfo !== order.deliveryInfo;
    };
    const handleEditClick2 = (item,order) => {
        if (!item) return; // Prevent issues if item is undefined
        const updatedItem = {
            ...item,
            orId: order.orderId , // Replace 'default_orId_value' if needed
        };
        setSelectedItem(updatedItem);
        setShowModal(true);
    };

    const handleSubmit2 = async (formData) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/change-quantity`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    itemId: formData.itemId,
                    newQuantity: formData.newQuantity,
                    updatedPrice: formData.updatedPrice,
                    orId: formData.orId,
                    booked: formData.booked,
                }),
            });

            const data = await response.json();

            if (response.ok) {
                fetchOrder();
                console.log("Quantity updated successfully:", data.message);
                alert("Quantity updated successfully!");
            } else {
                console.error("Failed to update quantity:", data.message);
                alert(`Failed to update quantity: ${data.message}`);
            }
        } catch (error) {
            console.error("Error during quantity update:", error);
            alert(`Error updating quantity: ${error.message}`);
        }
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
                                        {!isEditing ? (
                                            <p><strong>Payment Status:</strong>
                                                <span >
                                                    {order.payStatus}
                                                </span>
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Payment Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="payStatus"
                                                    value={formData.payStatus}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Pending">Pending</option>
                                                    <option value="Advanced">Advanced</option>
                                                    <option value="Settled">Settled</option>
                                                    <option value="COD">COD</option>
                                                    <option value="Credit">Credit</option>
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
                                        {formData.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>
                                                <p><strong>Color:</strong> {item.color}</p>
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
                                                        <Button color="danger" className="ms-2" onClick={() => handleRemoveItem(index, item)}>Remove</Button>
                                                        <Button color="secondary" className="ms-2" onClick={() => handleEditClick2(item, order)}>Change Qty</Button>
                                                    </FormGroup>

                                                )}
                                            </li>
                                        ))}
                                    </div>

                                </ul>
                                {isEditing && (
                                    <Button color="primary" className="mt-3" onClick={handleAddItem}>+ Add New Item</Button>
                                )}
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
                                    <p><strong>Advance Amount:</strong> Rs. {order.advance}</p>
                                    <p><strong>Balance Amount:</strong> Rs. {order.balance}</p>
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
