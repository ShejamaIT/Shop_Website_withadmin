import React, { useState, useEffect } from "react";
import { Container, Row, Col, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import { useNavigate } from "react-router-dom";
import SupplierDetails from "./SupplierDetails";
import { toast } from "react-toastify";
import AddSupplier from "./AddSupplier";

const AllSuppliers = () => {
    const [activeTab, setActiveTab] = useState("");
    const [suppliers, setSuppliers] = useState([]);
    const navigate = useNavigate();

    // Function to fetch suppliers
    const fetchSuppliers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/suppliers");
            const data = await response.json();
            if (data.suppliers && data.suppliers.length > 0) {
                setSuppliers(data.suppliers);
                setActiveTab(data.suppliers[0].s_ID); // Set the first supplier as the default active tab
            } else {
                setActiveTab("addSupplier"); // Default to Add Supplier if no suppliers are present
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Error fetching suppliers.");
        }
    };

    // Fetch suppliers when the component mounts or after adding a supplier
    useEffect(() => {
        fetchSuppliers();
    }, []); // Run only once when component mounts

    // Function to handle adding a new supplier
    const handleAddSupplier = (newSupplier) => {
        setSuppliers((prevSuppliers) => [...prevSuppliers, newSupplier]); // Add new supplier to the list
        setActiveTab(newSupplier.s_ID); // Set the new supplier as the active tab
    };

    return (
        <Helmet title={'All-Suppliers'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    {/* Tab Navigation */}
                    <Nav tabs>
                        {/* Add Supplier Tab */}
                        <NavItem>
                            <NavLink
                                className={activeTab === "addSupplier" ? "active" : ""}
                                onClick={() => setActiveTab("addSupplier")}
                            >
                                Add New Supplier
                            </NavLink>
                        </NavItem>
                        {suppliers.map((supplier) => (
                            <NavItem key={supplier.s_ID}>
                                <NavLink
                                    className={activeTab === supplier.s_ID ? "active" : ""}
                                    onClick={() => setActiveTab(supplier.s_ID)}
                                >
                                    {supplier.name} {/* Displaying supplier's name */}
                                </NavLink>
                            </NavItem>
                        ))}
                    </Nav>

                    {/* Tab Content */}
                    <TabContent activeTab={activeTab}>
                        {/* Add Supplier Tab Content */}
                        <TabPane tabId="addSupplier">
                            <Row>
                                <Col>
                                    <AddSupplier onAddSupplier={handleAddSupplier} />
                                </Col>
                            </Row>
                        </TabPane>
                        {suppliers.map((supplier) => (
                            <TabPane tabId={supplier.s_ID} key={supplier.s_ID}>
                                <SupplierDetails supplier={supplier} />
                            </TabPane>
                        ))}
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllSuppliers;
