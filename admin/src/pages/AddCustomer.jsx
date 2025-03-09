import React, { useState } from "react";
import Swal from "sweetalert2";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/addProduct.css";
import {toast} from "react-toastify";

const AddCustomer = () => {
    const [formData, setFormData] = useState({
        firstName: "", lastName: "", email: "", id: "", address: "", contact: "", contact2: "",
    });
    const [errors, setErrors] = useState({});

    const validateInput = (name, value) => {
        let error = "";
        if (!value.trim()) {
            error = "This field is required.";
        } else {
            if (name === "email" && !/^[\w.-]+@[\w.-]+\.\w{2,}$/.test(value)) {
                error = "Invalid email format.";
            }
            if ((name === "contact" || name === "contact2") && value && !/^[0-9]+$/.test(value)) {
                error = "Phone number must contain only numbers.";
            }
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        validateInput(name, value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const hasErrors = Object.values(errors).some((error) => error !== "");
        if (hasErrors) {
            Swal.fire("Error!", "Please fix validation errors before submitting.", "error");
            return;
        }

        try {
            const fullName = `${formData.firstName} ${formData.lastName}`.trim();
            const customerData = {
                name: fullName,
                contact: formData.contact,
                contact2: formData.contact2 || "",
                address: formData.address,
                email: formData.email,
                id: formData.id,
            };

            const response = await fetch("http://localhost:5001/api/admin/main/customer", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(customerData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success(result.message);
                handleClear();
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error("Something went wrong. Please try again.")
            }
        } catch (error) {
            console.error("Error submitting customer data:", error);
            toast.error("Error submitting customer data. Please try again.");
        }
    };

    const handleClear = () => {
        setFormData({ firstName: "", lastName: "", address: "", contact: "", contact2: "", email: "", id: "" });
        setErrors({});
    };

    return (
        <Container className="add-item-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Add New Customer</h3>
                    <Form onSubmit={handleSubmit}>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="firstName">First Name</Label>
                                    <Input type="text" name="firstName" value={formData.firstName} onChange={handleChange} />
                                    {errors.firstName && <small className="text-danger">{errors.firstName}</small>}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label for="lastName">Last Name</Label>
                                    <Input type="text" name="lastName" value={formData.lastName} onChange={handleChange} />
                                    {errors.lastName && <small className="text-danger">{errors.lastName}</small>}
                                </FormGroup>
                            </Col>
                        </Row>
                        <FormGroup>
                            <Label for="email">Email</Label>
                            <Input type="email" name="email" value={formData.email} onChange={handleChange} />
                            {errors.email && <small className="text-danger">{errors.email}</small>}
                        </FormGroup>
                        <FormGroup>
                            <Label for="id">NIC</Label>
                            <Input type="text" name="id" value={formData.id} onChange={handleChange} />
                            {errors.id && <small className="text-danger">{errors.id}</small>}
                        </FormGroup>
                        <FormGroup>
                            <Label for="address">Address</Label>
                            <Input type="textarea" name="address" value={formData.address} onChange={handleChange} />
                            {errors.address && <small className="text-danger">{errors.address}</small>}
                        </FormGroup>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Phone Number</Label>
                                    <Input type="text" name="contact" value={formData.contact} onChange={handleChange} />
                                    {errors.contact && <small className="text-danger">{errors.contact}</small>}
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Optional Number</Label>
                                    <Input type="text" name="contact2" value={formData.contact2} onChange={handleChange} />
                                    {errors.contact2 && <small className="text-danger">{errors.contact2}</small>}
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md="6">
                                <Button type="submit" color="primary" block>
                                    Add Customer
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
export default AddCustomer;
