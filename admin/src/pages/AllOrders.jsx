import React, { useState } from "react";
import {Container, Row, Nav, NavItem, NavLink, TabContent, TabPane, Col} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import TablePending from "../components/tables/TablePending";
import TableAccepting from "../components/tables/TableAccepting";
import TableInproduction from "../components/tables/TableInProduction";

import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';
import classnames from "classnames";
import TableAcceptingUnbooked from "../components/tables/TableAcceptingUnbooked";
import TableCompleted from "../components/tables/TableCompleted";
import PlaceOrder from "./Placeorder";
import Tableforproduction from "../components/tables/Tableforproduction";
import DeliveryNotes from "./DeliveryNotes";

const AllOrders = () => {
    const [activeTab, setActiveTab] = useState("0"); // Main tab tracking
    const [nestedActiveTab, setNestedActiveTab] = useState("0");

    return (
        <Helmet title={'Dashboard'}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container className='dashboard'>
                    {/* Main Navigation Tabs */}
                    <Nav tabs className="mb-3">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "0" })}
                                onClick={() => setActiveTab("0")}
                                style={{ cursor: "pointer" }}
                            >
                                Place Order
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                Pending Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                Accepted Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={activeTab === "3" ? "active" : ""}
                                onClick={() => setActiveTab("3")}
                            >
                                For Production
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "4" })}
                                onClick={() => setActiveTab("4")}
                                style={{ cursor: "pointer" }}
                            >
                                In Production
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "5" })}
                                onClick={() => setActiveTab("5")}
                                style={{ cursor: "pointer" }}
                            >
                                Completed Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "6" })}
                                onClick={() => setActiveTab("6")}
                                style={{ cursor: "pointer" }}
                            >
                                Issued Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "7" })}
                                onClick={() => setActiveTab("7")}
                                style={{ cursor: "pointer" }}
                            >
                                Print GatePass
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Main Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="0">
                            <Row>
                                <PlaceOrder />
                            </Row>
                        </TabPane>

                        <TabPane tabId="1">
                            <Row>
                                <TablePending />
                            </Row>
                        </TabPane>

                        {/* Accepted Orders with Nested Tabs */}
                        <TabPane tabId="2">
                            {/* Nested Navigation Tabs */}
                            <Nav tabs className="mb-3">
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: nestedActiveTab === "1" })}
                                        onClick={() => setNestedActiveTab("1")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        All Booked Orders
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: nestedActiveTab === "2" })}
                                        onClick={() => setNestedActiveTab("2")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        Unbooked Orders
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            {/* Nested Tab Content */}
                            <TabContent activeTab={nestedActiveTab}>
                                <TabPane tabId="1">
                                    <Row>
                                        <TableAccepting />
                                    </Row>
                                </TabPane>
                                <TabPane tabId="2">
                                    <Row>
                                        <TableAcceptingUnbooked />
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </TabPane>

                        <TabPane tabId="3">
                            <Row>
                                <Col>
                                    <Tableforproduction />
                                </Col>
                            </Row>
                        </TabPane>

                        <TabPane tabId="4">
                            <Row>
                                <TableInproduction />
                            </Row>
                        </TabPane>

                        <TabPane tabId="5">
                            <Row>
                                <TableCompleted />
                            </Row>
                        </TabPane>
                        <TabPane tabId="6">
                            <Row>
                                <TableCompleted />
                            </Row>
                        </TabPane>
                        <TabPane tabId="7">
                            <Row>
                                <DeliveryNotes />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllOrders;
