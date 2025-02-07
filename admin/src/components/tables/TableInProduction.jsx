import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import EditOrderModal from "../../pages/EditOrderModal"; // Import the modal component
import "../../style/inproduction.css"; // Import CSS

const TableInproduction = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/orders-inproduction");
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch orders");
                }

                setOrders(data.data);
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
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    };

    // Open modal and set selected order
    const handleEditClick = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    // Handle form submission (Update order status)
    const handleSubmit = async (formData) => {
        console.log(formData);
        // try {
        //     const response = await fetch(`http://localhost:5001/api/admin/main/update-order/${selectedOrder.p_ID}`, {
        //         method: "PUT",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(formData),
        //     });
        //
        //     const data = await response.json();
        //
        //     if (response.ok) {
        //         alert("Order status updated successfully!");
        //         setOrders((prevOrders) =>
        //             prevOrders.map((order) =>
        //                 order.p_ID === selectedOrder.p_ID ? { ...order, ...formData } : order
        //             )
        //         );
        //         setShowModal(false);
        //     } else {
        //         alert(data.message || "Failed to update status.");
        //     }
        // } catch (error) {
        //     alert("Server error. Please try again.");
        // }
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
                            <th>Quantity</th>
                            <th>Expected Date</th>
                            <th>Special Note</th>
                            <th>Status</th>
                            <th>Action</th>
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
                                    <td>{order.status}</td>
                                    <td className="action-buttons">
                                        <button className="edit-btn" onClick={() => handleEditClick(order)}>✏️</button>
                                    </td>
                                </tr>
                            ))
                        )}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Popup Modal */}
            {showModal && selectedOrder && (
                <EditOrderModal
                    selectedOrder={selectedOrder}
                    setShowModal={setShowModal}
                    handleSubmit={handleSubmit}
                />
            )}
        </div>
    );
};

export default TableInproduction;
