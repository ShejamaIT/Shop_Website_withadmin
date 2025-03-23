import React, { useState, useEffect } from "react";
import { Container, Row, Col, Label, Input, Form, Table, Button } from "reactstrap";
import { toast } from "react-toastify";
import Helmet from "../components/Helmet/Helmet";
import "../style/PurchaseDetails.css";

const PurchaseDetails = () => {
    const [PurchaseId, setPurchaseId] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [supplierItems, setSupplierItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [DeliveryCharge, setDeliveryCharge] = useState("0");
    const [ItemTotal, setItemTotal] = useState("0");
    const [Invoice, setInvoiceId] = useState("");
    const [NetTotal, setNetTotal] = useState("0");

    const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    useEffect(() => {
        fetchPurchaseID();
        fetchSuppliers();
    }, []);

    useEffect(() => {
        const calculateItemTotal = () => {
            const total = selectedItems.reduce((acc, item) => {
                return acc + (item.unitPrice * item.quantity);
            }, 0);
            setItemTotal(total.toFixed(2)); // Set the total to two decimal places
        };
        calculateItemTotal();
    }, [selectedItems]);

    useEffect(() => {
        const netTotal = parseFloat(ItemTotal) + parseFloat(DeliveryCharge || 0);
        setNetTotal(netTotal.toFixed(2));
    }, [ItemTotal, DeliveryCharge]);

    const fetchPurchaseID = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/newPurchasenoteID");
            const data = await response.json();
            setPurchaseId(data.PurchaseID);
        } catch (err) {
            toast.error("Failed to load Purchase ID.");
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/suppliers");
            const data = await response.json();
            if (data.success) {
                setSuppliers(data.suppliers);
            } else {
                toast.error(data.message || "Failed to load suppliers.");
            }
        } catch (err) {
            toast.error("Failed to load suppliers.");
        }
    };

    const fetchSupplierItems = async (supplierId) => {
        if (!supplierId) return;

        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/supplier-items?s_Id=${supplierId}`);
            const data = await response.json();
            if (data.success) {
                setSupplierItems(data.items);
            } else {
                setSupplierItems([]);
                toast.error(data.message || "No items found.");
            }
        } catch (err) {
            toast.error("Failed to load supplier items.");
        }
    };

    const handleSupplierChange = (event) => {
        const supplierId = event.target.value;
        setSelectedSupplier(supplierId);
        setSupplierItems([]);
        setSelectedItems([]);
        fetchSupplierItems(supplierId);
    };

    const handleItemChange = (event) => {
        const itemId = event.target.value;
        const item = supplierItems.find((item) => item.I_Id === itemId);
        if (item && !selectedItems.find(i => i.I_Id === item.I_Id)) {
            setSelectedItems([...selectedItems, { ...item, quantity: 1, unitPrice: item.unit_cost }]);
        }
    };

    const handleQuantityChange = (index, event) => {
        const newSelectedItems = [...selectedItems];
        newSelectedItems[index].quantity = parseInt(event.target.value, 10) || 0;
        setSelectedItems(newSelectedItems);
    };

    const handleUnitPriceChange = (index, event) => {
        const newSelectedItems = [...selectedItems];
        newSelectedItems[index].unitPrice = parseFloat(event.target.value) || 0;
        setSelectedItems(newSelectedItems);
    };

    const handleDeliveryChargeChange = (e) => {
        setDeliveryCharge(e.target.value);
    };

    const handleInvoiceChange = (e) => {
        setInvoiceId(e.target.value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedSupplier || selectedItems.length === 0) {
            toast.error("Please fill in all fields correctly.");
            return;
        }

        const orderData = {
            purchase_id: PurchaseId,
            supplier_id: selectedSupplier,
            date: currentDate,
            time: currentTime,
            itemTotal: ItemTotal,
            delivery: DeliveryCharge,
            invoice: Invoice,
            items: selectedItems.map(item => ({
                I_Id: item.I_Id,
                color: item.color || "N/A",
                unit_price: item.unitPrice,
                quantity: item.quantity,
                total_price: (item.unitPrice * item.quantity).toFixed(2)
            })),
        };

        console.log("Order Data:", orderData);
        try {
            // Send data to the backend
            const response = await fetch("http://localhost:5001/api/admin/main/addStock", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData), // Send as JSON
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Purchase saved successfully!");
                setSelectedItems([]); // Clear selected items after successful submission
                setTimeout(() => {
                    window.location.reload(); // Auto-refresh the page
                }, 1000);
            } else {
                toast.error(result.message || "Failed to save purchase.");
            }
        } catch (err) {
            console.error("Error saving purchase:", err);
            toast.error("Error saving purchase.");
        }
    };

    const handleClear = () => {
        setSelectedSupplier("");
        setSelectedItems([]);
        setDeliveryCharge("0");
        setInvoiceId("");
        setItemTotal("0");
        setNetTotal("0");
    };

    return (
        <Helmet title={"Purchase Items"}>
            <section>
                <Container className="purchase-item-container">
                    <Row>
                        <Col lg="10" className="mx-auto">
                            <h3 className="text-center">Purchase Invoice</h3>
                            <Form onSubmit={handleSubmit}>
                                <div className="order-detail">
                                    <Row className="mb-3">
                                        <Col>
                                            <h5 className="text-center" style={{ textDecoration: "underline" }}>Purchase Note Detail</h5>
                                            <hr />
                                        </Col>
                                    </Row>

                                    <Row className="d-flex gap-5">
                                        <Col>
                                            <p><strong>Purchase Id:</strong> {PurchaseId}</p>
                                            <Label><strong>Supplier:</strong></Label>
                                            <Input type="select" value={selectedSupplier} onChange={handleSupplierChange}>
                                                <option value="">Select a Supplier</option>
                                                {suppliers.map((supplier) => (
                                                    <option key={supplier.s_ID} value={supplier.s_ID}>
                                                        {supplier.name}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                        <Col>
                                            <p><strong>Date:</strong> {currentDate}</p>
                                            <p><strong>Time:</strong> {currentTime}</p>
                                        </Col>
                                    </Row>

                                    <Row className="mt-4">
                                        <Col>
                                            <hr />
                                            <h5 className="text-center" style={{ textDecoration: "underline" }}>Purchase Items</h5>
                                            <hr />
                                        </Col>
                                    </Row>

                                    <Row className={'mb-3'}>
                                        <Col>
                                            <Label><strong>Items:</strong></Label>
                                            <Input type="select" onChange={handleItemChange} disabled={!selectedSupplier}>
                                                <option value="">Select Item</option>
                                                {supplierItems.map((item) => (
                                                    <option key={item.I_Id} value={item.I_Id}>
                                                        {item.I_name} - Rs.{item.unit_cost}
                                                    </option>
                                                ))}
                                            </Input>
                                        </Col>
                                    </Row>

                                    {selectedItems.length > 0 && (
                                        <Row className="mt-4 mb-3">
                                            <Col>
                                                <Table bordered>
                                                    <thead>
                                                    <tr>
                                                        <th>Item ID</th>
                                                        <th>Item Name</th>
                                                        <th>Color</th>
                                                        <th>Unit Price (Rs.)</th>
                                                        <th>Quantity</th>
                                                        <th>Total Price (Rs.)</th>
                                                    </tr>
                                                    </thead>
                                                    <tbody>
                                                    {selectedItems.map((item, index) => (
                                                        <tr key={item.I_Id}>
                                                            <td>{item.I_Id}</td>
                                                            <td>{item.I_name}</td>
                                                            <td>{item.color || "N/A"}</td>
                                                            <td>
                                                                <Input
                                                                    type="number"
                                                                    value={item.unitPrice}
                                                                    onChange={(e) => handleUnitPriceChange(index, e)}
                                                                />
                                                            </td>
                                                            <td>
                                                                <Input
                                                                    type="number"
                                                                    value={item.quantity}
                                                                    onChange={(e) => handleQuantityChange(index, e)}
                                                                />
                                                            </td>
                                                            <td>{(item.unitPrice * item.quantity).toFixed(2)}</td>
                                                        </tr>
                                                    ))}
                                                    </tbody>
                                                </Table>
                                            </Col>
                                        </Row>
                                    )}

                                    <Row className={'mb-3'}>
                                        <Label><strong>Delivery Charges:</strong></Label>
                                        <Input
                                            type="number"
                                            value={DeliveryCharge}
                                            onChange={handleDeliveryChargeChange}
                                            placeholder="Enter delivery charge"
                                        />
                                    </Row>

                                    <Row className={'mb-3'}>
                                        <Label><strong>Invoice ID:</strong></Label>
                                        <Input
                                            type="text"
                                            value={Invoice}
                                            onChange={handleInvoiceChange}
                                            placeholder="Enter invoice ID"
                                        />
                                    </Row>

                                    <Row>
                                        <hr />
                                        <h5>Item Total: Rs.{ItemTotal}</h5>
                                        <h5>Delivery Fee: Rs.{DeliveryCharge}</h5>
                                        <h5>Net Total: Rs.{NetTotal}</h5>
                                    </Row>

                                    <Row>
                                        <Col md="6">
                                            <Button type="submit" color="primary" block>
                                                Save Purchase
                                            </Button>
                                        </Col>
                                        <Col md="6">
                                            <Button type="button" color="danger" block onClick={handleClear}>
                                                Clear
                                            </Button>
                                        </Col>
                                    </Row>
                                </div>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default PurchaseDetails;
