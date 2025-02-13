import React, { useState, useEffect } from "react";
import {Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button} from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import TableTwo from "../components/tables/TableTwo";
import SaleteamDetail from "./SaleteamDetail";
import {useNavigate} from "react-router-dom";

const AllSaleteam = () => {
    const [activeTab, setActiveTab] = useState(""); // Initially empty, will set dynamically
    const [salesteamMembers, setSalesteamMembers] = useState([]); // State to store sales team members
    const navigate = useNavigate(); // Initialize navigate

    // Fetch sales team members when the component mounts
    useEffect(() => {
        const fetchSalesTeamMembers = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/salesteam"); // Adjusted API endpoint
                const data = await response.json();

                if (data.data && data.data.length > 0) {
                    setSalesteamMembers(data.data); // Store the fetched data in state
                    setActiveTab(data.data[0].stID); // Set first member as default active tab
                }
            } catch (error) {
                console.error("Error fetching sales team members:", error);
            }
        };

        fetchSalesTeamMembers();
    }, []); // Run only once when component mounts

    function handleNavigate(stid) {
        navigate(`/saleteam-detail/${stid}`); // Navigate to OrderDetails page
    }

    return (
        <Helmet title={'All-Saleteam'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* Tab Navigation */}
                    <Nav tabs>
                        {salesteamMembers.map((member) => (
                            <NavItem key={member.stID}>
                                <NavLink
                                    className={activeTab === member.stID ? "active" : ""}
                                    onClick={() => setActiveTab(member.stID)}
                                >
                                    {member.employeeName} {/* Displaying employee's name */}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {salesteamMembers.map((member) => (
                            <TabPane tabId={member.stID} key={member.stID}>
                                <Row>
                                    <Col>
                                        <h4>Details for {member.employeeName}</h4>
                                        <p><strong>Employee ID:</strong> {member.E_Id}</p>
                                        <p><strong>Job Role:</strong> {member.job}</p>
                                        <p><strong>Contact:</strong> {member.contact}</p>
                                        <p><strong>Target:</strong> {member.target}</p>

                                        {/* Example Table Component (Replace with relevant content) */}
                                        <Button color="success" onClick={() => handleNavigate(member.stID)}>View detail</Button>
                                    </Col>
                                </Row>
                            </TabPane>
                        ))}
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllSaleteam;
