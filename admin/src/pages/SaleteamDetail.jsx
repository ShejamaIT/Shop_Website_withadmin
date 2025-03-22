import React, { useState, useEffect } from "react";
import { Container, Row, Col, Table, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const SaleteamDetail = ({ Saleteam }) => {
    const [salesteamMember, setSalesteamMember] = useState(null);
    const [monthAdvance, setMonthAdvance] = useState(null);
    const [ordersThisMonthIssued, setOrdersThisMonthIssued] = useState([]);
    const [ordersThisMonthOther, setOrdersThisMonthOther] = useState([]);
    const [ordersLastMonthIssued, setOrdersLastMonthIssued] = useState([]);
    const [ordersLastMonthOther, setOrdersLastMonthOther] = useState([]);
    const [advancedetails , setAdanceDetails] = useState([]);
    const [coupones, setCoupones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [activeTabThisMonth, setActiveTabThisMonth] = useState("1-1");
    const [activeTabLastMonth, setActiveTabLastMonth] = useState("2-1");

    useEffect(() => {
        if (!Saleteam.stID) {
            setError("Sales team ID is missing or invalid.");
            setLoading(false);
            return;
        }
        fetchOrder(Saleteam.stID);
    }, [Saleteam.stID]);

    const fetchOrder = async (id) => {
        try {
            setLoading(true);
            setError(null);
            const response = await fetch(`http://localhost:5001/api/admin/main/orders/by-sales-team?stID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");
            const data = await response.json();
            setSalesteamMember(data.data.memberDetails || null);
            setOrdersThisMonthIssued(data.data.ordersThisMonthIssued || []);
            setOrdersThisMonthOther(data.data.ordersThisMonthOther || []);
            setOrdersLastMonthIssued(data.data.ordersLastMonthIssued || []);
            setOrdersLastMonthOther(data.data.ordersLastMonthOther || []);
            setAdanceDetails(data.data.advanceDetails  || []);
            setCoupones(data.data.coupons || []);
            setMonthAdvance(data.data.totalAdvance);
            setLoading(false);
        } catch (err) {
            setError(err.message);
            setLoading(false);
        }
    };

    const toggleTabThisMonth = (tab) => {
        setActiveTabThisMonth(tab);
    };

    const toggleTabLastMonth = (tab) => {
        setActiveTabLastMonth(tab);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };

    if (loading) return <p className="loading-text">Loading team details...</p>;
    if (error) return <p className="error-text">Something went wrong: {error}</p>;

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
                                    <tr><td><strong>Employee Name</strong></td><td>{salesteamMember?.employeeName}</td></tr>
                                    <tr><td><strong>Employee ID</strong></td><td>{salesteamMember?.stID}</td></tr>
                                    <tr><td><strong>Phone</strong></td><td>{salesteamMember?.employeeContact}</td></tr>
                                    <tr><td><strong>Nic</strong></td><td>{salesteamMember?.employeeNic}</td></tr>
                                    <tr><td><strong>Advance</strong></td><td>Rs. {monthAdvance ?? '0.00'}</td></tr>
                                    </tbody>
                                </Table>
                            </div>


                            <div className="coupon-detail">
                                <Row>
                                    {/* Coupon Details */}
                                    <Col lg={6}>
                                        <h4 className="sub-title">Coupon Details</h4>
                                        <Table bordered className="coupon-table">
                                            <thead>
                                            <tr>
                                                <th>Coupon ID</th>
                                                <th>Discount (Rs.)</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {coupones.length > 0 ? (
                                                coupones.map((coupon, index) => (
                                                    <tr key={index}>
                                                        <td>{coupon.couponId}</td>
                                                        <td>Rs. {coupon.couponDiscount}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="2" className="no-coupon-text">No coupons available.</td>
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
                                {/* Orders for This Month */}
                                <h4 className="sub-title">Orders for This Month</h4>
                                <Nav tabs>
                                    <NavItem>
                                        <NavLink
                                            className={activeTabThisMonth === "1-1" ? "active" : ""}
                                            onClick={() => toggleTabThisMonth("1-1")}
                                        >
                                            Issued Orders
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTabThisMonth === "1-2" ? "active" : ""}
                                            onClick={() => toggleTabThisMonth("1-2")}
                                        >
                                            Other Orders
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTabThisMonth}>
                                    {/* Issued Orders for This Month */}
                                    <TabPane tabId="1-1">
                                        <Table striped bordered className="items-table">
                                            <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Order Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ordersThisMonthIssued.map((order, index) => (
                                                <tr key={index}>
                                                    <td>{order.orderId}</td>
                                                    <td>{formatDate(order.orderDate)}</td>
                                                    <td>Rs. {order.totalPrice}</td>
                                                    <td>{order.orderStatus}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </TabPane>

                                    {/* Other Orders for This Month */}
                                    <TabPane tabId="1-2">
                                        <Table striped bordered className="items-table">
                                            <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Order Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ordersThisMonthOther.map((order, index) => (
                                                <tr key={index}>
                                                    <td>{order.orderId}</td>
                                                    <td>{formatDate(order.orderDate)}</td>
                                                    <td>Rs. {order.totalPrice}</td>
                                                    <td>{order.orderStatus}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </TabPane>
                                </TabContent>

                                {/* Orders for Last Month */}
                                <h4 className="sub-title">Orders for Last Month</h4>
                                <Nav tabs>
                                    <NavItem>
                                        <NavLink
                                            className={activeTabLastMonth === "2-1" ? "active" : ""}
                                            onClick={() => toggleTabLastMonth("2-1")}
                                        >
                                            Issued Orders
                                        </NavLink>
                                    </NavItem>
                                    <NavItem>
                                        <NavLink
                                            className={activeTabLastMonth === "2-2" ? "active" : ""}
                                            onClick={() => toggleTabLastMonth("2-2")}
                                        >
                                            Other Orders
                                        </NavLink>
                                    </NavItem>
                                </Nav>

                                <TabContent activeTab={activeTabLastMonth}>
                                    {/* Issued Orders for Last Month */}
                                    <TabPane tabId="2-1">
                                        <Table striped bordered className="items-table">
                                            <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Order Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ordersLastMonthIssued.map((order, index) => (
                                                <tr key={index}>
                                                    <td>{order.orderId}</td>
                                                    <td>{formatDate(order.orderDate)}</td>
                                                    <td>Rs. {order.totalPrice}</td>
                                                    <td>{order.orderStatus}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </TabPane>

                                    {/* Other Orders for Last Month */}
                                    <TabPane tabId="2-2">
                                        <Table striped bordered className="items-table">
                                            <thead>
                                            <tr>
                                                <th>Order ID</th>
                                                <th>Order Date</th>
                                                <th>Total Amount</th>
                                                <th>Order Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {ordersLastMonthOther.map((order, index) => (
                                                <tr key={index}>
                                                    <td>{order.orderId}</td>
                                                    <td>{formatDate(order.orderDate)}</td>
                                                    <td>Rs. {order.totalPrice}</td>
                                                    <td>{order.orderStatus}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </Table>
                                    </TabPane>
                                </TabContent>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default SaleteamDetail;
