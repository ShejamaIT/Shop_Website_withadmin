import React, { useState, useEffect } from "react";
import {Container, Row, Col, Button, FormGroup, Label, Input, Spinner, ModalHeader, ModalBody, ModalFooter, Modal} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import { useParams } from "react-router-dom";
import '../style/DeliveryNoteDetails.css';
import {toast} from "react-toastify";

const DeliveryNoteDetails = () => {
    const { id } = useParams();
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(""); // Added state for selected date
    const [selectedItems, setSelectedItems] = useState({});
    const [showStockModal, setShowStockModal] = useState(false);
    const [showStockModal1, setShowStockModal1] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState(null);
    const [selectedBalance, setSelectedBalance] = useState(0);
    const [selectedAction, setSelectedAction] = useState("Available");
    const [payment, setPayment] = useState("");
    const [Rpayment, setRPayment] = useState("");
    const [CustomerBalance, setCustomerBalance] = useState(0);
    const [AmountRecevice, setAmountRecevice] = useState("");
    const [DriverBalance, setDriverBalance] = useState(0);
    const [selectedItemStatus, setSelectedItemStatus] = useState({});

    // State for Return & Cancel Reasons
    const [reasons, setReasons] = useState({});
    useEffect(() => {
        fetchDeliveryNote();
    }, [id]);
    const fetchDeliveryNote = async () => {
        try {
            setIsLoading(true);
            const response = await fetch(`http://localhost:5001/api/admin/main/delivery-note?delNoID=${id}`);

            if (!response.ok) {
                throw new Error("Failed to fetch delivery note details.");
            }
            const data = await response.json();
            setDeliveryNote(data.details);
            fetchDeliveryDates(data.details.district);
            setOrders(
                data.orders.map(order => ({
                    ...order,
                    originalOrderStatus: order.orderStatus, originalDeliveryStatus: order.deliveryStatus, received: false,
                }))
            );
            // Initialize reason state for each order
            const initialReasons = {};
            data.orders.forEach(order => {
                initialReasons[order.OrID] = { reason: "", type: "" };
            });
            setReasons(initialReasons);

        } catch (error) {
            setError("Failed to load delivery note details.");
        } finally {
            setIsLoading(false);
        }
    };
    const fetchDeliveryDates = async (district) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/delivery-schedule?district=${district}`);
            const data = await response.json();
            console.log(data);
            if (data.upcomingDates && data.upcomingDates.length > 0) {
                setDeliveryDates(data.upcomingDates);
            } else {
                setDeliveryDates([]);
            }
        } catch (error) {
            toast.error("Error fetching delivery dates.");
            setDeliveryDates([]);
        }
    };
    const handleChange = (e, orderIndex) => {
        const { name, value, type, checked } = e.target;
        const orderId = orders[orderIndex].OrID;

        setOrders(prevOrders =>
            prevOrders.map((order, i) =>
                i === orderIndex ? { ...order, [name]: value } : order
            )
        );
        setOrders(prevOrders =>
            prevOrders.map((order, i) =>
                i === orderIndex
                    ? {
                        ...order,
                        [name]: type === "checkbox" ? checked : value,
                        received: type === "checkbox" ? checked : order.received
                    }
                    : order
            )
        );
        if (name === "orderStatus" && (value === "Returned" || value === "Cancelled")) {
            setSelectedItems(prev => ({ ...prev, [orderId]: [] })); // Reset selection
        }
    };
    const handleItemSelection = (orderId, itemId, stockId) => {
        // Create a unique identifier for each issued item based on both itemId and stockId
        const itemKey = `${itemId}-${stockId}`;

        setSelectedItems(prev => ({
            ...prev,
            [orderId]: prev[orderId]?.includes(itemKey)
                ? prev[orderId].filter(id => id !== itemKey) // Remove if already selected
                : [...(prev[orderId] || []), itemKey] // Add if not selected
        }));
        setShowStockModal(true)
    };
    const handleReasonChange = (e, orderId) => {
        const { name, value } = e.target;
        setReasons(prev => ({
            ...prev,
            [orderId]: { ...prev[orderId], [name]: value }
        }));
    };
    const handleItemStatusChange = (itemKey, newStatus) => {
        console.log("Updating status for:", itemKey);
        console.log("New status:", newStatus);

        setSelectedItemStatus(prev => ({
            ...prev,
            [itemKey]: newStatus,  // Update status for this specific item
        }));
    };
    const handleConfirmSelection = () => {
        if (!selectedItems || Object.keys(selectedItems).length === 0) {
            console.warn("No items selected for status update.");
            return;
        }

        // Iterate over the selected items and update their status
        Object.values(selectedItems).forEach(itemArray => {
            itemArray.forEach(itemKey => {
                handleItemStatusChange(itemKey, selectedAction);
            });
        });

        // passReservedItem(selectedItems, selectedAction); // Ensure this function handles updates correctly
        setShowStockModal(false); // Close modal
    };
    const handlePayment = () => {
        if (!payment || isNaN(payment) || Number(payment) <= 0) {
            alert("Please enter a valid payment amount.");
            return;
        }

        console.log("Payment received:", payment);
        setShowStockModal1(false);
    };
    const setDate = (e) => {
        const routedate = e.target.value;
        setSelectedDeliveryDate(routedate); // Set the selected date
    };
    const handleSave = async () => {
        const rescheduledDate = selectedDeliveryDate || "";

        // Filter and map orders to include selected items and their status
        const updatedOrders = orders
            .filter(order =>
                order.orderStatus !== order.originalOrderStatus ||
                order.deliveryStatus !== order.originalDeliveryStatus ||
                order.received
            )
            .map(order => ({
                OrID: order.OrID,
                orderStatus: order.orderStatus,
                deliveryStatus: order.deliveryStatus,
                received: order.received,
                reason: reasons[order.OrID]?.reason || "N/A",
                reasonType: reasons[order.OrID]?.type || "N/A",
                rescheduledDate,
                returnedItems: selectedItems[order.OrID]?.map(itemKey => {
                    const [itemId, stockId] = itemKey.split("-");
                    const itemStatus = selectedItemStatus[itemKey] || "Available";
                    return { itemId, stockId, status: itemStatus };
                }) || [],
                payment: order.orderStatus === "Returned" || "Canceled" ? payment : 0,
            }));

        console.log(updatedOrders);

        try {
            const hasReturnedOrder = updatedOrders.some(order => order.orderStatus === "Returned");
            const allIssued = updatedOrders.length > 0 && updatedOrders.every(order => order.orderStatus === "Issued");

            if (hasReturnedOrder) {
                // Call delivery-return API if any order is returned
                const returnResponse = await fetch("http://localhost:5001/api/admin/main/delivery-return", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        deliveryNoteId: id,
                        updatedOrders,
                    }),
                });

                const returnResult = await returnResponse.json();
                if (returnResult.success) {
                    toast.success("Returned orders processed successfully.");
                } else {
                    alert("Failed to process returned orders.");
                }
            }

            if (allIssued) {
                // Call delivery-done API only when all orders are issued
                const doneResponse = await fetch("http://localhost:5001/api/admin/main/delivery-done", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        deliveryNoteId: id,
                        updatedOrders,
                    }),
                });

                const doneResult = await doneResponse.json();
                if (doneResult.success) {
                    toast.success("Delivery note marked as done successfully.");
                } else {
                    alert("Failed to mark delivery note as done.");
                }
            }

            fetchDeliveryNote();
            setIsEditing(false); // Exit edit mode
        } catch (error) {
            alert("An error occurred while updating the delivery note.");
        }
    };
    // Function to open modal and set selected order details
    const handleOpenModal = (OrID, balance) => {
        setSelectedOrderId(OrID);
        setSelectedBalance(balance);
        setShowStockModal1(true);
    };
    const handleCustomerBalance = (e) => {
        const receivedPayment = e.target.value;
        setRPayment(receivedPayment);
        const dueAmount = parseFloat(payment) || 0;
        const received = parseFloat(receivedPayment) || 0;
        setCustomerBalance(dueAmount - received);
    };
    const handleDriverBalance = (e) => {
        const driverReceived = e.target.value;
        setAmountRecevice(driverReceived);
        const received = parseFloat(Rpayment) || 0;
        const driverAmount = parseFloat(driverReceived) || 0;
        setDriverBalance(received - driverAmount);
    };

    if (isLoading) {
        return (
            <div className="text-center mt-5">
                <Spinner color="primary" />
                <p>Loading delivery note details...</p>
            </div>
        );
    }
    if (error) {
        return <div className="text-center text-danger mt-5">{error}</div>;
    }
    if (!deliveryNote) {
        return <div className="text-center mt-5 text-warning">No delivery note data found.</div>;
    }
    return (
        <Helmet title={`Delivery Note - ${deliveryNote.delNoID}`}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h4 className="mb-3 text-center topic">Delivery Note #{deliveryNote.delNoID}</h4>
                            <div className="delivery-note-details">
                                <div className="delivery-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="order-general">
                                        <p><strong>Driver Name:</strong> {deliveryNote.driverName}</p><p><strong>Vehicle:</strong> {deliveryNote.vehicalName}</p>
                                        <p><strong>Hire Charge:</strong> Rs. {deliveryNote.hire}</p><p><strong>Balance to Collect:</strong> Rs. {deliveryNote.balanceToCollect}</p>
                                        <p><strong>Delivery Date:</strong> {new Date(deliveryNote.date).toLocaleDateString()}</p>
                                        <p><strong>District:</strong> {deliveryNote.district}</p><p><strong>Status:</strong> {deliveryNote.status}</p>
                                    </div>
                                    <h5 className="mt-4">Orders & Issued Items</h5>
                                    <div className="delivery-orders">
                                        <ul className="order-items gap-2">
                                            <div className="order-general">
                                                {orders.map((order, index) => (
                                                    <div key={order.OrID} className="order-box">
                                                        <p><strong>Order ID:</strong> {order.OrID}</p>
                                                        {!isEditing ? (
                                                            <p><strong>Order Status:</strong> {order.orderStatus}</p>
                                                        ) : (
                                                            <>
                                                                <FormGroup>
                                                                    <Label><strong>Order Status:</strong></Label>
                                                                    <Input type="select" name="orderStatus" value={order.orderStatus} onChange={(e) => handleChange(e, index)}>
                                                                        <option value="Issued">Issued</option>
                                                                        <option value="Returned">Returned</option>
                                                                        <option value="Cancelled">Cancelled</option>
                                                                    </Input>
                                                                </FormGroup>
                                                                {(order.orderStatus === "Returned" || order.orderStatus === "Cancelled") && (
                                                                    <FormGroup>
                                                                        <Label><strong>{order.orderStatus} Reason</strong></Label>
                                                                        <Input type="select" name="reason" value={reasons[order.OrID]?.reason} onChange={(e) => handleReasonChange(e, order.OrID)}>
                                                                            <option value="">Select a Reason</option>
                                                                            <option value="Customer Not Answer">Customer Not Answer</option>
                                                                            <option value="Customer Rejected">Customer Rejected</option>
                                                                            <option value="Customer Has No Money">Customer Has No Money</option>
                                                                            <option value="Driver Issue">Driver Issue</option>
                                                                            <option value="Vehicle Issue">Vehicle Issue</option>
                                                                            <option value="Other">Other</option>
                                                                        </Input>
                                                                        {reasons[order.OrID]?.reason === "Other" && (
                                                                            <Input type="text" name="customReason" placeholder="Enter custom reason" value={reasons[order.OrID]?.customReason || ""} onChange={(e) => handleReasonChange(e, order.OrID)} className="mt-2"/>
                                                                        )}
                                                                    </FormGroup>
                                                                )}
                                                                {order.orderStatus === "Returned" && (
                                                                    <FormGroup>
                                                                        <Label><strong>Reschedule Date</strong></Label>
                                                                        {deliveryDates.length > 0 ? (
                                                                            <Input type="select" id="deliveryDateSelect" value={selectedDeliveryDate} onChange={setDate}>
                                                                                <option value="">-- Select Date --</option>
                                                                                {deliveryDates.map((date, index) => (
                                                                                    <option key={index} value={new Date(date).toISOString().split("T")[0]}>
                                                                                        {new Date(date).toLocaleDateString()}
                                                                                    </option>
                                                                                ))}
                                                                            </Input>
                                                                        ) : (
                                                                            <Input type="date" id="customDeliveryDate" value={selectedDeliveryDate} onChange={(e) => setSelectedDeliveryDate(e.target.value)}/>
                                                                        )}
                                                                    </FormGroup>
                                                                )}
                                                            </>
                                                        )}
                                                        {!isEditing ? (
                                                            <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                                        ) : (
                                                            <FormGroup>
                                                                <Label><strong>Delivery Status:</strong></Label>
                                                                <Input type="select" name="deliveryStatus" value={order.deliveryStatus} onChange={(e) => handleChange(e, index)}>
                                                                    <option value="Delivered">Delivered</option>
                                                                    <option value="Returned">Returned</option>
                                                                </Input>
                                                            </FormGroup>
                                                        )}
                                                        {/* Display Issued Items for this Order */}
                                                        <div className="issued-items">
                                                            <h6 className="mt-3">Issued Items:</h6>
                                                            {order.issuedItems.length > 0 ? (
                                                                order.issuedItems.map((item, itemIndex) => {
                                                                    const itemKey = `${item.I_Id}-${item.stock_Id}`;  // Use both itemId and stockId as the key
                                                                    return (
                                                                        <div key={itemIndex} className="item-box">
                                                                            <p><strong>Item ID:</strong> {item.I_Id}</p>
                                                                            <p><strong>Stock ID:</strong> {item.stock_Id}</p>
                                                                            <p><strong>Date Issued:</strong> {new Date(item.datetime).toLocaleString()}</p>

                                                                            {(order.orderStatus === "Returned" || order.orderStatus === "Cancelled") && (
                                                                                <div className="form-check">
                                                                                    <input type="checkbox" className="form-check-input" id={`select-item-${order.OrID}-${itemKey}`} checked={selectedItems[order.OrID]?.includes(itemKey) || false} onChange={() => handleItemSelection(order.OrID, item.I_Id, item.stock_Id)}  // Pass both itemId and stockId
                                                                                    />
                                                                                    <label className="form-check-label" htmlFor={`select-item-${order.OrID}-${itemKey}`}>
                                                                                        Select Item
                                                                                    </label>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })
                                                            ) : (
                                                                <p className="text-muted">No issued items found for this order.</p>
                                                            )}
                                                        </div>
                                                        {order.balanceAmount > 0 ? (
                                                            isEditing ? (
                                                                <FormGroup>
                                                                    <Label><strong>Balance:</strong> Rs.{order.balanceAmount}</Label>
                                                                    <div className="d-flex align-items-center">
                                                                        <Button className='ms-4' onClick={() => handleOpenModal(order.OrID, order.balanceAmount)}>
                                                                            Payment
                                                                        </Button>
                                                                    </div>
                                                                </FormGroup>
                                                            ) : (
                                                                <p><strong>Balance:</strong> Rs.{order.balanceAmount}</p>
                                                            )
                                                        ) : (
                                                            <p><strong>Balance:</strong> Rs.{order.balanceAmount}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </ul>
                                    </div>
                                </div>
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <Button color="primary" onClick={() => setIsEditing(true)}>Edit Delivery Note</Button>
                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    )}
                                </div>
                            </div>
                            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Issued Stock</ModalHeader>
                                <ModalBody>
                                    <FormGroup style={{ position: "relative" }}>
                                        <Label>What to do to this item?</Label>
                                        <Input
                                            type="select"
                                            value={selectedAction}
                                            onChange={(e) => setSelectedAction(e.target.value)}
                                        >
                                            <option value="Available">Set as Available</option>
                                            <option value="Reserved">Set as Reserved</option>
                                            <option value="Damage">Set as Damage</option>
                                        </Input>
                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handleConfirmSelection}>Pass</Button>
                                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
                            <Modal isOpen={showStockModal1} toggle={() => setShowStockModal1(false)}>
                                <ModalHeader toggle={() => setShowStockModal1(false)}>Payment</ModalHeader>
                                <ModalBody>
                                    <FormGroup style={{ position: "relative" }}>
                                        <Label><strong>Order ID:</strong> {selectedOrderId}</Label>
                                        <Label><strong>Due Amount:</strong> Rs.{selectedBalance}</Label>

                                        <Label>Received Payment</Label>
                                        <Input type="number" onChange={handleCustomerBalance} />
                                        <Label><strong>Customer Balance:</strong> Rs.{CustomerBalance.toFixed(2)}</Label>

                                        <Label>Amount Received</Label>
                                        <Input type="number" value={AmountRecevice} onChange={handleDriverBalance} />
                                        <Label><strong>Driver Balance:</strong> Rs.{DriverBalance.toFixed(2)}</Label>
                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handlePayment}>Payment Settle</Button>
                                    <Button color="secondary" onClick={() => setShowStockModal1(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};
export default DeliveryNoteDetails;
