import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css"; // Import CSS

const AddItem = () => {
    const [formData, setFormData] = useState({
        I_Id: "", I_name: "", Ca_Id: "", sub_one: "", sub_two: "", descrip: "", color: "", material: "", otherMaterial: "", price: "", warrantyPeriod: "", cost: "", img: null, img1: null, img2: null, img3: null, s_Id: "", minQty: ""
    });
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [subCatOne, setSubCatOne] = useState([]);
    const [subCatTwo, setSubCatTwo] = useState([]);

    // Fetch Categories
    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/categories");
            const data = await response.json();
            setCategories(data.length > 0 ? data : []);
        } catch (err) {
            console.error("Error fetching categories:", err);
            setCategories([]); // Default to empty array on error
        }
    };

// Fetch Suppliers
    useEffect(() => {
        fetchSuppliers();
    }, []);

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
            setSuppliers([]); // Default to empty array on error
        }
    };

// Fetch Subcategories when Category changes
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
            const response = await fetch(`http://localhost:5001/api/admin/main/types?Ca_Id=${Ca_Id}`);
            const data = await response.json();
            setSubCatOne(data.data.length > 0 ? data.data : []); // Ensure empty array if no data
            setSubCatTwo([]); // Reset subcategory two
            setFormData((prev) => ({ ...prev, sub_one: "", sub_two: "" })); // Reset form fields
        } catch (err) {
            console.error("Error fetching subcategories:", err);
            setSubCatOne([]); // Default to empty array on error
        }
    };

// Fetch Subcategories Two when Subcategory One changes
    useEffect(() => {
        if (formData.sub_one) {
            const selectedSubCatOne = subCatOne.find((cat) => cat.subCatOneId === formData.sub_one);
            setSubCatTwo(selectedSubCatOne ? selectedSubCatOne.subCatTwo : []);
            setFormData((prev) => ({ ...prev, sub_two: "" }));
        }
    }, [formData.sub_one, subCatOne]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleImageChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) setFormData((prev) => ({ ...prev, [name]: files[0] }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting Form:", formData);
        // Add API request to submit form data here
        try {
            // ✅ Handle "Other" material selection
            const materialToSend = formData.material === "Other" ? formData.otherMaterial : formData.material;

            // ✅ Prepare FormData for submission
            const formDataToSend = new FormData();
            formDataToSend.append("I_Id", formData.I_Id);
            formDataToSend.append("I_name", formData.I_name);
            formDataToSend.append("Ca_Id", formData.Ca_Id);
            formDataToSend.append("sub_one", formData.sub_one);
            formDataToSend.append("sub_two", formData.sub_two || "None"); // Set "None" if not selected
            formDataToSend.append("descrip", formData.descrip);
            formDataToSend.append("color", formData.color);
            formDataToSend.append("material", materialToSend);
            formDataToSend.append("price", formData.price);
            formDataToSend.append("warrantyPeriod", formData.warrantyPeriod);
            formDataToSend.append("cost", formData.cost);
            formDataToSend.append("s_Id", formData.s_Id);
            formDataToSend.append("minQty", formData.minQty);

            // ✅ Append Required Main Image
            if (formData.img) {
                formDataToSend.append("img", formData.img);
            } else {
                toast.error("Main image is required.");
                return;
            }

            // ✅ Append Optional Images
            if (formData.img1) formDataToSend.append("img1", formData.img1);
            if (formData.img2) formDataToSend.append("img2", formData.img2);
            if (formData.img3) formDataToSend.append("img3", formData.img3);

            // ✅ Submit the form data
            const submitResponse = await fetch("http://localhost:5001/api/admin/main/add-item", {
                method: "POST",
                body: formDataToSend,
            });
            const submitData = await submitResponse.json();

            if (submitResponse.ok) {
                toast.success("✅ Item added successfully!");
                setFormData({
                    I_Id: "",I_name: "",Ca_Id: "",sub_one: "",sub_two: "",descrip: "",color: "",material: "",otherMaterial: "",price: "",warrantyPeriod: "",cost: "",img: null,img1: null,img2: null,img3: null,s_Id: "",minQty: ""
                });
            } else {
                toast.error(submitData.message || "❌ Failed to add item.");
            }
        } catch (error) {
            console.error("❌ Error submitting form:", error);
            toast.error("❌ An error occurred while adding the item.");
        }
    };

    const handleClear = () => {
        setFormData({
            I_Id: "", I_name: "", Ca_Id: "", sub_one: "", sub_two: "", descrip: "", color: "", material: "", otherMaterial: "", price: "", warrantyPeriod: "", cost: "", img: null, img1: null, img2: null, img3: null, s_Id: "", minQty: ""
        });
        setSubCatOne([]);
        setSubCatTwo([]);
    };

    return (
        <Container className="add-item-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Add New Item</h3>
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
                                {categories.length > 0 ? categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                )) : <option value="">No Categories Available</option>}
                            </Input>
                        </FormGroup>

                        {formData.Ca_Id && (
                            <FormGroup>
                                <Row>
                                    <Col md={6}>
                                        <Label for="sub_one">Sub One</Label>
                                        <Input
                                            type="select"
                                            name="sub_one"
                                            id="sub_one"
                                            value={formData.sub_one}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">Select Sub One</option>
                                            {subCatOne.length > 0 ? subCatOne.map((sub) => (
                                                <option key={sub.subCatOneId} value={sub.subCatOneId}>
                                                    {sub.subCatOneName}
                                                </option>
                                            )) : <option value="">No Subcategories Available</option>}
                                        </Input>
                                    </Col>
                                    <Col md={6}>
                                        {formData.sub_one && (
                                            <>
                                                <Label for="sub_two">Sub Two</Label>
                                                <Input
                                                    type="select"
                                                    name="sub_two"
                                                    id="sub_two"
                                                    value={formData.sub_two}
                                                    onChange={handleChange}
                                                    required
                                                >
                                                    <option value="">Select Sub Two</option>
                                                    {subCatTwo.length > 0 ? subCatTwo.map((sub) => (
                                                        <option key={sub.subCatTwoId} value={sub.subCatTwoId}>
                                                            {sub.subCatTwoName}
                                                        </option>
                                                    )) : <option value="">No Subcategories Available</option>}
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
                            <Input
                                type="select"
                                name="material"
                                value={formData.material}
                                onChange={handleChange}
                                required
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

                        <FormGroup>
                            <Label for="warrantyPeriod">Warranty Period</Label>
                            <Input type="text" name="warrantyPeriod" id="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="price">Price</Label>
                            <Input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="img">Main Image (Required)</Label>
                            <Input type="file" name="img" id="img" accept="image/*" onChange={handleImageChange} required />
                        </FormGroup>

                        <FormGroup>
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
                        </FormGroup>

                        <FormGroup>
                            <Label for="s_Id">Select Supplier</Label>
                            <Input type="select" name="s_Id" id="s_Id" value={formData.s_Id} onChange={handleChange} required>
                                <option value="">Select Supplier</option>
                                {suppliers.length > 0 ? suppliers.map((supplier) => (
                                    <option key={supplier.s_ID} value={supplier.s_ID}>
                                        {supplier.name} ({supplier.contact})
                                    </option>
                                )) : <option value="">No Suppliers Available</option>}
                            </Input>
                        </FormGroup>

                        <FormGroup>
                            <Label for="cost">Cost</Label>
                            <Input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="minQty">Min Quantity (for production)</Label>
                            <Input type="number" name="minQty" id="minQty" value={formData.minQty} onChange={handleChange} required />
                        </FormGroup>

                        <Row>
                            <Col md="6">
                                <Button type="submit" color="primary" block>
                                    Add Item
                                </Button>
                            </Col>
                            <Col md="6">
                                <Button type="button" color="danger" block onClick={handleClear}>
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

export default AddItem;
