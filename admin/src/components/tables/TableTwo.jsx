import React, { useState, useEffect } from "react";
import "./TableTwo.css";
import axios from "axios";

const TableTwo = () => {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all items from API
        const fetchItems = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/admin/items");
                setItems(response.data);
            } catch (error) {
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

            {/* Table Header */}
            <div className="table-header">
                <div className="col col-img">Image</div>
                <div className="col col-name">Item Name</div>
                <div className="col col-price">Price</div>
                <div className="col col-qty">Quantity</div>
                <div className="col col-description">Description</div>
            </div>

            {/* Table Data with scroll */}
            <div className="table-body">
                {loading ? (
                    <p className="loading-message">Loading...</p>
                ) : items.length === 0 ? (
                    <p className="no-data-message">No items found</p>
                ) : (
                    items.map((item) => (
                        <div className="table-row" key={item.I_Id}>
                            <div className="col col-img">
                                <img src={item.img} alt={item.I_name} className="product-image" />
                            </div>
                            <div className="col col-name">{item.I_name}</div>
                            <div className="col col-price">Rs.{item.price}</div>
                            <div className="col col-qty">{item.qty}</div>
                            <div className="col col-description">{item.descrip}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default TableTwo;
