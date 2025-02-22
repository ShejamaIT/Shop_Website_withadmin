import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css";

const AddSupplier = ({ onAddSupplier }) => {
    const [formData, setFormData] = useState({
        name: "",
        address: "",
        contact: "",
        contact2: "",
    });

    const [items, setItems] = useState([]); // List of all items to select
    const [selectedItems, setSelectedItems] = useState([]); // List of selected items with costs
    const [filteredItems, setFilteredItems] = useState([]); // Filtered list based on search term
    const [searchTerm, setSearchTerm] = useState(""); // Search term for filtering items

    // Fetch all items from the server
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/allitems");
                const data = await response.json();
                setItems(data || []);
                setFilteredItems(data || []);
            } catch (error) {
                console.error("Error fetching items:", error);
                toast.error("Error fetching items.");
            }
        };

        fetchItems();
    }, []);

    // Handle input changes for the supplier form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle searching/filtering items by name
    const handleSearchChange = (e) => {
        const { value } = e.target;
        setSearchTerm(value);
        const filtered = items.filter((item) =>
            item.I_Id.toString().includes(value) || item.I_name.toLowerCase().includes(value.toLowerCase())
        );
        setFilteredItems(filtered);
    };

    // Add selected item to the list with its cost
    const handleSelectItem = (item) => {
        if (!selectedItems.some((selected) => selected.I_Id === item.I_Id)) {
            setSelectedItems((prevItems) => [
                ...prevItems,
                { ...item, cost: "" },
            ]);
        }
        setSearchTerm(""); // Clear search term
        setFilteredItems([]); // Hide the dropdown
    };

    // Handle the cost change for a specific item
    const handleCostChange = (e, itemId) => {
        const { value } = e.target;
        setSelectedItems((prevItems) =>
            prevItems.map((item) =>
                item.I_Id === itemId ? { ...item, cost: value } : item
            )
        );
    };

    // Handle removing a selected item from the list
    const handleRemoveItem = (itemId) => {
        setSelectedItems((prevItems) =>
            prevItems.filter((item) => item.I_Id !== itemId)
        );
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name || !formData.address || !formData.contact) {
            toast.error("Please fill out all supplier details.");
            return;
        }

        if (selectedItems.length === 0) {
            toast.error("Please select at least one item.");
            return;
        }

        // Prepare data to send to the server
        const supplierData = {
            name: formData.name,
            contact: formData.contact,
            contact2: formData.contact2 || "", // If there's no secondary contact, pass an empty string
            address: formData.address,
            items: selectedItems.map(item => ({
                I_Id: item.I_Id,
                cost: item.cost
            }))
        };

        try {
            // Make a POST request to the server to add the supplier and items
            const response = await fetch("http://localhost:5001/api/admin/main/supplier", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(supplierData),
            });

            const result = await response.json();

            if (response.ok) {
                // Show success message and clear the form
                toast.success(result.message);
                handleClear(); // Clear form after successful submission
            } else {
                // Show error message if something goes wrong
                toast.error(result.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting supplier data:", error);
            toast.error("Error submitting supplier data. Please try again.");
        }
    };


    // Clear form data
    const handleClear = () => {
        setFormData({
            s_ID: "",
            name: "",
            address: "",
            contact: "",
            contact2: "",
        });
        setSelectedItems([]);
        setSearchTerm("");
        setFilteredItems([]);
    };

    return (
        <Container className="add-item-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Add New Supplier</h3>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label for="name">Supplier Name</Label>
                            <Input
                                type="text"
                                name="name"
                                id="name"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="address">Address</Label>
                            <Input
                                type="textarea"
                                name="address"
                                id="address"
                                value={formData.address}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="contact">Contact</Label>
                            <Input
                                type="text"
                                name="contact"
                                id="contact"
                                value={formData.contact}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="contact2">Secondary Contact</Label>
                            <Input
                                type="text"
                                name="contact2"
                                id="contact2"
                                value={formData.contact2}
                                onChange={handleChange}
                            />
                        </FormGroup>

                        {/* Item Selection */}
                        <FormGroup>
                            <Label for="item">Select Items</Label>
                            <div style={{ position: "relative" }}>
                                <Input
                                    type="text"
                                    placeholder="Search and select items"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                />
                                {searchTerm && filteredItems.length > 0 && (
                                    <div className="dropdown">
                                        {filteredItems.map((item) => (
                                            <div
                                                key={item.I_Id}
                                                onClick={() => handleSelectItem(item)}
                                                className="dropdown-item"
                                            >
                                                {item.I_name}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </FormGroup>

                        {/* Display selected items with costs */}
                        {selectedItems.map((item) => (
                            <Row key={item.I_Id} className="mt-2">
                                <Col md={4}>
                                    <Label>Selected Item: {item.I_name}</Label>
                                </Col>
                                <Col md={4}>
                                    <Input
                                        type="number"
                                        value={item.cost}
                                        onChange={(e) => handleCostChange(e, item.I_Id)}
                                        placeholder="Enter cost"
                                    />
                                </Col>
                                <Col md={2}>
                                    <Button
                                        color="danger"
                                        onClick={() => handleRemoveItem(item.I_Id)}
                                    >
                                        Remove
                                    </Button>
                                </Col>
                            </Row>
                        ))}

                        <Row>
                            <Col md="6">
                                <Button type="submit" color="primary" block>
                                    Add Supplier
                                </Button>
                            </Col>
                            <Col md="6">
                                <Button
                                    type="button"
                                    color="danger"
                                    block
                                    onClick={handleClear}
                                >
                                    Clear
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default AddSupplier;
