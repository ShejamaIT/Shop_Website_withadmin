import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Table } from "reactstrap";
import { toast } from "react-toastify";
import "../style/deliverynotes.css";
import MakeDeliveryNote from "./MakeDeliveryNote";
import DeliveryNoteView from "./DeliveryNoteView";
import {logDOM} from "@testing-library/react";
import ReceiptView from "./ReceiptView";
import FinalInvoice2 from "./FinalInvoice2";

const DeliveryNotes = () => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState("");
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);
    const [noScheduleMessage, setNoScheduleMessage] = useState("");
    const [selectedDeliveryDate, setSelectedDeliveryDate] = useState(""); // Added state for selected date
    const [showModal2, setShowModal2] = useState(false);
    const [showModal1, setShowModal1] = useState(false);
    const [showDeliveryView, setShowDeliveryView] = useState(false);
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
                orderIds: selectedOrders.map(order => order.orderId),  // Extracting order IDs
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
                setReceiptData(updatedReceiptData);
                setShowModal2(false);
                setShowDeliveryView(true);
                toast.success("Delivery note created successfully.");
                setTimeout(() => {
                    window.location.reload(); // Auto-refresh the page
                }, 1000);
            } else {
                toast.error(data.message || "Error creating delivery note.");
            }

        } catch (error) {
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
    const loadOders = (e) => {
        const routedate = e.target.value;
        setSelectedDeliveryDate(routedate); // Set the selected date
        fetchOrders(routedate);
    };

    const fetchOrders = async (date) => {
        try {
            if (!selectedRoute || !date) {
                toast.error("Please select both route and delivery date.");
                return;
            }
            const response = await fetch(`http://localhost:5001/api/admin/main/find-completed-orders?district=${selectedRoute}&date=${date}`);
            const data = await response.json();
            if (data.orders) {
                setOrders(data.orders);
            } else {
                setOrders([]); // Clear orders if no data
            }
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
        fetchDeliveryDates(routeId); // Fetch the delivery schedule when the route changes
        setSelectedOrders([]);
        setTotalAmount(0);
    };
    const handleOrderSelection = (order) => {
        const updatedOrders = selectedOrders.includes(order)
            ? selectedOrders.filter(o => o !== order)
            : [...selectedOrders, order];
        setSelectedOrders(updatedOrders);
        setSelectedOrder(order);
        handleEditClick1(order);
        calculateTotal(updatedOrders);
    };
    const handleEditClick1 = (order) => {
        if (!order) return;
        setSelectedOrder(order);
        setShowModal1(true);
    };
    const calculateTotal = (orders) => {
        const total = orders.reduce((sum, order) => sum + order.balance, 0);
        setTotalAmount(total);
    };
    const handleSubmit3 = async (formData) => {
        console.log(formData);
        setShowModal2(false);
        const updatedData = {
            orID: selectedOrder.orderId,
            delStatus: formData.deliveryStatus,
            delPrice: formData.delivery,
            discount: selectedOrder.discount,
            subtotal: formData.subtotal,
            total: formData.billTotal,
            advance: formData.totalAdvance,
            payStatus: formData.paymentType,
            stID: selectedOrder.saleID,
            paymentAmount: formData.addedAdvance,
            selectedItems: formData.selectedItems,
            balance: formData.billTotal - formData.totalAdvance, // assuming balance calculation
            salesperson: selectedOrder.salesTeam.employeeName,
            items: selectedOrder.items,
        };
        try {
            // Make API request to the /isssued-order endpoint
            const response = await fetch('http://localhost:5001/api/admin/main/isssued-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
            const result = await response.json();
            if (response.ok) {
                toast.success("Update order Successfully");
                setShowModal1(false);
                setReceiptData(updatedData);  // Set data for receipt
                setShowReceiptView(true);         // Show receipt view
            } else {
                console.error("Error:", result.message);
            }
        } catch (error) {
            console.error("Error making API request:", error.message);
        }
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
                                        onChange={loadOders}// Update selected date on change
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
                                                <td>{order.orderId}</td>
                                                <td>{order.customerName}</td>
                                                <td>Rs.{order.totalPrice}</td>
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
                    {showDeliveryView && (
                        <DeliveryNoteView
                            receiptData={receiptData}
                            setShowDeliveryView={setShowDeliveryView}
                        />
                    )}
                    {showReceiptView && (
                        <ReceiptView
                            receiptData={receiptData}
                            setShowReceiptView={setShowReceiptView}
                        />
                    )}
                    {showModal1 && selectedOrder && (
                        <FinalInvoice2
                            selectedOrder={selectedOrder}
                            setShowModal2={setShowModal1}
                            handlePaymentUpdate={handleSubmit3}
                        />
                    )}
                </Col>
            </Row>
        </Container>
    );
};
export default DeliveryNotes;
