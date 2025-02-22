import React, { useEffect, useState } from "react";
import { Container, Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";

const AddOtherDetails = () => {
    const [categories, setCategories] = useState([]);
    const [catname , setCatname] = useState({  Catname: ""});
    const [formData, setFormData] = useState({ Ca_Id: "", sub_one: "", sub_two: "", subcatone_img: null, subcattwo_img: null,});
    const [typeData, setTypeData] = useState({ Ca_Id: "", sub_one: "", sub_two: "" });
    // Fetch Categories
    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/categories")
            .then((res) => res.json())
            .then((data) => setCategories(data))
            .catch((err) => {
                toast.error("Failed to load categories.");
            });
    }, []);

    // Handle Input Changes for formData
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Handle File Input Changes (Images)
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setFormData((prev) => ({ ...prev, [name]: files[0] })); // Store file in formData
        }
    };

    // Handle Input Changes for catname
    const handleCatChange = (e) => {
        const { name, value } = e.target;
        setCatname((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Form Submission for Sub-Categories
    const handleSubmitCategory = async () => {
        if (!catname.Catname.trim()) {
            toast.error("Category name cannot be empty!");
            return;
        }

        try {
            // Send the new category to the API
            const saveResponse = await fetch("http://localhost:5001/api/admin/main/category", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(catname),
            });
            const saveData = await saveResponse.json();
            if (saveData.success) {
                toast.success("Category added successfully!");
                setCatname({ Catname: "" }); // Reset input field
            } else {
                throw new Error(saveData.message);
            }
        } catch (error) {
            toast.error("Failed to add category. Please try again.");
        }
    };

    // Handle Form Submission for Sub-Categories
    const handleSubmitSubCategory = async () => {
        if (!formData.Ca_Id || !formData.sub_one || !formData.subcatone_img) {
            toast.error("Category, Sub-category One, and Image are required.");
            return;
        }

        const formDataToSend = new FormData();
        formDataToSend.append("Ca_Id", formData.Ca_Id);
        formDataToSend.append("sub_one", formData.sub_one);

        // If sub_two is "None", don't send it
        if (formData.sub_two && formData.sub_two !== "None") {
            formDataToSend.append("sub_two", formData.sub_two);
        } else {
            formDataToSend.append("sub_two", "None");
        }

        // Append image files only if they exist
        if (formData.subcatone_img) formDataToSend.append("subcatone_img", formData.subcatone_img);
        if (formData.sub_two !== "None" && formData.subcattwo_img) {
            formDataToSend.append("subcattwo_img", formData.subcattwo_img);
        }

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/subcategory", {
                method: "POST",
                body: formDataToSend,
            });
            const result = await response.json();

            if (result.success) {
                toast.success("Sub-category added successfully!");
                setFormData({
                    Ca_Id: "",
                    sub_one: "",
                    sub_two: "",
                    subcatone_img: null,
                    subcattwo_img: null,
                });
            } else {
                toast.error(result.message);
            }
        } catch (error) {
            toast.error("Failed to add sub-category.");
        }
    };

    return (
        <Container className="add-item-container">
            <Row className="justify-content-center">
                <Col lg="6" className="d-flex flex-column gap-4">
                    {/* Add Category Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Category</Label>
                        <Input type="text" placeholder="Enter category name" className="mb-2" name="Catname" value={catname.Catname} onChange={handleCatChange}/>
                        <Button color="primary" onClick={handleSubmitCategory}>Add Category</Button>
                    </div>

                    {/* Add Sub-Category Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Select Category</Label>
                        <Input type="select" className="mb-2" name="Ca_Id" id="Ca_Id" value={formData.Ca_Id} onChange={handleChange} required>
                            <option value="">Select Category</option>
                            {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </Input>

                        <Label className="fw-bold">Add Sub-Category One</Label>
                        <Input type="text" placeholder="Enter first sub-category" className="mb-2" name="sub_one" value={formData.sub_one} onChange={handleChange} />
                        <Input type="file" accept="image/*" className="mb-2" name="subcatone_img" onChange={handleFileChange} />

                        <Label className="fw-bold">Add Sub-Category Two</Label>
                        <Input type="text" placeholder="Enter second sub-category" className="mb-2" name="sub_two" value={formData.sub_two} onChange={handleChange} />
                        <Input type="file" accept="image/*" className="mb-2" name="subcattwo_img" onChange={handleFileChange} />

                        <Button color="success" onClick={handleSubmitSubCategory}>Add Sub-Category</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};
export default AddOtherDetails;
