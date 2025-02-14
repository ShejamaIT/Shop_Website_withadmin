import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/ItemDetails.css";


const ItemDetails = () => {
    const { id } = useParams(); // Get item ID from URL
    const [item, setItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [suppliers, setSuppliers] = useState([]); // State to store supplier data
    const [suppliers1, setSuppliers1] = useState([]); // State to store supplier data
    const [formData, setFormData] = useState({}); // Stores editable fields
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [stockData, setStockData] = useState({
        supplierId: "",
        stockCount: "",
        date: ""
    });
    const [supplierData, setSupplierData] = useState({
        supplierName: "",
        contactInfo: "",
        email: ""
    });

    useEffect(() => {
        fetchItem();
    }, [id]);

    // Fetch all suppliers when the modal opens
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/suppliers"); // Adjust the endpoint if necessary
                if (!response.ok) throw new Error("Failed to fetch suppliers");
                const data = await response.json();
                if (data.success) {
                    setSuppliers1(data.suppliers); // Set the suppliers list
                } else {
                    toast.error(data.message);
                }
            } catch (error) {
                toast.error("Error loading suppliers");
            }
        };

        if (showSupplierModal) {
            fetchSuppliers();
        }
    }, [showSupplierModal]); // Re-run this when the modal is opened

    const handleSupplierSelect = (e) => {
        const selectedSupplierID = e.target.value;

        // Find the selected supplier from the list
        const selectedSupplier = suppliers1.find(supplier => supplier.s_ID === selectedSupplierID);

        if (selectedSupplier) {
            // Update the form fields with the selected supplier's details
            setSupplierData({
                ...supplierData,
                supplierID: selectedSupplier.s_ID,
                supplierName: selectedSupplier.name,
                contactInfo: selectedSupplier.contact,
            });
        }
    };

    const fetchItem = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/item-details?I_Id=${id}`);
            if (!response.ok) throw new Error("Failed to fetch item details.");
            const data = await response.json();
            setItem(data.item);
            setSuppliers(data.item.suppliers || []); // Set suppliers
            setFormData(data.item); // Copy item details for editing
            console.log(data.item);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError(err.message);
            setLoading(false);
        }
    };


    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file" && files) {
            // Handle image file change (Convert to base64)
            const file = files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                // Update the formData with the base64 string of the image
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    [name]: reader.result.split(',')[1], // Removing the "data:image/png;base64," part
                }));
            };

            // Read the file as a data URL (Base64 encoded string)
            reader.readAsDataURL(file);
        } else {
            // Handle regular text input changes
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name]: value,
            }));
        }
    };
    const handleImageChange = (e) => {
        const { name, files } = e.target;
        const file = files[0];

        if (file) {
            const reader = new FileReader();

            reader.onloadend = () => {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    [name]: reader.result.split(',')[1], // Store base64 without data URL prefix
                }));
            };

            reader.readAsDataURL(file);
        }
    };
    const handleStockChange = (e) => {
        const { name, value } = e.target;
        setStockData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSupplierChange = (e) => {
        const { name, value } = e.target;
        setSupplierData((prev) => ({ ...prev, [name]: value }));
    };

    const handleAddStock = async () => {
        console.log(item.id,stockData);
        // try {
        //     const response = await fetch(`http://localhost:5001/api/admin/main/add-stock`, {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify({ itemId: id, ...stockData }),
        //     });
        //
        //     if (!response.ok) throw new Error("Failed to add stock.");
        //
        //     toast.success("Stock added successfully!");
        //     setShowStockModal(false);
        //     fetchItem();
        // } catch (err) {
        //     toast.error("Failed to add stock!");
        // }
    };

    const handleAddSupplier = async () => {
        try {
            // Assuming you want to save the item-supplier association
            const response = await fetch("http://localhost:5001/api/admin/main/add-item-supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    I_Id: item.I_Id,  // Make sure this is the correct Item ID
                    s_ID: supplierData.supplierID   // Make sure this is the correct Supplier ID
                }),
            });

            if (!response.ok) throw new Error("Failed to add item-supplier association");
            const data = await response.json();

            if (data.success) {
                toast.success("Item-Supplier association added successfully!");
                setShowSupplierModal(false); // Close the modal after adding
            } else {
                toast.error(data.message);
            }
        } catch (error) {
            toast.error("Error adding item-supplier association");
        }
    };


    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/update-item`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update item.");

            const updatedItem = await response.json();
            setItem(updatedItem);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating item:", err);
            toast.error("Failed to update item!");
        }
    };

    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;
    if (!item) return <p>Item not found</p>;

    return (
        <Helmet title={`Item Details - ${item.I_name}`}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h4 className="mb-3 text-center topic">Item #{item.I_Id} Details</h4>
                            <div className="item-details">
                                {/* General Item Info */}
                                <div className="item-header">
                                    <h5 className="mt-4">General Details</h5>
                                    <div className="item-general">
                                        <Row>
                                            <Col>
                                                {!isEditing ? (
                                                    <p><strong>Item Name:</strong> {item.I_name}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Item Name:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="I_name"
                                                            value={formData.I_name}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Description:</strong> {item.descrip}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Description:</strong></Label>
                                                        <Input
                                                            type="textarea"
                                                            name="descrip"
                                                            value={formData.descrip}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Price:</strong> Rs. {item.price}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Price:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="price"
                                                            value={formData.price}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Cost:</strong> Rs. {item.cost}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Cost:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="cost"
                                                            value={formData.cost}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                {!isEditing ? (
                                                    <p><strong>Warranty Period:</strong> {item.warrantyPeriod}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Warranty Period:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="warrantyPeriod"
                                                            value={formData.warrantyPeriod}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>

                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Stock Quantity:</strong> {item.stockQty}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Stock Quantity:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="qty"
                                                            value={formData.stockQty}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>

                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Available Quantity:</strong> {item.availableQty}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Stock Quantity:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="qty"
                                                            value={formData.availableQty}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>

                                                )}
                                            </Col>
                                        </Row>
                                        {/* Category Name */}
                                        <Row>
                                            <Col>
                                                {!isEditing ? (
                                                    <p><strong>Category:</strong> {item.category_name}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Category:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="categoryName"
                                                            value={formData.category_name}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}

                                                {/* Subcategory One */}
                                                {!isEditing ? (
                                                    <p><strong>Subcategory One:</strong> {item.subcategory_one}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory One:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="subcategoryOne"
                                                            value={formData.subcategory_one}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}

                                                {/* Subcategory Two */}
                                                {item.subcategory_two && item.subcategory_two !== 'None' && !isEditing ? (
                                                    <p><strong>Subcategory Two:</strong> {item.subcategory_two}</p>
                                                ) : isEditing ? (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory Two:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="subcategoryTwo"
                                                            value={formData.subcategory_two}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                ) : null}
                                            </Col>
                                        </Row>
                                    </div>
                                </div>
                                {/* Item Image */}
                                <div className="item-images">
                                    <h5 className="mt-4">Item Images</h5>
                                    <Row className="image-row">
                                        {[{ key: "img", label: "Main Image" }, { key: "img1", label: "Image 1" }, { key: "img2", label: "Image 2" }, { key: "img3", label: "Image 3" }].map(({ key, label }) => (
                                            <Col md="3" key={key} className="image-col">
                                                <div className="image-container">
                                                    {!isEditing ? (
                                                        item[key] ? (
                                                            <img
                                                                src={`data:image/png;base64,${item[key]}`}
                                                                alt={label}
                                                                className="item-image"
                                                            />
                                                        ) : (
                                                            <div className="no-image">No Image Available</div>
                                                        )
                                                    ) : (
                                                        <FormGroup>
                                                            <Label><strong>{label}:</strong></Label>
                                                            <Input type="file" name={key} onChange={handleImageChange} />
                                                        </FormGroup>
                                                    )}
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                                {/* Supplier Details */}
                                <div>
                                    <h5 className="mt-4">Supplier List</h5>
                                    <Row>
                                        {suppliers.map((supplier) => (
                                            <Col key={supplier.s_ID} lg="4" md="6" sm="12">
                                                <div className="supplier-card">
                                                    <h6>{supplier.s_name}</h6>
                                                    <p><strong>Supplier ID:</strong> {supplier.s_ID}</p>
                                                    <p><strong>Name:</strong> {supplier.name}</p>
                                                    <p><strong>Contact:</strong> {supplier.contact}</p>
                                                </div>
                                            </Col>
                                        ))}
                                    </Row>
                                </div>
                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <>
                                            <Button color="primary" className="ms-3" onClick={() => setIsEditing(true)}>Edit Item</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setShowSupplierModal(true)}>Add Supplier</Button>
                                            <Button color="danger" className="ms-3" onClick={() => setShowStockModal(true)}>Add Stock</Button>
                                        </>

                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Add Stock Modal */}
                            <Modal isOpen={showStockModal} toggle={() => setShowStockModal(!showStockModal)}>
                                <ModalHeader toggle={() => setShowStockModal(!showStockModal)}>Add Stock</ModalHeader>
                                <ModalBody>
                                    <FormGroup>
                                        <Label>Supplier ID</Label>
                                        <Input
                                            type="select"
                                            name="supplierId"
                                            value={stockData.supplierId}
                                            onChange={handleStockChange}
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers.map((supplier) => (
                                                <option key={supplier.s_ID} value={supplier.s_ID}>
                                                    {supplier.s_ID} - {supplier.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Stock Count</Label>
                                        <Input
                                            type="number"
                                            name="stockCount"
                                            value={stockData.stockCount}
                                            onChange={handleStockChange}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Date</Label>
                                        <Input
                                            type="date"
                                            name="date"
                                            value={stockData.date}
                                            onChange={handleStockChange}
                                        />
                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handleAddStock}>Add Stock</Button>
                                    <Button color="secondary" onClick={() => setShowStockModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
                            {/* Add Supplier Modal */}
                            <Modal isOpen={showSupplierModal} toggle={() => setShowSupplierModal(!showSupplierModal)}>
                                <ModalHeader toggle={() => setShowSupplierModal(!showSupplierModal)}>Add Supplier</ModalHeader>
                                <ModalBody>
                                    <FormGroup>
                                        <Label>Supplier ID</Label>
                                        <Input
                                            type="select"
                                            name="supplierID"
                                            value={supplierData.supplierID}
                                            onChange={handleSupplierSelect} // Handle supplier ID selection
                                        >
                                            <option value="">Select Supplier</option>
                                            {suppliers1.map((supplier) => (
                                                <option key={supplier.s_ID} value={supplier.s_ID}>
                                                    {supplier.s_ID} - {supplier.name}
                                                </option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Supplier Name</Label>
                                        <Input
                                            type="text"
                                            name="supplierName"
                                            value={supplierData.supplierName}
                                            onChange={handleSupplierChange} // Handle change for name
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Contact Info</Label>
                                        <Input
                                            type="text"
                                            name="contactInfo"
                                            value={supplierData.contactInfo}
                                            onChange={handleSupplierChange} // Handle change for contact info
                                        />
                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handleAddSupplier}>Add Supplier</Button>
                                    <Button color="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ItemDetails;
