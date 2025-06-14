import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TablePending = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState("Walking");
    const navigate = useNavigate();
    const userType = localStorage.getItem("type");

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    useEffect(() => {
        applyFilters();
    }, [searchQuery, selectedType, orders]);

    const fetchOrders = async () => {
        setLoading(true);
        const type = userType;
        const Eid = localStorage.getItem("EID");

        try {
            const endpoint =
                type === "ADMIN"
                    ? "http://localhost:5001/api/admin/main/orders-pending"
                    : `http://localhost:5001/api/admin/main/orders-pending-stid?eid=${Eid}`;

            const response = await fetch(endpoint);
            if (!response.ok) throw new Error(`Error ${response.status}: Failed to fetch`);

            const data = await response.json();
            setOrders(data.data || []);
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

    const applyFilters = () => {
        const query = searchQuery.toLowerCase();

        const filtered = orders.filter((order) => {
            const matchesType = order.ordertype === selectedType;

            const contact1 = order.contact1 ? order.contact1.toString() : "";
            const contact2 = order.contact2 ? order.contact2.toString() : "";
            const stId = order.stID ? order.stID.toString() : "";
            const employeeName = order.employeeName ? order.employeeName.toLowerCase() : ""; // Added employeeName check

            const matchesSearch =
                order.OrID.toString().toLowerCase().includes(query) ||
                contact1.toLowerCase().includes(query) ||
                contact2.toLowerCase().includes(query) ||
                (userType === "ADMIN" && stId.toLowerCase().includes(query)) ||
                (userType === "ADMIN" && employeeName.includes(query)); // Added employee name search for ADMIN

            return matchesType && matchesSearch;
        });

        setFilteredOrders(filtered);
    };

    return (
        <div className="table-container">
            <h4 className="table-title">Pending Orders</h4>

            {/* Order Type Radio */}
            <div style={{ marginBottom: "15px" }}>
                <label style={{ marginRight: "20px" }}>
                    <input
                        type="radio"
                        value="Walking"
                        checked={selectedType === "Walking"}
                        onChange={(e) => setSelectedType(e.target.value)}
                    />
                    Walking Orders
                </label>
                <label>
                    <input
                        type="radio"
                        value="On-site"
                        checked={selectedType === "On-site"}
                        onChange={(e) => setSelectedType(e.target.value)}
                    />
                    On-site Orders 
                </label>
            </div>

            {/* Search Box */}
            <input
                type="text"
                placeholder={`Search by Order ID, Contact${userType === "ADMIN" ? ", or Staff ID" : ""}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
            />

            {loading ? (
                <p className="loading-text">Loading orders...</p>
            ) : error ? (
                <p className="error-text">Error: {error}</p>
            ) : (
                <div className="table-wrapper">
                    <table className="styled-table">
                        <thead>
                            <tr>
                                <th>Order ID</th>
                                <th>Order Date</th>
                                <th>Expected Date</th>
                                <th>Customer</th>
                                <th>Order Status</th>
                                <th>Delivery Status</th>
                                <th>Total Price</th>
                                {userType === "ADMIN" && <th>Staff ID</th>}
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="no-data">
                                        No {selectedType.toLowerCase()} orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => (
                                    <tr key={order.OrID}>
                                        <td>{order.OrID}</td>
                                        <td>{formatDate(order.orDate)}</td>
                                        <td>{formatDate(order.expectedDeliveryDate)}</td>
                                        <td>{order.customer}</td>
                                        <td>
                                            <span className={`status ${order.orStatus.toLowerCase()}`}>
                                                {order.orStatus}
                                            </span>
                                        </td>
                                        <td>{order.dvStatus}</td>
                                        <td>Rs.{order.totPrice.toFixed(2)}</td>
                                        {userType === "ADMIN" && <td>{order.stID || "N/A"}</td>}
                                        <td>
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
            )}
        </div>
    );
};

export default TablePending;
