import React, { useState, useEffect } from "react";
import {Container, Row, Col, Table, Form, Label, Input, FormGroup, Button} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";
import {toast} from "react-toastify";

const Leaveform = () => {
    const [employees, setEmployees] = useState([]);
    const [formData, setFormData] = useState({
        id: "", name: "", date:"",type:"",reason:"",
    });
    // Fetch Employees
    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/employees");
            const data = await response.json();
            if (data.success && Array.isArray(data.employees)) {
                setEmployees(data.employees);
            } else {
                setEmployees([]);
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
            setEmployees([]); // Default to empty array on error
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const { id, date, type, reason } = formData;

        if (!id || !date || !type || !reason) {
            toast.error("Please fill out all required details.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/add-leave", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ id, date, type, reason }),
            });

            const result = await response.json();

            if (result.success) {
                toast.success("Leave successfully recorded.");
                handleClear(); // Optional: clear the form after success
            } else {
                toast.error(result.message || "Failed to add leave.");
            }
        } catch (error) {
            console.error("Error submitting leave:", error);
            toast.error("Server error. Please try again later.");
        }
    };

    const handleClear = () => {
        setFormData({
            id: "", name: "", date:"",type:"",reason:"",
        });
    };
    const handleEmployeeSelect = (e) => {
        const selectedId = e.target.value;
        const selectedEmployee = employees.find(emp => emp.E_Id === selectedId);
        if (selectedEmployee) {
            setFormData({
                id: selectedEmployee.E_Id, name: selectedEmployee.name,date:"",type:"",reason:"",
            });
        } else {
            setFormData({
                id: "", name: "", date:"",type:"",reason:"",
            });
        }
    };

    return (
        <Helmet title={`Leave Form`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h3 className="text-center">Leave Form</h3>
                            <Form onSubmit={handleSubmit}>
                                <FormGroup>
                                    <Label for="id">Select Employee</Label>
                                    <Input type="select" name="id" id="id" value={formData.id}
                                           onChange={handleEmployeeSelect}>
                                        <option value="">-- Select Employee --</option>
                                        {employees.length > 0 ? (
                                            employees.map(emp => (
                                                <option key={emp.E_Id} value={emp.E_Id}>
                                                    {emp.E_Id} - {emp.name}
                                                </option>
                                            ))
                                        ) : (
                                            <option disabled>No employees available</option>
                                        )}
                                    </Input>
                                </FormGroup>
                                <FormGroup>
                                    <Label for="date">Leave Date</Label>
                                    <Input type='date' name='date' id='date' value={formData.date}
                                           onChange={(e) => setFormData({ ...formData, date: e.target.value })} />
                                </FormGroup>
                                <FormGroup>
                                    <Label for="type">Leave type</Label>
                                    <Input
                                        type="select"
                                        name="type"
                                        id="type"
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    >
                                        <option value="">-- Select Type --</option>
                                        <option value="Informed">Informed Leave</option>
                                        <option value="Uninformed">Uninformed Leave</option>
                                    </Input>
                                </FormGroup>

                                <FormGroup>
                                    <Label for="reason">Reason</Label>
                                    <Input type='text' name='reason' id='reason' value={formData.reason}
                                           onChange={(e) => setFormData({ ...formData, reason: e.target.value })}/>
                                </FormGroup>
                                <Row>
                                    <Col md="6">
                                        <Button type="submit" color="primary" block>Add Leave</Button>
                                    </Col>
                                    <Col md="6">
                                        <Button type="button" color="danger" block onClick={handleClear}>Clear</Button>
                                    </Col>
                                </Row>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Leaveform;
