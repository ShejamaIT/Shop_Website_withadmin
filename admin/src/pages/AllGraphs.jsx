import React, { useState, useEffect } from "react";
import {Container, Row, Nav, NavItem, NavLink, TabContent, TabPane} from "reactstrap";
import { useLocation, useNavigate } from "react-router-dom";
import classnames from "classnames";
import Helmet from "../components/Helmet/Helmet";

import Graphs from "./Graphs"; // Placeholder for all three — can be split later

// import "../style/allProducts.css";

const AllGraphs = () => {
    const [activeTab, setActiveTab] = useState("income-performance");
    const location = useLocation();
    const navigate = useNavigate();

    // Slug-based tab names
    const tabNames = [
        "income-performance",
        "item-selling-performance",
        "sale-team-performance",
    ];

    const tabLabels = {
        "income-performance": "Income Performance",
        "item-selling-performance": "Item Selling Performance",
        "sale-team-performance": "Sale Team Performance",
    };

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
        <Helmet title={"Graphs"}>
            <section>
                <Container className="dashboard">
                    {/* Nav Tabs */}
                    <Nav tabs className="mb-3">
                        {tabNames.map((name, index) => (
                            <NavItem key={index}>
                                <NavLink
                                    className={classnames({ active: activeTab === name })}
                                    onClick={() => handleTabChange(name)}
                                    style={{ cursor: "pointer" }}
                                >
                                    {tabLabels[name]}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        <TabPane tabId="income-performance">
                            <Row>
                                <Graphs />
                            </Row>
                        </TabPane>

                        <TabPane tabId="item-selling-performance">
                            <Row>
                                <Graphs />
                            </Row>
                        </TabPane>

                        <TabPane tabId="sale-team-performance">
                            <Row>
                                <Graphs />
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllGraphs;
