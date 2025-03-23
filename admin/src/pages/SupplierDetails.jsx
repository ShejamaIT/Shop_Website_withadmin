import React, { useState, useEffect } from 'react';
import {Row, Col, Button, Input, Table, Label, Container} from 'reactstrap';
import {toast} from "react-toastify";
import Helmet from "../components/Helmet/Helmet";

const SupplierDetails = ({ supplier }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedItem, setSelectedItem] = useState(null);
    const [itemsList, setItemsList] = useState([]);  // List to store items (existing + new)
    const [paymentList, setPaymentList] = useState([]);  // List to store payment
    const [dropdownOpen, setDropdownOpen] = useState(false);  // To handle dropdown visibility
    const [amount, setAmount] = useState('');  // To store entered cost
    const [warrantyPeriod, setWarrantyPeriod] = useState('');  // Warranty period remains unchanged
    const [itemData, setItemData] = useState([]); // List of all items for searching and filtering
    const [filteredItems, setFilteredItems] = useState([]); // List to store filtered items based on search term
    const [selectedImage, setSelectedImage] = useState(null);  // Store selected image file
    const [imagePreview, setImagePreview] = useState(null);  // Store image preview URL

    // Fetch all items for search and filter
    useEffect(() => {
        const fetchAllItems = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/allitems");  // API to fetch all items
                const data = await response.json();

                if (response.ok) {
                    setItemData(data); // Store all items for search
                } else {
                    console.error("Failed to load items:", data.message);
                }
            } catch (error) {
                console.error("Error fetching all items:", error);
            }
        };
        fetchAllItems();
    }, []); // Fetch once when component mounts

    // Fetch supplier-specific items
    useEffect(() => {
        const fetchSupplierItems = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/admin/main/supplier-items?s_Id=${supplier.s_ID}`);
                const data = await response.json();
                if (response.ok) {
                    setItemsList(data.items); // Set existing items for supplier
                } else {
                    console.error("Failed to load supplier items:", data.message);
                }
            } catch (error) {
                console.error("Error fetching supplier items:", error);
            }
        };
        fetchSupplierItems();
    }, [supplier.s_ID]); // Re-fetch when supplier changes
    // Fetch supplier-specific items
    useEffect(() => {
        const fetchSupplierPayments = async () => {
            try {
                const response = await fetch(`http://localhost:5001/api/admin/main/unpaid-stock-details?s_Id=${supplier.s_ID}`);
                const data = await response.json();
                if (response.ok) {
                    setPaymentList(data.unpaidStockDetails); // Set existing items for supplier
                } else {
                    console.error("Failed to load supplier items:", data.message);
                }
            } catch (error) {
                console.error("Error fetching supplier items:", error);
            }
        };
        fetchSupplierPayments();
    }, [supplier.s_ID]); // Re-fetch when supplier changes

    // Handle search term change
    const handleSearchChange = (e) => {
        const term = e.target.value;
        setSearchTerm(term);

        // Filter items based on the search term (item code or name)
        const filtered = itemData.filter((item) =>
            item.I_Id.toString().includes(term) || item.I_name.toLowerCase().includes(term.toLowerCase())
        );

        setFilteredItems(filtered);
        setDropdownOpen(filtered.length > 0);  // Open dropdown if matching items exist
    };

    // Handle selecting an item from the dropdown
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setSearchTerm(item.I_Id);  // Set search box to selected item code
        setDropdownOpen(false);  // Close the dropdown after selection
        setWarrantyPeriod(item.warrantyPeriod);  // Set warranty period as is (it won't be changed)
    };

    const handleAddItem = async () => {
        if (!amount) {
            toast.error("Add cost first.");
            return;
        }

        if (!selectedItem) {
            toast.error("Select an item first.");
            return;
        }

        // Check if the item already exists in the list
        const itemExists = itemsList.some(item => item.I_Id === selectedItem.I_Id);
        if (itemExists) {
            toast.error("This item has already been added.");
            return;
        }
        let imageBase64 = selectedItem.img; // Default to existing image if no new image is selected
        // Convert selected image to Base64 if a new image is uploaded
        if (selectedImage) {
            const reader = new FileReader();
            reader.readAsDataURL(selectedImage);
            imageBase64 = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result);
                reader.onerror = error => reject(error);
            });
        }
        // Create new item object
        const newItem = {
            I_Id: selectedItem.I_Id,
            I_name: selectedItem.I_name,
            img: imageBase64,
            s_ID: supplier.s_ID,
            unit_cost: amount,
            warrantyPeriod: selectedItem.warrantyPeriod
        };
        const itemDetail ={
            I_Id: selectedItem.I_Id,
            s_ID: supplier.s_ID,
            unit_cost: amount
        }

        // Send API request to save the item in `item_supplier` table
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/add-supplier-item", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(itemDetail),
            });

            const data = await response.json();

            if (response.ok) {
                // Add the new item to the local list
                setItemsList((prevItems) => [newItem, ...prevItems]);

                // Clear selection fields
                setSelectedItem('');
                setAmount('');
                setSelectedImage(null);
                setImagePreview(null);

                toast.success("Item added successfully!");
            } else {
                toast.error(data.message || "Failed to add item.");
            }
        } catch (error) {
            console.error("Error adding item:", error);
            toast.error("Error adding item. Please try again.");
        }
    };
    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };
    return (
        <Helmet title={`Supplier Detail`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            <div className="salesteam-details">
                                <Table bordered className="member-table">
                                    <tbody>
                                    <tr><td><strong>Id</strong></td><td>{supplier.s_ID}</td></tr>
                                    <tr><td><strong>Name</strong></td><td>{supplier.name}</td></tr>
                                    <tr><td><strong>Contact 1</strong></td><td>{supplier.contact}</td></tr>
                                    <tr><td><strong>Contact 2</strong></td><td>{supplier.contact2}</td></tr>
                                    <tr><td><strong>Address</strong></td><td>{supplier.address}</td></tr>
                                    </tbody>
                                </Table>
                            </div>

                            <div className="coupon-detail">
                                {/* Search box */}
                                <Row>
                                    <Col md={6}>
                                        <Input
                                            type="text"
                                            value={searchTerm}
                                            onChange={handleSearchChange}  // Update search term and filter items
                                            placeholder="Search for item..."
                                        />
                                    </Col>

                                </Row>

                                {/* Dropdown to select items */}
                                {dropdownOpen && filteredItems.length > 0 && (
                                    <div className="dropdown" style={{ position: 'absolute', zIndex: 1000, backgroundColor: 'white', border: '1px solid #ddd' }}>
                                        {filteredItems.map((item) => (
                                            <div key={item.I_Id} onClick={() => handleSelectItem(item)} className="dropdown-item">
                                                {item.I_Id} - {item.I_name}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Display selected item details */}
                                {selectedItem && (
                                    <Row className="mt-2">
                                        <Col md={4}>
                                            <label>Selected Item: {selectedItem.I_name}</label> {/* Display item name */}
                                        </Col>
                                        <Col md={4}>
                                            <Input
                                                type="number"
                                                value={amount}
                                                onChange={(e) => setAmount(e.target.value)}
                                                placeholder="Enter cost"
                                            />
                                        </Col>
                                        <Col md={2}>
                                            <Button color="primary" onClick={handleAddItem}>Add</Button>
                                        </Col>
                                    </Row>
                                )}
                            </div>
                            <div className="coupon-detail">
                                <h4 className="sub-title">Supply Items</h4>
                                {/* Display existing and new items in the table */}
                                <Table bordered className="coupon-table">
                                    <thead>
                                    <tr>
                                        <th>Item Image</th>
                                        <th>Item Code</th>
                                        <th>Item Name</th>
                                        <th>Cost Amount</th>
                                        <th>Warranty Period</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {itemsList.map((item, index) => (
                                        <tr key={index}>
                                            <td><img src={item.img} alt={item.I_name} className="product-image" /></td>
                                            <td>{item.I_Id}</td>
                                            <td>{item.I_name}</td>
                                            <td>{item.amount || item.unit_cost}</td> {/* Display the inputted amount or the existing cost */}
                                            <td>{item.warrantyPeriod}</td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>
                            <div className="coupon-detail">
                                <h4 className="sub-title">Payment Details</h4>
                                <Table bordered className="coupon-table">
                                    <thead>
                                    <tr>
                                        <th>Purchase Note</th>
                                        <th>Date</th>
                                        <th>Delivery (Rs.)</th>
                                        <th>Amount (Rs.)</th>
                                        <th>Action</th>

                                    </tr>
                                    </thead>
                                    <tbody>
                                    {paymentList.length > 0 ? (
                                        paymentList.map((payment, index) => (
                                            <tr key={index}>
                                                <td>{payment.pc_Id}</td>
                                                <td>{formatDate(payment.rDate)}</td>
                                                <td>Rs. {payment.deliveryCharge}</td>
                                                <td>Rs. {payment.total}</td>
                                                <td>
                                                    <Button
                                                        // onClick={() => handleViewOrder(note.noteId)}
                                                    >
                                                        👁️
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5" className="no-coupon-text">No payments available.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </Table>
                            </div>

                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default SupplierDetails;
