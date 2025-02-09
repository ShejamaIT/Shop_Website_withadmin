import React, { useState } from "react";
import "../style/invoice.css"; // Import the CSS file for styling

const BillInvoice = ({ selectedOrder, setShowModal }) => {
    const invoiceDate = new Date().toLocaleDateString(); // System Date

    // State for editable fields
    const [deliveryCharge, setDeliveryCharge] = useState(selectedOrder.deliveryCharge);
    const [discount, setDiscount] = useState(selectedOrder.discount);
    const [advance, setAdvance] = useState(selectedOrder.advance);

    // Calculate total for each item
    const calculateTotal = (item) => item.quantity * item.unitPrice;

    // Calculate Subtotal
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + calculateTotal(item), 0);

    // Calculate Net Total & Balance
    const netTotal = Number(subtotal) + Number(deliveryCharge) - Number(discount);

    // Calculate Balance
    const balance = netTotal - Number(advance);

    return (
        <div className="modal-overlay">
            <div className="modal-content bill-invoice">
                <h2 className="invoice-title">Invoice</h2>

                {/* Order Details */}
                <div className="invoice-section">
                    <p><strong>Order ID:</strong> #{selectedOrder.orderId}</p>
                    <p><strong>Order Date:</strong> {selectedOrder.orderDate}</p>
                    <p><strong>Invoice Date:</strong> {invoiceDate}</p>
                    <p><strong>Contact:</strong> {selectedOrder.phoneNumber}</p>
                </div>

                {/* Items Table */}
                <table className="invoice-table">
                    <thead>
                    <tr>
                        <th>Item</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.itemName}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.unitPrice.toFixed(2)}</td>
                            <td>Rs. {calculateTotal(item).toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>

                {/* Summary */}
                <div className="invoice-summary">
                    <p><strong>Subtotal:</strong> Rs. {subtotal.toFixed(2)}</p>

                    <div className="invoice-summary-item">
                        <label><strong>Delivery Price:</strong></label>
                        <input
                            type="number"
                            value={deliveryCharge}
                            onChange={(e) => setDeliveryCharge(e.target.value)}
                        />
                    </div>

                    <div className="invoice-summary-item">
                        <label><strong>Discount:</strong></label>
                        <input
                            type="number"
                            value={discount}
                            onChange={(e) => setDiscount(e.target.value)}
                        />
                    </div>

                    <hr />
                    <p><strong>Net Total:</strong> Rs. {netTotal.toFixed(2)}</p>

                    <div className="invoice-summary-item">
                        <label><strong>Advance:</strong></label>
                        <input
                            type="number"
                            value={advance}
                            onChange={(e) => setAdvance(e.target.value)}
                        />
                    </div>

                    <p><strong>Balance:</strong> Rs. {balance.toFixed(2)}</p>
                </div>


                {/* Print & Close Buttons */}
                <div className="modal-buttons">
                    <button className="print-btn" onClick={() => window.print()}>Print</button>
                    <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default BillInvoice;
