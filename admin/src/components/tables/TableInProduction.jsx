import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate
import "./TableThree.css"; // Importing the stylesheet

const TableInproduction = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/orders-inproduction"); // Adjust API URL if needed
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

    // Function to navigate to order details page
    const handleViewOrder = (orderId) => {
        navigate(`/order-detail/${orderId}`); // Navigate to OrderDetails page
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
                            <th>Item ID</th>
                            <th>Supplier ID</th>
                            <th>Quantity </th>
                            <th>Expected Date</th>
                            <th>Special Note</th>
                        </tr>
                        </thead>
                        <tbody>
                        {orders.length === 0 ? (
                            <tr>
                                <td colSpan="9" className="no-data">No orders found</td>
                            </tr>
                        ) : (
                            orders.map((order) => (
                                <tr key={order.p_ID}>
                                    <td>{order.p_ID}</td>
                                    <td>{order.I_Id}</td>
                                    <td>{order.s_ID}</td>
                                    <td>{order.qty}</td>
                                    <td>{formatDate(order.expectedDate)}</td>
                                    <td>{order.specialNote}</td>
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

export default TableInproduction;
