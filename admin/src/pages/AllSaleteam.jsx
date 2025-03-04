import React, { useState, useEffect } from "react";
import {
    Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button
} from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import { useNavigate } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import SaleteamDetail from "./SaleteamDetail";

const AllSaleteam = () => {
    const [mainTab, setMainTab] = useState("salesTeam"); // Tracks main tab selection
    const [activeSubTab, setActiveSubTab] = useState(""); // Tracks sub-tab for Sales Team
    const [salesteamMembers, setSalesteamMembers] = useState([]);

    useEffect(() => {
        fetchSalesTeamMembers();
    }, []);

    const fetchSalesTeamMembers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/salesteam");
            const data = await response.json();

            if (data.data && data.data.length > 0) {
                setSalesteamMembers(data.data);
                setActiveSubTab(data.data[0].stID); // Set first member as default sub-tab
            }
        } catch (error) {
            console.error("Error fetching sales team members:", error);
        }
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
            setActiveSubTab(newSalesMember.stID);
        }
    };

    return (
        <Helmet title="All-Saleteam">
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* === MAIN NAVIGATION TABS === */}
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                className={mainTab === "salesTeam" ? "active" : ""}
                                onClick={() => setMainTab("salesTeam")}
                            >
                                Sales Team
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "drivers" ? "active" : ""}
                                onClick={() => setMainTab("drivers")}
                            >
                                Drivers
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={mainTab === "addEmployee" ? "active" : ""}
                                onClick={() => setMainTab("addEmployee")}
                            >
                                Add Employee
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={mainTab}>
                        {/* === SALES TEAM TAB === */}
                        <TabPane tabId="salesTeam">
                            {salesteamMembers.length > 0 ? (
                                <>
                                    <Nav tabs className="mt-3">
                                        {salesteamMembers.map((member) => (
                                            <NavItem key={member.stID}>
                                                <NavLink
                                                    className={activeSubTab === member.stID ? "active" : ""}
                                                    onClick={() => setActiveSubTab(member.stID)}
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
                            <p className="mt-3">Drivers management will be implemented here.</p>
                        </TabPane>

                        {/* === ADD EMPLOYEE TAB === */}
                        <TabPane tabId="addEmployee">
                            <Row>
                                <Col>
                                    <AddEmployee onAddEmployee={handleAddEmployee} />
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllSaleteam;
