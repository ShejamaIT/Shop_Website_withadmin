import React, { useState, useEffect } from "react";
import { Container, Row, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import classnames from "classnames";
import { useLocation, useNavigate } from "react-router-dom";
import TablePending from "../components/tables/TablePending";
import TableAccepting from "../components/tables/TableAccepting";
import TableCompleted from "../components/tables/TableCompleted";
import Tableforproduction from "../components/tables/Tableforproduction";
import TableIssued from "../components/tables/TableIssuedOrders";
import TableAcceptingUnbooked from "../components/tables/TableAcceptingUnbooked";
import TableReturned from "../components/tables/TableReturnedOrders";
import TableCancled from "../components/tables/TableCancelledOrders";
import TableDeliverd from "../components/tables/TableDeliverdOrders";

const AllOrders = () => {
    const [activeTab, setActiveTab] = useState("Pending Orders");
    const [nestedActiveTab, setNestedActiveTab] = useState("1");
    const [refreshKey, setRefreshKey] = useState(0); // For forcing re-render

    const location = useLocation();
    const navigate = useNavigate();

    // List of tab names corresponding to the tabs
    const tabNames = [
        "Pending Orders",
        "Accepted Orders",
        "Production",
        "Completed Orders",
        "Delivered Orders",
        "Issued Orders",
        "Returned Orders",
        "Cancel Orders"
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

    // Function to refresh the tab content after updates
    const handleDataUpdate = () => {
        setRefreshKey((prev) => prev + 1);
    };

    return (
        <Helmet title={'All-orders'}>
            <section>
                <Container className='dashboard'>
                    {/* Main Navigation Tabs */}
                    <Nav tabs className="mb-3">
                        {tabNames.map((label, index) => (
                            <NavItem key={index}>
                                <NavLink
                                    className={classnames({ active: activeTab === label })}
                                    onClick={() => handleTabChange(label)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {label}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Main Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="Pending Orders" key={refreshKey}>
                            <Row>
                                <TablePending />
                            </Row>
                        </TabPane>

                        {/* Accepted Orders with Nested Tabs */}
                        <TabPane tabId="Accepted Orders" key={refreshKey}>
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

                        <TabPane tabId="Production" key={refreshKey}>
                            <Row>
                                <Tableforproduction />
                            </Row>
                        </TabPane>

                        <TabPane tabId="Completed Orders" key={refreshKey}>
                            <Row>
                                <TableCompleted />
                            </Row>
                        </TabPane>
                        <TabPane tabId="Delivered Orders" key={refreshKey}>
                            <Row>
                                <TableDeliverd />
                            </Row>
                        </TabPane>

                        <TabPane tabId="Issued Orders" key={refreshKey}>
                            <Row>
                                <TableIssued />
                            </Row>
                        </TabPane>

                        <TabPane tabId="Returned Orders" key={refreshKey}>
                            <Row>
                                <TableReturned />
                            </Row>
                        </TabPane>

                        <TabPane tabId="Cancel Orders" key={refreshKey}>
                            <Row>
                                <TableCancled />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllOrders;
