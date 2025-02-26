import React, { useState, useEffect } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button } from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import { useNavigate } from "react-router-dom";
import AddEmployee from "./AddEmployee";
import SaleteamDetail from "./SaleteamDetail";

const AllSaleteam = () => {
    const [activeTab, setActiveTab] = useState("");
    const [salesteamMembers, setSalesteamMembers] = useState([]);
    const navigate = useNavigate();

    const fetchSalesTeamMembers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/salesteam");
            const data = await response.json();
            console.log(data.data);
            if (data.data && data.data.length > 0) {
                setSalesteamMembers(data.data);
                setActiveTab(data.data[0].stID);
            } else {
                setActiveTab("addEmployee");
            }
        } catch (error) {
            console.error("Error fetching sales team members:", error);
        }
    };

    useEffect(() => {
        fetchSalesTeamMembers();
    }, []);

    function handleNavigate(stid) {
        navigate(`/saleteam-detail/${stid}`);
    }

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
            setActiveTab(newSalesMember.stID);
        }
    };

    return (
        <Helmet title={'All-Saleteam'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    <Nav tabs>
                        {salesteamMembers.map((member) => (
                            <NavItem key={member.stID}>
                                <NavLink
                                    className={activeTab === member.stID ? "active" : ""}
                                    onClick={() => setActiveTab(member.stID)}
                                >
                                    {member.employeeName}
                                </NavLink>
                            </NavItem>
                        ))}

                        <NavItem>
                            <NavLink
                                className={activeTab === "addEmployee" ? "active" : ""}
                                onClick={() => setActiveTab("addEmployee")}
                            >
                                Add Employee
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        {salesteamMembers.map((member) => (
                            <TabPane tabId={member.stID} key={member.stID}>
                                <SaleteamDetail Saleteam={member} />
                            </TabPane>
                        ))}

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
