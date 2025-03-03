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
                setOrders(data.orders);

            } catch (error) {
                console.error("Error fetching delivery note details:", error);
                setError("Failed to load delivery note details.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchDeliveryNote();
    }, [id]);

    const handleChange = (e, orderIndex) => {
        const { name, value } = e.target;

        setOrders(prevOrders => {
            return prevOrders.map((order, i) =>
                i === orderIndex
                    ? { ...order, [name]: value }
                    : order
            );
        });
    };

    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/update-delivery-note`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    delNoID: deliveryNote.delNoID,
                    orders: orders.map(order => ({
                        OrID: order.OrID,
                        orderStatus: order.orderStatus,
                        deliveryStatus: order.deliveryStatus,
                        issuedItems: order.issuedItems
                    }))
                }),
            });

            if (!response.ok) {
                throw new Error("Failed to update delivery note.");
            }

            console.log("Delivery note updated successfully!");
            setIsEditing(false);
        } catch (error) {
            console.error("Error updating delivery note:", error);
            setError("Failed to update delivery note.");
        }
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
                                        <ul className="order-items">
                                            <div className="order-general">
                                                {orders.map((order, index) => (
                                                    <div key={order.OrID} className="order-box">
                                                        <p><strong>Order ID:</strong> {order.OrID}</p>
                                                        {!isEditing ? (
                                                            <p><strong>Order Status:</strong> {order.orderStatus}</p>
                                                        ) : (
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
                                                                    <option value="Completed">Completed</option>
                                                                </Input>
                                                            </FormGroup>
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
