import React, { useState, useEffect } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import TableAllItem from "../components/tables/TableAllItem";
import Tableforproduction from "../components/tables/Tableforproduction";
import TableInProduction from "../components/tables/TableInProduction";
import AddProduct from "./AddProducts";
import AddOtherDetails from "./AddOtherDetails";
import PurchaseDetails from "./purchaseitem";

const AllProducts = () => {
    const [activeTab, setActiveTab] = useState("Add Item"); // Manage active tab name
    const location = useLocation();
    const navigate = useNavigate();

    // List of tab names
    const tabNames = [
        "Add Item",
        "All Products",
        "For Production",
        "In Production",
        "Add Categories",
        "Item Purchase"
    ];

    // Read the active tab from the URL query parameter (using `tab`)
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        if (tab && tabNames.includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    // Update the URL when the active tab changes
    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        navigate(`?tab=${tabName}`); // Update the URL with the tab query param
    };

    return (
        <Helmet title={'All-Products'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* Tab Navigation */}
                    <Nav tabs>
                        {tabNames.map((label, index) => (
                            <NavItem key={index}>
                                <NavLink
                                    className={activeTab === label ? "active" : ""}
                                    onClick={() => handleTabChange(label)}
                                >
                                    {label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {/* Add Item Tab */}
                        <TabPane tabId="Add Item">
                            <Row>
                                <Col>
                                    <AddProduct />
                                </Col>
                            </Row>
                        </TabPane>

                        {/* All Products Tab */}
                        <TabPane tabId="All Products">
                            <Row>
                                <TableAllItem />
                            </Row>
                        </TabPane>

                        {/* For Production Tab */}
                        <TabPane tabId="For Production">
                            <Row>
                                <Col>
                                    <Tableforproduction />
                                </Col>
                            </Row>
                        </TabPane>

                        {/* In Production Tab */}
                        <TabPane tabId="In Production">
                            <Row>
                                <Col>
                                    <TableInProduction />
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Add Categories Tab */}
                        <TabPane tabId="Add Categories">
                            <Row>
                                <Col>
                                    <AddOtherDetails />
                                </Col>
                            </Row>
                        </TabPane>

                        {/* Purchase item Tab */}
                        <TabPane tabId="Item Purchase">
                            <Row>
                                <Col>
                                    <PurchaseDetails />
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllProducts;
