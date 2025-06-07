import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button } from "reactstrap";
import NavBar from "./NavBar/Navbar";
import Helmet from "../components/Helmet/Helmet";
import "../style/orderDetailsUpdated.css"; // Reuse existing styling

const CustomerDetailsView = () => {
    const { c_ID } = useParams();
    const navigate = useNavigate();
    const [customer, setCustomer] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCustomerDetails();
    }, [c_ID]);

    const fetchCustomerDetails = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/customer-details&orders?c_ID=${c_ID}`);
            if (!response.ok) throw new Error("Failed to fetch customer details.");
            const data = await response.json();
            setCustomer(data);
        } catch (err) {
            console.error("Error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="text-center mt-5">Loading customer details...</p>;
    if (error) return <p className="text-danger text-center mt-5">{error}</p>;
    if (!customer) return <p className="text-center mt-5">Customer not found.</p>;

    const orderStats = customer.orders[0] || {};

    return (
        <Helmet title={`Customer - ${customer.FtName} ${customer.SrName}`}>
            <section className="order-section">
                <NavBar />
                <Container>
                    <Row className="mb-3">
                        <Col lg="12" className="text-center">
                            <h2 className="order-title">Customer Details</h2>
                            <h4 className="order-subtitle">Customer ID: {customer.c_ID}</h4>
                        </Col>
                    </Row>

                    <Row>
                        <Col lg="6">
                            <div className="order-card">
                                <h5>Personal Information</h5>
                                <p><strong>Title:</strong> {customer.title}</p>
                                <p><strong>Full Name:</strong> {customer.FtName} {customer.SrName}</p>
                                <p><strong>NIC:</strong> {customer.id}</p>
                                <p><strong>Address:</strong> {customer.address}</p>
                                <p><strong>Primary Contact:</strong> {customer.contact1}</p>
                                <p><strong>Secondary Contact:</strong> {customer.contact2}</p>
                            </div>
                        </Col>

                        <Col lg="6">
                            <div className="order-card">
                                <h5>Customer Classification</h5>
                                <p><strong>Category:</strong> {customer.category}</p>
                                <p><strong>Type:</strong> {customer.type}</p>
                                <p><strong>Trade Name:</strong> {customer.t_name}</p>
                                <p><strong>Occupation:</strong> {customer.occupation}</p>
                                <p><strong>Workplace:</strong> {customer.workPlace}</p>
                                <p><strong>Balance:</strong> Rs. {customer.balance.toFixed(2)}</p>
                            </div>
                        </Col>
                    </Row>

                    <Row className="mt-3">
                        <Col lg="12">
                            <div className="order-card">
                                <h5>Order Status Summary</h5>
                                <Row>
                                    <Col><p><strong>Accepted:</strong> {orderStats.Accepted || 0}</p></Col>
                                    <Col><p><strong>Pending:</strong> {orderStats.Pending || 0}</p></Col>
                                    <Col><p><strong>Delivered:</strong> {orderStats.Delivered || 0}</p></Col>
                                    <Col><p><strong>Issued:</strong> {orderStats.Issued || 0}</p></Col>
                                    <Col><p><strong>Production:</strong> {orderStats.Production || 0}</p></Col>
                                </Row>
                            </div>
                        </Col>
                    </Row>

                    <Row className="mt-4">
                        <Col lg="12" className="text-center">
                            <Button color="secondary" onClick={() => navigate(-1)}>
                                ← Back
                            </Button>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default CustomerDetailsView;
