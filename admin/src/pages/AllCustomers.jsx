import React, { useState } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import AddCustomer from "./AddCustomer";
import TableAllCustomer from "../components/tables/TableAllCustomer";
import TableCustomer from "../components/tables/TableCustomer";

const AllCustomer = () => {
    const [activeTab, setActiveTab] = useState("1"); // Manage active tab

    return (
        <Helmet title={'All-Customers'}>
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
                                Add Customer
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "2" ? "active" : ""}
                                onClick={() => setActiveTab("2")}
                            >
                                All Customers
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "3" ? "active" : ""}
                                onClick={() => setActiveTab("3")}
                            >
                                Credit Customer
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "4" ? "active" : ""}
                                onClick={() => setActiveTab("4")}
                            >
                                Cash Customer
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "5" ? "active" : ""}
                                onClick={() => setActiveTab("5")}
                            >
                                Loyal Customer
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "6" ? "active" : ""}
                                onClick={() => setActiveTab("6")}
                            >
                                Blacklisted Customer
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {/* First Tab - Table */}
                        <TabPane tabId="1">
                            <Row>
                                <AddCustomer/>
                            </Row>
                        </TabPane>
                        <TabPane tabId="2">
                            <Row>
                                <Col>
                                    <TableAllCustomer/>
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="3">
                            <Row>
                                <Col>
                                    <TableCustomer filter="Credit" title="Credit Customers" />
                                </Col>
                            </Row>
                        </TabPane>

                        <TabPane tabId="4">
                            <Row>
                                <Col>
                                    <TableCustomer filter="Cash" title="Cash Customers" />
                                </Col>
                            </Row>
                        </TabPane>

                        <TabPane tabId="5">
                            <Row>
                                <Col>
                                    <TableCustomer filter="Loyal" title="Loyal Customers" />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="6">
                            <Row>
                                <Col>

                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllCustomer;
