import React, { useState, useEffect } from "react";
import "./TableTwo.css"; // Import the stylesheet
import axios from "axios";

const TableTwo = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch all items from API
        const fetchItems = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/admin/items");
                setItems(response.data);
            } catch (error) {
                setError("Error fetching items.");
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    return (
        <div className="table-container">
            <h4 className="table-title">All Items</h4>

            {loading ? (
                <p className="loading-message">Loading...</p>
            ) : error ? (
                <p className="error-message">{error}</p>
            ) : (
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Image</th>
                        <th>Item Name</th>
                        <th>Price</th>
                        <th>Quantity</th>
                        <th>Description</th>
                    </tr>
                    </thead>
                    <tbody className="table-body">
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="no-data">
                                No items found
                            </td>
                        </tr>
                    ) : (
                        items.slice(0, 4).map((item) => (
                            <tr key={item.I_Id}>
                                <td>
                                    <img src={item.img} alt={item.I_name} className="product-image" />
                                </td>
                                <td>{item.I_name}</td>
                                <td>Rs.{item.price}</td>
                                <td>{item.qty}</td>
                                <td>{item.descrip}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            )}
            <div className="scrollable-body">
                <table className="styled-table">
                    <tbody>
                    {items.length === 0 ? (
                        <tr>
                            <td colSpan="5" className="no-data">
                                No items found
                            </td>
                        </tr>
                    ) : (
                        items.slice(4).map((item) => (
                            <tr key={item.I_Id}>
                                <td>
                                    <img src={item.img} alt={item.I_name} className="product-image" />
                                </td>
                                <td>{item.I_name}</td>
                                <td>Rs.{item.price}</td>
                                <td>{item.qty}</td>
                                <td>{item.descrip}</td>
                            </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TableTwo;
