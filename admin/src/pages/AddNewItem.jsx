import React, { useState, useEffect } from "react";
import {Form, FormGroup, Label, Input, Button, Row, Col} from "reactstrap";
import "../style/invoice.css";
import AddNewSupplier from "../pages/AddNewSupplier";
import {toast} from "react-toastify";

const AddNewItem = ({ setShowModal, handleSubmit2 }) => {
    const [formData, setFormData] = useState({
        I_Id: "", I_name: "", Ca_Id: "", sub_one: "", sub_two: "", descrip: "", color: "",startStock:"",
        material: "", warrantyPeriod: "", price: "", cost: "", minQty: "", s_Id: "", img: null, img1: null, img2: null, img3: null,});

    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [subCatOne, setSubCatOne] = useState([]);
    const [subCatTwo, setSubCatTwo] = useState([]);
    const [showSupplierModal, setShowSupplierModal] = useState(false);


    // Fetch categories and suppliers on mount
    useEffect(() => {
        fetchCategories();
        fetchSuppliers();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/categories");
            const data = await response.json();
            setCategories(data.length > 0 ? data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategories([]);
        }
    };

    const fetchSuppliers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/suppliers");
            const data = await response.json();
            if (data.success) {
                setSuppliers(data.suppliers.length > 0 ? data.suppliers : []);
            } else {
                setSuppliers([]);
            }
        } catch (err) {
            console.error("Error fetching suppliers:", err);
            setSuppliers([]);
        }
    };

    useEffect(() => {
        if (formData.Ca_Id) {
            fetchSubcategories(formData.Ca_Id);
        } else {
            setSubCatOne([]);
            setSubCatTwo([]);
        }
    }, [formData.Ca_Id]);

    const fetchSubcategories = async (Ca_Id) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/subcategories?Ca_Id=${Ca_Id}`);
            const data = await response.json();
            setSubCatOne(data.data.length > 0 ? data.data : []);
            setSubCatTwo([]);
            setFormData((prev) => ({ ...prev, sub_one: "", sub_two: "" }));
        } catch (err) {
            console.error("Error fetching subcategories:", err);
            setSubCatOne([]);
        }
    };

    useEffect(() => {
        if (formData.sub_one) {
            const selected = subCatOne.find((cat) => cat.subCatOneId === formData.sub_one);
            setSubCatTwo(selected ? selected.subCatTwo : []);
            setFormData((prev) => ({ ...prev, sub_two: "" }));
        }
    }, [formData.sub_one, subCatOne]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        handleSubmit2(formData);
        setShowModal(false);
    };

    const handleClear = () => {
        setFormData({
            I_Id: "", I_name: "", Ca_Id: "", sub_one: "", sub_two: "", descrip: "", color: "", material: "", warrantyPeriod: "",startStock:"",
            price: "", cost: "", minQty: "", s_Id: "", img: null, img1: null, img2: null, img3: null,});
    };
    const handleAddSupplier = async (newSupplier) => {
        console.log(newSupplier);
        try {
            // Example: Save to server (optional)
            const response = await fetch("http://localhost:5001/api/admin/main/supplier", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSupplier),
            });

            const data = await response.json();
            if (data.success) {
                toast.success("✅ Supplier added successfully!");
                // Refetch suppliers to refresh dropdown
                await fetchSuppliers();
            }
        } catch (err) {
            console.error("Failed to add supplier:", err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <h2 className="invoice-title">Add New Item</h2>
                <Form onSubmit={handleSubmit}>
                    <FormGroup>
                        <Label for="I_Id">Item ID</Label>
                        <Input type="text" name="I_Id" id="I_Id" value={formData.I_Id} onChange={handleChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="I_name">Item Name</Label>
                        <Input type="text" name="I_name" id="I_name" value={formData.I_name} onChange={handleChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="Ca_Id">Category</Label>
                        <Input type="select" name="Ca_Id" id="Ca_Id" value={formData.Ca_Id} onChange={handleChange} required>
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Input>
                    </FormGroup>
                    {formData.Ca_Id && (
                        <FormGroup>
                            <Row>
                                <Col md={6}>
                                    <Label for="sub_one">Sub One</Label>
                                    <Input type="select" name="sub_one" id="sub_one" value={formData.sub_one} onChange={handleChange} required>
                                        <option value="">Select Sub One</option>
                                        {subCatOne.map((sub) => (
                                            <option key={sub.subCatOneId} value={sub.subCatOneId}>{sub.subCatOneName}</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={6}>
                                    {formData.sub_one && (
                                        <>
                                            <Label for="sub_two">Sub Two</Label>
                                            <Input type="select" name="sub_two" id="sub_two" value={formData.sub_two} onChange={handleChange} required>
                                                <option value="">Select Sub Two</option>
                                                {subCatTwo.map((sub) => (
                                                    <option key={sub.subCatTwoId} value={sub.subCatTwoId}>{sub.subCatTwoName}</option>
                                                ))}
                                            </Input>
                                        </>
                                    )}
                                </Col>
                            </Row>
                        </FormGroup>
                    )}
                    <FormGroup>
                        <Label for="descrip">Description</Label>
                        <Input type="textarea" name="descrip" id="descrip" value={formData.descrip} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup>
                        <Label for="color">Color</Label>
                        <Input type="text" name="color" id="color" value={formData.color} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup>
                        <Label for="material">Material</Label>
                        <Input type="select" name="material" id="material" value={formData.material}
                               onChange={handleChange} required>
                            <option value="">Select Material</option>
                            <option value="Teak">Teak</option>
                            <option value="Mahogani">Mahogani</option>
                            <option value="Mara">Mara</option>
                            <option value="Attoriya">Attoriya</option>
                            <option value="Sapu">Sapu</option>
                            <option value="Steel">Steel</option>
                            <option value="MDF">MDF</option>
                            <option value="MM">MM</option>
                            <option value="Mattress">Mattress</option>
                            <option value="Other">Other</option>
                        </Input>
                    </FormGroup>

                    <FormGroup>
                        <Label for="warrantyPeriod">Warranty Period</Label>
                        <Input type="text" name="warrantyPeriod" id="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup>
                        <Label for="s_Id" className="fw-bold">Select Supplier</Label>
                        <div className="d-flex gap-2 align-items-start">
                            {/* Dropdown - takes more space */}
                            <div style={{ flex: 2 }}>
                                <Input type="select" name="s_Id" id="s_Id" value={formData.s_Id} onChange={handleChange} required>
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.s_ID} value={supplier.s_ID}>
                                            {supplier.name} ({supplier.contact})
                                        </option>
                                    ))}
                                </Input>
                            </div>

                            {/* Add New Supplier Button */}
                            <div style={{ flex: 1 }}>
                                <Button
                                    color="primary"
                                    className="w-100"
                                    onClick={() => setShowSupplierModal(true)}
                                >
                                    Add New
                                </Button>

                            </div>
                        </div>
                    </FormGroup>

                    <FormGroup>
                        <Label for="cost">Cost</Label>
                        <Input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="price">Selling Price</Label>
                        <Input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required />
                    </FormGroup>

                    <FormGroup>
                        <Label for="minQty">Min Quantity (for production)</Label>
                        <Input type="number" name="minQty" id="minQty" value={formData.minQty} onChange={handleChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="startStock">Avaliable Stock</Label>
                        <Input type="number" name="startStock" id="startStock" value={formData.startStock} onChange={handleChange} required />
                    </FormGroup>
                    <FormGroup>
                        <Label for="img">Main Image (Required)</Label>
                        <Input type="file" name="img" id="img" accept="image/*" onChange={handleImageChange} required />
                    </FormGroup>

                    {/* <FormGroup>
                        <Label for="img1">Additional Image 1 (Required)</Label>
                        <Input type="file" name="img1" id="img1" accept="image/*" onChange={handleImageChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="img2">Additional Image 2 (Optional)</Label>
                        <Input type="file" name="img2" id="img2" accept="image/*" onChange={handleImageChange} />
                    </FormGroup>
                    <FormGroup>
                        <Label for="img3">Additional Image 3 (Optional)</Label>
                        <Input type="file" name="img3" id="img3" accept="image/*" onChange={handleImageChange} />
                    </FormGroup> */}
                    <Row className="mt-3">
                        <Col md={6}>
                            <Button type="submit" color="primary" block>
                                Add Item
                            </Button>
                        </Col>
                        <Col md={6}>
                            <Button type="button" color="secondary" block onClick={handleClear}>Clear</Button>
                        </Col>
                    </Row>
                    <div className="text-center mt-3">
                        <Button type="button" color="danger" onClick={() => setShowModal(false)}>Close</Button>
                    </div>
                </Form>
                {showSupplierModal && (
                    <AddNewSupplier
                        setShowModal={setShowSupplierModal}
                        handleSubmit2={handleAddSupplier}
                    />
                )}

            </div>
        </div>
    );
};

export default AddNewItem;
