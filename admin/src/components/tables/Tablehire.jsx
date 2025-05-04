import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../style/TableThree.css";
import ChangeQty from "../../pages/changeQty";
import HirePayment from "../../pages/hirePayment";

const TableHire = ({ refreshKey }) => {
    const [hires, setHires] = useState([]);
    const [filteredHires, setFilteredHires] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const [showModal, setShowModal] = useState(false);
    const [selectedHire, setSelectedHire] = useState(null);

    useEffect(() => {
        fetchHires();
    }, [refreshKey]);

    const fetchHires = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/other-hires");
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to fetch hires");
            }

            setHires(data.data);
            setFilteredHires(data.data);
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

    const handleView = (hire) => {
        console.log(hire);
        setSelectedHire(hire);
        setShowModal(true);
    };

    const handleSearch = (event) => {
        const query = event.target.value.toLowerCase();
        setSearchQuery(query);

        const filteredData = hires.filter((hire) =>
            hire.custname?.toLowerCase().includes(query) ||
            hire.id?.toString().includes(query) ||
            hire.phoneNumber?.toLowerCase().includes(query)
        );

        setFilteredHires(filteredData);
    };
    const handleSubmit2 = async (formData) => {
        console.log(formData);
        // try {
        //     const response = await fetch(`http://localhost:5001/api/admin/main/change-quantity`, {
        //         method: "PUT",
        //         headers: {
        //             "Content-Type": "application/json",
        //         },
        //         body: JSON.stringify({
        //             itemId: formData.itemId,
        //             newQuantity: formData.newQuantity,
        //             updatedPrice: formData.updatedPrice,
        //             orId: formData.orId,
        //             booked: formData.booked,
        //         }),
        //     });
        //
        //     const data = await response.json();
        //
        //     if (response.ok) {
        //         fetchOrder();
        //         alert("Quantity updated successfully!");
        //     } else {
        //         alert(`Failed to update quantity: ${data.message}`);
        //     }
        // } catch (error) {
        //     console.error("Error during quantity update:", error);
        //     alert(`Error updating quantity: ${error.message}`);
        // }
    }


    return (
        <div className="table-container">
            <h4 className="table-title">All Other Hires</h4>
            <input
                type="text"
                placeholder="Search by Customer Name, ID, or Phone..."
                value={searchQuery}
                onChange={handleSearch}
                className="search-input"
            />

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Pickup</th>
                        <th>Destination</th>
                        <th>Hire</th>
                        <th>Date</th>
                        <th>Driver</th>
                        <th>Vehicle</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr><td colSpan="10" className="text-center">Loading hires...</td></tr>
                    ) : error ? (
                        <tr><td colSpan="10" className="text-center text-error">{error}</td></tr>
                    ) : filteredHires.length === 0 ? (
                        <tr><td colSpan="10" className="text-center">No hires found</td></tr>
                    ) : (
                        filteredHires.map((hire) => (
                            <tr key={hire.id}>
                                <td>{hire.id}</td>
                                <td>{hire.custname}</td>
                                <td>{hire.phoneNumber}</td>
                                <td>{hire.pickup}</td>
                                <td>{hire.destination}</td>
                                <td>{hire.hire}</td>
                                <td>{formatDate(hire.date)}</td>
                                <td>{hire.driverName }</td>
                                <td>{hire.registration_no }</td>
                                <td>
                                    <button
                                        className="view-btn"
                                        onClick={() => handleView(hire)}
                                    >
                                        👁️
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
                {showModal && selectedHire && (
                    <HirePayment
                        selectedHire={selectedHire}
                        setShowModal={setShowModal}
                        handleSubmit2={handleSubmit2}
                    />
                )}

            </div>
        </div>
    );
};

export default TableHire;
