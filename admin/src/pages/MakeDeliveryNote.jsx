import React, { useState, useEffect } from "react";
import "../style/deleiverynote.css";
import { toast } from "react-toastify";

const MakeDeliveryNote = ({ selectedOrders, setShowModal, handleDeliveryUpdate }) => {
    const [vehicleId, setVehicleId] = useState("");
    const [driverName, setDriverName] = useState("");
    const [hire, setHire] = useState("");
    const [balanceToCollect, setBalanceToCollect] = useState(0);
    const [ordersWithBalance, setOrdersWithBalance] = useState([]);

    // Group orders into those with balance and without balance
    useEffect(() => {
        const ordersWithBalance = selectedOrders.filter(order => order.balance > 0);
        setOrdersWithBalance(ordersWithBalance);
    }, [selectedOrders]);

    // Calculate the total balance to collect
    useEffect(() => {
        const totalBalance = ordersWithBalance.reduce((sum, order) => sum + order.balance, 0);
        setBalanceToCollect(totalBalance);
    }, [ordersWithBalance]);

    const handlePrintAndSubmit = () => {
        if (balanceToCollect > 0 && (vehicleId === "" || driverName === "" || hire === "")) {
            toast.error("Please provide vehicle ID and driver name before submitting the delivery note.");
        } else {
            handleDeliveryUpdate({
                orders: selectedOrders,
                vehicleId,
                driverName,
                hire,
                balanceToCollect,
            });
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content make-delivery-note">
                <h2 className="invoice-title">Make Delivery Note</h2>

                {/* Orders Summary */}
                <div className="invoice-section">
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
                        {selectedOrders.map((order, index) => (
                            <tr key={index}>
                                <td>{order.orId}</td>
                                <td>{order.custName}</td>
                                <td>Rs.{order.total}</td>
                                <td>Rs.{order.advance}</td>
                                <td>Rs.{order.balance.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Balance to Collect Row */}
                <div className="balance-to-collect">
                    {/*<table className="receipt-table">*/}
                    {/*    <thead>*/}
                    {/*    <tr>*/}
                    {/*        <th>Balance to Collect</th>*/}
                    {/*        <th>Total</th>*/}
                    {/*    </tr>*/}
                    {/*    </thead>*/}
                    {/*    <tbody>*/}
                    {/*    {ordersWithBalance.map((order, index) => (*/}
                    {/*        <tr key={index}>*/}
                    {/*            <td>Order ID {order.orId}</td>*/}
                    {/*            <td>Rs. {order.balance.toFixed(2)}</td>*/}
                    {/*        </tr>*/}
                    {/*    ))}*/}
                    {/*    </tbody>*/}
                    {/*</table>*/}
                    <p><strong>Total Balance to Collect: </strong>Rs. {balanceToCollect.toFixed(2)}</p>
                </div>

                {/* Vehicle and Driver Info */}
                <div className="delivery-details">
                    <div className="input-group">
                        <div className="vehicle-info">
                            <label><strong>Vehicle ID:</strong></label>
                            <input
                                type="text"
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                placeholder="Enter vehicle ID"
                            />
                        </div>

                        <div className="driver-info">
                            <label><strong>Driver Name:</strong></label>
                            <input
                                type="text"
                                value={driverName}
                                onChange={(e) => setDriverName(e.target.value)}
                                placeholder="Enter driver's name"
                            />
                        </div>

                        <div className="hire-info">
                            <label><strong>Hire:</strong></label>
                            <input
                                type="text"
                                value={hire}
                                onChange={(e) => setHire(e.target.value)}
                                placeholder="Enter hire value"
                            />
                        </div>
                    </div>
                </div>


                {/* Action Buttons */}
                <div className="modal-buttons">
                    <button className="print-btn" onClick={handlePrintAndSubmit}>Print</button>
                    <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default MakeDeliveryNote;
