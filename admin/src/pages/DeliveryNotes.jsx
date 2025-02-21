import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, Table } from "reactstrap";
import { toast } from "react-toastify";
import "../style/deliverynotes.css";

const DeliveryNotes = () => {
    const [routes, setRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState("");
    const [orders, setOrders] = useState([]);
    const [selectedOrders, setSelectedOrders] = useState([]);
    const [totalAmount, setTotalAmount] = useState(0);

    useEffect(() => {
        //fetchRoutes();
    }, []);

    const fetchRoutes = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/delivery-rates");
            const data = await response.json();
            console.log(data);
            setRoutes( data||[]);
        } catch (error) {
            toast.error("Error fetching routes.");
        }
    };

    const fetchOrders = async (routeId) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/orders?route=${routeId}`);
            const data = await response.json();
            setOrders(data || []);
        } catch (error) {
            toast.error("Error fetching orders.");
        }
    };

    const handleRouteChange = (e) => {
        const routeId = e.target.value;
        setSelectedRoute(routeId);
        fetchOrders(routeId);
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

    const handlePrint = () => window.print();

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
                    </Form>

                    {orders.length > 0 && (
                        <Table bordered responsive className="order-table">
                            <thead>
                            <tr>
                                <th>Select</th>
                                <th>Order ID</th>
                                <th>Customer</th>
                                <th>Total</th>
                                <th>Balance</th>
                            </tr>
                            </thead>
                            <tbody>
                            {orders.map(order => (
                                <tr key={order.id}>
                                    <td>
                                        <Input type="checkbox" onChange={() => handleOrderSelection(order)} />
                                    </td>
                                    <td>{order.id}</td>
                                    <td>{order.customerName}</td>
                                    <td>Rs.{order.total}</td>
                                    <td>Rs.{order.balance}</td>
                                </tr>
                            ))}
                            </tbody>
                        </Table>
                    )}

                    <h5 className="text-end mt-3">Total Balance: Rs.{totalAmount}</h5>
                    <div className="text-center mt-4">
                        <Button color="primary" onClick={handlePrint}>Print Delivery Note</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default DeliveryNotes;