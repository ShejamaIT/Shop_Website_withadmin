import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TableAccepting = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [orderType, setOrderType] = useState("Walking"); // Default to Walking
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    useEffect(() => {
        filterOrders();
    }, [orderType, searchQuery, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        const type = localStorage.getItem("type");
        const Eid = localStorage.getItem("EID");

        try {
            const endpoint =
                type === "ADMIN"
                    ? "http://localhost:5001/api/admin/main/orders-accepting"
                    : `http://localhost:5001/api/admin/main/orders-accepting-stid?eid=${Eid}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch orders");
            }

            setOrders(data.data.bookedOrders);
        } catch (err) {
            setError(err.message || "Something went wrong");
        } finally {
            setLoading(false);
        }
    };

    const filterOrders = () => {
        const filtered = orders.filter((order) => {
            const matchesType = order.ordertype === orderType;
            const contact1 = order.contact1 ? order.contact1.toString() : "";
            const contact2 = order.contact2 ? order.contact2.toString() : "";
            const matchesSearch =
                order.OrID.toString().toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact1.toLowerCase().includes(searchQuery.toLowerCase()) ||
                contact2.toLowerCase().includes(searchQuery.toLowerCase());

            return matchesType && matchesSearch;
        });

        setFilteredOrders(filtered);
    };

    const handleViewOrder = (orderId) => {
        navigate(`/accept-order-detail/${orderId}`);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
    };

    return (
        <div className="table-container">
            <h4 className="table-title">Booked Orders</h4>

            {/* Radio buttons for order type selection */}
            <div style={{ marginBottom: "15px" }}>
                <label style={{ marginRight: "20px" }}>
                    <input
                        type="radio"
                        name="orderType"
                        value="Walking"
                        checked={orderType === "Walking"}
                        onChange={() => setOrderType("Walking")}
                    />{" "}
                    Walking Orders
                </label>
                <label>
                    <input
                        type="radio"
                        name="orderType"
                        value="On-site"
                        checked={orderType === "On-site"}
                        onChange={() => setOrderType("On-site")}
                    />{" "}
                    On-site Orders
                </label>
            </div>

            {/* Search input */}
            <input
                type="text"
                placeholder="Search by Order ID or Contact..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
                                <td colSpan="10" className="error-text text-center">{error}</td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan="10" className="no-data text-center">
                                    No {orderType} orders found
                                </td>
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

export default TableAccepting;
