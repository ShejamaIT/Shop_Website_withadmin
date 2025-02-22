import React, { useEffect, useState } from "react";
import { Container, Row, Col, Label, Input, Button } from "reactstrap";
import { toast } from "react-toastify";

const AddOtherDetails = () => {
    const [subCategoriesOne, setSubCategoriesOne] = useState([]);
    const [subCategoriesTwo, setSubCategoriesTwo] = useState([]);
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

    // Fetch SubCategory One when Category Changes for Type Section
    useEffect(() => {
        if (typeData.Ca_Id) {
            fetch(`http://localhost:5001/api/admin/main/getSubcategories?Ca_Id=${typeData.Ca_Id}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setSubCategoriesOne(data.data);
                        setTypeData((prev) => ({ ...prev, sub_one: "", sub_two: "" })); // Reset selections
                    }
                })
                .catch((err) => {
                    toast.error("Failed to load subcategories.");
                });
        } else {
            setSubCategoriesOne([]);
            setSubCategoriesTwo([]);
        }
    }, [typeData.Ca_Id]);
    // Fetch SubCategory Two when SubCategory One Changes for Type Section
    useEffect(() => {
        if (typeData.sub_one) {
            fetch(`http://localhost:5001/api/admin/main/getSubcategoriesTwo?sb_c_id=${typeData.sub_one}`)
                .then((res) => res.json())
                .then((data) => {
                    if (data.success) {
                        setSubCategoriesTwo(data.data);
                        setTypeData((prev) => ({ ...prev, sub_two: "" })); // Reset sub_two selection
                    }
                })
                .catch((err) => {
                    toast.error("Failed to load subcategories.");
                });
        } else {
            setSubCategoriesTwo([]);
        }
    }, [typeData.sub_one]);

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

    // Handle Input Changes for typeData
    const handleTypeChange = (e) => {
        const { name, value } = e.target;
        setTypeData((prev) => ({ ...prev, [name]: value }));
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

    // Handle Form Submission for Types
    const handleSubmitType = async () => {
        try {
            // Destructure typeData
            const { Ca_Id, sub_one, sub_two } = typeData;

            // Perform basic validation
            if (!Ca_Id || !sub_one) {
                toast.error("Ca_Id and sub_one are required.");
                return;
            }

            console.log("Submitting Type Data:", typeData);

            // Prepare the request payload
            const formDataToSend = {
                Ca_Id,
                sub_one,
                sub_two,
            };

            // Send POST request to your API
            const response = await fetch("http://localhost:5001/api/admin/main/type", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formDataToSend),
            });

            const result = await response.json();

            if (result.success) {
                // Show success toast and reset form state
                toast.success(result.message);
                setTypeData({
                    Ca_Id: "",
                    sub_one: "",
                    sub_two: "",
                });
            } else {
                // Show error message from the API response
                toast.error(result.message);
            }
        } catch (error) {
            // Handle network or server errors
            toast.error("Failed to add type. Please try again.");
            console.error("Error submitting Type:", error);
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

                    {/* Add Type Section */}
                    {/*<div className="p-3 border rounded shadow-sm">*/}
                    {/*    <Label className="fw-bold">Add Type</Label>*/}
                    {/*    <Input type="select" className="mb-2" name="Ca_Id" value={typeData.Ca_Id} onChange={handleTypeChange} required>*/}
                    {/*        <option value="">Select Category</option>*/}
                    {/*        {categories.map((cat) => (*/}
                    {/*            <option key={cat.id} value={cat.id}>{cat.name}</option>*/}
                    {/*        ))}*/}
                    {/*    </Input>*/}
                    {/*    {subCategoriesOne.length > 0 && (*/}
                    {/*        <Input type="select" className="mb-2" name="sub_one" value={typeData.sub_one} onChange={handleTypeChange} required>*/}
                    {/*            <option value="">Select Sub One</option>*/}
                    {/*            {subCategoriesOne.map((sub) => (*/}
                    {/*                <option key={sub.sb_c_id} value={sub.subcategory}>{sub.subcategory}</option>*/}
                    {/*            ))}*/}
                    {/*        </Input>*/}
                    {/*    )}*/}
                    {/*    {subCategoriesTwo.length > 0 && (*/}
                    {/*        <Input type="select" className="mb-2" name="sub_two" value={typeData.sub_two} onChange={handleTypeChange} required>*/}
                    {/*            <option value="">Select Sub Two</option>*/}
                    {/*            {subCategoriesTwo.map((sub) => (*/}
                    {/*                <option key={sub.sb_cc_id} value={sub.sb_cc_id}>{sub.subcategory}</option>*/}
                    {/*            ))}*/}
                    {/*        </Input>*/}
                    {/*    )}*/}
                    {/*    <Button color="danger" onClick={handleSubmitType}>Add Type</Button>*/}
                    {/*</div>*/}

                </Col>
            </Row>
        </Container>
    );
};
export default AddOtherDetails;
