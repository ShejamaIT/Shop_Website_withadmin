import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TablePending = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState(""); // Search input state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    const fetchOrders = async () => {
        setLoading(true);
        const type = localStorage.getItem("type");
        const Eid = localStorage.getItem("EID");

        try {
            const endpoint = type === "ADMIN"
                ? "http://localhost:5001/api/admin/main/orders-pending"
                : `http://localhost:5001/api/admin/main/orders-pending-stid?eid=${Eid}`;


            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch`);

            const data = await response.json();
            setOrders(data.data);
            setFilteredOrders(data.data);
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

    // Handle search filter (by Order ID)
   const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        const filteredData = orders.filter((order) => {
            // Check for undefined or null contact fields and make sure they are strings
            const contact1 = order.contact1 ? order.contact1.toString() : "";
            const contact2 = order.contact2 ? order.contact2.toString() : "";

            // Check if query matches either contact number
            return (
                order.OrID.toString().toLowerCase().includes(query) ||
                contact1.toLowerCase().includes(query) ||
                contact2.toLowerCase().includes(query)
            );
        });
        setFilteredOrders(filteredData);
    };

    return (
        <div className="table-container">
            <h4 className="table-title">Pending Orders</h4>
            {/* 🔍 Search Box */}
            <input
                type="text"
                placeholder="Search by Order ID..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
            />

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Order Date</th>
                        <th>Order Type</th>
                        <th>Expected Date</th>
                        <th>Customer</th>
                        <th>Order Status</th>
                        <th>Delivery Status</th>
                        <th>Total Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="10" className="loading-text text-center">Loading orders...</td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="10" className="error-text text-center">No Orders....</td>
                        </tr>
                    ) : filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan="10" className="no-data text-center">No orders found</td>
                        </tr>
                    ) : (
                        filteredOrders.map((order) => (
                            <tr key={order.OrID}>
                                <td>{order.OrID}</td>
                                <td>{formatDate(order.orDate)}</td>
                                <td>{order.ordertype}</td>
                                <td>{formatDate(order.expectedDeliveryDate)}</td>
                                <td>{order.customer}</td>
                                <td>
                                        <span className={`status ${order.orStatus.toLowerCase()}`}>
                                            {order.orStatus}
                                        </span>
                                </td>
                                <td>{order.dvStatus}</td>
                                <td>Rs.{order.totPrice.toFixed(2)}</td>
                                <td className="action-buttons">
                                    <button
                                        className="view-btn"
                                        onClick={() => handleViewOrder(order.OrID)}
                                    >
                                        👁️
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TablePending;
