import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Table } from "reactstrap";
import { toast } from "react-toastify";
import "../style/deliverynotes.css";
import ReceiptView from "./ReceiptView";
import MakeDeliveryNote from "./MakeDeliveryNote";
import DeliveryNoteView from "./DeliveryNoteView";

const DeliveryNotes = () => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState("");
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [noScheduleMessage, setNoScheduleMessage] = useState("");
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(""); // Added state for selected date
    const [showModal2, setShowModal2] = useState(false);
    const [showReceiptView, setShowReceiptView] = useState(false);
    const [receiptData, setReceiptData] = useState(null);

    const handleSubmit2 = async (formData) => {
        try {
            const updatedReceiptData = {
                orders: selectedOrders,
                vehicleId: formData.vehicleId,
                driverName: formData.driverName,
                hire:formData.hire,
                balanceToCollect: formData.balanceToCollect,
                selectedDeliveryDate: selectedDeliveryDate,
                district: selectedRoute,
            };

            // Prepare the data for API call (including necessary fields)
            const deliveryNoteData = {
                driverName: formData.driverName,
                vehicleName: formData.vehicleId,  // Assuming vehicleId maps to vehicleName
                hire:formData.hire,
                date: selectedDeliveryDate,  // The selected delivery date
                orderIds: selectedOrders.map(order => order.orId),  // Extracting order IDs
                district: selectedRoute,
                balanceToCollect: formData.balanceToCollect,
            };
            console.log(updatedReceiptData);
            console.log(deliveryNoteData);

            // Make the API call to create a delivery note and save the orders
            const response = await fetch("http://localhost:5001/api/admin/main/create-delivery-note", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(deliveryNoteData),
            });

            const data = await response.json();

            if (response.ok) {
                // Optionally, set the receipt data
                setReceiptData(updatedReceiptData);
                setShowModal2(false);
                setShowReceiptView(true);
                // Show success message to the user
                toast.success("Delivery note created successfully.");
            } else {
                // Handle errors from the API
                console.error("Error creating delivery note:", data.message);
                toast.error(data.message || "Error creating delivery note.");
            }

        } catch (error) {
            console.error("Error submitting form data:", error);
            toast.error("An unexpected error occurred while submitting the delivery note.");
        }
    };

    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/delivery-rates");
            const data = await response.json();
            setRoutes(data.data || []);
        } catch (error) {
            toast.error("Error fetching routes.");
        }
    };

    const fetchOrders = async (routeId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/find-issued-orders?district=${routeId}`);
            const data = await response.json();
            setOrders(data.orders || []);
        } catch (error) {
            toast.error("Error fetching orders.");
        }
    };

    const fetchDeliveryDates = async (district) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/delivery-schedule?district=${district}`);
            const data = await response.json();
            if (data.upcomingDates && data.upcomingDates.length > 0) {
                setDeliveryDates(data.upcomingDates);
                setNoScheduleMessage(""); // Clear any previous "No schedule" message
            } else {
                setDeliveryDates([]);
                setNoScheduleMessage("No schedule available for this district.");
            }
        } catch (error) {
            toast.error("Error fetching delivery dates.");
            setDeliveryDates([]);
            setNoScheduleMessage("No schedule available for this district.");
        }
    };

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        setSelectedRoute(routeId);
        fetchOrders(routeId);
        fetchDeliveryDates(routeId); // Fetch the delivery schedule when the route changes
        setSelectedOrders([]);
        setTotalAmount(0);
    };

    const handleOrderSelection = (order) => {
        const updatedOrders = selectedOrders.includes(order)
            ? selectedOrders.filter(o => o !== order)
            : [...selectedOrders, order];
        setSelectedOrders(updatedOrders);
        calculateTotal(updatedOrders);
    };

    const calculateTotal = (orders) => {
        const total = orders.reduce((sum, order) => sum + order.balance, 0);
        setTotalAmount(total);
    };

    const handleEditClick3 = (selectedOrders) => {
        if (!selectedOrders) return;
        setSelectedOrders(selectedOrders);
        setShowModal2(true);
    };

    return (
        <Container className="delivery-notes-container">
            <Row>
                <Col lg="10" className="mx-auto">
                    <h3 className="text-center mb-4">Delivery Notes</h3>
                    <Form>
                        <FormGroup>
                            <Label for="routeSelect">Select Route</Label>
                            <Input type="select" id="routeSelect" value={selectedRoute} onChange={handleRouteChange}>
                                <option value="">-- Select Route --</option>
                                {routes.map(route => (
                                    <option key={route.district} value={route.district}>{route.district}</option>
                                ))}
                            </Input>
                        </FormGroup>
                        {/* Delivery Date Dropdown */}
                        {deliveryDates.length > 0 ? (
                            <div>
                                <FormGroup>
                                    <Label for="deliveryDateSelect">Select Delivery Date</Label>
                                    <Input
                                        type="select"
                                        id="deliveryDateSelect"
                                        value={selectedDeliveryDate} // Add state to track selected date
                                        onChange={(e) => setSelectedDeliveryDate(e.target.value)} // Update selected date on change
                                    >
                                        <option value="">-- Select Date --</option>
                                        {deliveryDates.map((date, index) => (
                                            <option key={index} value={new Date(date).toLocaleDateString()}>
                                                {new Date(date).toLocaleDateString()}
                                            </option>
                                        ))}
                                    </Input>
                                </FormGroup>
                                {orders.length > 0 && (
                                    <Table bordered responsive className="order-table">
                                        <thead>
                                        <tr>
                                            <th>Select</th>
                                            <th>Order ID</th>
                                            <th>Customer</th>
                                            <th>Total</th>
                                            <th>Advance</th>
                                            <th>Balance</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {orders.map(order => (
                                            <tr key={order.id}>
                                                <td>
                                                    <Input type="checkbox" onChange={() => handleOrderSelection(order)} />
                                                </td>
                                                <td>{order.orId}</td>
                                                <td>{order.custName}</td>
                                                <td>Rs.{order.total}</td>
                                                <td>Rs.{order.advance}</td>
                                                <td>Rs.{order.balance}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                )}
                            </div>
                        ) : (
                            <p className="mt-4 text-danger">{noScheduleMessage}</p>
                        )}
                        <h5 className="text-end mt-3">Total Balance: Rs.{totalAmount}</h5>
                    </Form>

                    <div className="text-center mt-4">
                        <Button color="primary" onClick={() => handleEditClick3(selectedOrders)}>Get Delivery Note</Button>
                    </div>
                    {showModal2 && selectedOrders && (
                        <MakeDeliveryNote
                            selectedOrders={selectedOrders}
                            setShowModal={setShowModal2}
                            handleDeliveryUpdate={handleSubmit2}
                        />
                    )}
                    {showReceiptView && (
                        <DeliveryNoteView
                            receiptData={receiptData}
                            setShowReceiptView={setShowReceiptView}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
};

export default DeliveryNotes;
