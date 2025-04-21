import React, { useState } from "react";
import { Container } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../pages/Navbar";
import Sidebar from "../pages/Sidebar";
import '../style/Dashboard.css';
import { toast } from "react-toastify";

// Page components
import HomeContent from "../pages/AddSupplier";
import Customers from "../pages/AddCustomer";
import Products from "../pages/AddProducts";
// Add more imports as needed

const Dashboard = () => {
    const [activePage, setActivePage] = useState("dashboard");

    // Function to render the current page
    const renderPage = () => {
        switch (activePage) {
            case "customers":
                return <Customers />;
            case "products":
                return <Products />;
            case "dashboard":
            default:
                return <HomeContent />;
        }
    };

    return (
        <Helmet title="Dashboard">
            <div className="dashboard-layout">
                <NavBar />
                <div className="main-layout">
                    <Sidebar onNavigate={setActivePage} /> {/* Pass navigation function */}
                    <div className="content-scrollable">
                        <Container fluid>
                            {renderPage()}
                        </Container>
                    </div>
                </div>
            </div>
        </Helmet>
    );
};

export default Dashboard;
