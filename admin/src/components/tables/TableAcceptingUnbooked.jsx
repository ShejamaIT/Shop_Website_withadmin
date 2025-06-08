import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TableAcceptingUnbooked = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    const fetchOrders = async () => {
        const type = localStorage.getItem("type");
        const Eid = localStorage.getItem("EID");
        setLoading(true); // <- Ensure loading starts
        try {
            const endpoint = type === "ADMIN"
                ? "http://localhost:5001/api/admin/main/orders-accepting"
                : `http://localhost:5001/api/admin/main/orders-accepting-stid?eid=${Eid}`;

            const response = await fetch(endpoint);

            const data = await response.json(); // ✅ FIX: Parse response first

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch orders");
            }

            setOrders(data.data.unbookedOrders); // ✅ Use `data.data` based on your backend
            setFilteredOrders(data.data.unbookedOrders);
        } catch (err) {
            setError(err.message || "Something went wrong");
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

    // Search function (filters by Order ID)
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
            <h4 className="table-title">Unbooked Orders</h4>
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
                        <th>Customer </th>
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
                            <td colSpan="10" className="error-text text-center">{error}</td>
                        </tr>
                    ) : filteredOrders.length === 0 ? (
                        <tr>
                            <td colSpan="10" className="no-data text-center">No Unbooked orders found</td>
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

export default TableAcceptingUnbooked;
