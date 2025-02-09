import React, { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Button, Input, FormGroup, Label } from "reactstrap";
import { useParams } from "react-router-dom";
import NavBar from "../components/header/navBar";
import "../style/ItemDetails.css";

const ItemDetails = () => {
    const { id } = useParams(); // Get item ID from URL
    const [item, setItem] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({}); // Stores editable fields
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchItem();
    }, [id]);

    const fetchItem = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/item-details?I_Id=${id}`);
            if (!response.ok) throw new Error("Failed to fetch item details.");
            const data = await response.json();
            setItem(data.item);
            setFormData(data.item); // Copy item details for editing
            console.log(data.item);
            setLoading(false);
        } catch (err) {
            console.error("Error fetching item details:", err);
            setError(err.message);
            setLoading(false);
        }
    }

    const handleChange = (e) => {
        const { name, value, type, files } = e.target;

        if (type === "file" && files) {
            // Handle image file change (Convert to base64)
            const file = files[0];
            const reader = new FileReader();

            reader.onloadend = () => {
                // Update the formData with the base64 string of the image
                setFormData((prevFormData) => ({
                    ...prevFormData,
                    [name]: reader.result.split(',')[1], // Removing the "data:image/png;base64," part
                }));
            };

            // Read the file as a data URL (Base64 encoded string)
            reader.readAsDataURL(file);
        } else {
            // Handle regular text input changes
            setFormData((prevFormData) => ({
                ...prevFormData,
                [name]: value,
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
                    [name]: reader.result.split(',')[1], // Store base64 string without the data URL prefix
                }));
            };

            reader.readAsDataURL(file);
        }
    };


    const handleSave = async () => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/update-item`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!response.ok) throw new Error("Failed to update item.");

            const updatedItem = await response.json();
            setItem(updatedItem);
            setIsEditing(false);
        } catch (err) {
            console.error("Error updating item:", err);
            toast.error("Failed to update item!");
        }
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
                                                {!isEditing ? (
                                                    <p><strong>Cost:</strong> Rs. {item.cost}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Cost:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="cost"
                                                            value={formData.cost}
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
                                                    <p><strong>Stock Quantity:</strong> {item.stockQty}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Stock Quantity:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="qty"
                                                            value={formData.stockQty}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>

                                                )}
                                                {!isEditing ? (
                                                    <p><strong>Available Quantity:</strong> {item.availableQty}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Stock Quantity:</strong></Label>
                                                        <Input
                                                            type="number"
                                                            name="qty"
                                                            value={formData.availableQty}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>

                                                )}
                                            </Col>
                                        </Row>
                                        {/* Category Name */}
                                        <Row>
                                            <Col>
                                                {!isEditing ? (
                                                    <p><strong>Category:</strong> {item.category_name}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Category:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="categoryName"
                                                            value={formData.category_name}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}

                                                {/* Subcategory One */}
                                                {!isEditing ? (
                                                    <p><strong>Subcategory One:</strong> {item.subcategory_one}</p>
                                                ) : (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory One:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="subcategoryOne"
                                                            value={formData.subcategory_one}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                )}

                                                {/* Subcategory Two */}
                                                {item.subcategory_two && item.subcategory_two !== 'None' && !isEditing ? (
                                                    <p><strong>Subcategory Two:</strong> {item.subcategory_two}</p>
                                                ) : isEditing ? (
                                                    <FormGroup>
                                                        <Label><strong>Subcategory Two:</strong></Label>
                                                        <Input
                                                            type="text"
                                                            name="subcategoryTwo"
                                                            value={formData.subcategory_two}
                                                            onChange={handleChange}
                                                        />
                                                    </FormGroup>
                                                ) : null}
                                            </Col>
                                        </Row>

                                    </div>
                                </div>

                                {/* Item Image */}
                                <div className="item-image">
                                    <h5 className="mt-4">Item Image</h5>
                                    {!isEditing ? (
                                        // Display the image if not editing
                                        <img
                                            src={`data:image/png;base64,${item.img}`}
                                            alt={item.I_name}
                                            className="item-image-display"
                                        />
                                    ) : (
                                        // Show the input field for image editing (or add the logic to upload the image)
                                        <FormGroup>
                                            <Label><strong>Item Image:</strong></Label>
                                            <Input
                                                type="file"
                                                name="img"
                                                onChange={handleImageChange}
                                            />
                                        </FormGroup>
                                    )}
                                </div>


                                {/* Buttons */}
                                <div className="text-center mt-4">
                                    {!isEditing ? (
                                        <Button color="primary" onClick={() => setIsEditing(true)}>Edit Item</Button>
                                    ) : (
                                        <>
                                            <Button color="success" onClick={handleSave}>Save Changes</Button>
                                            <Button color="secondary" className="ms-3" onClick={() => setIsEditing(false)}>Cancel</Button>
                                        </>
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
