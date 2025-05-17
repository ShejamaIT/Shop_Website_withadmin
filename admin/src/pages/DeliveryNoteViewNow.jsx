import React, { useRef } from "react";
import html2canvas from "html2canvas";
import "../style/deliveryRecipt.css";

const DeliveryNoteViewNow = ({ receiptData, setShowDeliveryView }) => {
    const {
        order, // expecting a single order object instead of orders array
        vehicleId,
        driverName,
        hire,
        balanceToCollect,
        selectedDeliveryDate,
    } = receiptData;

    const receiptRef = useRef(null);
    const Dhire = Number(hire);
    const currentDateTime = new Date().toLocaleString();

    const handleSaveAndRefresh = () => {
        if (receiptRef.current) {
            html2canvas(receiptRef.current, { scale: 2 }).then((canvas) => {
                const image = canvas.toDataURL("image/png");
                const link = document.createElement("a");
                link.href = image;
                link.download = `deliveryNote_${Date.now()}.png`;
                link.click();
            });
        }
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    const handleCloseAndRefresh = () => {
        setShowDeliveryView(false);
        setTimeout(() => {
            window.location.reload();
        }, 1000);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content receipt-modal" ref={receiptRef}>
                <h4 className="text-dark text-center">Shejama Group</h4>
                <h5 className="text-center">No.75, Sri Premarathana Mw, Moratumulla</h5>
                <h5 className="text-center">071 3 608 108 / 077 3 608 108</h5>
                <hr />

                <div className="delivery-note-info">
                    <p><strong>Delivery Note Date:</strong> {(selectedDeliveryDate || currentDateTime)}</p>
                    <p><strong>Vehicle ID:</strong> {vehicleId}</p>
                    <p><strong>Driver Name:</strong> {driverName}</p>
                    <p><strong>Hire:</strong> Rs. {Dhire.toFixed(2)}</p>
                    <p><strong>Order Id:</strong> {order.orderId}</p>
                    <p><strong>Customer:</strong> {order.customerName}</p>
                </div>

                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Total</th>
                        <th>Advance</th>
                        <th>Balance</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>Rs. {order.total}</td>
                        <td>Rs. {order.advance}</td>
                        <td>Rs. {order.balance}</td>
                    </tr>
                    </tbody>
                </table>

                <p><strong>Balance to Collect:</strong> Rs. {balanceToCollect.toFixed(2)}</p>

                <table className="receipt-table">
                    <thead>
                    <tr>
                        <th>Address</th>
                        <th>Contact 1</th>
                        <th>Contact 2</th>
                    </tr>
                    </thead>
                    <tbody>
                    <tr>
                        <td>{order.address}</td>
                        <td>{order.contact1}</td>
                        <td>{order.contact2}</td>
                    </tr>
                    </tbody>
                </table>
            </div>

            <div className="modal-buttons">
                <button onClick={handleSaveAndRefresh} className="print-btn">Save</button>
                <button onClick={handleCloseAndRefresh} className="close-btn">Close</button>
            </div>
        </div>
    );
};

export default DeliveryNoteViewNow;
