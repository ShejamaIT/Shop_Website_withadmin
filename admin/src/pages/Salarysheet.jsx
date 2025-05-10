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
    const [monthlyDeliveryTotal , setMonthlyDeliveryTotal] = useState(0);
    const [monthlyHireTotal , setMonthlyHireTotal] = useState(0);
    const [monthlyTargetBouns , setMonthlyTargetBouns] = useState(0);
    const [dailyTargetBouns , setDailyTargetBouns] = useState(0);
    const [monthlyDeptBalance , setMonthlyDeptBalance] = useState(0);
    const [formData, setFormData] = useState({
        id: "", name: "", job: "",
        informedLeave:"", uninformedLeave:"",
        basic: "", loan: "",advance:"",
        attendance:"",leaveDeduction:"",
        saving:"",otherpay:"",total :"",
    });
    // Fetch Employees
    useEffect(() => {
        fetchEmployees();
    }, []);
    useEffect(() => {
        if (!formData.basic) return;

        const basic = parseFloat(formData.basic) || 0;
        const attendance = parseFloat(formData.attendance) || 0;
        const deduction = parseFloat(formData.leaveDeduction) || 0;
        const saving = parseFloat(formData.saving) || 0;
        const other = parseFloat(formData.otherpay) || 0;

        const totalAdvance = advancePayments.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
        const totalLoan = loanPayments ? parseFloat(loanPayments.installment || 0) : 0;

        let s_total = basic + attendance - totalAdvance - totalLoan - saving - other;

        // Include extra driver-related bonuses/adjustments
        if (formData.job === 'Driver') {
            s_total += monthlyTargetBouns + dailyTargetBouns - monthlyDeptBalance;
        }

        // Construct updated form data
        const updatedData = {
            ...formData,
            total: s_total.toFixed(2)
        };

        // Conditionally add loanDate if available
        if (loanPayments && loanPayments.date) {
            updatedData.loanDate = loanPayments.date;
        }

        // If job is Driver, include additional values
        if (formData.job === 'Driver') {
            updatedData.monthlyTargetBouns = monthlyTargetBouns;
            updatedData.dailyTargetBouns = dailyTargetBouns;
            updatedData.monthlyDeptBalance = monthlyDeptBalance;
            updatedData.loan = totalLoan.toFixed(2); // Optional
        }


        setFormData(updatedData);
    }, [formData.basic, formData.attendance, formData.leaveDeduction, formData.saving, formData.otherpay, advancePayments, loanPayments, monthlyTargetBouns, dailyTargetBouns, monthlyDeptBalance]);

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
    const handleEmployeeSelect = async (e) => {
        const selectedId = e.target.value;
        const selectedEmployee = employees.find(emp => emp.E_Id === selectedId);
        console.log(selectedEmployee);

        if (selectedEmployee) {
            const [advanceList, loanData] = await fetchSalaryPayments(selectedId); // Wait and get both
            const leaveData = await fetchLeaveCount(selectedId); // Get leave counts

            // Compute values
            const totalAdvance = advanceList.reduce((sum, a) => sum + parseFloat(a.amount || 0), 0);
            const totalLoan = loanData ? parseFloat(loanData.installment || 0) : 0;
            const attendanceBonus = leaveData.totalLeave > 4 ? 0 : 4000 - leaveData.attendanceDeduction;

            // Set form data now that everything is available
            setFormData({
                id: selectedEmployee.E_Id,
                name: selectedEmployee.name,
                job: selectedEmployee.job,
                basic: selectedEmployee.basic,
                informedLeave: leaveData.informedLeave,
                uninformedLeave: leaveData.uninformedLeave,
                attendance: attendanceBonus,
                leaveDeduction: leaveData.attendanceDeduction,
                advance: totalAdvance.toFixed(2),
                loan: totalLoan.toFixed(2),
                saving: "", otherpay: "", total: ""
            });

            if (selectedEmployee.job === 'Driver') {
                fetchDriverHireSummary(selectedId);
            }
        }
    };

    const fetchSalaryPayments = async (eid) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/advance&loan?eid=${eid}`);
            const data = await response.json();
            if (data.success) {
                const advances = data.advancePayments || [];
                const loan = data.lastMonthUnpaidInstallment || null;
                setAdvancePayments(advances);
                setLoanPayments(loan);
                return [advances, loan]; // return both
            } else {
                setAdvancePayments([]);
                setLoanPayments(null);
                return [[], null];
            }
        } catch (err) {
            console.error("Error fetching salary payments:", err);
            setAdvancePayments([]);
            setLoanPayments(null);
            return [[], null];
        }
    };

    const fetchLeaveCount = async (eid) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/leave-count?eid=${eid}`);
            const data = await response.json();
            return {
                informedLeave: data.success ? data.informedLeave || 0 : 0,
                uninformedLeave: data.success ? data.uninformedLeave || 0 : 0,
                totalLeave: data.success ? data.totalLeave || 0 : 0,
                attendanceDeduction: data.success ? data.attendanceDeduction || 0 : 0
            };
        } catch (err) {
            console.error("Error fetching leave counts:", err);
            return {
                informedLeave: 0,
                uninformedLeave: 0,
                totalLeave: 0,
                attendanceDeduction: 0
            };
        }
    };

    const fetchDriverHireSummary = async (eid) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/hire-summary?eid=${eid}`);
            const data = await response.json();
            console.log(data);

            setMonthlyDeliveryTotal(data.lastMonthDeliveryTotal || 0.0);
            setMonthlyHireTotal(data.lastMonthHireTotal || 0.0);
            setMonthlyTargetBouns(data.monthlyBonus?.bonus || 0.0);
            setMonthlyDeptBalance(data.balance|| 0.0);

            // Calculate total daily bonus
            const totalDailyBonus = (data.dailySummary || []).reduce((sum, day) => sum + (day.bonus || 0), 0);
            setDailyTargetBouns(totalDailyBonus);

        } catch (err) {
            console.error("Error fetching salary payments:", err);
        }
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);
    }

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
                                            <td>{formData.informedLeave}</td>
                                            <td><strong>Uninformed Leave</strong></td>
                                            <td>{formData.uninformedLeave}</td>
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
                                {formData.job === "Driver" && (
                                    <div className="p-3 border rounded shadow-sm bg-light mt-3">
                                        <h5 className="fw-bold mb-4">Hire Commission</h5>
                                        <Table bordered className="member-table">
                                            <tbody>
                                            <tr>
                                                <td><strong>Total Delivery Hire</strong></td>
                                                <td>Rs. {(monthlyDeliveryTotal).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Total Other Hire</strong></td>
                                                <td>Rs. {(monthlyHireTotal).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Monthly Target Bouns</strong></td>
                                                <td>Rs. {(monthlyTargetBouns).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Daily Target Bouns</strong></td>
                                                <td>Rs. {(dailyTargetBouns).toFixed(2)}</td>
                                            </tr>
                                            <tr>
                                                <td><strong>Monthly Dept Balance</strong></td>
                                                <td>Rs. {(monthlyDeptBalance).toFixed(2)}</td>
                                            </tr>
                                            </tbody>
                                        </Table>
                                    </div>
                                )}

                                <div className="p-3 border rounded shadow-sm bg-light mt-3">
                                <h5 className="fw-bold mb-4">Advance Payments</h5>
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
                                <div className="p-3 border rounded shadow-sm bg-light mt-3">
                                    <h5 className="fw-bold mb-4">Loan Payments</h5>

                                    {loanPayments ? (
                                        <div className="d-flex flex-column gap-3">
                                            <div
                                                className="border rounded p-3 shadow-sm d-flex justify-content-between align-items-center">
                                                <div>
                                                    <div>
                                                        <strong>Date:</strong> {new Date(loanPayments.date).toLocaleDateString()}
                                                    </div>
                                                    <div><strong>Payment:</strong> Rs. {loanPayments.installment}</div>
                                                    <div><strong>Skip Count:</strong> {loanPayments.skip}</div>
                                                </div>
                                                <Button color="success">Pass</Button>
                                            </div>

                                            {/* Total Section */}
                                            <div className="border-top pt-3 mt-2 d-flex justify-content-between">
                                                <strong>Total</strong>
                                                <strong>
                                                    Rs. {Number(loanPayments.installment).toFixed(2)}
                                                </strong>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-muted">No loan payments</div>
                                    )}
                                </div>

                                <div className="p-3 border rounded shadow-sm bg-light mt-3">
                                    <h5 className="fw-bold mb-4">Other Payments</h5>
                                    <Table bordered className="member-table">
                                        <tbody>
                                        <tr>
                                            <td><strong>Saving</strong></td>
                                            <td>
                                                <div className="input-cell">
                                                    Rs.
                                                    <Input
                                                        type="text"
                                                        name="saving"
                                                        value={formData.saving}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                saving: e.target.value
                                                            })
                                                        }
                                                        className="form-input"
                                                    />
                                                </div>
                                            </td>
                                            <td><strong>Other</strong></td>
                                            <td>
                                                <div className="input-cell">
                                                    Rs.
                                                    <Input
                                                        type="text"
                                                        name="otherpay"
                                                        value={formData.otherpay}
                                                        onChange={(e) =>
                                                            setFormData({
                                                                ...formData,
                                                                otherpay: e.target.value
                                                            })
                                                        }
                                                        className="form-input"
                                                    />
                                                </div>
                                            </td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </div>
                                <div className="p-3 border rounded shadow-sm bg-light mt-3">
                                    <h5 className="fw-bold mb-4">Total salary</h5>
                                    <Table bordered className="member-table">
                                        <tbody>
                                        <tr>
                                            <td><strong>Total salary in hand</strong></td>
                                            <td>{formData.total}</td>
                                        </tr>
                                        </tbody>
                                    </Table>
                                </div>
                                <Row>
                                    <Col md="6">
                                        <Button type="submit" color="primary" block>
                                            Pay
                                        </Button>
                                    </Col>
                                    <Col md="6">
                                        <Button type="button" color="danger" block>
                                            Clear
                                        </Button>
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

export default SalarySheet;
