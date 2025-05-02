import React, { useState, useEffect } from "react";
import { Container, Row, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import classnames from "classnames";
import Helmet from "../components/Helmet/Helmet";

import DeliveryNotes from "./DeliveryNotes";
import TableAllDeliveryNotes from "../components/tables/TableAllDeliveryNotes";
import AddDeliveryShedule from "./AddDeliveryShedule";

const AllDeliveryNotes = () => {
    const [activeTab, setActiveTab] = useState("Create Delivery Note"); // Default tab
    const location = useLocation();
    const navigate = useNavigate();

    const tabNames = [
        "Create Delivery Note",
        "All Delivery Notes",
        "Add Scheduled Dates",
    ];

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const tab = searchParams.get("tab");
        if (tab && tabNames.includes(tab)) {
            setActiveTab(tab);
        }
    }, [location]);

    const handleTabChange = (tabName) => {
        setActiveTab(tabName);
        navigate(`?tab=${tabName}`);
    };

    return (
        <Helmet title={'Delivery Notes'}>
            <section>
                <Container className="dashboard">
                    {/* Main Tabs */}
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

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="Create Delivery Note">
                            <Row>
                                <DeliveryNotes />
                            </Row>
                        </TabPane>

                        <TabPane tabId="All Delivery Notes">
                            <Row>
                                <TableAllDeliveryNotes />
                            </Row>
                        </TabPane>

                        <TabPane tabId="Add Scheduled Dates">
                            <Row>
                                <AddDeliveryShedule />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllDeliveryNotes;
