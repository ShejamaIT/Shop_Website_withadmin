import React, { useState, useEffect } from "react";
import "../style/deleiverynote.css";
import { toast } from "react-toastify";
import { Input } from "reactstrap";

const MakeDeliveryNote = ({ selectedOrders, setShowModal, handleDeliveryUpdate }) => {
    const [vehicleId, setVehicleId] = useState("");
    const [driverName, setDriverName] = useState("");
    const [driverId, setDriverId] = useState("");  // New: Stores the selected driver ID (devID)
    const [drivers, setDrivers] = useState([]);
    const [hire, setHire] = useState("");
    const [balanceToCollect, setBalanceToCollect] = useState(0);
    const [ordersWithBalance, setOrdersWithBalance] = useState([]);
    const [filteredDriver, setFilteredDriver] = useState([]);

    // Filter orders with balance
    useEffect(() => {
        const ordersWithBalance = selectedOrders.filter(order => order.balance > 0);
        setOrdersWithBalance(ordersWithBalance);
    }, [selectedOrders]);

    // Calculate total balance to collect
    useEffect(() => {
        const totalBalance = ordersWithBalance.reduce((sum, order) => sum + order.balance, 0);
        setBalanceToCollect(totalBalance);
    }, [ordersWithBalance]);
    useEffect(() => {
        const totalDeliveryCharge = selectedOrders.reduce((sum, order) => sum + (order.deliveryCharge || 0), 0);
        setHire(totalDeliveryCharge.toString());
    }, [selectedOrders]);


    // Fetch drivers
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/drivers");
                const data = await response.json();
                setDrivers(data.data || []);
            } catch (error) {
                toast.error("Error fetching drivers.");
            }
        };
        fetchDrivers();
    }, []);

    // Handle submission & printing
    const handlePrintAndSubmit = () => {
        if (balanceToCollect > 0 && (vehicleId === "" || hire === "" || !driverId)) {
            toast.error("Please provide vehicle ID, hire value, and select a driver before submitting.");
            return;
        }
        handleDeliveryUpdate({
            orders: selectedOrders,
            vehicleId,
            driverName,  // Includes selected driver name
            driverId,    // Includes selected driver ID (devID)
            hire,
            balanceToCollect,
        });
    };

    // Handle driver search
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setDriverName(value);

        if (!value.trim()) {
            setFilteredDriver([]);
        } else {
            const filtered = drivers.filter((driver) =>
                driver.devID.toString().includes(value) || driver.employeeName.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredDriver(filtered);
        }
    };

    // Select driver from dropdown
    const handleSelectDriver = (driver) => {
        setDriverId(driver.devID);   // Store driver ID (devID)
        setDriverName(driver.employeeName);  // Store driver name
        setFilteredDriver([]);  // Hide dropdown
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
                                <td>{order.orderId}</td>
                                <td>{order.customerName}</td>
                                <td>Rs.{order.totalPrice}</td>
                                <td>Rs.{order.advance}</td>
                                <td>Rs.{order.balance.toFixed(2)}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                {/* Balance to Collect Row */}
                <div className="balance-to-collect">
                    <p><strong>Total Balance to Collect: </strong>Rs. {balanceToCollect.toFixed(2)}</p>
                </div>

                {/* Vehicle and Driver Info */}
                <div className="delivery-details">
                    <div className="input-group">
                        {/* Vehicle ID */}
                        <div className="vehicle-info">
                            <label><strong>Vehicle ID:</strong></label>
                            <input
                                type="text"
                                value={vehicleId}
                                onChange={(e) => setVehicleId(e.target.value)}
                                placeholder="Enter vehicle ID"
                            />
                        </div>

                        {/* Driver Selection */}
                        <div className="driver-info">
                            <label><strong>Driver Name:</strong></label>
                            <Input
                                type="text"
                                placeholder="Search driver"
                                value={driverName}
                                onChange={handleSearchChange}
                            />
                            {driverName && filteredDriver.length > 0 && (
                                <div className="dropdown">
                                    {filteredDriver.map((driver) => (
                                        <div
                                            key={driver.devID}
                                            onClick={() => handleSelectDriver(driver)}
                                            className="dropdown-item"
                                        >
                                            {driver.employeeName} ({driver.devID})
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Hire Fee */}
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
                    <button className="print-btn" onClick={handlePrintAndSubmit}>Save</button>
                    <button className="close-btn" onClick={() => setShowModal(false)}>Close</button>
                </div>
            </div>
        </div>
    );
};

export default MakeDeliveryNote;
