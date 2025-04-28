import React, {useState, useEffect, useRef} from "react";
import { toast } from 'react-toastify';
import { useNavigate } from "react-router-dom"; // Import useNavigate for redirection
import Helmet from "../components/Helmet/Helmet";
import {Container, Row, Col, Button, Input, FormGroup, Label, ModalHeader, ModalBody, ModalFooter, Modal} from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../pages/Navbar";
import "../style/orderDetails.css";
import BillInvoice from "./AccpetBillInvoice";
import ChangeQty from "./changeQty";
import FinalInvoice from "./FinalInvoice";
import ReceiptView from "./ReceiptView";
const CompleteOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate(); // Initialize useNavigate
    const [order, setOrder] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [showModal1, setShowModal1] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [showReceiptView, setShowReceiptView] = useState(false);
    const [receiptData, setReceiptData] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [items, setItems] = useState([]); // State to store supplier data
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [itemdetails, setItemDetails] = useState([]);
    const [selectedItemForReserve, setSelectedItemForReserve] = useState(null);
    const [showStockModal1, setShowStockModal1] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const debounceTimeout = useRef(null);

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
    const calculateBalance = (total,advance) => {
        return Number(total) - Number(advance);
    }
    const calculateItemTotal = () => {
        return formData?.items && Array.isArray(formData.items)
            ? formData.items.reduce((total, item) => {
                // Calculate price after discount per item
                const priceAfterDiscount = (item.quantity * item.unitPrice) - item.totalDiscountAmount;
                return total + (priceAfterDiscount || 0);
            }, 0)
            : 0;
    };
    const handleRemoveItem = (index) => {
        setFormData((prevFormData) => ({
            ...prevFormData,
            items: prevFormData.items.filter((_, i) => i !== index),
        }));
    };
    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/accept-order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();

            // Ensure `isBooked` updates correctly
            const bookedItems = data.order.bookedItems.map((booked) => booked.itemId);
            const updatedItems = data.order.items.map((item) => ({
                ...item,
                booked: bookedItems.includes(item.itemId),
            }));

            setOrder({ ...data.order, items: updatedItems });
            setFormData({ ...data.order, items: updatedItems });

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
        const updatedItemTotal = calculateItemTotal();
        const updatedBalance = calculateBalance(updatedTotal,formData.advance);
        const updatedData = { ...formData, totalPrice: updatedTotal , balance:updatedBalance, netTotal:updatedItemTotal };
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
                    Issued: `/issued-order-detail/${updatedData.orderId}`,
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

    const handleEditClick = (order) => {
        if (!order) return;
        setSelectedOrder(order);
        setShowModal1(true);
    };
    const handleEditClick3 = (order) => {
        if (!order) return;
        setSelectedOrder(order);
        setShowModal2(true);
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

    const handleSubmit3 = async (formData) => {
        setShowModal2(false);
        const updatedData = {
            orID: order.orderId,
            delStatus: formData.deliveryStatus,
            delPrice: formData.delivery,
            discount: order.discount,
            subtotal: formData.subtotal,
            total: formData.billTotal,
            advance: formData.totalAdvance,
            payStatus: formData.paymentType,
            stID: order.saleID,
            paymentAmount: formData.addedAdvance,
            selectedItems: formData.selectedItems,
            balance: formData.billTotal - formData.totalAdvance, // assuming balance calculation
            salesperson: order.salesTeam.employeeName,
            items: order.items,
        };

        try {
            // Make API request to the /isssued-order endpoint
            const response = await fetch('http://localhost:5001/api/admin/main/isssued-order', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });

            const result = await response.json();

            if (response.ok) {
                // Successfully updated
                // Optionally, handle success, e.g., navigate or show a success message
                setReceiptData(updatedData);  // Set data for receipt
                setShowReceiptView(true);         // Show receipt view
            } else {
                // Handle error response
                console.error("Error:", result.message);
                // Optionally, show error message to the user
            }
        } catch (error) {
            console.error("Error making API request:", error.message);
            // Handle network error, show error message to the user
        }
    };

    const handleSubmit = async (formData) => {
        // Destructure the necessary fields from formData
        const { orID,
            isPickup,
            netTotal,
            totalAdvance,
            previousAdvance,
            balance,
            addedAdvance,
            updatedDeliveryCharge,
            updatedDiscount } = formData;

        try {
            // Send request to the "update-invoice" API
            const response = await fetch("http://localhost:5001/api/admin/main/update-invoice", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    orID,
                    isPickup,
                    netTotal,
                    totalAdvance,
                    previousAdvance,
                    balance,
                    addedAdvance,
                    updatedDeliveryCharge,
                    updatedDiscount
                }),
            });

            // Handle the response
            const data = await response.json();

            if (response.ok) {
                fetchOrder();
                toast.success("Invoice and payment updated successfully!");
                setShowModal(false); // Close the modal if it's open
            } else {
                alert(data.error || "Failed to update invoice.");
            }
        } catch (error) {
            console.error("Error updating invoice:", error);
            alert("Server error. Please try again.");
        }
    };
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
        setDropdownOpen(false); // Close dropdown after selection
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

    const ReservedItem = async (selectedItems) => {
        if (!selectedItems || selectedItems.length === 0) {
            console.log("No items selected for reservation");
            return;
        }
        if (!order || !order.orderId) {
            console.log("Order ID is not available");
            return;
        }

        try {
            const requestData = {
                orID: order.orderId,  // Order ID from your data
                selectedItems: selectedItems  // The selected items to be reserved
            };

            // Call the API to reserve items
            const response = await fetch("http://localhost:5001/api/admin/main/special-reserved", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(requestData)
            });

            // Parse the response from the server
            const result = await response.json();

            if (response.ok) {
                toast.success("Items reserved successfully", result);
                setShowStockModal1(false);
            } else {
                toast.error( result.message);
            }

        } catch (error) {
            // Handle any errors that occurred during the API call
            console.error("API call error:", error);
        }
    };

    // Fetch stock when modal opens or selectedItemForReserve changes
    useEffect(() => {
        if (selectedItemForReserve?.itemId || selectedItemForReserve?.I_Id) {
            const itemId = selectedItemForReserve.itemId || selectedItemForReserve.I_Id;
            fetchStockDetails(itemId);
        }
        setSearchTerm("");
        setFilteredItems([]);
        setDropdownOpen(false);
    }, [selectedItemForReserve, showStockModal1]);
    const handleSearchChange1 = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        const filtered = itemdetails.filter((item) =>
            item.I_Id.toString().toLowerCase().includes(term.toLowerCase())
        );
        setFilteredItems(filtered);
        setDropdownOpen(term.trim() !== "" && filtered.length > 0);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            const itemId = selectedItemForReserve?.itemId || selectedItemForReserve?.I_Id;
            fetchStockDetails(itemId);
        }, 500);
    };
    const fetchStockDetails = async (itemId) => {
        console.log(itemId);
        if (!itemId) {
            setItemDetails([]);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:5001/api/admin/main/get-stock-detail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            console.log(data.stockDetails);
            setItemDetails(data.stockDetails || []);
            if (!data.stockDetails?.length) {
                toast.error("No stock details found.");
            }
        } catch (error) {
            toast.error("Error fetching stock: " + error.message);
        } finally {
            setIsLoading(false);
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
                            <h4 className="mb-3 text-center topic">Completed Order Details</h4>
                            <h4 className="mb-3 text-center topic">#{order.orderId}</h4>
                            <div className="order-details">
                                <div className="order-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {order.orderDate}</p>
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
                                        <p><strong>Expected Delivery Date:</strong> {order.expectedDeliveryDate}</p>
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

                                {/* Ordered Items */}
                                <h5 className="mt-4">Ordered Items</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {formData.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>
                                                <p><strong>Color:</strong> {item.color}</p>
                                                <p><strong>Requested Quantity:</strong> {item.quantity}</p>
                                                <p><strong>Unit Price:</strong> Rs. {item.unitPrice}</p>
                                                <p><strong>Discount:</strong> Rs. {item.discount}</p>
                                                <p><strong>Amount:</strong> Rs. {item.amount}</p>
                                                <p><strong>Available Quantity:</strong> {item.availableQuantity}</p>

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
                                                        <Button color="danger" className="ms-2"
                                                                onClick={() => handleRemoveItem(index, item)}>Remove</Button>
                                                        <Button color="secondary" className="ms-2"
                                                                onClick={() => handleEditClick2(item, order)}>Change
                                                            Qty</Button>
                                                        <Button color="primary" className="ms-2" onClick={() => {
                                                            setSelectedItemForReserve(item);
                                                            setShowStockModal1(true);
                                                        }}>Reserved</Button>
                                                    </FormGroup>

                                                )}
                                            </li>
                                        ))}
                                    </div>
                                    {isEditing && (
                                        <Button color="primary" className="mt-3"
                                                onClick={() => setShowStockModal(true)}>+ Add New Item</Button>
                                    )}
                                </ul>

                                <div className="order-summary">
                                    <Row>
                                        <Col md="3">
                                            <p><strong>Item Total:</strong> Rs. {order.netTotal}</p>
                                        </Col>
                                        <Col md="3">
                                            <p><strong>Discount
                                                Price:</strong> Rs. {formData.discount ?? order.discount}</p>
                                            {/*{!isEditing ? (*/}
                                            {/*    <p><strong>Discount Price:</strong> Rs. {formData.discount ?? order.discount}</p>*/}
                                            {/*) : (*/}
                                            {/*    <FormGroup>*/}
                                            {/*        <Label><strong>Discount Price:</strong></Label>*/}
                                            {/*        <Input*/}
                                            {/*            type="text"*/}
                                            {/*            name="discount"*/}
                                            {/*            value={formData.discount ?? order.discount}*/}
                                            {/*            onChange={handleChange}*/}
                                            {/*        />*/}
                                            {/*    </FormGroup>*/}
                                            {/*)}*/}
                                        </Col>

                                        <Col md="3">
                                            <p><strong>Special Discount:</strong> Rs. {order.specialdiscount}</p>
                                        </Col>

                                        <Col md="3">
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
                                        </Col>
                                    </Row>

                                    <Row className="mt-4">
                                        <Col md="4">
                                            <p><strong>Total Amount:</strong> Rs. {calculateTotal()}</p>
                                        </Col>

                                        <Col md="4">
                                            <p><strong>Advance Amount:</strong> Rs. {order.advance}</p>
                                        </Col>

                                        <Col md="4">
                                            <p><strong>Balance Amount:</strong> Rs. {order.balance}</p>
                                        </Col>
                                    </Row>
                                </div>

                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <>
                                            <Button color="primary" onClick={() => setIsEditing(true)}
                                                    disabled={loading}>
                                                {loading ? "Loading..." : "Edit Order"}
                                            </Button>
                                            <Button color="success" className="ms-3"
                                                    onClick={() => handleEditClick(order)} disabled={loading}>
                                                Payment
                                            </Button>
                                            {/* Conditionally render the Issued button based on deliveryStatus */}
                                            {order.deliveryStatus === 'pickup' && (
                                                <Button color="secondary" className="ms-3"
                                                        onClick={() => handleEditClick3(order)} disabled={loading}>
                                                    Issued
                                                </Button>
                                            )}
                                        </>

                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave} disabled={loading}>
                                                {loading ? "Saving..." : "Save Changes"}
                                            </Button>
                                            <Button color="secondary" className="ms-3"
                                                    onClick={() => setIsEditing(false)} disabled={loading}>
                                                Cancel
                                            </Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Add Item</ModalHeader>
                                <ModalBody>
                                    <FormGroup style={{position: "relative"}}>
                                        <Label>Items ID</Label>
                                        <Input type="text" placeholder="Search items" value={searchTerm}
                                               onChange={handleSearchChange}/>
                                        {searchTerm && filteredItems.length > 0 && (
                                            <div className="dropdown">
                                                {filteredItems.map((item) => (
                                                    <div key={item.I_Id} onClick={() => handleSelectItem(item)}
                                                         className="dropdown-item">
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
                                            <Col md={4}><Input type="number" value={item.qty}
                                                               onChange={(e) => handleQtyChange(e, item.I_Id)}/></Col>
                                            <Col md={2}><Button color="danger" onClick={() => handleRemoveItem1(item.I_Id)}>Remove</Button></Col>
                                        </Row>
                                    ))}
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={() => passReservedItem(selectedItems)}>Pass</Button>
                                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>

                            <Modal isOpen={showStockModal1} toggle={() => setShowStockModal1(!showStockModal1)}>
                                <ModalHeader toggle={() => setShowStockModal1(!showStockModal1)}>Special Reserved</ModalHeader>
                                <ModalBody>
                                    {selectedItemForReserve && (
                                        <div className="mb-3">
                                            <strong>Selected Item ID:</strong>{" "}
                                            {selectedItemForReserve.itemId || selectedItemForReserve.I_Id || "N/A"}
                                        </div>
                                    )}

                                    <FormGroup style={{ position: "relative" }}>
                                        <Label>Search Item by ID</Label>
                                        <Input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange1}
                                            placeholder="Type to search..."
                                            autoComplete="off"
                                        />
                                        {dropdownOpen && filteredItems.length > 0 && (
                                            <div
                                                className="dropdown"
                                                style={{
                                                    position: "absolute",
                                                    zIndex: 100,
                                                    backgroundColor: "white",
                                                    border: "1px solid #ddd",
                                                    width: "100%",
                                                    maxHeight: "200px",
                                                    overflowY: "auto",
                                                }}
                                            >
                                                {filteredItems.map((item) => (
                                                    <div
                                                        key={item.I_Id + item.stock_Id}
                                                        onClick={() => handleSelectItem(item)}
                                                        className="dropdown-item"
                                                        style={{ padding: "8px", cursor: "pointer" }}
                                                    >
                                                        {item.I_Id} - {item.pid_Id} - {item.stock_Id}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </FormGroup>

                                    <Label className="mt-3">Selected Items</Label>
                                    <table className="selected-items-table">
                                        <thead>
                                        <tr>
                                            <th>Item ID</th>
                                            <th>Batch ID</th>
                                            <th>Stock ID</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {selectedItems.map((item, index) => (
                                            <tr key={index}>
                                                <td>{item.I_Id}</td>
                                                <td>{item.pid_Id}</td>
                                                <td>{item.stock_Id}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </table>
                                </ModalBody>
                                <ModalFooter>
                                    <Button
                                        color="primary"
                                        onClick={() => ReservedItem(selectedItems, selectedItemForReserve)}
                                    >
                                        Pass
                                    </Button>
                                    <Button color="secondary" onClick={() => setShowStockModal1(false)}>
                                        Cancel
                                    </Button>
                                </ModalFooter>
                            </Modal>


                            {showModal1 && selectedOrder && (
                                <BillInvoice
                                    selectedOrder={selectedOrder}
                                    setShowModal1={setShowModal1}
                                    handleSubmit={handleSubmit}
                                />
                            )}
                            {showModal && selectedItem && (
                                <ChangeQty
                                    selectedItem={selectedItem} // Pass selectedItem as an object
                                    setShowModal={setShowModal}
                                    handleSubmit2={handleSubmit2}
                                />
                            )}
                            {showModal2 && selectedOrder && (
                                <FinalInvoice
                                    selectedOrder={selectedOrder}
                                    setShowModal2={setShowModal2}
                                    handlePaymentUpdate={handleSubmit3}
                                />
                            )}
                            {showReceiptView && (
                                <ReceiptView
                                    receiptData={receiptData}
                                    setShowReceiptView={setShowReceiptView}
                                />
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};
export default CompleteOrderDetails;
