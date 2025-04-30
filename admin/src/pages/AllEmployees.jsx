import React, { useState, useEffect } from "react";
import {Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button} from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import { useNavigate, useLocation } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import SaleteamDetail from "./SaleteamDetail";
import DriverDetail from "./DriverDetail";
import AdancePayment from "./AdancePayment";
import LoanPayment from "./LoanPayment";
import Salarysheet from "./Salarysheet";
import Leaveform from "./Leaveform";
import AddOrderTargets from "./AddorderTargets";

const AllEmployees = () => {
    const [mainTab, setMainTab] = useState("addEmployee"); // Tracks main tab selection
    const [activeSubTab, setActiveSubTab] = useState(""); // Tracks sub-tab for Sales Team
    const [salesteamMembers, setSalesteamMembers] = useState([]);
    const [drivers, setDrivers] = useState([]);
    const [paymentSubTab, setPaymentSubTab] = useState("advance");

    const location = useLocation();
    const navigate = useNavigate();

    // Update both main tab and sub-tab from URL query parameters
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        const subTab = searchParams.get("subTab");

        // Set the main tab based on the query parameter (or default to salesTeam)
        if (tab && ["salesTeam", "drivers", "addEmployee"].includes(tab)) {
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
    }, []);

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
        const newTab = mainTab === "salesTeam" ? "salesTeam" : "drivers"; // Keep the main tab the same
        navigate(`?tab=${newTab}&subTab=${subTabId}`); // Update the URL with the sub-tab query param
    };

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

    return (
        <Helmet title="All-Employee">
            <section>
                <Container className="all-products">
                    {/* === MAIN NAVIGATION TABS === */}
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                className={mainTab === "addEmployee" ? "active" : ""}
                                onClick={() => handleMainTabChange("addEmployee")}
                            >
                                Add Employee
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
                                className={mainTab === "payment" ? "active" : ""}
                                onClick={() => handleMainTabChange("payment")}
                            >
                                Payments
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={mainTab}>
                        {/* === ADD EMPLOYEE TAB === */}
                        <TabPane tabId="addEmployee">
                            <Row>
                                <Col>
                                    <AddEmployee onAddEmployee={handleAddEmployee} />
                                </Col>
                            </Row>
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
                                    <Leaveform />
                                </TabPane>
                                <TabPane tabId="target">
                                    <AddOrderTargets />
                                </TabPane>
                                <TabPane tabId="salary">
                                    <Salarysheet />
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
