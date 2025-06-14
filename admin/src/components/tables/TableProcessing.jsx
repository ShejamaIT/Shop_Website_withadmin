import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TableProcessing = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedType, setSelectedType] = useState("Walking");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const userType = localStorage.getItem("type");
    const Eid = localStorage.getItem("EID");

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    useEffect(() => {
        applySearchAndTypeFilter();
    }, [orders, searchQuery, selectedType]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const endpoint =
                userType === "ADMIN"
                    ? "http://localhost:5001/api/admin/main/orders-Processing"
                    : `http://localhost:5001/api/admin/main/orders-Processing-stid?eid=${Eid}`;

            const response = await fetch(endpoint);
            const data = await response.json();

            if (!response.ok) throw new Error(data.message || "Failed to fetch orders");

            setOrders(data.data || []);
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
        navigate(`/prodution-order-detail/${orderId}`);
    };

    const applySearchAndTypeFilter = () => {
        const query = searchQuery.toLowerCase();

        const filtered = orders.filter((order) => {
            const contact1 = order.contact1 ? order.contact1.toString() : "";
            const contact2 = order.contact2 ? order.contact2.toString() : "";
            const stId = order.stID ? order.stID.toString() : "";

            const matchesSearch =
                order.OrID.toString().toLowerCase().includes(query) ||
                contact1.toLowerCase().includes(query) ||
                contact2.toLowerCase().includes(query) ||
                (userType === "ADMIN" && stId.toLowerCase().includes(query));

            const matchesType = order.ordertype === selectedType;

            return matchesSearch && matchesType;
        });

        setFilteredOrders(filtered);
    };

    return (
        <div className="table-container">
            <h4 className="table-title">In-Production Orders</h4>

            {/* Radio Buttons */}
            <div style={{ marginBottom: "15px" }}>
                <label style={{ marginRight: "20px" }}>
                    <input
                        type="radio"
                        value="Walking"
                        checked={selectedType === "Walking"}
                        onChange={(e) => setSelectedType(e.target.value)}
                    />
                    Walking
                </label>
                <label>
                    <input
                        type="radio"
                        value="On-site"
                        checked={selectedType === "On-site"}
                        onChange={(e) => setSelectedType(e.target.value)}
                    />
                    On-site
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
                            {userType === "ADMIN" && <th>Sales By</th>}
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={userType === "ADMIN" ? "10" : "9"} className="loading-text text-center">
                                    Loading orders...
                                </td>
                            </tr>
                        ) : error ? (
                            <tr>
                                <td colSpan={userType === "ADMIN" ? "10" : "9"} className="error-text text-center">
                                    {error}
                                </td>
                            </tr>
                        ) : filteredOrders.length === 0 ? (
                            <tr>
                                <td colSpan={userType === "ADMIN" ? "10" : "9"} className="no-data text-center">
                                    No {selectedType.toLowerCase()} orders found.
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
                                        <span className={`status ${order.orStatus?.toLowerCase()}`}>
                                            {order.orStatus}
                                        </span>
                                    </td>
                                    <td>{order.dvStatus}</td>
                                    <td>Rs.{order.totPrice.toFixed(2)}</td>
                                    {userType === "ADMIN" && <td>{order.stID || "N/A"}</td>}
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

export default TableProcessing;
