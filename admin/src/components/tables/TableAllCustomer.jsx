import React, { useState, useEffect } from "react";
import "../../style/TableTwo.css"; // Import the stylesheet
import { useNavigate } from "react-router-dom";

const TableAllCustomer = () => {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        fetchCustomers();
    }, []);

    // Fetch all customers from API
    const fetchCustomers = async () => {
        setLoading(true); // Start loading state

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/allcustomers");
            const data = await response.json();

            if (response.ok) {
                setCustomers(data); // Store fetched customers
            } else {
                setCustomers([]); // Set empty array
                setError(data.message || "No customers available."); // Show error message
            }
        } catch (error) {
            setCustomers([]); // Ensure customers array is empty on error
            setError("Error fetching customers.");
            console.error("Error fetching customers:", error);
        } finally {
            setLoading(false); // Stop loading state
        }
    };

    return (
        <div className="table-container">
            <h4 className="table-title">All Customers</h4>

            <div className="table-wrapper">
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Customer Id</th>
                        <th>Name</th>
                        <th>NIC</th>
                        <th>Contact</th>
                        <th>Balance</th>
                        <th>Type</th>
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
                                <td>{customer.balance}</td>
                                <td>{customer.type}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableAllCustomer;
