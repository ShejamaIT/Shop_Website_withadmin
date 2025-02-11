import React, { useState, useEffect } from "react";
import "../style/invoice.css";

const ChangeQty = ({ selectedItem, setShowModal, handleSubmit2 }) => {
    // Initial state based on the selected item or default values
    const [quantity, setQuantity] = useState(selectedItem?.quantity || 1);
    const [updatedPrice, setUpdatedPrice] = useState(quantity * (selectedItem?.unitPrice || 0));

    // Update the price when the quantity changes
    useEffect(() => {
        if (selectedItem) {
            setUpdatedPrice(quantity * selectedItem.unitPrice);
        }
    }, [quantity, selectedItem]);

    // Handle quantity change and prevent invalid values
    const handleQuantityChange = (e) => {
        console.log(e.target);
        let value = e.target.value;
        console.log(value);
        // If the input is empty, treat it as 1, otherwise parse it to a number
        let newQty = value === "" ? 1 : parseInt(value, 10);
        console.log("newQty "+newQty);
        // // If parsed value is invalid or less than 1, reset it to 1
        // if (isNaN(newQty) || newQty < 1) {
        //     newQty = 1;
        // }
        //
        // // Ensure the quantity is within the stock limit
        // newQty = Math.max(1, Math.min(selectedItem.stockQuantity, newQty));

        // Update state
        setQuantity(newQty);
        setUpdatedPrice(selectedItem.unitPrice * newQty)
    };

    // Handle form submission (save the updated quantity and price)
    const handleSave = () => {
        if (quantity < 1 || isNaN(quantity)) {
            alert("Please enter a valid quantity.");
            return;
        }

        handleSubmit2({
            itemId: selectedItem.itemId,
            newQuantity: quantity,
            updatedPrice: updatedPrice,
            booked: selectedItem.booked, // Include booked status if needed
        });

        setShowModal(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="invoice-title">Change Request Qty</h2>

                <div className="invoice-section">
                    <p><strong>Item:</strong> {selectedItem.itemName}</p>

                    <div className="invoice-summary-item">
                        <label><strong>Requested Quantity:</strong></label>
                        <input
                            type="number"
                            value={quantity}
                            onChange={(e) => handleQuantityChange(e)}
                            min="1"
                            max={selectedItem.stockQuantity}
                        />
                    </div>

                    <p><strong>Available Quantity:</strong> {selectedItem.availableQuantity}</p>
                    <p><strong>Booked Quantity:</strong> {selectedItem.bookedQuantity}</p>
                    <p><strong>Unit Price:</strong> Rs. {selectedItem.unitPrice}</p>
                    <p><strong>Updated Price:</strong> Rs. {updatedPrice}</p>
                </div>

                <div className="modal-buttons">
                    <button className="save-btn" onClick={handleSave}>Save</button>
                    <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default ChangeQty;
