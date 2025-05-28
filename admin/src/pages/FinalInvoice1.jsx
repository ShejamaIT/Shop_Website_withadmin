import React, { useState, useEffect } from "react";
import "../style/finalInvoice.css";
import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from "reactstrap";
import { toast } from "react-toastify";

const FinalInvoice1 = ({ selectedOrder, setShowModal2, handlePaymentUpdate,handleDeliveryNote }) => {
    const invoiceDate = new Date().toLocaleDateString();
    const [paymentType, setPaymentType] = useState(selectedOrder.payStatus);
    const [deliveryStatus, setDeliveryStatus] = useState(selectedOrder.deliveryStatus);
    const [advance, setAdvance] = useState(selectedOrder.advance);
    const [nowPay, setNowPay] = useState(0);
    const [showStockModal, setShowStockModal] = useState(false);
    const [items, setItems] = useState([]); // State to store supplier data
    const [selectedItems, setSelectedItems] = useState([]); // State to store selected stock items
    const [searchTerm, setSearchTerm] = useState('');
    const [dropdownOpen, setDropdownOpen] = useState(false);  // To handle dropdown visibility
    const [filteredItems, setFilteredItems] = useState([]); // List to store filtered items based on search term
    const [selectedItem, setSelectedItem] = useState([]);
    const [isLoading, setIsLoading] = useState(false);  // Loading state for stock fetch
    const calculateTotal = (item) => item.quantity * (item.price/item.quantity);
    const discount = Number(selectedOrder.discount) || 0;  // Default to 0 if undefined or NaN
    const delivery = Number(selectedOrder.deliveryCharge) || 0;  // Default to 0 if undefined or NaN
    const subtotal = Number(selectedOrder.items.reduce((sum, item) => sum + calculateTotal(item), 0)) || 0;  // Ensure subtotal is a valid number
    const totalAdvance = Number(advance) + Number(nowPay) || 0;  // Ensure advance is valid
    const netTotal = (subtotal + delivery - (Number(selectedOrder.discount) || 0));  // Default discount to 0 if undefined or NaN
    const balance = netTotal - totalAdvance;
    useEffect(() => {
        if (balance === 0) {
            setPaymentType('Settled');
        }
    }, [balance]);

    useEffect(() => {
        if (advance !== 0) {
            setPaymentType('Advanced');
        }
    }, [advance]);
    const handlePrintAndSubmit = () => {
        // Ensure balance is 0 or paymentType is either 'COD' or 'Credit'
        if (balance !== 0 && (paymentType !== 'COD' && paymentType !== 'Credit')) {
            toast.error("If balance is not settled, the payment type must be either 'COD' or 'Credit'.");
        } else if (selectedItems.length === 0) {
            toast.error("No reserved items selected.");
        } else {
            handlePaymentUpdate({
                orderId: selectedOrder.orderId,
                paymentType: paymentType, deliveryStatus: deliveryStatus, totalAdvance: totalAdvance, subtotal: subtotal,
                billTotal: netTotal, balance: balance, delivery: delivery, selectedItems: selectedItems,
            });
        }
    };
    const viewhandle = () =>{
        handleDeliveryNote(
            // setShowModal2(false)
        );
    };
    const viewhandle1 = () => {
        setShowModal2(false);
        setTimeout(() => {
            window.location.reload(); // Refresh after closing modal
        }, 300); // Slight delay gives smoother UX
    };
    
    useEffect(() => {
        const itemIds = [...new Set(selectedOrder.items.map(item => item.itemId))];
        const fetchReservedAndUnreserved = async () => {
            try {
                setIsLoading(true);
                if (!selectedOrder?.orderId || itemIds.length === 0) {
                    toast.error("Invalid order or item data.");
                    return;
                }
                // 1. Fetch reserved items
                const reservedRes = await fetch("http://localhost:5001/api/admin/main/get-special-reserved", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orID: selectedOrder.orderId, itemIds })
                });
                let reservedItems = [];
                if (reservedRes.ok) {
                    const reservedData = await reservedRes.json();
                    reservedItems = reservedData.reservedItems || [];
                    setSelectedItem(reservedItems); // Show in table
                    setSelectedItems(reservedItems); // Preselect
                }
                // 2. Count how many are still needed per item
                const requiredQtyMap = {};
                selectedOrder.items.forEach(item => {
                    requiredQtyMap[item.itemId] = item.quantity;
                });
                const reservedCountMap = {};
                reservedItems.forEach(item => {
                    reservedCountMap[item.I_Id] = (reservedCountMap[item.I_Id] || 0) + 1;
                });
                const stillNeededItemIds = [];
                for (const itemId of itemIds) {
                    const reservedCount = reservedCountMap[itemId] || 0;
                    const requiredQty = requiredQtyMap[itemId] || 0;
                    if (reservedCount < requiredQty) {
                        stillNeededItemIds.push(itemId);
                    }
                }
                // 3. Fetch unreserved stock for items still needing more
                let unreservedItems = [];
                if (stillNeededItemIds.length > 0) {
                    const stockRes = await fetch("http://localhost:5001/api/admin/main/get-stock-details", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(stillNeededItemIds)
                    });
                    if (!stockRes.ok) {
                        const errorText = await stockRes.text();
                        throw new Error(errorText || "Failed to fetch unreserved stock details");
                    }
                    const data = await stockRes.json();
                    unreservedItems = data.stockDetails || [];
                }
                // 4. Merge for modal use
                setItems([ ...unreservedItems]);
            } catch (error) {
                toast.error("Error loading reserved/unreserved stock: " + error.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchReservedAndUnreserved();
    }, []);
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
        const orderedItem = selectedOrder.items.find(orderItem => orderItem.itemId === item.I_Id);
        if (!orderedItem) {
            toast.error("Selected stock does not belong to the order.");
            return;
        }
        const requestedQty = orderedItem.quantity;
        const selectedCount = selectedItems.filter(selected => selected.I_Id === item.I_Id).length;
        const isAlreadySelected = selectedItems.some(selected => selected.stock_Id === item.stock_Id);
        if (isAlreadySelected) {
            toast.error("This stock item has already been selected.");
            return;
        }
        if (selectedCount >= requestedQty) {
            toast.error(`You cannot select more than ${requestedQty} stock items for this order.`);
            return;
        }
        // Calculate price per item (unit price)
        const unitPrice = orderedItem.price && orderedItem.quantity
            ? orderedItem.price / orderedItem.quantity
            : 0;
        // Add price to the item object
        const itemWithPrice = {
            ...item,
            price: unitPrice
        };
        setSelectedItems(prevItems => [...prevItems, itemWithPrice]);
        setSearchTerm('');
        setDropdownOpen(false);
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
                    <p><strong>Order ID:</strong> #{selectedOrder.orderId}</p><p><strong>Order Date:</strong> {selectedOrder.orderDate}</p>
                    <p><strong>Invoice Date:</strong> {invoiceDate}</p><p><strong>Contact:</strong> {selectedOrder.phoneNumber}</p>
                    <div className="payment-type">
                        <label><strong>Payment Status:</strong></label>
                        <select value={paymentType} onChange={handlePaymentTypeChange}>
                            {/* Conditionally render options based on deliveryStatus */}
                            {deliveryStatus === "Pickup" && (
                                <>
                                    <option value="">-- Please Select Payment Type ---</option>
                                    <option value="Settled">Settled</option><option value="Credit">Credit</option>
                                </>
                            )}
                            {deliveryStatus === "Delivery" && (
                                <>
                                    <option value="">-- Please Select Payment Type ---</option>
                                    <option value="Settled">Settled</option><option value="COD">COD</option><option value="Credit">Credit</option>
                                </>
                            )}
                            {balance === 0 && <option value="Settled">Settled</option>} {/* Auto-set to Settled if balance is 0 */}
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
                        <th>Discount</th>
                        <th>Price</th>
                        <th>Qty</th>
                        <th>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {selectedOrder.items.map((item, index) => (
                        <tr key={index}>
                            <td>{item.itemName}</td>
                            <td>{item.discount}</td>
                            <td>Rs. {(item.price.toFixed(2)/item.quantity)}</td>
                            <td>{item.quantity}</td>
                            <td>Rs. {item.price.toFixed(2)}</td>
                        </tr>
                    ))}
                    </tbody>
                </table>
                <div>
                    <Label>Issued Items</Label>
                    <table className="selected-items-table">
                        <thead>
                        <tr>
                            <th>Item ID</th>
                            <th>Batch ID</th>
                            <th>Stock ID</th>
                        </tr>
                        </thead>
                        <tbody>
                        {selectedItem.map((item, index) => (
                            <tr key={index}>
                                <td>{item.I_Id}</td>
                                <td>{item.pc_Id}</td>
                                <td>{item.stock_Id}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>

                <div className="invoice-footer">
                    <div className="total-section">
                        <p><strong>Subtotal:</strong> Rs. {subtotal.toFixed(2)}</p><p><strong>Discount:</strong> Rs. {discount.toFixed(2)}</p>
                        <p><strong>Delivery:</strong> Rs. {delivery.toFixed(2)}</p><p><strong>Total:</strong> Rs. {netTotal.toFixed(2)}</p>
                        <p><strong>Advance:</strong> Rs. {advance.toFixed(2)}</p><p><strong>Balance:</strong> Rs. {balance.toFixed(2)}</p>
                    </div>

                    <div className="modal-buttons">
                        <button className="scan-btn" onClick={() => setShowStockModal(true)}>Scan</button>
                        <button className="print-btn" onClick={handlePrintAndSubmit}>Save</button>

                        {selectedOrder?.deliveryStatus === "Pickup" && (
                            <button className="close-btn" onClick={viewhandle1}>Close</button>
                        )}

                        {selectedOrder?.deliveryStatus === "Delivery" && (
                            <button className="close-btn" onClick={viewhandle}>Get delivery Note</button>
                        )}
                    </div>


                </div>
            </div>
            {/* Stock Modal */}
            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Scan Stock</ModalHeader>
                <ModalBody>
                    <FormGroup style={{ position: "relative" }}>
                        <Label>Items ID</Label>
                        <Input type="text" value={searchTerm} onChange={handleSearchChange} placeholder="Search for item..." />
                        {dropdownOpen && (
                            <div className="dropdown" style={{ position: "absolute", zIndex: 100, backgroundColor: "white", border: "1px solid #ddd", width: "100%" }}>
                                {filteredItems.map((item) => (
                                    <div key={item.I_Id} onClick={() => handleSelectItem(item)} className="dropdown-item" style={{ padding: "8px", cursor: "pointer" }}>
                                        {item.I_Id} - {item.stock_Id} - {item.pc_Id}
                                    </div>
                                ))}
                            </div>
                        )}
                    </FormGroup>
                    <Label>Issued Items</Label>
                    <table className="selected-items-table">
                        <thead>
                        <tr>
                            <th>Item ID</th>
                            <th>Batch ID</th>
                            <th>Stock ID</th>
                        </tr>
                        </thead>
                        <tbody>
                        {selectedItems.map((item, index) => (
                            <tr key={index}>
                                <td>{item.I_Id}</td>
                                <td>{item.pc_Id}</td>
                                <td>{item.stock_Id}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </ModalBody>
                <ModalFooter>
                    <Button color="primary" onClick={() => passReservedItem(selectedItems)}>Pass</Button>
                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                </ModalFooter>
            </Modal>
        </div>
    );
};
export default FinalInvoice1;
