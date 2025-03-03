import React, { useState, useEffect } from "react";
import { Container, Row, Col, Button, FormGroup, Label, Input, Spinner } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import { useParams } from "react-router-dom";

const DeliveryNoteDetails = () => {
    const { id } = useParams();
    const [deliveryNote, setDeliveryNote] = useState(null);
    const [orders, setOrders] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);

    // State for Return & Cancel Reasons
    const [reasons, setReasons] = useState({});

    useEffect(() => {
        const fetchDeliveryNote = async () => {
            try {
                setIsLoading(true);
                const response = await fetch(`http://localhost:5001/api/admin/main/delivery-note?delNoID=${id}`);

                if (!response.ok) {
                    throw new Error("Failed to fetch delivery note details.");
                }

                const data = await response.json();
                setDeliveryNote(data.details);
                setOrders(
                    data.orders.map(order => ({
                        ...order,
                        originalOrderStatus: order.orderStatus,
                        originalDeliveryStatus: order.deliveryStatus,
                        received: false, // Checkbox tracking
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

        fetchDeliveryNote();
    }, [id]);

    const handleChange = (e, orderIndex) => {
        const { name, value, type, checked } = e.target;
        const orderId = orders[orderIndex].OrID;

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

        // If the order is returned or canceled, show reason selection
        if (name === "orderStatus") {
            if (value === "Returned" || value === "Cancelled") {
                setReasons(prev => ({
                    ...prev,
                    [orderId]: { reason: "", type: value }
                }));
            } else {
                setReasons(prev => ({
                    ...prev,
                    [orderId]: { reason: "", type: "" }
                }));
            }
        }
    };

    const handleReasonChange = (e, orderId) => {
        const { value } = e.target;
        setReasons(prev => ({
            ...prev,
            [orderId]: { ...prev[orderId], reason: value }
        }));
    };

    const handleSave = async () => {
        // Identify changed orders
        const updatedOrders = orders
            .filter(order =>
                order.orderStatus !== order.originalOrderStatus ||
                order.deliveryStatus !== order.originalDeliveryStatus ||
                order.received // Ensure received orders are also included
            )
            .map(order => ({
                OrID: order.OrID,
                orderStatus: order.orderStatus,
                deliveryStatus: order.deliveryStatus,
                received: order.received, // Include received status
                reason: reasons[order.OrID]?.reason || "N/A", // Attach reason if applicable
                reasonType: reasons[order.OrID]?.type || "N/A" // Attach reason type (Returned/Cancelled)
            }));

        console.log("Updated Orders with Reasons and Received:", updatedOrders);

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
                                        <p><strong>Driver Name:</strong> {deliveryNote.driverName}</p>
                                        <p><strong>Vehicle:</strong> {deliveryNote.vehicalName}</p>
                                        <p><strong>Hire Charge:</strong> Rs. {deliveryNote.hire}</p>
                                        <p><strong>Balance to Collect:</strong> Rs. {deliveryNote.balanceToCollect}</p>
                                        <p><strong>Delivery Date:</strong> {new Date(deliveryNote.date).toLocaleDateString()}</p>
                                        <p><strong>District:</strong> {deliveryNote.district}</p>
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
                                                                    <Input
                                                                        type="select"
                                                                        name="orderStatus"
                                                                        value={order.orderStatus}
                                                                        onChange={(e) => handleChange(e, index)}
                                                                    >
                                                                        <option value="Issued">Issued</option>
                                                                        <option value="Returned">Returned</option>
                                                                        <option value="Cancelled">Cancelled</option>
                                                                    </Input>
                                                                </FormGroup>
                                                                {order.orderStatus === "Returned" && (
                                                                    <FormGroup>
                                                                        <Label>Return Reason</Label>
                                                                        <Input
                                                                            type="select"
                                                                            value={reasons[order.OrID]?.reason}
                                                                            onChange={(e) => handleReasonChange(e, order.OrID)}
                                                                        >
                                                                            <option value="">Select a Reason</option>
                                                                            <option value="Customer Not Answer">Customer Not Answer</option>
                                                                            <option value="Customer Rejected">Customer Rejected</option>
                                                                            <option value="Customer Has No money">Customer Has No money</option>
                                                                            <option value="Driver Issue">Driver Issue</option>
                                                                            <option value="Vehical Issue">Vehical Issue</option>
                                                                        </Input>
                                                                    </FormGroup>
                                                                )}

                                                                {order.orderStatus === "Cancelled" && (
                                                                    <FormGroup>
                                                                        <Label>Cancel Reason</Label>
                                                                        <Input
                                                                            type="select"
                                                                            value={reasons[order.OrID]?.reason}
                                                                            onChange={(e) => handleReasonChange(e, order.OrID)}
                                                                        >
                                                                            <option value="">Select a Reason</option>
                                                                            <option value="Customer Not Answer">Customer Not Answer</option>
                                                                            <option value="Customer Rejected">Customer Rejected</option>
                                                                            <option value="Customer Has No money">Customer Has No money</option>
                                                                            <option value="Driver Issue">Driver Issue</option>
                                                                            <option value="Vehical Issue">Vehical Issue</option>
                                                                        </Input>
                                                                    </FormGroup>
                                                                )}
                                                            </>
                                                        )}

                                                        {!isEditing ? (
                                                            <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                                        ) : (
                                                            <FormGroup>
                                                                <Label><strong>Delivery Status:</strong></Label>
                                                                <Input
                                                                    type="select"
                                                                    name="deliveryStatus"
                                                                    value={order.deliveryStatus}
                                                                    onChange={(e) => handleChange(e, index)}
                                                                >
                                                                    <option value="Issued">Issued</option>
                                                                    <option value="Delivered">Delivered</option>
                                                                    <option value="Returned">Returned</option>
                                                                </Input>
                                                            </FormGroup>
                                                        )}
                                                        {order.balance > 0 ? (
                                                            isEditing ? (
                                                                <FormGroup>
                                                                    <Label><strong>Balance:</strong> Rs.{order.balance}</Label>
                                                                    <div className="d-flex align-items-center">
                                                                        <Input
                                                                            type="checkbox"
                                                                            id={`received-${order.OrID}`}
                                                                            checked={order.received}
                                                                            onChange={(e) => handleChange(e, index)}
                                                                        />
                                                                        <Label for={`received-${order.OrID}`} className="ms-2">Received</Label>
                                                                    </div>
                                                                </FormGroup>
                                                            ) : (
                                                                <p><strong>Balance:</strong> Rs.{order.balance}</p>
                                                            )
                                                        ) : (
                                                            <p><strong>Balance:</strong> Rs.{order.balance}</p>
                                                        )}

                                                        {/* Display Issued Items for this Order */}
                                                        <div className="issued-items">
                                                            <h6 className="mt-3">Issued Items:</h6>
                                                            {order.issuedItems.length > 0 ? (
                                                                order.issuedItems.map((item, itemIndex) => (
                                                                    <div key={itemIndex} className="item-box">
                                                                        <p><strong>Item ID:</strong> {item.I_Id}</p>
                                                                        <p><strong>Stock ID:</strong> {item.stock_Id}</p>
                                                                        <p><strong>Date Issued:</strong> {new Date(item.datetime).toLocaleString()}</p>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <p className="text-muted">No issued items found for this order.</p>
                                                            )}
                                                        </div>
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
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default DeliveryNoteDetails;
