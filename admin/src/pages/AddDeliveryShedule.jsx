import React, { useState } from "react";
import { Container, Row, Col, Label, Input, Button, Table } from "reactstrap";

const AddDeliverySchedule = () => {
    const [deliveryRates, setDeliveryRates] = useState({ District: "", rate: "" });
    const [scheduledDates, setScheduledDates] = useState({ District: "", dates: [] });
    const [dateInput, setDateInput] = useState(""); // Temporary input for a single date

    // Handle Input Changes for delivery rates
    const handleRateChange = (e) => {
        const { name, value } = e.target;
        setDeliveryRates((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Input Changes for district name
    const handleDistrictChange = (e) => {
        const { name, value } = e.target;
        setScheduledDates((prev) => ({ ...prev, [name]: value }));
    };

    // Handle Date Selection and Add to List
    const handleAddDate = () => {
        if (dateInput && !scheduledDates.dates.includes(dateInput)) {
            setScheduledDates((prev) => ({
                ...prev,
                dates: [...prev.dates, dateInput]
            }));
            setDateInput(""); // Reset input field
        }
    };

    // Remove Selected Date from List
    const handleRemoveDate = (dateToRemove) => {
        setScheduledDates((prev) => ({
            ...prev,
            dates: prev.dates.filter(date => date !== dateToRemove)
        }));
    };

    // Handle Form Submission for Delivery Rates
    const handleSubmitRate = async () => {
        console.log("Delivery Rate Submitted:", deliveryRates);
    };

    // Handle Form Submission for Scheduled Dates
    const handleSubmitDates = async () => {
        console.log("Scheduled Dates Submitted:", scheduledDates);
    };

    return (
        <Container className="add-item-container">
            <Row className="justify-content-center">
                <Col lg="6" className="d-flex flex-column gap-4">
                    {/* Add Delivery Rates Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Delivery Rates</Label>
                        <Input type="text" placeholder="Enter district name" className="mb-2" name="District" value={deliveryRates.District} onChange={handleRateChange} />
                        <Input type="number" placeholder="Enter district rate" className="mb-2" name="rate" value={deliveryRates.rate} onChange={handleRateChange} />
                        <Button color="primary" onClick={handleSubmitRate}>Add Rate</Button>
                    </div>

                    {/* Add Delivery Scheduled Dates Section */}
                    <div className="p-3 border rounded shadow-sm">
                        <Label className="fw-bold">Add Delivery Scheduled Dates</Label>
                        <Input type="text" placeholder="Enter district name" className="mb-2" name="District" value={scheduledDates.District} onChange={handleDistrictChange} />
                        <Row className="align-items-center">
                            <Col xs="8">
                                <Input type="date" className="mb-2" value={dateInput} onChange={(e) => setDateInput(e.target.value)} />
                            </Col>
                            <Col xs="4">
                                <Button color="info" onClick={handleAddDate}>Add Date</Button>
                            </Col>
                        </Row>

                        {/* Display Selected Dates in a Table */}
                        {scheduledDates.dates.length > 0 && (
                            <Table bordered size="sm" className="mt-3">
                                <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Selected Date</th>
                                    <th>Action</th>
                                </tr>
                                </thead>
                                <tbody>
                                {scheduledDates.dates.map((date, index) => (
                                    <tr key={index}>
                                        <td>{index + 1}</td>
                                        <td>{date}</td>
                                        <td>
                                            <Button color="danger" size="sm" onClick={() => handleRemoveDate(date)}>Remove</Button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                        )}

                        <Button color="success" className="mt-2" onClick={handleSubmitDates}>Submit Dates</Button>
                    </div>
                </Col>
            </Row>
        </Container>
    );
};

export default AddDeliverySchedule;
