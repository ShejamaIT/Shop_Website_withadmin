import React, { useState, useEffect } from "react";
import "./TableTwo.css"; // Import the stylesheet
import axios from "axios";
import {useNavigate} from "react-router-dom";

const TableForProduction = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        // Fetch all items from API
        const fetchItems = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/allitemslessone"); // Adjust API URL if needed
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || "Failed to fetch items.");
                }

                setItems(data.data); // Assuming `data.data` contains the array of orders
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);
    const handleViewSuppliers = (itemId) => {
        navigate(`/supplier-detail/${itemId}`); // Navigate to OrderDetails page
    };
    return (
        <div className="table-container">
            <h4 className="table-title">For Production Items</h4>

            {loading ? (
                <p className="loading-message">Loading...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <div className="table-wrapper">
                    <table className="styled-table">
                        <thead>
                        <tr>
                            <th>Image</th>
                            <th>Item Name</th>
                            <th>Price</th>
                            <th>Quantity</th>
                            <th>Description</th>
                            <th>Action</th>
                        </tr>
                        </thead>
                        <tbody>
                        {items.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="no-data">
                                    No items found
                                </td>
                            </tr>
                        ) : (
                            items.map((item) => (
                                <tr key={item.I_Id}>
                                    <td>
                                        <img src={item.img} alt={item.I_name} className="product-image" />
                                    </td>
                                    <td>{item.I_name}</td>
                                    <td>Rs.{item.price}</td>
                                    <td>{item.availableQty}</td>
                                    <td>{item.descrip}</td>
                                    <td className="action-buttons">
                                        <button
                                            className="view-btn"
                                             onClick={() => handleViewSuppliers(item.I_Id)}
                                        >
                                            👁️ Get Suppliers
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

export default TableForProduction;
