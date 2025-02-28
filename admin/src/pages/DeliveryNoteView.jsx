import React from "react";
import "../style/receiptView.css";

const DeliveryNoteView = ({ receiptData, setShowReceiptView }) => {
    // Destructure necessary values from the receiptData
    const { orders, vehicleId, driverName, hire, balanceToCollect, selectedDeliveryDate } = receiptData;
    console.log(receiptData);

    // Format the date
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    };

    // Current Date and Time
    const currentDateTime = new Date().toLocaleString();

    return (
        <div className="modal-overlay">
            <div className="modal-content receipt-modal">
                <h4 className="text-dark text-center">Shejama Groups</h4>
                <h5 className="text-center">No.75, Sri Premarathana Mw, Moratumulla</h5>
                <h5 className="text-center">071 3 608 108 / 077 3 608 108</h5>
                <hr />

                {/* Display Delivery Note Information */}
                <div className="delivery-note-info">
                    <p><strong>Delivery Note Date:</strong> {(selectedDeliveryDate || currentDateTime)} | </p>
                    <p><strong>Vehicle ID:</strong> {vehicleId} | </p>
                    <p><strong>Driver Name:</strong> {driverName} | </p>
                    <p><strong>Hire:</strong> {hire}</p>
                </div>

                {/* Orders Table */}
                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Customer Name</th>
                        <th>Total</th>
                        <th>Advance</th>
                        <th>Balance</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, index) => (
                        <tr key={index}>
                            <td>{order.orId}</td>
                            <td>{order.custName}</td>
                            <td>Rs. {order.total.toFixed(2)}</td>
                            <td>Rs. {order.advance.toFixed(2)}</td>
                            <td>Rs. {order.balance.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <p><strong>Balance to Collect:</strong> Rs. {balanceToCollect.toFixed(2)}</p>
                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Address</th>
                        <th>Contact 1</th>
                        <th>Contact 2</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, index) => (
                        <tr key={index}>
                            <td>{order.orId}</td>
                            <td>{order.address}</td>
                            <td>{order.contact1}</td>
                            <td>{order.contact2}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Action Buttons */}
                <div className="modal-buttons">
                    <button onClick={() => window.print()} className="print-btn">Print</button>
                    <button onClick={() => setShowReceiptView(false)} className="close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

export default DeliveryNoteView;
