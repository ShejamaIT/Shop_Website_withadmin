import React, { useState } from "react";
import { Container, Row, Nav, NavItem, NavLink, TabContent, TabPane, Col } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';
import classnames from "classnames";

import TablePending from "../components/tables/TablePending";
import TableAccepting from "../components/tables/TableAccepting";
import TableCompleted from "../components/tables/TableCompleted";
import PlaceOrder from "./Placeorder";
import Tableforproduction from "../components/tables/Tableforproduction";
import TableIssued from "../components/tables/TableIssuedOrders";
import TableInproduction from "../components/tables/TableInProduction";
import TableAcceptingUnbooked from "../components/tables/TableAcceptingUnbooked";
import {useNavigate} from "react-router-dom";
import DeliveryNotes from "./DeliveryNotes";
import TableAllDeliveryNotes from "../components/tables/TableAllDeliveryNotes";
import AddDeliveryShedule from "./AddDeliveryShedule";
import TableReturned from "../components/tables/TableReturnedOrders";

const AllOrders = () => {
    const [activeTab, setActiveTab] = useState("0");
    const [nestedActiveTab, setNestedActiveTab] = useState("1");
    const [refreshKey, setRefreshKey] = useState(0); // Forcing re-render
    const navigate = useNavigate()

    // Function to refresh the tab content after updates
    const handleDataUpdate = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <Helmet title={'Dashboard'}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container className='dashboard'>
                    {/* Main Navigation Tabs */}
                    <Nav tabs className="mb-3">
                        {["Place Order", "Pending Orders", "Accepted Orders", "For Production", "In Production", "Completed Orders", "Delivery Notes" , "Issued Orders", "Returned Orders"].map((label, index) => (
                            <NavItem key={index}>
                                <NavLink
                                    className={classnames({ active: activeTab === index.toString() })}
                                    onClick={() => setActiveTab(index.toString())}
                                    style={{ cursor: "pointer" }}
                                >
                                    {label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Main Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="0" key={refreshKey}>
                            <Row>
                                <PlaceOrder onOrderPlaced={handleDataUpdate} />
                            </Row>
                        </TabPane>

                        <TabPane tabId="1" key={refreshKey}>
                            <Row>
                                <TablePending />
                            </Row>
                        </TabPane>

                        {/* Accepted Orders with Nested Tabs */}
                        <TabPane tabId="2" key={refreshKey}>
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

                            <TabContent activeTab={nestedActiveTab}>
                                <TabPane tabId="1" key={refreshKey}>
                                    <Row>
                                        <TableAccepting />
                                    </Row>
                                </TabPane>
                                <TabPane tabId="2" key={refreshKey}>
                                    <Row>
                                        <TableAcceptingUnbooked />
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </TabPane>

                        <TabPane tabId="3" key={refreshKey}>
                            <Row>
                                <Col>
                                    <Tableforproduction />
                                </Col>
                            </Row>
                        </TabPane>
                        <TabPane tabId="4" key={refreshKey}>
                            <Row>
                                <TableInproduction />
                            </Row>
                        </TabPane>
                        <TabPane tabId="5" key={refreshKey}>
                            <Row>
                                <TableCompleted />
                            </Row>
                        </TabPane>
                        <TabPane tabId="6" key={refreshKey}>
                            <Nav tabs className="mb-3">
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: nestedActiveTab === "1" })}
                                        onClick={() => setNestedActiveTab("1")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        Create Delivery Note
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: nestedActiveTab === "2" })}
                                        onClick={() => setNestedActiveTab("2")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        All delivery notes
                                    </NavLink>
                                </NavItem>
                                <NavItem>
                                    <NavLink
                                        className={classnames({ active: nestedActiveTab === "3" })}
                                        onClick={() => setNestedActiveTab("3")}
                                        style={{ cursor: "pointer" }}
                                    >
                                        Add Scheduled Dates
                                    </NavLink>
                                </NavItem>
                            </Nav>

                            <TabContent activeTab={nestedActiveTab}>
                                <TabPane tabId="1" key={refreshKey}>
                                    <Row>
                                        <DeliveryNotes />
                                    </Row>
                                </TabPane>
                                <TabPane tabId="2" key={refreshKey}>
                                    <Row>
                                        <TableAllDeliveryNotes />
                                    </Row>
                                </TabPane>
                                <TabPane tabId="3" key={refreshKey}>
                                    <Row>
                                        <AddDeliveryShedule />
                                    </Row>
                                </TabPane>
                            </TabContent>
                        </TabPane>
                        <TabPane tabId="7" key={refreshKey}>
                            <Row>
                                <TableIssued />
                            </Row>
                        </TabPane>
                        <TabPane tabId="8" key={refreshKey}>
                            <Row>
                                <TableReturned />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllOrders;
