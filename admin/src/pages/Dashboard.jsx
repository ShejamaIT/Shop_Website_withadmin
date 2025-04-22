import React, {useState} from "react";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../pages/Navbar";
import Sidebar from "../pages/Sidebar";
import "../style/Dashboard.css";
// Page components
// import HomeContent from "../pages/AddSupplier";
import Customers from "../pages/AllCustomers";
import Products from "../pages/AllProducts";
import Orders from "../pages/AllOrders";
import PlaceOrder from "../pages/Placeorder";
import OrderManage from "../pages/OrderManagement"
import Suppliers from "../pages/AllSuppliers";
import Employees from "../pages/AllEmployees";
import HomeContent from "../pages/HomeContent";
import {Container} from "reactstrap";

const Dashboard = () => {
    const [activePage, setActivePage] = useState("dashboard");

    // Function to render the current page
    const renderPage = () => {
        switch (activePage) {
            case "dashboard":
                return <HomeContent />
            case "customers":
                return <Customers />;
            case "products":
                return <Products />;
            case "orders":
                return <PlaceOrder />;
            case "product_list":
                return <Orders/>
            case "stock":
                return <OrderManage />
            case "suppliers":
                return <Suppliers />
            case "employees" :
                return <Employees />
            default:
                return <HomeContent />;
        }
    };
    return (
        <Helmet title="Dashboard">
            <div className="dashboard-container">
                <Sidebar onNavigate={setActivePage} />
                <div className="main-content">
                    <NavBar />
                    <div className="page-content">
                        <Container fluid>
                            {renderPage()}
                        </Container>
                        {/* This is where the dynamic content (home, customer, etc.) will load */}
                    </div>
                </div>
            </div>
        </Helmet>
    );
};

export default Dashboard;
