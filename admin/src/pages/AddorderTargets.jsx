import React, { useState, useEffect } from "react";
import { Container, Row, Col, Label, Input, Button, Table } from "reactstrap";
import '../style/delivery.css';
import { toast } from "react-toastify";

const AddOrderTargets = () => {
    const [orderTarget, setOrderTarget] = useState({
        target: "",
        bonus: ""
    });

    const [dbRates, setDbRates] = useState([]);

    const handleRateChange = (e) => {
        const { name, value } = e.target;
        setOrderTarget((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmitOrderTarget = async () => {
        const { target, bonus } = orderTarget;

        if (!target || !bonus) {
            toast.error("Please fill in both target and bonus.");
            return;
        }

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/order-targets", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ target, bonus })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Target added successfully!");
                setOrderTarget({ target: "", bonus: "" });
                fetchTargets(); // Refresh list
            } else {
                toast.error("Failed to add target.");
            }
        } catch (err) {
            console.error("Error adding target:", err);
            toast.error("Server error.");
        }
    };

    const fetchTargets = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/order-targets");
            const data = await response.json();

            if (data.success) {
                setDbRates(data.targets || []);
            }
        } catch (err) {
            console.error("Error fetching targets:", err);
        }
    };

    useEffect(() => {
        fetchTargets();
    }, []);

    return (
        <Container className="add-item-container">
            <Row className="justify-content-center">
                <Col lg="6" className="d-flex flex-column gap-4">
                    {/* Add Target Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Order Complete Target</Label>
                        <Input
                            type="text"
                            placeholder="Enter Target value"
                            className="mb-2"
                            name="target"
                            value={orderTarget.target}
                            onChange={handleRateChange}
                        />
                        <Input
                            type="text"
                            placeholder="Enter Bonus value"
                            className="mb-2"
                            name="bonus"
                            value={orderTarget.bonus}
                            onChange={handleRateChange}
                        />
                        <Button color="primary" onClick={handleSubmitOrderTarget}>Save Target</Button>
                    </div>

                    {/* Target List Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Order Targets</Label>
                        <Table bordered size="sm" className="mt-2">
                            <thead className="custom-table-header">
                            <tr>
                                <th>Target</th>
                                <th>Bonus</th>
                            </tr>
                            </thead>
                            <tbody>
                            {dbRates.length === 0 ? (
                                <tr>
                                    <td colSpan="2" className="text-center">No Data</td>
                                </tr>
                            ) : (
                                dbRates.map((rate, index) => (
                                    <tr key={index}>
                                        <td>{rate.target}</td>
                                        <td>{rate.bonus}</td>
                                    </tr>
                                ))
                            )}
                            </tbody>
                        </Table>
                    </div>
                </Col>
                <Col lg="6" />
            </Row>
        </Container>
    );
};

export default AddOrderTargets;
