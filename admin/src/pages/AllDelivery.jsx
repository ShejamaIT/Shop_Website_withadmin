import React, { useState } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import TableAllItem from "../components/tables/TableAllItem";
import AddDeliveryShedule from "./AddDeliveryShedule";


const AllDelivery = () => {
    const [activeTab, setActiveTab] = useState("1"); // Manage active tab

    return (
        <Helmet title={'All-Delivery'}>
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
                                All Delivery
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "2" ? "active" : ""}
                                onClick={() => setActiveTab("2")}
                            >
                                Add Scheduled Dates
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {/* First Tab - Table */}
                        <TabPane tabId="1">
                            <Row>
                                <TableAllItem />
                            </Row>
                        </TabPane>
                        <TabPane tabId="2">
                            <Row>
                                <Col>
                                    <AddDeliveryShedule />
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllDelivery;
