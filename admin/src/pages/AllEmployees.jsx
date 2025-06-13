import React, { useState, useEffect } from "react";
import {Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import { useNavigate, useLocation } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import UpdateEmployee from "./UpdateEmployee";
import SaleteamDetail from "./SaleteamDetail";
import DriverDetail from "./DriverDetail";
import AdancePayment from "./AdancePayment";
import LoanPayment from "./LoanPayment";
import Salarysheet from "./Salarysheet";
import Leaveform from "./Leaveform";
import AddOrderTargets from "./AddorderTargets";
import TableLeave from "../components/tables/TableLeave";
import AddNewUser from "./AddNewUser";
import UserManagement from "./UserManagement";

const AllEmployees = () => {
    const [mainTab, setMainTab] = useState("addEmployee"); // Tracks main tab selection
    const [activeSubTab, setActiveSubTab] = useState(""); // Tracks sub-tab for Sales Team
    const [salesteamMembers, setSalesteamMembers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [it, setIt] = useState([]);
    const [hr, setHr] = useState([]);
    const [admin, setAdmin] = useState([]);
    const [other, setOther] = useState([]);
    const [addEmployeeSubTab, setAddEmployeeSubTab] = useState("add");
    const [paymentSubTab, setPaymentSubTab] = useState("advance");
    const [userSubTab, setUserSubTab] = useState("AddNewUser");
    const location = useLocation();
    const navigate = useNavigate();
    // Update both main tab and sub-tab from URL query parameters
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        const subTab = searchParams.get("subTab");

        // Set the main tab based on the query parameter (or default to salesTeam)
        if (tab && ["salesTeam", "drivers", "addEmployee","other"].includes(tab)) {
            setMainTab(tab);
        }
        // Set the sub-tab based on the query parameter (or default to the first member's ID)
        if (subTab) {
            setActiveSubTab(subTab);
        } else if (salesteamMembers.length > 0) {
            setActiveSubTab(salesteamMembers[0].stID); // Default to first member
        } else if (drivers.length > 0) {
            setActiveSubTab(drivers[0].devID); // Default to first driver
        }
    }, [location, salesteamMembers, drivers]);

    useEffect(() => {
        fetchSalesTeamMembers();
        fetchDrivers();
        fetchOtherEmployees();
    }, []);

    const fetchOtherEmployees = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/grouped-employees");
            const data = await response.json();

            if (data.success && Array.isArray(data.employees)) {
                setOther(data.employees);  // All IT, HR, Admin employees in one array
            } else {
                setOther([]);  // Reset if failed
            }
        } catch (error) {
            console.error("Error fetching OtherEmployees:", error);
            setOther([]);
        }
    };

    const fetchSalesTeamMembers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/salesteam");
            const data = await response.json();
            if (data.data && data.data.length > 0) {
                setSalesteamMembers(data.data);
                if (!activeSubTab) {
                    setActiveSubTab(data.data[0].stID); // Set first member as default sub-tab
                }
            }
        } catch (error) {
            console.error("Error fetching sales team members:", error);
        }
    };
    const fetchDrivers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/drivers");
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                setDrivers(data.data);
                if (!activeSubTab) {
                    setActiveSubTab(data.data[0].devID); // Set first driver as default sub-tab
                }
            }
        } catch (error) {
            console.error("Error fetching drivers:", error);
        }
    };
    const handleMainTabChange = (tabName) => {
        setMainTab(tabName);
        setActiveSubTab(""); // Reset the sub-tab when changing the main tab
        navigate(`?tab=${tabName}`); // Update the URL with the main tab query param
    };

    const handleSubTabChange = (subTabId) => {
        setActiveSubTab(subTabId);
        navigate(`?tab=${mainTab}&subTab=${subTabId}`); // Use current mainTab dynamically
    };
    useEffect(() => {
        if (mainTab === "other" && other.length > 0 && !activeSubTab) {
            setActiveSubTab(other[0].E_Id);
            navigate(`?tab=other&subTab=${other[0].E_Id}`);
        }
    }, [mainTab, other, activeSubTab, navigate]);

    const handleAddEmployee = (newEmployee) => {
        if (newEmployee.job === "Sales") {
            const newSalesMember = {
                stID: `ST-${newEmployee.E_Id}`,
                E_Id: newEmployee.E_Id,
                employeeName: newEmployee.name,
                job: newEmployee.job,
                contact: newEmployee.contact,
                target: newEmployee.target || 0,
                currentRate: newEmployee.currentRate || 0,
            };

            setSalesteamMembers((prevMembers) => [...prevMembers, newSalesMember]);
            setMainTab("salesTeam"); // Switch to Sales Team tab if an employee is added
            setActiveSubTab(newSalesMember.stID); // Set the new employee as the active sub-tab
            navigate(`?tab=salesTeam&subTab=${newSalesMember.stID}`); // Update URL with the new sub-tab
        }
    };
    useEffect(() => {
        if (mainTab === "drivers" && drivers.length > 0 && !activeSubTab) {
            setActiveSubTab(drivers[0].devID);
            navigate(`?tab=drivers&subTab=${drivers[0].devID}`);
        }
    }, [mainTab, drivers, activeSubTab, navigate]);

    const handlePaymentSubTabChange = (subTabName) => {
        setPaymentSubTab(subTabName);
        navigate(`?tab=payment&paySubTab=${subTabName}`);
    };
    const handleUserSubTabChange = (subTabName) => {
        setUserSubTab(subTabName);
        navigate(`?tab=userAccounts&paySubTab=${subTabName}`);
    };

    return (
        <Helmet title="All-Employee">
            <section>
                <Container className="dashboard">
                    {/* === MAIN NAVIGATION TABS === */}
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                className={mainTab === "addEmployee" ? "active" : ""}
                                onClick={() => handleMainTabChange("addEmployee")}
                            >
                                Add & Update
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "salesTeam" ? "active" : ""}
                                onClick={() => handleMainTabChange("salesTeam")}
                            >
                                Sales Team
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "drivers" ? "active" : ""}
                                onClick={() => handleMainTabChange("drivers")}
                            >
                                Drivers
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "other" ? "active" : ""}
                                onClick={() => handleMainTabChange("other")}
                            >
                                Other
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "payment" ? "active" : ""}
                                onClick={() => handleMainTabChange("payment")}
                            >
                                Payments
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "userAccounts" ? "active" : ""}
                                onClick={() => handleMainTabChange("userAccounts")}
                            >
                                User Accounts
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={mainTab}>
                        {/* === ADD EMPLOYEE TAB === */}
                        {/* <TabPane tabId="addEmployee">
                            <Row>
                                <Col>
                                    <AddEmployee onAddEmployee={handleAddEmployee} />
                                </Col>
                            </Row>
                        </TabPane> */}

                        <TabPane tabId="addEmployee">
                            <Nav tabs className="mt-3">
                                <NavItem>
                                    <NavLink
                                        className={addEmployeeSubTab === "add" ? "active" : ""}
                                         onClick={() => setAddEmployeeSubTab("add")}
                                    >
                                        Add
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={addEmployeeSubTab === "update" ? "active" : ""}
                                         onClick={() => setAddEmployeeSubTab("update")}
                                    >
                                        Update
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            <TabContent activeTab={addEmployeeSubTab} className="mt-3">
                                <TabPane tabId="add">
                                    <Row>
                                        <Col>
                                            <AddEmployee onAddEmployee={handleAddEmployee} />
                                        </Col>
                                    </Row>
                                </TabPane>
                                <TabPane tabId="update">
                                    <Row>
                                        <Col>
                                            <UpdateEmployee/>
                                            {/* <UpdateEmployee onUpdate={handleUpdateEmployee} employees={employees} /> */}
                                        </Col>
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </TabPane>

                        {/* === SALES TEAM TAB === */}
                        <TabPane tabId="salesTeam">
                            {salesteamMembers.length > 0 ? (
                                <>
                                    <Nav tabs className="mt-3">
                                        {salesteamMembers.map((member) => (
                                            <NavItem key={member.stID}>
                                                <NavLink
                                                    className={activeSubTab === member.stID ? "active" : ""}
                                                    onClick={() => handleSubTabChange(member.stID)}
                                                >
                                                    {member.employeeName}
                                                </NavLink>
                                            </NavItem>
                                        ))}
                                    </Nav>

                                    <TabContent activeTab={activeSubTab} className="mt-3">
                                        {salesteamMembers.map((member) => (
                                            <TabPane tabId={member.stID} key={member.stID}>
                                                <SaleteamDetail Saleteam={member} />
                                            </TabPane>
                                        ))}
                                    </TabContent>
                                </>
                            ) : (
                                <p className="text-muted mt-3">No Sales Team members found.</p>
                            )}
                        </TabPane>
                        {/* === DRIVERS TAB === */}
                        <TabPane tabId="drivers">
                            {drivers.length > 0 ? (
                                <>
                                    <Nav tabs className="mt-3">
                                        {drivers.map((member) => (
                                            <NavItem key={member.devID}>
                                                <NavLink
                                                    className={activeSubTab === member.devID ? "active" : ""}
                                                    onClick={() => handleSubTabChange(member.devID)}
                                                >
                                                    {member.employeeName}
                                                </NavLink>
                                            </NavItem>
                                        ))}
                                    </Nav>

                                    <TabContent activeTab={activeSubTab} className="mt-3">
                                        {drivers.map((member) => (
                                            <TabPane tabId={member.devID} key={member.devID}>
                                                <DriverDetail driver={member} />
                                            </TabPane>
                                        ))}
                                    </TabContent>
                                </>
                            ) : (
                                <p className="text-muted mt-3">No Drivers found.</p>
                            )}
                        </TabPane>
                        <TabPane tabId="other">
                            {/* Job Role Tabs (IT, HR, Admin) */}
                            <Nav tabs className="mt-3">
                                {["It", "HR", "Admin"].map((jobKey) => {
                                    const employeesByJob = other.filter(emp => emp.job === jobKey);
                                    return employeesByJob.map((emp) => (
                                        <NavItem key={emp.E_Id}>
                                            <NavLink
                                                className={activeSubTab === emp.E_Id ? "active" : ""}
                                                onClick={() => handleSubTabChange(emp.E_Id)}
                                            >
                                                {emp.name}
                                            </NavLink>
                                        </NavItem>
                                    ));
                                })}
                            </Nav>

                            {/* Tab Content for Selected Employee */}
                            <TabContent activeTab={activeSubTab} className="mt-3">
                                {other.map((emp) => (
                                    <TabPane tabId={emp.E_Id} key={emp.E_Id}>
                                        <div>
                                            <h5>{emp.name}</h5>
                                            <p><strong>Job:</strong> {emp.job}</p>
                                            <p><strong>Contact:</strong> {emp.contact}</p>
                                            <p><strong>NIC:</strong> {emp.nic}</p>
                                            <p><strong>Address:</strong> {emp.address}</p>
                                            <p><strong>DOB:</strong> {emp.dob}</p>
                                            <p><strong>Basic Salary:</strong> {emp.basic}</p>
                                            <p><strong>Type:</strong> {emp.type}</p>
                                        </div>
                                    </TabPane>
                                ))}
                            </TabContent>
                        </TabPane>

                        <TabPane tabId="payment">
                            <Nav tabs className="mt-3">
                                <NavItem>
                                    <NavLink className={paymentSubTab === "advance" ? "active" : ""} onClick={() => handlePaymentSubTabChange("advance")}>
                                        Advance
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={paymentSubTab === "loan" ? "active" : ""} onClick={() => handlePaymentSubTabChange("loan")}>
                                        Loan
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={paymentSubTab === "leave" ? "active" : ""} onClick={() => handlePaymentSubTabChange("leave")}>
                                        Leaves
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={paymentSubTab === "target" ? "active" : ""} onClick={() => handlePaymentSubTabChange("target")}>
                                        Set Targets
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={paymentSubTab === "salary" ? "active" : ""} onClick={() => handlePaymentSubTabChange("salary")}>
                                        Monthly Salary
                                    </NavLink>
                                </NavItem>
                            </Nav>
                            <TabContent activeTab={paymentSubTab} className="mt-3">
                                <TabPane tabId="advance">
                                    <AdancePayment />
                                </TabPane>
                                <TabPane tabId="loan">
                                    <LoanPayment />
                                </TabPane>
                                <TabPane tabId="leave">
                                    <TableLeave />
                                </TabPane>
                                <TabPane tabId="target">
                                    <AddOrderTargets />
                                </TabPane>
                                <TabPane tabId="salary">
                                    <Salarysheet />
                                </TabPane>
                            </TabContent>
                        </TabPane>

                        <TabPane tabId="userAccounts">
                            <Nav tabs className="mt-3">
                                <NavItem>
                                    <NavLink className={userSubTab === "AddNewUser" ? "active" : ""} onClick={() => handleUserSubTabChange("AddNewUser")}>
                                        Add New user
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink className={userSubTab === "AllUsers" ? "active" : ""} onClick={() => handleUserSubTabChange("AllUsers")}>
                                        All Users
                                    </NavLink>
                                </NavItem>

                            </Nav>
                            <TabContent activeTab={userSubTab} className="mt-3">
                                <TabPane tabId="AddNewUser">
                                    <AddNewUser />
                                </TabPane>
                                <TabPane tabId="AllUsers">
                                    <UserManagement />
                                </TabPane>
                            </TabContent>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllEmployees;
