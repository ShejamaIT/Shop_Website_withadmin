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
                setActiveTab(data.suppliers[0].s_ID);
            }
        } catch (error) {
            console.error("Error fetching suppliers:", error);
            toast.error("Error fetching suppliers.");
        }
    };

    // Fetch suppliers when the component mounts or after adding a supplier
    useEffect(() => {
        fetchSuppliers();
    }, []);

    return (
        <Helmet title={'All-Suppliers'}>
            <section>
                <Row>
                    <NavBar />
                </Row>

                <Container className="all-products">
                    <Nav tabs>
                        {suppliers.map((supplier) => (
                            <NavItem key={supplier.s_ID}>
                                <NavLink
                                    className={activeTab === supplier.s_ID ? "active" : ""}
                                    onClick={() => setActiveTab(supplier.s_ID)}
                                >
                                    {supplier.name}
                                </NavLink>
                            </NavItem>
                        ))}
                        <NavItem>
                            <NavLink
                                className={activeTab === "5" ? "active" : ""}
                                onClick={() => setActiveTab("5")}
                            >
                                Add New Supplier
                            </NavLink>
                        </NavItem>
                    </Nav>

                    <TabContent activeTab={activeTab}>
                        {suppliers.map((supplier) => (
                            <TabPane tabId={supplier.s_ID} key={supplier.s_ID}>
                                <SupplierDetails supplier={supplier} />
                            </TabPane>
                        ))}
                        <TabPane tabId="5">
                            <Row>
                                <Col>
                                    <AddSupplier onAddSupplier={fetchSuppliers} />
                                </Col>
                            </Row>
                        </TabPane>
                    </TabContent>
                </Container>
            </section>
        </Helmet>
    );
};

export default AllSuppliers;
