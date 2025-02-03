import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import '../style/orderDetails.css';
import axios from "axios";
import { useParams } from "react-router-dom";

const OrderDetails = () => {
    const { id } = useParams(); // Get order ID from URL

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/order/${id}/details`);
                setOrder(response.data.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!order) {
        return <p>Order not found</p>;
    }

    return (
        <Helmet title={`Order Details - ${order.OrID}`}>
            <section>
                <Container>
                    <Row>
                        <Col lg='12'>
                            <h4 className='mb-5'>Order #{order.OrID} Details</h4>
                            <div className="order-details">
                                <div className="order-info">
                                    <p><strong>Order ID:</strong> {order.OrID}</p>
                                    <p><strong>Order Date:</strong> {new Date(order.orDate).toLocaleDateString()}</p>
                                    <p><strong>Customer Email:</strong> {order.customerEmail}</p>
                                    <p><strong>Order Status:</strong> <span className={`status ${order.orStatus.toLowerCase()}`}>{order.orStatus}</span></p>
                                    <p><strong>Delivery Status:</strong> {order.dvStatus}</p>
                                    <p><strong>Delivery Price:</strong> Rs. {order.dvPrice}</p>
                                    <p><strong>Discount Price:</strong> Rs. {order.disPrice}</p>
                                    <p><strong>Total Price:</strong> Rs. {order.totPrice}</p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default OrderDetails;
