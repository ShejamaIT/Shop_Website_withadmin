import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css"; // Import CSS

const AddItem = () => {
    const [formData, setFormData] = useState({
        I_Id: "", // Item ID sent from frontend
        I_name: "",
        Ca_Id: "", // Category ID
        Ty_id: "", // Type ID
        sub_one: "", // Sub One ID
        sub_two: "", // Sub Two ID
        descrip: "",
        color: "",
        material: "",
        price: "",
        warrantyPeriod: "",
        cost: "",
        img: null,  // Main Image
        img1: null, // Additional Images
        img2: null,
        img3: null,
        s_Id:""
    });
    const [categories, setCategories] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [types, setTypes] = useState([]);

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

    // Fetch All Suppliers when component loads
    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/suppliers")
            .then((res) => res.json())
            .then((data) => {
                if (data.success) {
                    setSuppliers(data.suppliers); // Store suppliers data
                } else {
                    toast.error("Failed to load suppliers.");
                }
            })
            .catch((err) => {
                console.error("Error fetching suppliers:", err);
                toast.error("Error fetching suppliers.");
            });
    }, []);

    // Fetch Types when Category Changes
    useEffect(() => {
        if (formData.Ca_Id) {
            fetch(`http://localhost:5001/api/admin/main/types?Ca_Id=${formData.Ca_Id}`)
                .then((res) => res.json())
                .then((data) => setTypes(data.types))
                .catch((err) => {
                    console.error("Error fetching types:", err);
                    toast.error("Failed to load types.");
                });
        }
    }, [formData.Ca_Id]);

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Image Upload
    const handleImageChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setFormData((prev) => ({ ...prev, [name]: files[0] }));
        }
    };

    // Handle Other Material Change
    const handleOtherMaterialChange = (e) => {
        setFormData((prev) => ({ ...prev, otherMaterial: e.target.value }));
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submitting Form:", formData);

        try {
            // Fetch Type ID based on Category
            const typeResponse = await fetch(
                `http://localhost:5001/api/admin/main/find-types?Ca_Id=${formData.Ca_Id}&sub_one=${formData.sub_one}&sub_two=${formData.sub_two}`
            );

            if (!typeResponse.ok) {
                throw new Error("Failed to fetch Type ID");
            }

            const typeData = await typeResponse.json();
            const typeId = typeData.type.Ty_Id; // Extract Type ID

            if (!typeId){
                toast.error("Added Type Frist");
            }

            // If "Other" material is selected, set the material to the otherMaterial value
            const materialToSend = formData.material === "Other" ? formData.otherMaterial : formData.material;
            console.log(materialToSend);
            const formDataToSend = new FormData();
            formDataToSend.append("I_Id", formData.I_Id);
            formDataToSend.append("I_name", formData.I_name);
            formDataToSend.append("Ca_Id", formData.Ca_Id);
            formDataToSend.append("Ty_id", typeId);
            formDataToSend.append("descrip", formData.descrip);
            formDataToSend.append("color", formData.color);
            formDataToSend.append("material", materialToSend); // Send the correct material value
            formDataToSend.append("price", formData.price);
            formDataToSend.append("warrantyPeriod", formData.warrantyPeriod);
            formDataToSend.append("cost", formData.cost);
            formDataToSend.append("s_Id", formData.s_Id);

            // Append Required Images
            if (formData.img) formDataToSend.append("img", formData.img);
            if (formData.img1) formDataToSend.append("img1", formData.img1);

            // Append Optional Image
            if (formData.img2) formDataToSend.append("img2", formData.img2);
            if (formData.img3) formDataToSend.append("img3", formData.img3);
            console.log(formData);

            // Submit the form data (You can now handle the form data submission)
            const submitResponse = await fetch("http://localhost:5001/api/admin/main/add-item", {
                method: "POST",
                body: formDataToSend, // Send FormData
            });

            const submitData = await submitResponse.json();

            if (submitResponse.ok) {
                toast.success("Item added successfully!");
                setFormData({
                    I_Id: "",
                    I_name: "",
                    Ca_Id: "",
                    Ty_id: "",
                    sub_one: "",
                    sub_two: "",
                    descrip: "",
                    color: "",
                    material: "",
                    price: "",
                    warrantyPeriod: "",
                    cost: "",
                    img: null,
                    img1: null,
                    img2: null,
                    img3: null,
                    s_Id:"",
                });
            } else {
                toast.error(submitData.message || "Failed to add item.");
            }


        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error(error.message || "Error during form submission.");
        }
    };

    // Clear the form fields
    const handleClear = () => {
        setFormData({
            I_Id: "",
            I_name: "",
            Ca_Id: "",
            Ty_id: "",
            sub_one: "",
            sub_two: "",
            descrip: "",
            color: "",
            material: "",
            price: "",
            warrantyPeriod: "",
            cost: "",
            img: null,
            img1: null,
            img2: null,
            img3: null,
            s_Id:"",
        });
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
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </Input>
                        </FormGroup>
                        {/* Type selection, shown only when a category is selected */}
                        {formData.Ca_Id && (
                            <FormGroup>
                                <Row>
                                    {/* Sub One Dropdown */}
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
                                            {types.map((type) => (
                                                <option key={type.Ty_Id} value={type.sub_one}>
                                                    {type.sub_one}
                                                </option>
                                            ))}
                                        </Input>
                                    </Col>

                                    {/* Sub Two Dropdown, shown after selecting Sub One */}
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
                                                    {types
                                                        .filter((type) => type.sub_one === formData.sub_one)
                                                        .map((type) => (
                                                            <option key={type.Ty_Id} value={type.sub_two}>
                                                                {type.sub_two}
                                                            </option>
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
                            <Row>
                                <Col md={6}>
                                    <Label for="material">Material</Label>
                                    <Input
                                        type="select"
                                        name="material"
                                        id="material"
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
                                </Col>
                                <Col md={6}>
                                    {formData.material === "Other" && (
                                        <Input
                                            type="text"
                                            name="otherMaterial"
                                            id="otherMaterial"
                                            placeholder="Enter custom material"
                                            value={formData.otherMaterial || ""} // This ensures it is editable
                                            onChange={handleOtherMaterialChange}
                                            required
                                        />
                                    )}
                                </Col>
                            </Row>
                        </FormGroup>

                        <FormGroup>
                            <Label for="warrantyPeriod">Warranty Period</Label>
                            <Input type="text" name="warrantyPeriod" id="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="price">Price</Label>
                            <Input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required />
                        </FormGroup>

                        {/* Image Upload Inputs */}
                        <FormGroup>
                            <Label for="img">Main Image (Required)</Label>
                            <Input type="file" name="img" id="img" accept="image/*" onChange={handleImageChange} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="img1">Additional Image 1 (Required)</Label>
                            <Input type="file" name="img1" id="img1" accept="image/*" onChange={handleImageChange} required />
                        </FormGroup>
                        <FormGroup>
                            <Label for="img2">Additional Image 2 (Optional)</Label>
                            <Input type="file" name="img2" id="img2" accept="image/*" onChange={handleImageChange}  />
                        </FormGroup>
                        <FormGroup>
                            <Label for="img3">Additional Image 3 (Optional)</Label>
                            <Input type="file" name="img3" id="img3" accept="image/*" onChange={handleImageChange} />
                        </FormGroup>

                        <FormGroup>
                            <Label for="s_Id">Select Supplier</Label>
                            <Input type="select" name="s_Id" id="s_Id" value={formData.s_Id} onChange={handleChange} required>
                                <option value="">Select Supplier</option>
                                {suppliers.map((supplier) => (
                                    <option key={supplier.s_ID} value={supplier.s_ID}>
                                        {supplier.name} ({supplier.contact})
                                    </option>
                                ))}
                            </Input>
                        </FormGroup>

                        <FormGroup>
                            <Label for="cost">Cost</Label>
                            <Input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} required />
                        </FormGroup>

                        <div>
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
                        </div>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default AddItem;
