import React, { useState } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';
import classnames from "classnames";
import AddDeliveryShedule from "./AddDeliveryShedule";
import PlaceOrder from "./Placeorder";
import AddProduct from "./AddProducts";

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState("1"); // Track active tab

    const [refreshKey, setRefreshKey] = useState(0); // Forcing re-render

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
                    {/* Navigation Tabs */}
                    <Nav tabs className="mb-3">
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "1" })}
                                onClick={() => setActiveTab("1")}
                                style={{ cursor: "pointer" }}
                            >
                                Place Order
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "2" })}
                                onClick={() => setActiveTab("2")}
                                style={{ cursor: "pointer" }}
                            >
                                Add Item
                            </NavLink>
                        </NavItem>
                        <NavItem>
                            <NavLink
                                className={classnames({ active: activeTab === "3" })}
                                onClick={() => setActiveTab("3")}
                                style={{ cursor: "pointer" }}
                            >
                                Add Scheduled Dates
                            </NavLink>
                        </NavItem>
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="0" key={refreshKey}>
                            <Row>
                                {/*<PlaceOrder onOrderPlaced={handleDataUpdate} />*/}
                            </Row>
                        </TabPane>
                        <TabPane tabId="2">
                            <Row>
                                {/*<AddProduct />*/}
                            </Row>
                        </TabPane>
                        <TabPane tabId="3">
                            <Row>
                                {/*<AddDeliveryShedule />*/}
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default Dashboard;
