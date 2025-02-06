import React, { useState } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import TableThree from "../components/tables/TableThree";
import TablePending from "../components/tables/TablePending";
import TableAccepting from "../components/tables/TableAccepting";
import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';
import classnames from "classnames";

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("1"); // Track active tab

    return (
        <Helmet title={'Dashboard'}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container className='dashboard'>
                    {/* Navigation Tabs */}
                    <Nav tabs className="mb-3">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                All Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                Pending Orders
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                Accepted Orders
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="1">
                            <Row>
                                <TableThree />
                            </Row>
                        </TabPane>
                        <TabPane tabId="2">
                            <Row>
                                <TablePending />
                            </Row>
                        </TabPane>
                        <TabPane tabId="3">
                            <Row>
                                <TableAccepting />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default Dashboard;
