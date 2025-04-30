import React, { useState, useEffect } from "react";
import {Container, Row, Col, Table, Form, Label, Input, FormGroup, Button} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const SalarySheet = () => {
    const [employees, setEmployees] = useState([]);
    const [advancePayments, setAdvancePayments] = useState([]);
    const [loanPayments, setLoanPayments] = useState([]);
    const [informedLeaves,setInformedLeaves] = useState(0);
    const [uninformedLeaves ,setUninformedLeaves]= useState(0);
    const [attdanceBouns , setAttdanceBouns] = useState(0);
    const [deduction , setDeduction] = useState(0);
    const [formData, setFormData] = useState({
        id: "", name: "", job: "",
        informedLeave:"", uninformedLeave:"",
        basic: "", loan: "",
        attendance:"",leaveDeduction:"",
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
    const fetchSalaryPayments = async (eid) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/advance&loan?eid=${eid}`);
            const data = await response.json();

            if (data.success) {
                setAdvancePayments(data.advancePayments || []);
                setLoanPayments(data.loanPayments || []);
            } else {
                setAdvancePayments([]);
                setLoanPayments([]);
            }
        } catch (err) {
            console.error("Error fetching salary payments:", err);
            setAdvancePayments([]);
            setLoanPayments([]);
        }
    };
    const fetchLeaveCount = async (eid, selectedEmployee) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/leave-count?eid=${eid}`);
            const data = await response.json();

            const informed = data.success ? data.informedLeave || 0 : 0;
            const uninformed = data.success ? data.uninformedLeave || 0 : 0;
            const attendanceBonus = data.success ? data.attendanceBonus || 0 : 0;
            const attendanceDeduction = data.success ? data.attendanceDeduction || 0 : 0;

            setInformedLeaves(informed);
            setUninformedLeaves(uninformed);
            setAttdanceBouns(attendanceBonus);
            setDeduction(attendanceDeduction);
            if (selectedEmployee) {
                setFormData({
                    id: selectedEmployee.E_Id,
                    name: selectedEmployee.name,
                    job: selectedEmployee.job,
                    basic: selectedEmployee.basic,
                    informedLeave: informed,
                    uninformedLeave: uninformed,
                    attendance: attendanceBonus,
                    leaveDeduction: attendanceDeduction,
                });
            }
        } catch (err) {
            console.error("Error fetching leave counts:", err);
            // Optional fallback to clear formData on error
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
    }
    const handleEmployeeSelect = (e) => {
        const selectedId = e.target.value;
        const selectedEmployee = employees.find(emp => emp.E_Id === selectedId);

        fetchSalaryPayments(selectedId); // Keep this as-is
        fetchLeaveCount(selectedId, selectedEmployee); // Now passes employee to update formData inside
    };


    return (
        <Helmet title={`Salary Sheet`}>
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h3 className="text-center">Monthly Salary</h3>
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
                                <div className="salesteam-details">
                                    <Table bordered className="member-table">
                                        <tbody>
                                        <tr>
                                            <td><strong>Employee Name</strong></td>
                                            <td colSpan={3}>{formData.name}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Basic Salary</strong></td>
                                            <td colSpan={3}>Rs. {formData.basic}</td>
                                        </tr>
                                        <tr>
                                            <td><strong>Informed Leave</strong></td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="informedLeave"
                                                    value={formData.informedLeave}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        informedLeave: e.target.value
                                                    })}
                                                    className="form-control"
                                                />
                                            </td>
                                            <td><strong>Uninformed Leave</strong></td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="uninformedLeave"
                                                    value={formData.uninformedLeave}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        uninformedLeave: e.target.value
                                                    })}
                                                    className="form-control"
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td><strong>Attendance bonus</strong></td>
                                            <td colSpan={1}>Rs. {formData.attendance}</td>
                                            <td><strong>Leave Deduction</strong></td>
                                            <td colSpan={1}>Rs. {formData.leaveDeduction}</td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="salesteam-details">
                                    <Label>Advance Payments</Label>
                                    <Table bordered>
                                        <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Payment</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {advancePayments.length > 0 ? (
                                            <>
                                                {advancePayments.map((payment, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(payment.dateTime).toLocaleDateString()}</td>
                                                        <td>Rs. {payment.amount}</td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td><strong>Total</strong></td>
                                                    <td>
                                                        <strong>
                                                            Rs.{" "}
                                                            {advancePayments.reduce((total, p) => total + Number(p.amount), 0).toFixed(2)}
                                                        </strong>
                                                    </td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={2}>No advance</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="salesteam-details">
                                    <Label>Loan Payments</Label>
                                    <Table bordered className="member-table">
                                        <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Payment</th>
                                            <th>Pass</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loanPayments.length > 0 ? (
                                            <>
                                                {loanPayments.map((payment, index) => (
                                                    <tr key={index}>
                                                        <td>{new Date(payment.dateTime).toLocaleDateString()}</td>
                                                        <td>Rs. {payment.amount}</td>
                                                        <td><Button>Pass</Button></td>
                                                    </tr>
                                                ))}
                                                <tr>
                                                    <td><strong>Total</strong></td>
                                                    <td>
                                                        <strong>
                                                            Rs.{" "}
                                                            {loanPayments.reduce((total, p) => total + Number(p.amount), 0).toFixed(2)}
                                                        </strong>
                                                    </td>
                                                    <td></td>
                                                </tr>
                                            </>
                                        ) : (
                                            <tr>
                                                <td colSpan={3}>No loan payments</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="salesteam-details">
                                    <Label>Other Payments</Label>
                                    <Table bordered className="member-table">
                                        <tbody>
                                        <tr>
                                            <td><strong>Saving</strong></td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="saving"
                                                    value={formData.saving}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            saving: e.target.value
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </td>
                                            <td><strong>Other</strong></td>
                                            <td>
                                                <input
                                                    type="text"
                                                    name="otherpay"
                                                    value={formData.otherpay}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            otherpay: e.target.value
                                                        })
                                                    }
                                                    className="form-control"
                                                />
                                            </td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </div>


                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default SalarySheet;
