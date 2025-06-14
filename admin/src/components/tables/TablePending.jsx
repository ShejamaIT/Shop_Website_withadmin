import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";

const TablePending = ({ refreshKey }) => {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedType, setSelectedType] = useState("Walking"); // Radio state
    const navigate = useNavigate();

    useEffect(() => {
        fetchOrders();
    }, [refreshKey]);

    const fetchOrders = async () => {
        setLoading(true);
        const type = localStorage.getItem("type");
        const Eid = localStorage.getItem("EID");

        try {
            const endpoint =
                type === "ADMIN"
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

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        const filteredData = orders.filter((order) => {
            const contact1 = order.contact1 ? order.contact1.toString() : "";
            const contact2 = order.contact2 ? order.contact2.toString() : "";

            return (
                order.OrID.toString().toLowerCase().includes(query) ||
                contact1.toLowerCase().includes(query) ||
                contact2.toLowerCase().includes(query)
            );
        });
        setFilteredOrders(filteredData);
    };

    const filteredByType = filteredOrders.filter(
        (order) => order.ordertype === selectedType
    );

    return (
        <div className="table-container">
            <h4 className="table-title">Pending Orders</h4>

            {/* Radio Buttons */}
            <div className="radio-group">
                <label>
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
                    Online
                </label>
            </div>

            {/* Search Box */}
            <input
                type="text"
                placeholder="Search by Order ID or Contact..."
                value={searchQuery}
                onChange={handleSearch}
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
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredByType.length === 0 ? (
                                <tr>
                                    <td colSpan="9" className="no-data">
                                        No {selectedType.toLowerCase()} orders found.
                                    </td>
                                </tr>
                            ) : (
                                filteredByType.map((order) => (
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
