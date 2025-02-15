import React, { useEffect, useState } from "react";
import { Container, Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";

const AddOtherDetails = () => {
    const [categoryImage, setCategoryImage] = useState(null);
    const [subCategory1Image, setSubCategory1Image] = useState(null);
    const [subCategory2Image, setSubCategory2Image] = useState(null);
    const [typeImage, setTypeImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [types, setTypes] = useState([]);
    const [formData, setFormData] = useState({
        Ca_Id: "", // Category ID
        sub_one: "",
        sub_two: "",
    });

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
        } else {
            setTypes([]);
        }
    }, [formData.Ca_Id]);

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    return (
        <Container className="add-item-container">
            <Row className="justify-content-center">
                <Col lg="6" className="d-flex flex-column gap-4">
                    {/* Add Category Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Category</Label>
                        <Input type="text" placeholder="Enter category name" className="mb-2" />
                        <Input type="file" accept="image/*" className="mb-2" onChange={(e) => setCategoryImage(e.target.files[0])} />
                        <Button color="primary">Add Category</Button>
                    </div>

                    {/* Add Sub-Category Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Sub-Category</Label>

                        {/* First Sub-Category */}
                        <Input type="text" placeholder="Enter first sub-category" className="mb-2" />
                        <Input type="file" accept="image/*" className="mb-2" onChange={(e) => setSubCategory1Image(e.target.files[0])} />

                        {/* Second Sub-Category */}
                        <Input type="text" placeholder="Enter second sub-category" className="mb-2" />
                        <Input type="file" accept="image/*" className="mb-2" onChange={(e) => setSubCategory2Image(e.target.files[0])} />

                        <Button color="success">Add Sub-Category</Button>
                    </div>

                    {/* Add Type Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Type</Label>
                        <Input type="select" className="mb-2" name="Ca_Id" id="Ca_Id" value={formData.Ca_Id} onChange={handleChange} required>
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Input>

                        {/* Sub One Dropdown (Only Show if Category is Selected) */}
                        {formData.Ca_Id && (
                            <Input type="select" className="mb-2" name="sub_one" id="sub_one" value={formData.sub_one} onChange={handleChange} required>
                                <option value="">Select Sub One</option>
                                {types.map((type) => (
                                    <option key={type.Ty_Id} value={type.sub_one}>
                                        {type.sub_one}
                                    </option>
                                ))}
                            </Input>
                        )}

                        {/* Sub Two Dropdown (Only Show if Sub One is Selected) */}
                        {formData.sub_one && (
                            <Input type="select" className="mb-2" name="sub_two" id="sub_two" value={formData.sub_two} onChange={handleChange} required>
                                <option value="">Select Sub Two</option>
                                {types
                                    .filter((type) => type.sub_one === formData.sub_one)
                                    .map((type) => (
                                        <option key={type.Ty_Id} value={type.sub_two}>
                                            {type.sub_two}
                                        </option>
                                    ))}
                            </Input>
                        )}

                        <Input type="file" accept="image/*" className="mb-2" onChange={(e) => setTypeImage(e.target.files[0])} />
                        <Button color="danger">Add Type</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default AddOtherDetails;
