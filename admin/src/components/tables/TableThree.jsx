import React, { useEffect, useState } from "react";
import "./TableThree.css"; // Importing the stylesheet

const TableThree = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("http://localhost:5000/api/admin/main/orders"); // Adjust API URL if needed
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch orders");
                }

                setOrders(data.data); // Assuming `data.data` contains the array of orders
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
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
                            <th>Customer Email</th>
                            <th>Order Status</th>
                            <th>Total Price</th>
                            <th>Actions</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="no-data">No orders found</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.OrID}>
                                    <td>{order.OrID}</td>
                                    <td>{formatDate(order.orDate)}</td>
                                    <td>{order.customerEmail}</td>
                                    <td>
                                            <span className={`status ${order.orStatus.toLowerCase()}`}>
                                                {order.orStatus}
                                            </span>
                                    </td>
                                    <td>Rs.{order.totPrice.toFixed(2)}</td>
                                    <td className="action-buttons">
                                        <button className="view-btn">👁️</button>
                                        <button className="edit-btn">✏️</button>
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

export default TableThree;
