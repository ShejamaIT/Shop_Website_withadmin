import React, { useState, useEffect } from "react";
import "../style/finalInvoice.css";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { toast } from "react-toastify";

const FinalInvoice = ({ selectedOrder, setShowModal2, handlePaymentUpdate }) => {
    const invoiceDate = new Date().toLocaleDateString();
    const [paymentType, setPaymentType] = useState(selectedOrder.payStatus);
    const [deliveryStatus, setDeliveryStatus] = useState(selectedOrder.deliveryStatus);
    const [advance, setAdvance] = useState(selectedOrder.advance);
    const [nowPay, setNowPay] = useState(0);
    const [showStockModal, setShowStockModal] = useState(false);
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState([]);

    const calculateTotal = (item) => item.quantity * item.unitPrice;
    const delivery = Number(selectedOrder.deliveryCharge);
    const subtotal = selectedOrder.items.reduce((sum, item) => sum + calculateTotal(item), 0);
    const totalAdvance = Number(advance) + Number(nowPay);
    const netTotal = (subtotal + delivery) - Number(selectedOrder.discount);
    const balance = netTotal - totalAdvance;

    useEffect(() => {
        if (balance === 0) {
            setPaymentType('Settled');
        }
    }, [balance]);

    const handlePrintAndSubmit = () => {
        if (balance !== 0) {
            toast.error("Select correct payment type first");
        } else if (selectedItems.length === 0) {  // Fix: Check if selectedItems is empty
            toast.error("No reserved items selected.");
        } else {
            console.log(
                selectedOrder.orderId, paymentType, deliveryStatus, advance, nowPay, totalAdvance,
                netTotal, balance, delivery, selectedOrder, selectedItems
            );
        }
    };

    useEffect(() => {
        const itemIds = [...new Set(selectedOrder.items.map(item => item.itemId))];
        const fetchItems = async () => {
            try {
                if (itemIds.length === 0) {
                    toast.error("No valid item IDs to fetch stock details.");
                    return;
                }
                const response = await fetch("http://localhost:5001/api/admin/main/get-stock-details", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(itemIds)
                });

                if (!response.ok) throw new Error("Failed to fetch stock details");

                const data = await response.json();
                if (data.stockDetails && data.stockDetails.length > 0) {
                    setItems(data.stockDetails);
                } else {
                    toast.error("No stock details found for selected items.");
                }
            } catch (error) {
                toast.error("Error loading stock details.");
            }
        };

        if (showStockModal && selectedOrder.items.length > 0) {
            fetchItems();
        }
    }, [showStockModal, selectedOrder.items]);

    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        const filtered = items.filter((item) =>
            item.I_Id.toString().includes(term) || item.I_Id.toLowerCase().includes(term.toLowerCase())
        );
        setFilteredItems(filtered);
        setDropdownOpen(filtered.length > 0);
    };

    const handleSelectItem = (item) => {
        if (!selectedItems.some(selected => selected.I_Id === item.I_Id)) {
            setSelectedItems([...selectedItems, item]);
        }
        setSearchTerm('');
        setDropdownOpen(false);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, "0")}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getFullYear()}`;
    };

    const handlePaymentTypeChange = (e) => {
        setPaymentType(e.target.value);
    };

    const passReservedItem = () => {
        setSelectedItem(selectedItems);
        setShowStockModal(false);
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content final-invoice">
                <h2 className="invoice-title">Final Invoice</h2>
                <div className="invoice-section">
                    <p><strong>Order ID:</strong> #{selectedOrder.orderId}</p>
                    <p><strong>Order Date:</strong> {formatDate(selectedOrder.orderDate)}</p>
                    <p><strong>Invoice Date:</strong> {formatDate(invoiceDate)}</p>
                    <p><strong>Contact:</strong> {selectedOrder.phoneNumber}</p>

                    <div className="payment-type">
                        <label><strong>Payment Status:</strong></label>
                        <select value={paymentType} onChange={handlePaymentTypeChange}>
                            {deliveryStatus === "Pickup" && (
                                <>
                                    <option value="Settled">Settled</option>
                                    <option value="Credit">Credit</option>
                                </>
                            )}
                            {deliveryStatus === "Delivery" && (
                                <>
                                    <option value="Settled">Settled</option>
                                    <option value="COD">COD</option>
                                    <option value="Credit">Credit</option>
                                </>
                            )}
                            {balance === 0 && <option value="Settled">Settled</option>}
                        </select>
                    </div>

                    <div className="delivery-status">
                        <label><strong>Delivery Status:</strong></label>
                        <p>{selectedOrder.deliveryStatus}</p>
                    </div>
                </div>

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

                <div className="modal-buttons">
                    <button className="scan-btn" onClick={() => setShowStockModal(true)}>Scan</button>
                    <button className="print-btn" onClick={handlePrintAndSubmit}>Print</button>
                    <button className="close-btn" onClick={() => setShowModal2(false)}>Close</button>
                </div>
            </div>

            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Scan Stock</ModalHeader>
                <ModalBody>
                    <FormGroup>
                        <Label>Items ID</Label>
                        <Input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search for item..." />
                    </FormGroup>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={passReservedItem}>Pass</Button>
                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};

export default FinalInvoice;
