import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TableIssued = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    const fetchOrders = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/orders-issued");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch orders");
            }

            setOrders(data.bookedOrders);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
    };

    const handleViewOrder = (orderId) => {
        navigate(`/accept-order-detail/${orderId}`);
    };

    return (
        <div className="table-container">
            <div className="table-wrapper">
                {loading ? (
                    <p className="loading-text">Loading orders...</p>
                ) : error ? (
                    <p className="error-text">{error}</p>
                ) : (
                    <table className="styled-table">
                        <thead>
                        <tr>
                            <th>Order ID</th>
                            <th>Order Date</th>
                            <th>Order Type</th>
                            <th>Expected Date</th>
                            <th>Customer Email</th>
                            <th>Order Status</th>
                            <th>Delivery Status</th>
                            <th>Total Price</th>
                            <th>Acceptance Status</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="no-data">
                                    No Booked orders found
                                </td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.OrID}>
                                    <td>{order.OrID}</td>
                                    <td>{formatDate(order.orDate)}</td>
                                    <td>{order.ordertype}</td>
                                    <td>{formatDate(order.expectedDeliveryDate)}</td>
                                    <td>{order.customerEmail}</td>
                                    <td>
                                            <span className={`status ${order.orStatus.toLowerCase()}`}>
                                                {order.orStatus}
                                            </span>
                                    </td>
                                    <td>{order.dvStatus}</td>
                                    <td>
                                        {new Intl.NumberFormat("en-IN", {
                                            style: "currency",
                                            currency: "INR",
                                        }).format(order.totPrice)}
                                    </td>
                                    <td>{order.acceptanceStatus}</td>
                                    <td className="action-buttons">
                                        <button
                                            className="view-btn"
                                            onClick={() => handleViewOrder(order.OrID)}
                                            aria-label={`View order ${order.OrID}`}
                                        >
                                            👁️
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default TableIssued;
