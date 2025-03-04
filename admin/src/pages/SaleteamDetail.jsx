import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Button } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const SaleteamDetail = ({ Saleteam }) => {
    const [salesteamMember, setSalesteamMember] = useState(null);
    const [orders, setOrders] = useState([]);
    const [coupones, setCoupones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!Saleteam.stID) {
            // If id is undefined or null, handle the error
            setError("Sales team ID is missing or invalid.");
            setLoading(false);
            return; // Don't proceed with the API call if id is invalid
        }
        fetchOrder(Saleteam.stID);
    }, [Saleteam.stID]); // Run this effect when 'id' changes

    const fetchOrder = async (id) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/orders/by-sales-team?stID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            if (data.data) {
                setSalesteamMember(data.data.memberDetails || null); // Ensure member details are set properly
                setOrders(data.data.orders || []); // If no orders, set an empty array
                setCoupones(data.data.coupons || []); // If no orders, set an empty array
            } else {
                setError("No data available for this sales team.");
                setOrders([]); // Ensure orders remain an empty array if there's no data
                setSalesteamMember(null); // Ensure member details are cleared
            }

            setLoading(false);
        } catch (err) {
            setError(err.message);
            setOrders([]); // Ensure orders remain empty on error
            setSalesteamMember(null); // Clear member details on error
            setLoading(false);
        }
    };


    const calculateOrderSummary = () => {
        const totalOrders = salesteamMember.totalCount;
        const issuedOrders = salesteamMember.issuedCount;
        const totalOrderPrice = salesteamMember.totalOrder;
        const totalIssuedPrice = salesteamMember.totalIssued;
        // const totalPrice = orders.reduce((acc, order) => acc + order.totalPrice, 0); // Adjust to field name from your response
        return { totalOrders, issuedOrders , totalOrderPrice, totalIssuedPrice};
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };

    if (loading) return <p className="loading-text">Loading team details...</p>;
    if (error) return <p className="error-text">Something went wrong: {error}</p>;

    const { totalOrders, issuedOrders , totalOrderPrice, totalIssuedPrice } = calculateOrderSummary();
    return (
        <Helmet title={`Sales Team Detail`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            {/* Sales Team Member Details */}
                            <div className="salesteam-details">
                                <Table bordered className="member-table">
                                    <tbody>
                                    <tr>
                                        <td><strong>Employee Name</strong></td>
                                        <td>{salesteamMember?.employeeName}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Employee ID</strong></td>
                                        <td>{salesteamMember?.stID}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Phone</strong></td>
                                        <td>{salesteamMember?.employeeContact}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Nic</strong></td>
                                        <td>{salesteamMember?.employeeNic}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Job</strong></td>
                                        <td>{salesteamMember?.employeeJob}</td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </div>

                            {/* Coupon Details */}
                            <div className="coupon-detail">
                                <h4 className="sub-title">Coupon Details</h4>
                                {coupones &&coupones.length > 0 ? (
                                    <Table bordered className="coupon-table">
                                        <thead>
                                        <tr>
                                            <th>Coupon ID</th>
                                            <th>Discount (Rs.)</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {coupones.map((coupon, index) => (
                                            <tr key={index}>
                                                <td>{coupon.cpID}</td>
                                                <td>Rs. {coupon.discount}</td>
                                            </tr>
                                        ))}
                                        </tbody>
                                    </Table>
                                ) : (
                                    <p className="no-coupon-text">No coupons available.</p>
                                )}
                            </div>


                            {/* Orders for this Sales Team Member */}
                            <div className="order-details">
                                <h4 className="sub-title">Orders Summary</h4>
                                <Table bordered className="orders-table">
                                    <tbody>
                                    <tr>
                                        <td><strong>Received Orders Count</strong></td>
                                        <td>{salesteamMember.totalCount}</td>
                                        <td>{salesteamMember.issuedCount}</td>
                                        <td><strong>Issued Orders Count</strong></td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total Order Received</strong></td>
                                        <td>Rs. {salesteamMember.totalOrder}</td>
                                        <td>Rs. {salesteamMember.orderTarget}</td>
                                        <td><strong>Order Received Target</strong></td>

                                    </tr>
                                    <tr>
                                        <td><strong>Total Order Issued</strong></td>
                                        <td>Rs. {salesteamMember.totalIssued}</td>
                                        <td>Rs. {salesteamMember.issuedTarget}</td>
                                        <td><strong>Order Issued Target</strong></td>

                                    </tr>
                                    </tbody>
                                </Table>

                                {/* Orders List */}
                                <h4 className="sub-title">Order Details</h4>
                                <Table striped bordered className="items-table">
                                    <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Order Date</th>
                                        <th>Total Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={index}>
                                            <td>{order.orderId}</td> {/* Adjust field names as per response */}
                                            <td>{formatDate(order.orderDate)}</td> {/* Adjust field names as per response */}
                                            <td>Rs. {order.totalPrice}</td> {/* Adjust field names as per response */}
                                        </tr>
                                    ))}
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
export default SaleteamDetail;
