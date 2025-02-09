import React, { useState, useEffect } from "react";
import "../style/EditOrderModal.css"; // Import CSS file

const BillInvoice = ({ selectedOrder, setShowModal, handleSubmit }) => {
    const [newStatus, setNewStatus] = useState(selectedOrder.status || "Incomplete");
    const [isOrderComplete, setIsOrderComplete] = useState(false);
    const [rDate, setRDate] = useState("");
    const [recCount, setRecCount] = useState("");
    const [detail, setDetail] = useState("");

    // Function to check order completion
    const checkOrderCompletion = () => {
        const qty = Number(selectedOrder.qty); // Ensure it's a number
        const receivedQty = Number(recCount);  // Ensure it's a number


        /* Ordered Count */
        // if (qty === receivedQty) {
        //     setIsOrderComplete(true);
        //     setNewStatus("Complete");
        // } else {
        //     setIsOrderComplete(false);
        //     setNewStatus("Incomplete");
        // }

        /* More than Ordered Count */
        if (receivedQty >= qty) {
            setIsOrderComplete(true);
            setNewStatus("Complete");
        } else {
            setIsOrderComplete(false);
            setNewStatus("Incomplete");
        }
    };

    // Effect to update status after state changes
    useEffect(() => {
        if (rDate && recCount) {
            checkOrderCompletion(); // Ensure status updates before submitting
        }
    }, [recCount, rDate]); // Runs when `recCount` or `rDate` changes

    // Handle form submission
    const handleFormSubmit = (e) => {
        e.preventDefault();

        handleSubmit({ newStatus, isOrderComplete, rDate, recCount, detail });

    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h4>{{/*order id*/}} Invoice</h4>
                <form onSubmit={handleFormSubmit}>
                    {/* Order ID (Disabled) */}
                    <label><strong>Order ID:</strong></label>
                    <p>{selectedOrder.orderId}</p>

                    {/*/!* Expected Date Display *!/*/}
                    {/*<label><strong>Expected Date:</strong></label>*/}
                    {/*<p>{formatDate(selectedOrder.expectedDate)}</p>*/}

                    {/*/!* Received Date Input *!/*/}
                    {/*<label><strong>Received Date:</strong></label>*/}
                    {/*<input type="date" value={rDate} onChange={(e) => setRDate(e.target.value)} required />*/}

                    {/*/!* Received Count Input *!/*/}
                    {/*<label><strong>Received Count:</strong></label>*/}
                    {/*<input type="number" value={recCount} onChange={(e) => setRecCount(e.target.value)} min="1" required />*/}

                    {/*/!* Detail Input *!/*/}
                    {/*<label><strong>Detail:</strong></label>*/}
                    {/*<textarea value={detail} onChange={(e) => setDetail(e.target.value)} rows="3" />*/}

                    {/*/!* Order Complete Checkbox *!/*/}
                    {/*<div className="checkbox-container">*/}
                    {/*    <input type="checkbox" id="orderComplete" checked={isOrderComplete} readOnly />*/}
                    {/*    <label htmlFor="orderComplete">Order Complete</label>*/}
                    {/*</div>*/}

                    {/* Buttons */}
                    <div className="modal-buttons">
                        <button type="submit" className="save-btn">Save</button>
                        <button type="button" className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default BillInvoice;
