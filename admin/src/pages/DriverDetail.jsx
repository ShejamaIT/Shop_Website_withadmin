import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Spinner, Alert } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const DriverDetail = ({ driver }) => {
    const [driverDetails, setDriverDetails] = useState(null);
    const [deliveryCharges, setDeliveryCharges] = useState(null);
    const [thisMonthNotes, setThisMonthNotes] = useState([]);
    const [lastMonthNotes, setLastMonthNotes] = useState([]);
    const [advancedetails , setAdanceDetails] = useState([]);
    const [dailyditects , setDailyDitects] = useState([]);
    const [monthlyditects , setMonthlyDitects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!driver.devID) {
            setError("Driver ID is missing or invalid.");
            setLoading(false);
            return;
        }
        fetchDriverDetails(driver.devID);
    }, [driver.devID]);

    const fetchDriverDetails = async (id) => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`http://localhost:5001/api/admin/main/drivers/details?devID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch driver details.");

            const data = await response.json();
            console.log(data.data);

            setDriverDetails(data.data || {});
            setDeliveryCharges(data.data.deliveryCharges || {});
            setThisMonthNotes(data.data.deliveryNotes.thisMonth || []);
            setLastMonthNotes(data.data.deliveryNotes.lastMonth || []);
            setAdanceDetails(data.data.advanceDetails  || []);
            setDailyDitects(data.data.deliveryCharges.dailyCharges || []);
            setMonthlyDitects(data.data.deliveryCharges.monthlyCharges || []);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setDriverDetails(null);
            setDeliveryCharges(null);
            setThisMonthNotes([]);
            setLastMonthNotes([]);
            setLoading(false);
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };

    return (
        <Helmet title={`Driver Detail`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            {loading && (
                                <div className="text-center">
                                    <Spinner color="primary" />
                                    <p>Loading driver details...</p>
                                </div>
                            )}
                            {error && <Alert color="danger">⚠️ {error}</Alert>}
                            {!loading && !error && (
                                <>
                                    <div className="driver-details">
                                        <h4 className="sub-title">Driver Information</h4>
                                        <Table bordered className="driver-table">
                                            <tbody>
                                            <tr><td><strong>Employee Name</strong></td><td>{driverDetails.name}</td></tr>
                                            <tr><td><strong>Employee ID</strong></td><td>{driverDetails.devID}</td></tr>
                                            <tr><td><strong>Phone</strong></td><td>{driverDetails.contact}</td></tr>
                                            <tr><td><strong>NIC</strong></td><td>{driverDetails.nic}</td></tr>
                                            <tr><td><strong>Ditect Balance</strong></td><td>Rs. {driverDetails.balance}</td></tr>
                                            <tr><td><strong>Advance</strong></td><td>Rs. {driverDetails.totalAdvance}</td></tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                    <div className="coupon-detail">
                                        <Row>
                                            <Col lg={6}>
                                                <h4 className="sub-title">Daily Ditects</h4>
                                                <Table bordered className="coupon-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Delivery ID</th>
                                                        <th>Direct Amount (Rs.)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {dailyditects.length > 0 ? (
                                                        dailyditects.map((dd, index) => (
                                                            <tr key={index}>
                                                                <td>{dd.deliveryId}</td>
                                                                <td>Rs. {dd.amount}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="2" className="no-coupon-text">No Direct Amount.</td>
                                                        </tr>
                                                    )}
                                                    </tbody>
                                                </Table>

                                                <h4 className="sub-title">Monthly Ditects</h4>
                                                <Table bordered className="coupon-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Delivery ID</th>
                                                        <th>Direct Amount (Rs.)</th>
                                                        <th>Date</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {monthlyditects.length > 0 ? (
                                                        monthlyditects.map((dd, index) => (
                                                            <tr key={index}>
                                                                <td>{dd.deliveryId}</td>
                                                                <td>Rs. {dd.amount}</td>
                                                                <td>{formatDate(dd.date)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="no-coupon-text">No Direct Amount.</td>
                                                        </tr>
                                                    )}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                            {/* Advance Details */}
                                            <Col lg={6}>
                                                <h4 className="sub-title">Advance</h4>
                                                <Table bordered className="coupon-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Advance ID</th>
                                                        <th>Amount (Rs.)</th>
                                                        <th>Date </th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {advancedetails.length > 0 ? (
                                                        advancedetails.map((advance, index) => (
                                                            <tr key={index}>
                                                                <td>{advance.advanceId}</td>
                                                                <td>Rs. {advance.amount}</td>
                                                                <td>{formatDate(advance.dateTime)}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="3" className="no-coupon-text">No Advance.</td>
                                                        </tr>
                                                    )}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                    </div>

                                    <div className="coupon-detail">
                                        <Row>
                                            <Col lg={6}>
                                                <h4 className="sub-title">Delivery Notes - This Month</h4>
                                                <Table striped bordered className="items-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Delivery Note ID</th>
                                                        <th>District</th>
                                                        <th>Hire</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {thisMonthNotes.length > 0 ? thisMonthNotes.map(note => (
                                                        <tr key={note.delNoID}>
                                                            <td>{note.delNoID}</td>
                                                            <td>{note.district}</td>
                                                            <td>Rs. {note.hire}</td>
                                                        </tr>
                                                    )) : <tr><td colSpan="3">No records found</td></tr>}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                            <Col lg={6}>
                                                <h4 className="sub-title">Delivery Notes - Last Month</h4>
                                                <Table striped bordered className="items-table">
                                                    <thead>
                                                    <tr>
                                                        <th>Delivery Note ID</th>
                                                        <th>District</th>
                                                        <th>Hire</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {lastMonthNotes.length > 0 ? lastMonthNotes.map(note => (
                                                        <tr key={note.delNoID}>
                                                            <td>{note.delNoID}</td>
                                                            <td>{note.district}</td>
                                                            <td>Rs. {note.hire}</td>
                                                        </tr>
                                                    )) : <tr><td colSpan="3">No records found</td></tr>}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>

                                    </div>
                                    <div className="delivery-notes">

                                    </div>
                                </>
                            )}
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default DriverDetail;
