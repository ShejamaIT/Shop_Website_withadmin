import React, { useRef } from "react";
import html2canvas from "html2canvas";
import "../style/deliveryRecipt.css";

const DeliveryNoteView = ({ receiptData, setShowDeliveryView }) => {
    const { orders, vehicleId, driverName, hire, balanceToCollect, selectedDeliveryDate } = receiptData;
    const receiptRef = useRef(null);

    const Dhire = Number(hire);

    const currentDateTime = new Date().toLocaleString();

    // Function to save the receipt as an image
    const saveAsImage = () => {
        if (receiptRef.current) {
            html2canvas(receiptRef.current, { scale: 2 }).then((canvas) => {
                const image = canvas.toDataURL("image/png"); // Convert canvas to image URL (Base64)
                const link = document.createElement("a");
                link.href = image;
                link.download = `deliveryNote_${Date.now()}.png`; // Set the download file name
                link.click(); // Trigger the download action
            });
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content receipt-modal" ref={receiptRef}>
                <h4 className="text-dark text-center">Shejama Groups</h4>
                <h5 className="text-center">No.75, Sri Premarathana Mw, Moratumulla</h5>
                <h5 className="text-center">071 3 608 108 / 077 3 608 108</h5>
                <hr />

                <div className="delivery-note-info">
                    <p><strong>Delivery Note Date:</strong> {(selectedDeliveryDate || currentDateTime)}</p>
                    <p><strong>Vehicle ID:</strong> {vehicleId}</p>
                    <p><strong>Driver Name:</strong> {driverName}</p>
                    <p><strong>Hire:</strong> Rs. {Dhire}</p>
                </div>

                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Order ID</th>
                        <th>Total</th>
                        <th>Advance</th>
                        <th>Balance</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, index) => (
                        <tr key={index}>
                            <td>{order.orderId}</td>
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
                        <th>Customer Name</th>
                        <th>Address</th>
                        <th>Contact 1</th>
                        <th>Contact 2</th>
                    </tr>
                    </thead>
                    <tbody>
                    {orders.map((order, index) => (
                        <tr key={index}>
                            <td>{order.orderId}</td>
                            <td>{order.customerName}</td>
                            <td>{order.address}</td>
                            <td>{order.contact1}</td>
                            <td>{order.contact2}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
            </div>

            <div className="modal-buttons">
                <button onClick={saveAsImage} className="print-btn">Save</button>
                <button onClick={() => setShowDeliveryView(false)} className="close-btn">Close</button>
            </div>
        </div>
    );
};

export default DeliveryNoteView;
