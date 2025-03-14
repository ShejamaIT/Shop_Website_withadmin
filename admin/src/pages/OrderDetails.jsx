import React, {useEffect, useState} from "react";
import {toast} from 'react-toastify';
import {useNavigate, useParams} from "react-router-dom";
import {Button, Col, Container, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import "../style/orderDetails.css";
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
    const [showStockModal, setShowStockModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]); // State to store supplier data
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        fetchOrder();
    }, [id]);
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/allitems");
                const data = await response.json();
                setItems(data || []);
                setFilteredItems(data || []);
            } catch (error) {
                toast.error("Error fetching items.");
            }
        };
        fetchItems();
    }, []);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");
            const data = await response.json();
            console.log(data);
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
    const calculateBalance = (total,advance) => {
        return Number(total) - Number(advance);
    }

    const handleRemoveItem = (index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            items: prevFormData.items.filter((_, i) => i !== index),
        }));
    };

    const handleChange = (e, index) => {
        const { name, value, type, checked } = e.target;

        setFormData(prevFormData => {
            let updatedFormData = { ...prevFormData };

            console.log("Previous Form Data:", prevFormData);

            if (["deliveryStatus", "orderStatus", "payStatus"].includes(name)) {
                // ✅ Ensure direct update for status fields
                updatedFormData = { ...updatedFormData, [name]: value };
            }
            else if (name in prevFormData) {
                updatedFormData[name] = value;
            }
            else if (prevFormData.deliveryInfo && name in prevFormData.deliveryInfo) {
                updatedFormData.deliveryInfo = {
                    ...prevFormData.deliveryInfo,
                    [name]: value,
                };
            }
            else if (name === "booked" && index !== undefined) {
                updatedFormData.items = prevFormData.items.map((item, i) =>
                    i === index ? { ...item, booked: checked } : item
                );
            }
            else if (name === "quantity" && index !== undefined) {
                const newQuantity = value === "" ? 0 : parseInt(value, 10);
                if (!isNaN(newQuantity) && newQuantity >= 0) {
                    updatedFormData.items = prevFormData.items.map((item, i) =>
                        i === index
                            ? { ...item, quantity: newQuantity, price: newQuantity * item.unitPrice }
                            : item
                    );
                }
            }
            else if (["discount", "deliveryCharge"].includes(name)) {
                const updatedValue = value === "" ? 0 : parseFloat(value);
                if (!isNaN(updatedValue) && updatedValue >= 0) {
                    updatedFormData[name] = updatedValue;
                }
            }

            // **Recalculate Total Price**
            updatedFormData.totalPrice = (updatedFormData.items || []).reduce((total, item) => total + (item.price || 0), 0) +
                (updatedFormData.deliveryCharge || 0) - (updatedFormData.discount || 0);

            console.log("Updated Form Data:", updatedFormData);
            return updatedFormData;
        });
    };


    const handleSave = async () => {
        const updatedTotal = calculateTotal();
        const updatedBalance = calculateBalance(updatedTotal,formData.advance);
        const updatedData = { ...formData, totalPrice: updatedTotal , balance:updatedBalance };
        console.log(updatedData);
        let updatedGeneralOrder = null;
        try {
            // Step 1: Update order general details only if changed
            if (hasGeneralDetailsChanged(updatedData)) {
                const generalResponse = await fetch(`http://localhost:5001/api/admin/main/update-order-details`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                const generalResult = await generalResponse.json();

                if (!generalResponse.ok || !generalResult.success) {
                    toast.error(generalResult.message || "Failed to update order general details.");
                } else {
                    updatedGeneralOrder = generalResult;
                }
            }

            // Step 2: Update order items only if changed
            if (hasItemsChanged(updatedData)) {
                const itemsResponse = await fetch(`http://localhost:5001/api/admin/main/update-order-items`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                const itemsResult = await itemsResponse.json();

                if (!itemsResponse.ok || !itemsResult.success) {
                    toast.error(itemsResult.message || "Failed to update order items.");
                }
            }

            // Step 3: Update delivery information only if changed
            if (hasDeliveryChanged(updatedData)) {
                const deliveryResponse = await fetch(`http://localhost:5001/api/admin/main/update-delivery`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedData),
                });

                const deliveryResult = await deliveryResponse.json();

                if (!deliveryResponse.ok || !deliveryResult.success) {
                    toast.error(deliveryResult.message || "Failed to update delivery details.");
                }
            }

            // ✅ Show success message & navigate if all updates succeed
            await fetchOrder();
            setIsEditing(false);
            toast.success("Order Updated successfully...");
            if (updatedData.orderId) {
                const orderRoutes = {
                    Accepted: `/accept-order-detail/${updatedData.orderId}`,
                    Pending: `/order-detail/${updatedData.orderId}`,
                    Completed: `/complete-order-detail/${updatedData.orderId}`,
                };
                navigate(orderRoutes[updatedData.orderStatus] || "/dashboard");
            }
        } catch (err) {
            console.error("Error updating order:", err);
            toast.error(`Error: ${err.message}`);
        }
    };

    // ✅ Improved change detection functions
    const hasGeneralDetailsChanged = (updatedData) => {
        return updatedData.phoneNumber !== order.phoneNumber ||
            updatedData.optionalNumber !== order.optionalNumber ||
            updatedData.orderStatus !== order.orderStatus ||
            updatedData.deliveryStatus !== order.deliveryStatus ||
            updatedData.deliveryCharge !== order.deliveryCharge ||
            updatedData.discount !== order.discount ||
            updatedData.totalPrice !== order.totalPrice ||
            updatedData.payStatus !== order.payStatus ||
            updatedData.specialNote !== order.specialNote;
    };

    const hasItemsChanged = (updatedData) => {
        // Check for added or removed items
        const updatedItemIds = new Set(updatedData.items.map(item => item.itemId));
        const originalItemIds = new Set(order.items.map(item => item.itemId));

        if (updatedItemIds.size !== originalItemIds.size || [...updatedItemIds].some(id => !originalItemIds.has(id))) {
            return true; // Items were added or removed
        }

        // Check for quantity, price, or booking status changes
        return updatedData.items.some(updatedItem => {
            const originalItem = order.items.find(item => item.itemId === updatedItem.itemId);
            return originalItem && (
                updatedItem.quantity !== originalItem.quantity ||
                updatedItem.price !== originalItem.price ||
                updatedItem.booked !== originalItem.booked
            );
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

    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredItems(items);
        } else {
            const filtered = items.filter((item) =>
                item.I_Id.toString().includes(value) || item.I_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };
    const handleSelectItem = (item) => {
        if (!selectedItems.some((selected) => selected.I_Id === item.I_Id)) {
            setSelectedItems([...selectedItems, { ...item, qty: 1, price: item.price }]); // Ensure price is initialized
        }
        setSearchTerm("");
        setFilteredItems([]);
    };
    const handleQtyChange = (e, itemId) => {
        const value = parseInt(e.target.value) || 1;
        setSelectedItems((prevItems) =>
            prevItems.map((item) => item.I_Id === itemId ? { ...item, qty: value  } : item)
        );
    };
    const handleRemoveItem1 = (itemId) => {
        setSelectedItems((prevItems) => prevItems.filter((item) => item.I_Id !== itemId));
    };
    const passReservedItem = (selectedItems) => {
        setSelectedItem(selectedItems);
        handleAddItem(selectedItems);
        setShowStockModal(false);
    };

    const handleAddItem = (selectedItems) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            items: [
                ...prevFormData.items,
                ...selectedItems.map(item => ({
                    itemId: item.I_Id,
                    itemName: item.I_name,
                    color: item.color,
                    availableQuantity: item.availableQty,
                    quantity: item.qty || 0,
                    unitPrice: item.price,
                    price: item.qty * item.price, // Calculate price
                    booked: false, // Default booked status
                    stockQuantity: item.stockQty,
                    bookedQuantity: item.bookedQuantity || 0,
                })),
            ],
        }));
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}/${(date.getMonth() + 1).toString().padStart(2, "0")}/${date.getFullYear()}`;
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
                            <h4 className="mb-3 text-center topic">Pending Order Details</h4>
                            <h4 className="mb-3 text-center topic">#{order.orderId}</h4>
                            <div className="order-details">
                                <div className="order-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {order.orderDate}</p>
                                        <p><strong>Customer Email:</strong> {order.customer.name}</p>

                                        {!isEditing ? (
                                            <p><strong>Order Status:</strong>
                                                <span className={`status ${order.orderDetails.status.toLowerCase()}`}>
                                                    {order.orderDetails.status}
                                                </span>
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Order Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="orderStatus"
                                                    value={formData.orderDetails.status}
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
                                                {order.deliveryInfo.status}
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Delivery Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="deliveryStatus"
                                                    value={formData.deliveryInfo.status}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Delivery">Delivery</option><option value="Pick up">Pick up</option>
                                                </Input>
                                            </FormGroup>
                                        )}
                                        {!isEditing ? (
                                            <p><strong>Payment Status:</strong>
                                                <span >
                                                    {order.orderDetails.paymentStatus}
                                                </span>
                                            </p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Payment Status:</strong></Label>
                                                <Input
                                                    type="select"
                                                    name="payStatus"
                                                    value={formData.orderDetails.paymentStatus}
                                                    onChange={handleChange}
                                                >
                                                    <option value="Pending">Pending</option><option value="Advanced">Advanced</option>
                                                    <option value="Settled">Settled</option><option value="COD">COD</option><option value="Credit">Credit</option>
                                                </Input>
                                            </FormGroup>
                                        )}
                                        <p><strong>Expected Delivery Date:</strong> {order.deliveryInfo.scheduleDate}</p>
                                        {!isEditing ? (
                                            <p><strong>Contact:</strong> {order.customer.phoneNumber}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Contact:</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="phoneNumber"
                                                    value={formData.customer.phoneNumber ?? order.customer.phoneNumber}
                                                    onChange={handleChange}
                                                />
                                            </FormGroup>
                                        )}
                                        {!isEditing ? (
                                            <p><strong>Optional Contact:</strong> {order.customer.optionalNumber}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Optional Contact:</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="optionalNumber"
                                                    value={formData.customer.optionalNumber ?? order.customer.optionalNumber}
                                                    onChange={handleChange}
                                                />
                                            </FormGroup>
                                        )}
                                        <p><strong>Special Note:</strong> {order.orderDetails.specialNote}</p>
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
                                                            type="text" name="address" value={formData.deliveryInfo.address ?? order.deliveryInfo.address} onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>District:</strong> {order.deliveryInfo.district}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>District:</strong></Label>
                                                        <Input
                                                            type="text" name="district" value={formData.deliveryInfo.district ?? order.deliveryInfo.district} onChange={handleChange}
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
                                                <p><strong>Amount:</strong> Rs. {item.totalPrice}</p>
                                                <p><strong>Available Quantity:</strong> {item.availableQuantity}</p>
                                                <p><strong>Unit Price:</strong> Rs. {item.unitPrice}</p>
                                                {isEditing && (
                                                    <FormGroup check>
                                                        <Label check>
                                                            <Input
                                                                type="checkbox" name="booked" checked={formData.items[index]?.booked || false} onChange={(e) => handleChange(e, index)}
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
                                    {isEditing && (
                                        <Button color="primary" className="mt-3" onClick={() => setShowStockModal(true)}>+ Add New Item</Button>
                                    )}
                                </ul>

                                {/* Order Summary */}
                                <div className="order-summary">
                                    {!isEditing ? (
                                        <p><strong>Discount Price:</strong> Rs. {formData.orderDetails.discount ?? order.orderDetails.discount}</p>
                                    ) : (
                                        <FormGroup>
                                            <Label><strong>Discount Price:</strong></Label>
                                            <Input
                                                type="text" name="discount" value={formData.orderDetails.discount ?? order.orderDetails.discount} onChange={handleChange}
                                            />
                                        </FormGroup>
                                    )}

                                    {formData.deliveryStatus === "Pick up" ? (
                                        <p><strong>Delivery Amount:</strong> Rs. {formData.orderDetails.deliveryCharge ?? order.orderDetails.deliveryCharge}</p>
                                    ) : (
                                        !isEditing ? (
                                            <p><strong>Delivery Amount:</strong> Rs. {formData.orderDetails.deliveryCharge ?? order.orderDetails.deliveryCharge}</p>
                                        ) : (
                                            <FormGroup>
                                                <Label><strong>Delivery Amount:</strong></Label>
                                                <Input
                                                    type="text" name="deliveryCharge" value={formData.orderDetails.deliveryCharge ?? order.orderDetails.deliveryCharge} onChange={handleChange}
                                                />
                                            </FormGroup>
                                        )
                                    )}

                                    {/*<p><strong>Total Amount:</strong> Rs. {formData.totalPrice ?? order.totalPrice}</p>*/}
                                    <p><strong>Total Amount:</strong> Rs. {calculateTotal()}</p>
                                    <p><strong>Advance Amount:</strong> Rs. {order.orderDetails.advance}</p>
                                    <p><strong>Balance Amount:</strong> Rs. {order.orderDetails.balance}</p>
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
                            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Add Item</ModalHeader>
                                <ModalBody>
                                    <FormGroup style={{ position: "relative" }}>
                                        <Label>Items ID</Label>
                                        <Input type="text" placeholder="Search items" value={searchTerm} onChange={handleSearchChange} />
                                        {searchTerm && filteredItems.length > 0 && (
                                            <div className="dropdown">
                                                {filteredItems.map((item) => (
                                                    <div key={item.I_Id} onClick={() => handleSelectItem(item)} className="dropdown-item">
                                                        {item.I_name} - Rs.{item.price}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </FormGroup>
                                    <Label>Selected Items</Label>
                                    {selectedItems.map((item) => (
                                        <Row key={item.I_Id} className="mt-2">
                                            <Col md={4}><Label>{item.I_name} - Rs.{item.price}</Label></Col>
                                            <Col md={4}><Input type="number" value={item.qty} onChange={(e) => handleQtyChange(e, item.I_Id)} /></Col>
                                            <Col md={2}><Button color="danger" onClick={() => handleRemoveItem1(item.I_Id)}>Remove</Button></Col>
                                        </Row>
                                    ))}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={() => passReservedItem(selectedItems)}>Pass</Button>
                                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
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
