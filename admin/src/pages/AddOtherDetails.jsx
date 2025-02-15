import React, { useEffect, useState } from "react";
import { Container, Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";

const AddOtherDetails = () => {
    const [categoryImage, setCategoryImage] = useState(null);
    const [subCategory1Image, setSubCategory1Image] = useState(null);
    const [subCategory2Image, setSubCategory2Image] = useState(null);
    const [typeImage, setTypeImage] = useState(null);
    const [categories, setCategories] = useState([]);
    const [subCategoriesOne, setSubCategoriesOne] = useState([]);
    const [subCategoriesTwo, setSubCategoriesTwo] = useState([]);
    const [formData, setFormData] = useState({
        Ca_Id: "",
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

    // Fetch SubCategory One when Category Changes
    useEffect(() => {
        if (formData.Ca_Id) {
            console.log(formData.Ca_Id);
            fetch(`http://localhost:5001/api/admin/main/getSubcategories?Ca_Id=${formData.Ca_Id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setSubCategoriesOne(data.data);
                        setFormData((prev) => ({ ...prev, sub_one: "", sub_two: "" })); // Reset selections
                    }
                })
                .catch((err) => {
                    console.error("Error fetching subcategories:", err);
                    toast.error("Failed to load subcategories.");
                });
        } else {
            setSubCategoriesOne([]);
            setSubCategoriesTwo([]);
        }
    }, [formData.Ca_Id]);

    // Fetch SubCategory Two when SubCategory One Changes
    useEffect(() => {
        if (formData.sub_one) {
            fetch(`http://localhost:5001/api/admin/main/getSubcategoriesTwo?sb_c_id=${formData.sub_one}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setSubCategoriesTwo(data.data);
                        setFormData((prev) => ({ ...prev, sub_two: "" })); // Reset sub_two selection
                    }
                })
                .catch((err) => {
                    console.error("Error fetching subcategories:", err);
                    toast.error("Failed to load subcategories.");
                });
        } else {
            setSubCategoriesTwo([]);
        }
    }, [formData.sub_one]);

    // Handle Input Changes
    const handleChange = (e) => {
        const { name, value } = e.target;
        console.log(name , value);
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

                        {/* Category Dropdown */}
                        <Input type="select" className="mb-2" name="Ca_Id" id="Ca_Id" value={formData.Ca_Id} onChange={handleChange} required>
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Input>

                        {/* Sub One Dropdown */}
                        {subCategoriesOne.length > 0 && (
                            <Input type="select" className="mb-2" name="sub_one" id="sub_one" value={formData.sub_one} onChange={handleChange} required>
                                <option value="">Select Sub One</option>
                                {subCategoriesOne.map((sub) => (
                                    <option key={sub.sb_c_id} value={sub.sb_c_id}>{sub.subcategory}</option>
                                ))}
                            </Input>
                        )}

                        {/* Sub Two Dropdown */}
                        {subCategoriesTwo.length > 0 && (
                            <Input type="select" className="mb-2" name="sub_two" id="sub_two" value={formData.sub_two} onChange={handleChange} required>
                                <option value="">Select Sub Two</option>
                                {subCategoriesTwo.map((sub) => (
                                    <option key={sub.sb_cc_id} value={sub.sb_cc_id}>{sub.subcategory}</option>
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
