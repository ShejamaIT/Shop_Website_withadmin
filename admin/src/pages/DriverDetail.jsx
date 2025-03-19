import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table } from "reactstrap";
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

            setDriverDetails(data.data.driverDetails || null);
            setDeliveryCharges(data.data.deliveryCharges || null);
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
                            {/* ✅ Show Error Message If Any, But Keep the Table Structure */}
                            {error && <p className="error-text">Something went wrong: {error}</p>}

                            {/* Driver Details */}
                            <div className="driver-details">
                                <Table bordered className="driver-table">
                                    <tbody>
                                    <tr>
                                        <td><strong>Employee Name</strong></td>
                                        <td>{finalDriverDetails.employeeName}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Employee ID</strong></td>
                                        <td>{finalDriverDetails.employeeId}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Phone</strong></td>
                                        <td>{finalDriverDetails.employeeContact}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>NIC</strong></td>
                                        <td>{finalDriverDetails.employeeNic}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Job</strong></td>
                                        <td>{finalDriverDetails.employeeJob}</td>
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
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};
export default DriverDetail;
