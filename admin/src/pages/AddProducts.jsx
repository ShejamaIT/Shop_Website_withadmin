import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css"; // Import CSS

const AddItem = () => {
    const [formData, setFormData] = useState({
        I_name: "",
        Ty_id: "",
        descrip: "",
        price: "",
        qty: "",
        warrantyPeriod: "",
        cost: "",
        img: ""
    });

    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);

    // Fetch Categories
    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data.categories))
            .catch((err) => console.error("Error fetching categories:", err));
    }, []);

    // Fetch Types when Category Changes
    useEffect(() => {
        if (formData.Ca_Id) {
            fetch(`http://localhost:5001/api/admin/main/types?Ca_Id=${formData.Ca_Id}`)
                .then((res) => res.json())
                .then((data) => setTypes(data.types))
                .catch((err) => console.error("Error fetching types:", err));
        }
    }, [formData.Ca_Id]);

    // Handle Form Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Image Upload
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData((prev) => ({ ...prev, img: reader.result }));
        };
        if (file) reader.readAsDataURL(file);
    };

    // Handle Form Submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/add-item", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (response.ok) {
                toast.success("Item added successfully!");
                setFormData({ I_name: "", Ty_id: "", descrip: "", price: "", qty: "", warrantyPeriod: "", cost: "", img: "" });
            } else {
                toast.error(data.message || "Failed to add item.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Server error. Please try again.");
        }
    };

    return (
        <Container className="add-item-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Add New Item</h3>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label for="I_name">Item Name</Label>
                            <Input type="text" name="I_name" id="I_name" value={formData.I_name} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="Ca_Id">Category</Label>
                            <Input type="select" name="Ca_Id" id="Ca_Id" value={formData.Ca_Id} onChange={handleChange} required>
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.Ca_Id} value={cat.Ca_Id}>{cat.name}</option>
                                ))}
                            </Input>
                        </FormGroup>

                        {/*<FormGroup>*/}
                        {/*    <Label for="Ty_id">Type</Label>*/}
                        {/*    <Input type="select" name="Ty_id" id="Ty_id" value={formData.Ty_id} onChange={handleChange} required>*/}
                        {/*        <option value="">Select Type</option>*/}
                        {/*        {types.map((type) => (*/}
                        {/*            <option key={type.Ty_Id} value={type.Ty_Id}>{type.sub_one} - {type.sub_two}</option>*/}
                        {/*        ))}*/}
                        {/*    </Input>*/}
                        {/*</FormGroup>*/}

                        <FormGroup>
                            <Label for="descrip">Description</Label>
                            <Input type="textarea" name="descrip" id="descrip" value={formData.descrip} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="price">Price</Label>
                            <Input type="number" name="price" id="price" value={formData.price} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="qty">Quantity</Label>
                            <Input type="number" name="qty" id="qty" value={formData.qty} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="warrantyPeriod">Warranty Period</Label>
                            <Input type="text" name="warrantyPeriod" id="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="cost">Cost</Label>
                            <Input type="number" name="cost" id="cost" value={formData.cost} onChange={handleChange} required />
                        </FormGroup>

                        <FormGroup>
                            <Label for="img">Upload Image</Label>
                            <Input type="file" name="img" id="img" accept="image/*" onChange={handleImageChange} required />
                        </FormGroup>

                        <Button type="submit" color="primary" block>Add Item</Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default AddItem;
