import React, { useState, useEffect } from "react";
import "./TableTwo.css"; // Import the stylesheet
import axios from "axios";
import {useNavigate} from "react-router-dom";

const TableTwo = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        fetchItems();
    }, []);

    // Fetch all items from API
    const fetchItems = async () => {
        try {
            const response = await axios.get("http://localhost:5001/api/admin/main/allitems");
            setItems(response.data);
        } catch (error) {
            setError("Error fetching items.");
            console.error("Error fetching items:", error);
        } finally {
            setLoading(false);
        }
    };

    // Function to navigate to order details page
    const handleViewItem = (itemId) => {
        navigate(`/item-detail/${itemId}`); // Navigate to OrderDetails page
    };

    return (
        <div className="table-container">
            <h4 className="table-title">All Items</h4>

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
                            <th>Item Id</th>
                            <th>Item Name</th>
                            <th>Price</th>
                            <th>All Quantity</th>
                            <th>Available Quantity</th>
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
                                    <td>{item.I_Id}</td>
                                    <td>{item.I_name}</td>
                                    <td>Rs.{item.price}</td>
                                    <td>{item.stockQty}</td>
                                    <td>{item.availableQty}</td>
                                    <td>{item.descrip}</td>
                                    <td className="action-buttons">
                                        <button
                                            className="view-btn"
                                             onClick={() => handleViewItem(item.I_Id)}
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

export default TableTwo;
