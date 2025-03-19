import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Spinner, Alert } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const DriverDetail = ({ driver }) => {
    const [driverDetails, setDriverDetails] = useState(null);
    const [deliveryCharges, setDeliveryCharges] = useState(null);
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
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setDriverDetails(null); // ✅ Reset data on failure
            setDeliveryCharges(null);
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };

    // **Default Structure Data in Case of API Failure**
    const defaultDriverDetails = {
        employeeName: "N/A",
        employeeId: "N/A",
        employeeContact: "N/A",
        employeeNic: "N/A",
        employeeJob: "N/A",
        balance: "N/A"
    };

    const defaultDeliveryCharges = {
        dailyCharge: "N/A",
        monthlyCharge: "N/A"
    };

    // **Use Data or Default Values**
    const finalDriverDetails = driverDetails || defaultDriverDetails;
    const finalDeliveryCharges = deliveryCharges || defaultDeliveryCharges;

    return (
        <Helmet title={`Driver Detail`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            {/* ✅ Show Loading Spinner */}
                            {loading && (
                                <div className="text-center">
                                    <Spinner color="primary" />
                                    <p>Loading driver details...</p>
                                </div>
                            )}

                            {/* ✅ Show Error Message If Any */}
                            {error && <Alert color="danger">⚠️ {error}</Alert>}

                            {/* Driver Details */}
                            {!loading && !error && (
                                <>
                                    <div className="driver-details">
                                        <h4 className="sub-title">Driver Information</h4>
                                        <Table bordered className="driver-table">
                                            <tbody>
                                            <tr>
                                                <td><strong>Employee Name</strong></td>
                                                <td>{finalDriverDetails.name}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Employee ID</strong></td>
                                                <td>{finalDriverDetails.devID}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Phone</strong></td>
                                                <td>{finalDriverDetails.contact}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>NIC</strong></td>
                                                <td>{finalDriverDetails.nic}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Balance</strong></td>
                                                <td>Rs. {finalDriverDetails.balance}</td>
                                            </tr>
                                            </tbody>
                                        </Table>
                                    </div>

                                    {/* Delivery Charges */}
                                    <div className="delivery-charges">
                                        <h4 className="sub-title">Delivery Charges</h4>
                                        <Table bordered className="charges-table">
                                            <tbody>
                                            <tr>
                                                <td><strong>Daily Charge</strong></td>
                                                <td>Rs. {finalDeliveryCharges.dailyCharge}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Monthly Charge</strong></td>
                                                <td>Rs. {finalDeliveryCharges.monthlyCharge}</td>
                                            </tr>
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
