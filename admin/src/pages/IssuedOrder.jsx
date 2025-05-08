import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../pages/Navbar";
import "../style/orderDetails.css";

const IssuedOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchOrder();
    }, [id]);

    const fetchOrder = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/issued-order-details?orID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");

            const data = await response.json();
            setOrder(data.order);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handlePrintPaymentHistory = () => {
        const printWindow = window.open("", "Print Window", "width=600,height=600");
        printWindow.document.write("<h3>Payment History</h3>");

        if (order.paymentHistory && order.paymentHistory.length > 0) {
            order.paymentHistory.forEach(payment => {
                printWindow.document.write(`
                    <p><strong>Payment ID:</strong> ${payment.paymentId}</p>
                    <p><strong>Amount Paid:</strong> Rs. ${payment.amount}</p>
                    <p><strong>Payment Date:</strong> ${payment.paymentDate}</p>
                    <hr />
                `);
            });
        } else {
            printWindow.document.write("<p>No payments made yet.</p>");
        }

        printWindow.document.close();
        printWindow.print();
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!order) return <p>Order not found</p>;

    return (
        <Helmet title={`Order Details - ${order.orderId}`}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container>
                    {/* General Details */}
                    <Row>
                        <Col lg="12">
                            <h4 className="mb-3 text-center topic">Issued Order Details</h4>
                            <h4 className="mb-3 text-center topic">#{order.orderId}</h4>
                            <div className="order-details">
                                <div className="order-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="order-general">
                                        <p><strong>Order Date:</strong> {order.orderDate}</p>
                                        <p><strong>Customer Name:</strong> {order.customerName}</p>
                                        <p><strong>Order Status:</strong> {order.orderStatus}</p>
                                        <p><strong>Delivery Status:</strong> {order.deliveryStatus}</p>
                                        <p><strong>Payment Status:</strong> {order.payStatus}</p>
                                        <p><strong>Expected Delivery Date:</strong> {order.expectedDeliveryDate}</p>
                                        <p><strong>Contact:</strong> {order.customerPhone}</p>
                                        <p><strong>Optional Contact:</strong> {order.customerOptionalPhone}</p>
                                        <p><strong>Special Note:</strong> {order.specialNote}</p>
                                    </div>
                                    <h5 className="mt-4">Payment Details</h5>
                                    <div className="order-general">
                                        <p><strong>Net Item Amount:</strong>Rs. {order.netTotal}</p>
                                        <p><strong>Delivery Amount:</strong>Rs. {order.deliveryCharge}</p>
                                        <p><strong>Discount Amount:</strong>Rs. {order.discount}</p>
                                        <p><strong>Total Amount:</strong>Rs. {order.totalPrice}</p>
                                        <p><strong>Payment Amount:</strong>Rs. {order.advance}</p>
                                        <p><strong>Balance Amount:</strong>Rs. {order.balance}</p>
                                    </div>
                                </div>
                            </div>
                        </Col>
                    </Row>

                    {/* Ordered Items */}
                    <Row>
                        <Col lg="12">
                            <div className="mt-4">
                                <h5 className="mt-4">Ordered Items</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {order.items.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Item:</strong> {item.itemName}</p>
                                                <p><strong>Color:</strong> {item.color}</p>
                                                <p><strong>Requested Quantity:</strong> {item.quantity}</p>
                                                <p><strong>Amount:</strong> Rs. {item.totalPrice}</p>
                                            </li>
                                        ))}
                                    </div>
                                </ul>
                            </div>
                        </Col>
                    </Row>

                    {/* Issued Items */}
                    <Row>
                        <Col lg="12">
                            <div className="mt-4">
                                <h5 className="mt-4">Issued Items</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {order.issuedItems.map((item, index) => (
                                            <li key={index}>
                                                <p><strong>Batch ID:</strong> {item.BatchId}</p>
                                                <p><strong>Stock ID:</strong> {item.stockId}</p>
                                                <p><strong>Issued On:</strong> {item.issuedDate}</p>
                                            </li>
                                        ))}
                                    </div>
                                </ul>
                            </div>
                        </Col>
                    </Row>

                    {/* Payment History */}
                    <Row>
                        <Col lg="12">
                            <div className="mt-4">
                                <h5 className="mt-4">Payment History</h5>
                                <ul className="order-items">
                                    <div className="order-general">
                                        {order.paymentHistory && order.paymentHistory.length > 0 ? (
                                            order.paymentHistory.map((payment, index) => (
                                                <li key={index}>
                                                    <p><strong>Payment ID:</strong> {payment.paymentId}</p>
                                                    <p><strong>Amount Paid:</strong> Rs. {payment.amount}</p>
                                                    <p><strong>Payment Date:</strong> {payment.paymentDate}</p>
                                                </li>
                                            ))
                                        ) : (
                                            <p>No payments made yet.</p>
                                        )}
                                    </div>
                                </ul>
                            </div>

                            {/* Print Button for Payment History */}
                            <div className="text-center mt-4">
                                <Button color="primary" onClick={handlePrintPaymentHistory}>
                                    Print Payment History
                                </Button>
                                <Button
                                    color="secondary"
                                    className="ms-3"
                                    onClick={() => {
                                        const userType = localStorage.getItem("type");
                                         if (order.orderStatus === "Delivered") {
                                             if (userType === "ADMIN") {
                                                 navigate("/admin-dashboard/product_list?tab=Delivered%20Orders");
                                             } else {
                                                 navigate("/user-dashboard/product-list?tab=Delivered%20Orders");
                                             }
                                         }else if (order.orderStatus === "Issued") {
                                             if (userType === "ADMIN") {
                                                 navigate("/admin-dashboard/product_list?tab=Issued%20Orders");
                                             } else {
                                                 navigate("/user-dashboard/product-list?tab=Issued%20Orders");
                                             }
                                         }
                                    }}
                                >
                                    <i className="bx bx-home-alt-2"></i>
                                </Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default IssuedOrderDetails;
