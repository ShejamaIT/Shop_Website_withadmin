import React from "react";
import "../style/receiptView.css";

const ReceiptView = ({ receiptData, setShowReceiptView }) => {
    console.log(receiptData);
    const currentDateTime = new Date().toLocaleString();

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content receipt-modal">
                <h3 className="text-dark text-center">Shejama Groups</h3>
                <h5 className="text-center">No.75, Sri Premarathana Mw, Moratumulla</h5>
                <h5 className="text-center">071 3 608 108 / 077 3 608 108</h5>
                <hr />

                <p><strong>Order ID:</strong> #{receiptData.orID}</p>
                <p><strong>Order Date:</strong> {formatDate(receiptData.orderDate || currentDateTime)}</p>
                <p><strong>Date & Time:</strong> {currentDateTime}</p>
                <p><strong>Salesperson:</strong> {receiptData.salesperson}</p>
                <p><strong>Delivery Status:</strong> {receiptData.delStatus}</p>
                <p><strong>Payment Status:</strong> {receiptData.payStatus}</p>

                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {receiptData.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.unitPrice.toFixed(2)}</td>
                            <td>Rs. {(item.quantity * item.unitPrice).toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                <div className="receipt-summary">
                    <p><strong>Delivery Price:</strong> Rs. {receiptData.delPrice.toFixed(2)}</p>
                    <p><strong>Discount:</strong> Rs. {receiptData.discount.toFixed(2)}</p>
                    <p><strong>Net Total:</strong> Rs. {receiptData.total.toFixed(2)}</p>
                    <p><strong>Advance Paid:</strong> Rs. {receiptData.advance.toFixed(2)}</p>
                    <p><strong>Balance:</strong> Rs. {receiptData.balance.toFixed(2)}</p>
                </div>

                <div className="modal-buttons">
                    <button onClick={() => window.print()} className="print-btn">Print</button>
                    <button onClick={() => setShowReceiptView(false)} className="close-btn">Close</button>
                </div>
            </div>
        </div>
    );
};

export default ReceiptView;
