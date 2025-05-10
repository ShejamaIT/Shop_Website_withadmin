import React, { useState, useEffect } from "react";
import "../../style/TableTwo.css"; // Import the stylesheet
import { useNavigate } from "react-router-dom";

const TableAllDeliveryNotes= () => {
    const [deliverynotes, setDeliverynotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate
    const type = localStorage.getItem("type");
    const Eid = localStorage.getItem("EID");
    useEffect(() => {
        fetchNotes();
    }, []);

    // Fetch all items from API
    const fetchNotes = async () => {

        setLoading(true); // <- Ensure loading starts
        try {
            const endpoint = type === "ADMIN"
                ? "http://localhost:5001/api/admin/main/alldeliverynotes"
                : `http://localhost:5001/api/admin/main/alldeliverynotes-stid?eid=${Eid}`;

            const response = await fetch(endpoint);

            const data = await response.json(); // ✅ FIX: Parse response first

            console.log(data);
            if (data.length > 0) {
                setDeliverynotes(data); // Store fetched items
            } else {
                setDeliverynotes([]); // Set empty array
                setError("No deliveries available."); // Show "No items" message
            }
        } catch (error) {
            setDeliverynotes([]); // Ensure items array is empty on error
            setError("Error fetching deliveries.");
            console.error("Error fetching deliveries:", error);
        } finally {
            setLoading(false); // Stop loading state
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1)
            .toString()
            .padStart(2, "0")}-${date.getFullYear()}`;
    };
    const handleView = (delNoID) => {
        if (type === "ADMIN"){
            navigate(`/deliveryNote-detail/${delNoID}`); // Navigate to OrderDetails page
        } else if (type === "DRIVER"){
            navigate(`/deliveryNote-detail-drive/${delNoID}`); // Navigate to OrderDetails page
        }

    };
    return (
        <div className="table-container">
            <h4 className="table-title">All Deliveries</h4>

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Delivery NoteId</th>
                        <th>Delivery Date</th>
                        <th>Driver Name</th>
                        <th>District</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="8" className="loading-text text-center">Loading...</td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="8" className="error-text text-center">{error}</td>
                        </tr>
                    ) : deliverynotes.length === 0 ? (
                        <tr>
                            <td colSpan="8" className="no-items-message text-center">No items found</td>
                        </tr>
                    ) : (
                        deliverynotes.map((delivery) => (
                            <tr key={delivery.delNoID}>
                                <td>{delivery.delNoID}</td>
                                <td>{formatDate(delivery.date)}</td>
                                <td>{delivery.driverName}</td>
                                <td>{delivery.district}</td>
                                <td>{delivery.status}</td>
                                <td className="action-buttons">
                                    <button
                                        className="view-btn"
                                         onClick={() => handleView(delivery.delNoID)}
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

export default TableAllDeliveryNotes;
