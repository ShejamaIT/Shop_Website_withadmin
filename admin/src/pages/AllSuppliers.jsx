import React, { useState, useEffect } from "react";
import {Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane, Button} from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import {useNavigate} from "react-router-dom";
import SupplierDetails from "./SupplierDetails";
import AddOtherDetails from "./AddOtherDetails";
import AddItem from "./AddProducts";

const AllSuppliers = () => {
    const [activeTab, setActiveTab] = useState(""); // Initially empty, will set dynamically
    const [suppliers, setSuppliers] = useState([]); // State to store sales team members
    const navigate = useNavigate(); // Initialize navigate

    // Fetch sales team members when the component mounts
    useEffect(() => {
        const fetchSuppliers = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/suppliers"); // Adjusted API endpoint
                const data = await response.json();
                console.log(data.suppliers);
                if (data.suppliers && data.suppliers.length > 0) {
                    setSuppliers(data.suppliers); // Store the fetched data in state
                    setActiveTab(data.suppliers[0].s_ID); // Set first member as default active tab
                }
            } catch (error) {
                console.error("Error fetching sales team members:", error);
            }
        };

        fetchSuppliers();
    }, []); // Run only once when component mounts

    return (
        <Helmet title={'All-Suppliers'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* Tab Navigation */}
                    <Nav tabs>
                        {suppliers.map((member) => (
                            <NavItem key={member.s_ID}>
                                <NavLink
                                    className={activeTab === member.s_ID ? "active" : ""}
                                    onClick={() => setActiveTab(member.s_ID)}
                                >
                                    {member.name} {/* Displaying employee's name */}
                                </NavLink>
                            </NavItem>
                        ))}
                        <NavItem>
                            <NavLink
                                className={activeTab === "5" ? "active" : ""}
                                onClick={() => setActiveTab("5")}
                            >
                                Add New Supplier
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {suppliers.map((member) => (
                            <TabPane tabId={member.s_ID} key={member.s_ID}>
                                {/* Use the SupplierDetails component */}
                                <SupplierDetails supplier={member} />
                            </TabPane>
                        ))}
                        <TabPane tabId="5">
                            <Row>
                                <Col>
                                    <AddItem />
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllSuppliers;
