import React, { useState, useEffect } from "react";
import "../../style/TableTwo.css"; // Import the stylesheet
import { useNavigate } from "react-router-dom";

const TableCustomer = ({ filter, title }) => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchCustomers();
    }, [filter]); // Re-fetch when filter changes

    // Fetch customers from API with the provided filter
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/allcustomers?filter=${filter}`);
            const data = await response.json();

            if (response.ok) {
                setCustomers(data);
            } else {
                setCustomers([]);
                setError(data.message || "No customers available.");
            }
        } catch (error) {
            setCustomers([]);
            setError("Error fetching customers.");
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="table-container">
            <h4 className="table-title">{title}</h4>
            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Customer Id</th>
                        <th>Name</th>
                        <th>NIC</th>
                        <th>Contact</th>
                        <th>Balance</th>
                        <th>Action</th>
                    </tr>
                    </thead>
                    <tbody>
                    {loading ? (
                        <tr>
                            <td colSpan="5" className="loading-text text-center">Loading...</td>
                        </tr>
                    ) : error ? (
                        <tr>
                            <td colSpan="5" className="error-text text-center">{error}</td>
                        </tr>
                    ) : customers.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="no-items-message text-center">No customers found</td>
                        </tr>
                    ) : (
                        customers.map((customer) => (
                            <tr key={customer.c_ID}>
                                <td>{customer.c_ID}</td>
                                <td>{customer.name}</td>
                                <td>{customer.id}</td>
                                <td>{customer.contact1}</td>
                                <td className={customer.balance < 0 ? "negative-balance" : ""}>
                                    {customer.balance}
                                </td>
                                <td className="action-buttons">
                                    <button
                                        className="view-btn"
                                        // onClick={() => handleViewOrder(order.OrID)}
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

export default TableCustomer;
