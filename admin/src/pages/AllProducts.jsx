import React, { useState } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import TableTwo from "../components/tables/TableTwo";
import Tableforproduction from "../components/tables/Tableforproduction";
import TableInProduction from "../components/tables/TableInProduction";
import AddProduct from "./AddProducts";
import AddOtherDetails from "./AddOtherDetails";

const AllProducts = () => {
    const [activeTab, setActiveTab] = useState("1"); // Manage active tab

    return (
        <Helmet title={'All-Products'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* Tab Navigation */}
                    <Nav tabs>
                        <NavItem>
                            <NavLink
                                className={activeTab === "1" ? "active" : ""}
                                onClick={() => setActiveTab("1")}
                            >
                                All Products
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "2" ? "active" : ""}
                                onClick={() => setActiveTab("2")}
                            >
                                For Production
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "3" ? "active" : ""}
                                onClick={() => setActiveTab("3")}
                            >
                                In Production
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "4" ? "active" : ""}
                                onClick={() => setActiveTab("4")}
                            >
                                Add Item
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "5" ? "active" : ""}
                                onClick={() => setActiveTab("5")}
                            >
                                Add Other Details
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {/* First Tab - Table */}
                        <TabPane tabId="1">
                            <Row>
                                <TableTwo />
                            </Row>
                        </TabPane>

                        {/* Second Tab - Placeholder (Add any content here) */}
                        <TabPane tabId="2">
                            <Row>
                                <Col>
                                    <Tableforproduction />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="3">
                            <Row>
                                <Col>
                                    <TableInProduction />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="4">
                            <Row>
                                <Col>
                                    <AddProduct />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="5">
                            <Row>
                                <Col>
                                    <AddOtherDetails />
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
