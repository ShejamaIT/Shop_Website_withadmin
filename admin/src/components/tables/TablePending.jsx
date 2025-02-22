import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TableThree.css";

const TablePending = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/orders-pending");
            if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch`);
            const data = await response.json();
            setOrders(data.data);
        } catch (err) {
            setError(err.message || "Unexpected error occurred.");
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) =>
        new Intl.DateTimeFormat("en-GB").format(new Date(dateString));

    const handleViewOrder = (orderId) => {
        navigate(`/order-detail/${orderId}`);
    };

    return (
        <div className="table-container">
            <div className="table-wrapper">
                {/*<button className="refresh-btn" onClick={fetchOrders}>🔄 Refresh</button>*/}
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
                            <th>Sales By</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="no-data">
                                    🚫 No pending orders found.
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
                                            currency: "LKR",
                                        }).format(order.totPrice)}
                                    </td>
                                    <td>{order.stID}</td>
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

export default TablePending;
