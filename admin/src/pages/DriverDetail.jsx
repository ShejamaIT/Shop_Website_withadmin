import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Spinner, Alert } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const DriverDetail = ({ driver }) => {
    const [driverDetails, setDriverDetails] = useState(null);
    const [deliveryCharges, setDeliveryCharges] = useState(null);
    const [thisMonthNotes, setThisMonthNotes] = useState([]);
    const [lastMonthNotes, setLastMonthNotes] = useState([]);
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
                                            <tr><td><strong>Balance</strong></td><td>Rs. {driverDetails.balance}</td></tr>
                                            <tr><td><strong>Advance</strong></td><td>Rs. {driverDetails.totalAdvance}</td></tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                    {/*<div className="delivery-charges">*/}
                                    {/*    <h4 className="sub-title">Delivery Charges</h4>*/}
                                    {/*    <Table bordered className="charges-table">*/}
                                    {/*        <tbody>*/}
                                    {/*        <tr><td><strong>Daily Charge</strong></td><td>Rs. {deliveryCharges.dailyCharge}</td></tr>*/}
                                    {/*        <tr><td><strong>Monthly Charge</strong></td><td>Rs. {deliveryCharges.monthlyCharge}</td></tr>*/}
                                    {/*        </tbody>*/}
                                    {/*    </Table>*/}
                                    {/*</div>*/}
                                    <div className="delivery-notes">
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
                                    </div>
                                    <div className="delivery-notes">
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
