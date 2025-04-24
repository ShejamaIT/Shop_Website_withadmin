import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label, Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../pages/Navbar";
import "../style/ItemDetails.css";
const ItemDetails = () => {
    const { id } = useParams(); // Get item ID from URL
    const [item, setItem] = useState(null);
    const [stock, setStock] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [suppliers, setSuppliers] = useState([]); // State to store supplier data
    const [suppliers1, setSuppliers1] = useState([]); // State to store supplier data
    const [categories, setCategories] = useState([]);
    const [formData, setFormData] = useState({}); // Stores editable fields
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [subCatOne, setSubCatOne] = useState([]);
    const [subCatTwo, setSubCatTwo] = useState([]);
    const [showSupplierModal, setShowSupplierModal] = useState(false);
    const [stockData, setStockData] = useState({itemId:id, supplierId: "", stockCount: "", date: "", cost:"", comment:""});
    const [supplierData, setSupplierData] = useState({supplierName: "", contactInfo: "", cost:""});
    useEffect(() => {
        if (formData.maincategory) {
            fetch(`http://localhost:5001/api/admin/main/SubCatNames?categoryName=${formData.maincategory}`)
                .then((res) => res.json())
                .then((data) => {
                    setSubCatOne(data.data);
                    setSubCatTwo([]);
                    setFormData((prev) => ({ ...prev, sub_one: "", sub_two: "" }));
                })
                .catch(() => toast.error("Failed to load subcategories."));
        }
    }, [formData.maincategory]);

    useEffect(() => {
        if (formData.sub_one) {
            const selectedSubCatOne = subCatOne.find((cat) => cat.subCatOneId === formData.sub_one);
            setSubCatTwo(selectedSubCatOne ? selectedSubCatOne.subCatTwo : []);
            setFormData((prev) => ({ ...prev, sub_two: "" }));
        }
    }, [formData.sub_one, subCatOne]);

    const handleSupplierSelect = (e) => {
        const selectedSupplierID = e.target.value;

        // Find the selected supplier from the list
        const selectedSupplier = suppliers1.find(supplier => supplier.s_ID === selectedSupplierID);

        if (selectedSupplier) {
            setSupplierData(prevState => ({
                ...prevState,
                supplierID: selectedSupplier.s_ID,
                supplierName: selectedSupplier.name,
                contactInfo: selectedSupplier.contact,
                cost: selectedSupplier.cost || "",  // Ensure cost is updated too
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

    const handleStockChange = async (e) => {
        const { name, value } = e.target;
        setStockData((prev) => ({ ...prev, [name]: value }));

        // Fetch cost when supplier is selected
        if (name === "supplierId" && value) {
            try {
                const response = await fetch(`http://localhost:5001/api/admin/main/find-cost?s_ID=${value}&I_Id=${id}`);
                const data = await response.json();
                if (response.ok) {
                    setStockData((prev) => ({
                        ...prev,
                        cost: data.cost.unit_cost, // Set cost from API response
                    }));
                } else {
                    setStockData((prev) => ({ ...prev, cost: "" })); // Reset if not found
                    toast.error(data.message || "Cost not found.");
                }
            } catch (error) {
                console.error("Error fetching cost:", error.message);
                toast.error("Error fetching cost.");
            }
        }
    };

    const handleSupplierChange = (e) => {
        const { name, value } = e.target;
        setSupplierData(prev => ({ ...prev, [name]: value }));
    };

    const handleAddStock = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/add-stock-received", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(stockData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to add stock.");
            }

            toast.success("Stock added successfully!");
            setStockData({itemId:id, supplierId: "", stockCount: "", date: "", cost:"", price:"", comment:""});
            setShowStockModal(false); // Close the modal after success
            fetchItem(); // Refresh item list or update UI

        } catch (err) {
            console.error("Error adding stock:", err.message);
            toast.error(err.message || "Failed to add stock!");
        }
    };

    const handleAddSupplier = async () => {
        try {
            // Assuming you want to save the item-supplier association
            const response = await fetch("http://localhost:5001/api/admin/main/add-item-supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    I_Id: item.I_Id,
                    s_ID: supplierData.supplierID,
                    cost: supplierData.cost
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
            let formDataToSend = formData instanceof FormData ? formData : new FormData();

            // If formData is an object, convert it into FormData
            if (!(formData instanceof FormData)) {
                Object.entries(formData).forEach(([key, value]) => {
                    if (key === "suppliers" || key === "stockDetails") {
                        formDataToSend.append(key, JSON.stringify(value)); // Convert objects to JSON
                    } else {
                        formDataToSend.append(key, value);
                    }
                });
            }
            const updateResponse = await fetch("http://localhost:5001/api/admin/main/update-item", {
                method: "PUT",
                body: formDataToSend,
            });

            const updateResult = await updateResponse.json();

            if (updateResponse.ok && updateResult.success) {
                toast.success("✅ Item updated successfully!");
                fetchItem();
                setIsEditing(false);
                setFormData(updateResult.data);
            } else {
                console.error("❌ Error updating item:", updateResult.message);
                toast.error(updateResult.message || "Failed to update item.");
            }
        } catch (error) {
            console.error("❌ Error updating item:", error);
            toast.error("Error updating item: " + error.message);
        }
    };

    useEffect(() => {
        fetchItem();
    }, [id]);

    // Fetch Categories
    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => {
                console.error("Error fetching categories:", err);
                toast.error("Failed to load categories.");
            });
    }, []);

    // Fetch all suppliers when the modal opens
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/suppliers");
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

    const fetchItem = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/item-details?I_Id=${id}`);
            if (!response.ok) throw new Error("Failed to fetch item details.");
            const data = await response.json();
            setItem(data.item);
            setSuppliers(data.item.suppliers || []); // Set suppliers
            setStock(data.item.stockDetails || []); // set stockDetails
            setFormData(data.item); // Copy item details for editing
            setLoading(false);
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const handleChange = (e, supplierId) => {
        const { name, value, type, files } = e.target;

        // If the field is a file, handle image upload
        if (type === "file" && files) {
            const file = files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    [name]: reader.result.split(',')[1], // Removing the "data:image/png;base64," part
                }));
            };

            reader.readAsDataURL(file);
        } else {
            // Handle regular text input changes
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name]: value,
            }));
        }

        // Update the specific supplier's data in the suppliers array
        setSuppliers((prevSuppliers) =>
            prevSuppliers.map((supplier) =>
                supplier.s_ID === supplierId
                    ? { ...supplier, [name]: value } // Update the supplier's cost
                    : supplier
            )
        );

        // Also update the supplier information in formData
        setFormData((prevFormData) => ({
            ...prevFormData,
            suppliers: prevFormData.suppliers.map((supplier) =>
                supplier.s_ID === supplierId
                    ? { ...supplier, [name]: value } // Update the supplier's cost in the formData
                    : supplier
            )
        }));
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
                                                    <p><strong>Color:</strong> {item.color}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Color:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="color"
                                                            value={formData.color}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Material:</strong> {item.material}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Material:</strong></Label>
                                                        <Input
                                                            type="select"
                                                            name="material"
                                                            value={formData.material}
                                                            onChange={handleChange}
                                                        >
                                                            <option value="">Select Material</option>
                                                            <option value="Teak">Teak</option>
                                                            <option value="Mahogani">Mahogani</option>
                                                            <option value="Mara">Mara</option>
                                                            <option value="Attoriya">Attoriya</option>
                                                            <option value="Sapu">Sapu</option>
                                                            <option value="Steel">Steel</option>
                                                            <option value="MDF">MDF</option>
                                                            <option value="MM">MM</option>
                                                            <option value="Other">Other</option>
                                                        </Input>
                                                    </FormGroup>
                                                )}

                                            </Col>
                                        </Row>
                                        {/* Category Name */}
                                        <Row>
                                            <Col>

                                                {!isEditing ? (
                                                    <p><strong>Category:</strong> {item.maincategory}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Category:</strong></Label>
                                                        <Input type="select"
                                                               name="maincategory"
                                                               id="maincategory"
                                                               value={formData.maincategory}
                                                               onChange={handleChange} required>

                                                            {categories.map((cat) => (
                                                                <option key={cat.id} value={cat.name}>{cat.name}</option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                )}
                                                {/* Subcategory One */}
                                                {!isEditing ? (
                                                    <p><strong>Subcategory One:</strong> {item.sub_one}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory One:</strong></Label>
                                                        <Input
                                                            type="select"
                                                            name="sub_one"
                                                            id="sub_one"
                                                            value={formData.sub_one}
                                                            onChange={handleChange}
                                                            required
                                                        >
                                                            <option value="">Select Sub One</option>
                                                            {subCatOne.map((sub) => (
                                                                <option key={sub.subCatOneId} value={sub.subCatOneId}>
                                                                    {sub.subCatOneName}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                )}

                                                {/* Subcategory Two */}
                                                {!isEditing ? (
                                                    item.subcategory_two && item.subcategory_two !== 'None' ? (
                                                        <p><strong>Subcategory Two:</strong> {item.sub_two}</p>
                                                    ) : null
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory Two:</strong></Label>
                                                        <Input
                                                            type="select"
                                                            name="sub_two"
                                                            id="sub_two"
                                                            value={formData.sub_two}
                                                            onChange={handleChange}
                                                            required
                                                        >
                                                            <option value="">Select Sub Two</option>
                                                            {subCatTwo.map((sub) => (
                                                                <option key={sub.subCatTwoId} value={sub.subCatTwoId}>
                                                                    {sub.subCatTwoName}
                                                                </option>
                                                            ))}
                                                        </Input>
                                                    </FormGroup>
                                                )}
                                            </Col>
                                        </Row>
                                        <Row>
                                            <Col>
                                                {!isEditing ? (
                                                    <p><strong>Min Quantity:</strong> {item.minQTY}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Min Quantity:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="minQTY"
                                                            value={formData.minQTY}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}
                                                <p><strong>Stock Quantity:</strong> {item.stockQty}</p>
                                                <p><strong>Available Quantity:</strong> {item.availableQty}</p>
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
                                                    <h6>{supplier.name}</h6>
                                                    <p><strong>Supplier ID:</strong> {supplier.s_ID}</p>
                                                    <p><strong>Name:</strong> {supplier.name}</p>
                                                    <p><strong>Contact:</strong> {supplier.contact}</p>

                                                    <FormGroup>
                                                        {!isEditing ? (
                                                            <p><strong>Cost:</strong> {supplier.unit_cost}</p>
                                                        ) : (
                                                            <Input
                                                                type="text"
                                                                name="unit_cost"
                                                                value={supplier.unit_cost}
                                                                onChange={(e) => handleChange(e, supplier.s_ID)} // Update cost for the specific supplier
                                                            />
                                                        )}
                                                    </FormGroup>
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
                                            {/*<Button color="danger" className="ms-3" onClick={() => setShowStockModal(true)}>Add Stock</Button>*/}
                                        </>

                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
                                    )}
                                </div>
                            </div>
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
                                        <p>
                                            <Label>Supplier Name : </Label>{supplierData.supplierName}
                                        </p>

                                    </FormGroup>
                                    <FormGroup>
                                        <p>
                                            <Label>Contact Info : </Label><strong>{supplierData.contactInfo}</strong>
                                        </p>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label>Cost</Label>
                                        <Input
                                            type="number"
                                            name="cost"
                                            value={supplierData.cost}
                                            onChange={handleSupplierChange} // Now using correct function
                                        />
                                    </FormGroup>
                                </ModalBody>
                                <ModalFooter>
                                    <Button color="primary" onClick={handleAddSupplier}>Add Supplier</Button>
                                    <Button color="secondary" onClick={() => setShowSupplierModal(false)}>Cancel</Button>
                                </ModalFooter>
                            </Modal>
                        </Col>

                        <Col lg="12">
                            <h4 className="mb-3 text-center topic">Stock Details</h4>
                            <div className="item-details">
                                <div className="item-details">
                                    {stock && stock.length > 0 ? (
                                        <table className="table table-striped table-bordered">
                                            <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Stock ID</th>
                                                <th>Batch ID</th>
                                                <th>Status</th>
                                            </tr>
                                            </thead>
                                            <tbody>
                                            {stock.map((stockItem) => (
                                                <tr key={stockItem.pid_Id}>
                                                    <td>{stockItem.pid_Id}</td>
                                                    <td>{stockItem.stock_Id}</td>
                                                    <td>{stockItem.pc_Id}</td>
                                                    <td>{stockItem.status}</td>
                                                </tr>
                                            ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="text-center">No stock details available</p>
                                    )}
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ItemDetails;
