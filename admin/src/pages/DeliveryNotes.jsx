import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Table } from "reactstrap";
import { toast } from "react-toastify";
import "../style/deliverynotes.css";
import MakeDeliveryNote from "./MakeDeliveryNote";
import DeliveryNoteView from "./DeliveryNoteView";
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
    const [receiptDataD, setReceiptDataD] = useState(null);

    const handleSubmit2 = async (formData) => {
        try {
            // Ensure at least one order is selected before proceeding
            if (!selectedOrders || selectedOrders.length === 0) {
                toast.error("Please select at least one order.");
                return;
            }

            const updatedReceiptData = {
                orders: selectedOrders.map(order => ({
                    orderId: order.orderId,
                    customerName: order.customerName || "Unknown",
                    balance: order.balance || 0,
                    address: order.deliveryInfo?.address || "N/A", // Handle undefined values
                    contact1: order.phoneNumber || "N/A",
                    contact2: order.optionalNumber || "N/A",
                    total: order.totalPrice || 0,
                    advance: order.advance || 0,
                })),
                vehicleId: formData.vehicleId,
                driverName: formData.driverName,
                driverId: formData.driverId,
                hire: formData.hire || 0,
                balanceToCollect: formData.balanceToCollect || 0,
                selectedDeliveryDate: selectedDeliveryDate || new Date().toISOString().split("T")[0], // Default to today's date if empty
                district: selectedRoute || "Unknown",
            };

            // Prepare the data for the API request
            const deliveryNoteData = {
                driverName: formData.driverName,
                driverId: formData.driverId,
                vehicleName: formData.vehicleId, // Ensure correct field name
                hire: formData.hire || 0,
                date: updatedReceiptData.selectedDeliveryDate,
                orders: selectedOrders.map(order => ({
                    orderId: order.orderId,
                    balance: order.balance || 0,
                    address: order.deliveryInfo?.address || "N/A",
                    contact1: order.phoneNumber || "N/A",
                    contact2: order.optionalNumber || "N/A",
                })),
                district: selectedRoute || "Unknown",
                balanceToCollect: formData.balanceToCollect || 0,
            };

            console.log("Updated Receipt Data:", updatedReceiptData);
            console.log("Delivery Note Data:", deliveryNoteData);

            // Make the API call
            const response = await fetch("http://localhost:5001/api/admin/main/create-delivery-note", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(deliveryNoteData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error creating delivery note.");
            }

            toast.success("Delivery note created successfully.");
            setReceiptDataD(updatedReceiptData);
            setShowModal2(false);
            setShowDeliveryView(true);

        } catch (error) {
            console.error("Error while submitting delivery note:", error);
            toast.error(error.message || "An unexpected error occurred while submitting the delivery note.");
        }
    };


    useEffect(() => {
        fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/delivery-rates");
            const data = await response.json();
            console.log(data.data);
            setRoutes(["All", ...data.data.map(route => route.district)]);
        } catch (error) {
            toast.error("Error fetching routes.");
        }
    };

    const loadOrders = (e) => {
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
            console.log(selectedRoute, date);
            let url;
            if (selectedRoute === "All") {
                url = `http://localhost:5001/api/admin/main/find-completed-orders-by-date?date=${date}`;
            } else {
                url = `http://localhost:5001/api/admin/main/find-completed-orders?district=${selectedRoute}&date=${date}`;
            }

            console.log(url);

            const response = await fetch(url);
            const data = await response.json();
            console.log(data.orders);
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

        if (routeId === "All") {
            setDeliveryDates([]); // Clear delivery dates when "All" is selected
            setNoScheduleMessage(""); // Clear any messages
        } else {
            fetchDeliveryDates(routeId);
        }

        setSelectedOrders([]);  // Clear selected orders
        setTotalAmount(0);  // Clear total amount
    };

    const handleOrderSelection = (order) => {
        console.log(order);
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
        const updatedData = {
            orID: selectedOrder.orderId,
            orderDate: selectedOrder.orderDate,
            delStatus: formData.deliveryStatus,
            delPrice: formData.delivery,
            discount: selectedOrder.discount,
            subtotal: formData.subtotal,
            total: formData.billTotal,
            advance: formData.totalAdvance,
            payStatus: formData.paymentType,
            stID: selectedOrder.saleID,
            paymentAmount: formData.addedAdvance || 0,
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
                                {routes.map((district, index) => (
                                    <option key={index} value={district}>{district}</option>
                                ))}
                            </Input>
                        </FormGroup>
                        {/* Show Date Input if 'All' Route is selected */}
                        {selectedRoute === "All" && (
                            <FormGroup>
                                <Label for="deliveryDateSelect">Select Delivery Date</Label>
                                <Input
                                    type="date"
                                    id="deliveryDateSelect"
                                    value={selectedDeliveryDate}
                                    onChange={loadOrders}
                                />
                            </FormGroup>
                        )}
                        {/* Show Date Dropdown if specific district is selected */}
                        {selectedRoute !== "All" && deliveryDates.length > 0 && (
                            <FormGroup>
                                <Label for="deliveryDateSelect">Select Delivery Date</Label>
                                <Input
                                    type="select"
                                    id="deliveryDateSelect"
                                    value={selectedDeliveryDate} // Add state to track selected date
                                    onChange={loadOrders} // Update selected date on change
                                >
                                    <option value="">-- Select Date --</option>
                                    {deliveryDates.map((date, index) => (
                                        <option key={index} value={new Date(date).toLocaleDateString()}>
                                            {new Date(date).toLocaleDateString()}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>
                        )}
                        {/* Orders Table */}
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
                                    <th>District</th>
                                    <th>Type</th>
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
                                        <td>{order.deliveryInfo.district}</td>
                                        <td>{order.deliveryInfo.type}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        )}
                        <h5 className="text-end mt-3">Total Balance: Rs.{totalAmount}</h5>
                    </Form>

                    <div className="text-center mt-4">
                        <Button color="primary" onClick={() => handleEditClick3(selectedOrders)}>Get Delivery Note</Button>
                    </div>
                    {/* Modals for Delivery Note and Receipt */}
                    {showModal2 && selectedOrders && (
                        <MakeDeliveryNote
                            selectedOrders={selectedOrders}
                            setShowModal={setShowModal2}
                            handleDeliveryUpdate={handleSubmit2}
                        />
                    )}
                    {showDeliveryView && (
                        <DeliveryNoteView
                            receiptData={receiptDataD}
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
