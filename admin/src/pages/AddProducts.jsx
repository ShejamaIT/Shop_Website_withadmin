import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css"; // Import CSS

const AddItem = () => {
    const [formData, setFormData] = useState({
        I_name: "",
        Ca_Id: "", // category ID
        Ty_id: "", // type ID
        descrip: "",
        price: "",
        qty: "",
        warrantyPeriod: "",
        cost: "",
        img: "",
    });

    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);

    // Fetch Categories
    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/categories")
            .then((res) => res.json())
            .then((data) => {
                setCategories(data);
            })
            .catch((err) => {
                console.error("Error fetching categories:", err);
                toast.error("Failed to load categories.");
            });
    }, []);

    // Fetch Types when Category Changes
    useEffect(() => {
        if (formData.Ca_Id) {
            console.log(formData);
            fetch(`http://localhost:5001/api/admin/main/types?Ca_Id=${formData.Ca_Id}`)
                .then((res) => res.json())
                .then((data) => {
                    setTypes(data.types);
                })
                .catch((err) => {
                    console.error("Error fetching types:", err);
                    toast.error("Failed to load types.");
                });
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
        console.log(formData);
        try {
            // Fetch Type ID based on Ca_Id, sub_one, and sub_two
            const response = await fetch(`http://localhost:5001/api/admin/main/find-types?Ca_Id=${formData.Ca_Id}&sub_one=${formData.sub_one}&sub_two=${formData.sub_two}`);
            const data = await response.json();

            // If the type is found, update formData with the Type ID
            if (response.ok) {
                const typeId = data.type.Ty_Id; // Get the Type ID
                setFormData((prev) => ({
                    ...prev,
                    Ty_id: typeId, // Set the Type ID in the form data
                }));

                // Log the updated form data
                console.log(formData);

                // Now proceed with your original form submission logic
                const submitResponse = await fetch("http://localhost:5001/api/admin/main/add-item", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(formData),
                });

                const submitData = await submitResponse.json();
                if (submitResponse.ok) {
                    toast.success("Item added successfully!");
                    setFormData({ I_name: "", Ca_Id: "", Ty_id: "", sub_one: "", sub_two: "", descrip: "", price: "", qty: "", warrantyPeriod: "", cost: "", img: "" });
                } else {
                    toast.error(submitData.message || "Failed to add item.");
                }
            } else {
                toast.error(data.message || "Failed to fetch type ID.");
            }
        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Error during form submission.");
        }
        // try {
        //     const response = await fetch("http://localhost:5001/api/admin/main/add-item", {
        //         method: "POST",
        //         headers: { "Content-Type": "application/json" },
        //         body: JSON.stringify(formData),
        //     });
        //
        //     const data = await response.json();
        //     if (response.ok) {
        //         toast.success("Item added successfully!");
        //         setFormData({ I_name: "", Ca_Id: "", Ty_id: "", descrip: "", price: "", qty: "", warrantyPeriod: "", cost: "", img: "" });
        //     } else {
        //         toast.error(data.message || "Failed to add item.");
        //     }
        // } catch (error) {
        //     console.error("Error submitting form:", error);
        //     toast.error("Server error. Please try again.");
        // }
    };

    return (
        <Container className="add-item-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Add New Item</h3>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label for="I_name">Item Name</Label>
                            <Input
                                type="text"
                                name="I_name"
                                id="I_name"
                                value={formData.I_name}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="Ca_Id">Category</Label>
                            <Input
                                type="select"
                                name="Ca_Id"
                                id="Ca_Id"
                                value={formData.Ca_Id}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map((cat) => (
                                    <option key={cat.id} value={cat.id}> {/* Use cat.name instead of cat.Ca_Id */}
                                        {cat.name}
                                    </option>
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
                            <Input
                                type="textarea"
                                name="descrip"
                                id="descrip"
                                value={formData.descrip}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="price">Price</Label>
                            <Input
                                type="number"
                                name="price"
                                id="price"
                                value={formData.price}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="qty">Quantity</Label>
                            <Input
                                type="number"
                                name="qty"
                                id="qty"
                                value={formData.qty}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="warrantyPeriod">Warranty Period</Label>
                            <Input
                                type="text"
                                name="warrantyPeriod"
                                id="warrantyPeriod"
                                value={formData.warrantyPeriod}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="cost">Cost</Label>
                            <Input
                                type="number"
                                name="cost"
                                id="cost"
                                value={formData.cost}
                                onChange={handleChange}
                                required
                            />
                        </FormGroup>

                        <FormGroup>
                            <Label for="img">Upload Image</Label>
                            <Input
                                type="file"
                                name="img"
                                id="img"
                                accept="image/*"
                                onChange={handleImageChange}
                                required
                            />
                        </FormGroup>

                        <Button type="submit" color="primary" block>
                            Add Item
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default AddItem;
