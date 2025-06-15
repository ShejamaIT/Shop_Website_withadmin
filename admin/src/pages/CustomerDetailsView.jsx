import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Button, Input, Label } from "reactstrap";
import NavBar from "./NavBar/Navbar";
import Helmet from "../components/Helmet/Helmet";
import "../style/orderDetailsUpdated.css";

const CustomerDetailsView = () => {
    const { c_ID } = useParams();
    const navigate = useNavigate();

    const [customer, setCustomer] = useState(null);
    const [ledger, setLedger] = useState([]);
    const [paymentSummary, setPaymentSummary] = useState({
        totalBilled: 0,
        totalPaid: 0,
        balance: 0,
    });
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Fetch customer details on load
    useEffect(() => {
        fetchCustomerDetails();
    }, [c_ID]);

    // Fetch ledger when date range selected
    useEffect(() => {
        if (startDate && endDate) {
            fetchCustomerLedger();
        }
    }, [startDate, endDate]);

    const fetchCustomerDetails = async () => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:5001/api/admin/main/customer-details&orders?c_ID=${c_ID}`);
            if (!response.ok) throw new Error("Failed to fetch customer details.");
            const data = await response.json();
            setCustomer(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchCustomerLedger = async () => {
        try {
            setLoading(true);
            const response = await fetch(
                `http://localhost:5001/api/admin/main/customer-ledger?c_ID=${c_ID}&startDate=${startDate}&endDate=${endDate}`
            );
            const result = await response.json();
            console.log(result);
            if (!result.success) throw new Error(result.message);

            setLedger(result.data);

            // Calculate summary
            const totalPaid = result.data.reduce((sum, r) => sum + (r.paidAmount || 0), 0);
            const totalBilled = result.data.reduce((sum, r) => sum + (r.netTotal || 0), 0);
            const balance = result.data.reduce((sum, r) => sum + (r.balance || 0), 0);

            setPaymentSummary({ totalPaid, totalBilled, balance });
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <p className="text-center mt-5">Loading...</p>;
    if (error) return <p className="text-danger text-center mt-5">{error}</p>;
    if (!customer) return <p className="text-center mt-5">Customer not found.</p>;

    const orderStats = customer.orders?.[0] || {};

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
                        {/* Personal Info */}
                        <Col lg="4">
                            <div className="order-card">
                                <h5>Personal Information</h5>
                                <p><strong>Full Name:</strong> {customer.FtName} {customer.SrName}</p>
                                <p><strong>NIC:</strong> {customer.id}</p>
                                <p><strong>Address:</strong> {customer.address}</p>
                                <p><strong>Phone 1:</strong> {customer.contact1}</p>
                                <p><strong>Phone 2:</strong> {customer.contact2}</p>
                            </div>
                        </Col>

                        {/* Classification */}
                        <Col lg="4">
                            <div className="order-card">
                                <h5>Classification</h5>
                                <p><strong>Category:</strong> {customer.category}</p>
                                <p><strong>Type:</strong> {customer.type}</p>
                                <p><strong>Trade Name:</strong> {customer.t_name}</p>
                                <p><strong>Occupation:</strong> {customer.occupation}</p>
                                <p><strong>Workplace:</strong> {customer.workPlace}</p>
                                <p><strong>Current Balance:</strong> Rs. {customer.balance.toFixed(2)}</p>
                            </div>
                        </Col>

                        {/* Order Stats */}
                        <Col lg="4">
                            <div className="order-card">
                                <h5>Order Status Summary</h5>
                                <p><strong>Accepted:</strong> {orderStats.Accepted || 0}</p>
                                <p><strong>Pending:</strong> {orderStats.Pending || 0}</p>
                                <p><strong>Delivered:</strong> {orderStats.Delivered || 0}</p>
                                <p><strong>Issued:</strong> {orderStats.Issued || 0}</p>
                                <p><strong>Production:</strong> {orderStats.Production || 0}</p>
                            </div>
                        </Col>
                    </Row>

                    {/* Date Range Picker */}
                    <Row className="mt-4">
                        <Col lg="6">
                            <Label><strong>Start Date</strong></Label>
                            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                        </Col>
                        <Col lg="6">
                            <Label><strong>End Date</strong></Label>
                            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                        </Col>
                    </Row>

                    {/* Payment Summary + Ledger Table */}
                    {ledger.length > 0 ? (
                            ledger.map((entry, idx) => (
                                <Row key={idx} className="mt-4">
                                    <Col lg="12">
                                        <div className="order-card">
                                            <h5 className="mb-3">📅 {new Date(entry.date).toLocaleDateString()}</h5>
                                            <Row>
                                                {/* Left: Bills */}
                                                <Col lg="6">
                                                    <h6>Bills</h6>
                                                    {entry.bills.length > 0 ? (
                                                        <table className="table table-sm table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>Order ID</th>
                                                                    {/* <th>Net Total</th> */}
                                                                    <th>Balance</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {entry.bills.map((bill, i) => (
                                                                    <tr key={i}>
                                                                        <td>{bill.orID}</td>
                                                                        {/* <td>Rs. {bill.netTotal.toFixed(2)}</td> */}
                                                                        <td>Rs. {bill.balance.toFixed(2)}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-muted">No bills</p>
                                                    )}
                                                </Col>

                                                {/* Right: Payments */}
                                                <Col lg="6">
                                                    <h6>Payments</h6>
                                                    {entry.payments.length > 0 ? (
                                                        <table className="table table-sm table-bordered">
                                                            <thead>
                                                                <tr>
                                                                    <th>Type</th>
                                                                    <th>Paid</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {entry.payments.map((pay, i) =>
                                                                    pay.paymentTypes && pay.paymentTypes.length > 0 ? (
                                                                        pay.paymentTypes.map((ptype, j) => (
                                                                            <tr key={`${i}-${j}`}>
                                                                                <td>
                                                                                    {ptype.type}
                                                                                    {ptype.subType ? ` (${ptype.subType})` : ""}
                                                                                    {ptype.type === "Cheque" && (
                                                                                        <>
                                                                                            <br />
                                                                                            <small className="text-muted">
                                                                                                No: {ptype.chequeNumber || "N/A"} | Bank: {ptype.chequeBank || "N/A"}
                                                                                                <br />
                                                                                                Status: <strong>{ptype.chequeStatus || "N/A"}</strong>
                                                                                            </small>
                                                                                        </>
                                                                                    )}
                                                                                </td>
                                                                                <td>
                                                                                    Rs.{" "}
                                                                                    {Number(ptype.amount && ptype.amount > 0 ? ptype.amount : pay.paidAmount || 0).toFixed(2)}
                                                                                    </td>

                                                                                {/* <td>Rs. {Number(ptype.amount || 0).toFixed(2)}</td> */}
                                                                            </tr>
                                                                        ))
                                                                    ) : (
                                                                        <tr key={i}>
                                                                            <td>Unknown</td>
                                                                            <td>Rs. {Number(pay.paidAmount || 0).toFixed(2)}</td>
                                                                        </tr>
                                                                    )
                                                                )}

                                                            </tbody>
                                                        </table>
                                                    ) : (
                                                        <p className="text-muted">No payments</p>
                                                    )}
                                                </Col>
                                            </Row>
                                        </div>
                                    </Col>
                                </Row>
                            ))
                        ) : (
                            <p className="text-muted text-center mt-4">
                                No ledger records found for selected date range.
                            </p>
                        )}


                    <Row className="mt-4">
                        <Col lg="12" className="text-center">
                            <Button color="secondary" onClick={() => navigate(-1)}>← Back</Button>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default CustomerDetailsView;
