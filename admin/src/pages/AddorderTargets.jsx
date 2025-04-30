import React, { useState, useEffect } from "react";
import { Container, Row, Col, Label, Input, Button, Table } from "reactstrap";
import '../style/delivery.css';
import { toast } from "react-toastify";

const AddOrderTargets = () => {
    const [orderTarget, setOrderTarget] = useState({ target: "", bonus: "" });
    const [dbRates, setDbRates] = useState([]);
    const [salesTeam, setSalesTeam] = useState([]);
    const [selectedMember, setSelectedMember] = useState(null);
    const [editFields, setEditFields] = useState({ totalOrder: "", totalIssued: "" });
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
    const updateOrderTarget = async () => {
        const { totalOrder, totalIssued } = editFields;

        if (!totalOrder || !totalIssued) {
            toast.error("Please fill in both values.");
            return;
        }

        if (!selectedMember) {
            toast.error("Please select a sales team member.");
            return;
        }
        console.log(editFields);

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/update-sales-target", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    stID: selectedMember.stID,
                    totalOrder,
                    totalIssued
                })
            });

            const data = await response.json();

            if (data.success) {
                toast.success("Sales target updated successfully!");
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
                // Optional: refresh the sales team data
                fetchSalesTeam();
                setEditFields({ totalOrder: "", totalIssued: "" });
                setSelectedMember(null);
            } else {
                toast.error("Failed to update target.");
            }
        } catch (err) {
            console.error("Error updating target:", err);
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
    const fetchSalesTeam = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/sales-team-targets");
            const data = await response.json();
            if (data.success) setSalesTeam(data.salesTeam || []);
        } catch (err) {
            console.error("Error fetching sales team:", err);
        }
    };

    useEffect(() => {
        fetchTargets();
        fetchSalesTeam();
    }, []);
    const handleSelectChange = (e) => {
        const stID = e.target.value;
        const member = salesTeam.find((m) => m.stID === stID);
        console.log(member);
        setSelectedMember(member || null);
        setEditFields({ totalOrder: "", totalIssued: "" });
    };

    return (
        <Container className="add-item-container">
            <Row className="justify-content-center">
                <Col lg="6" className="d-flex flex-column gap-4">
                    {/* Change Target values of sale team */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Change order Target</Label>
                        <Input type="select" onChange={handleSelectChange} className="mb-3">
                            <option value="">-- Select Member --</option>
                            {salesTeam.map((m) => (
                                <option key={m.stID} value={m.stID}>
                                    {m.E_Id} - {m.name}
                                </option>
                            ))}
                        </Input>

                        {selectedMember && (
                            <Table bordered>
                                <tbody>
                                <tr>
                                    <td colSpan="2">
                                        <Label className="fw-bold">Total Orders</Label>
                                        <div className="d-flex gap-2">
                                            <div className="form-control w-50 bg-light fw-bold">
                                                {selectedMember.orderTarget || 0}
                                            </div>
                                            <Input
                                                type="number"
                                                name="totalOrder"
                                                placeholder="Edit Total Orders"
                                                value={editFields.totalOrder}
                                                onChange={(e) =>
                                                    setEditFields({...editFields, totalOrder: e.target.value})
                                                }
                                                className="form-control w-50"
                                            />
                                        </div>
                                    </td>
                                </tr>
                                <tr>
                                    <td colSpan="2">
                                        <Label className="fw-bold">Total Issued</Label>
                                        <div className="d-flex gap-2">
                                            <div className="form-control w-50 bg-light fw-bold">
                                                {selectedMember.issuedTarget || 0}
                                            </div>
                                            <Input
                                                type="number"
                                                name="totalIssued"
                                                placeholder="Edit Total Issued"
                                                value={editFields.totalIssued}
                                                onChange={(e) =>
                                                    setEditFields({...editFields, totalIssued: e.target.value})
                                                }
                                                className="form-control w-50"
                                            />
                                        </div>
                                    </td>
                                </tr>
                                </tbody>
                            </Table>
                        )}
                        <Button color="primary" onClick={updateOrderTarget}>Update Sales Target</Button>
                    </div>
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
                <Col lg="6"/>
            </Row>
        </Container>
    );
};

export default AddOrderTargets;
