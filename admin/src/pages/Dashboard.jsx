import React from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../pages/Navbar";
import Sidebar from "../pages/Sidebar";
import "../style/Dashboard.css";
import { Container } from "reactstrap";

const Dashboard = () => {
    const navigate = useNavigate();
    const location = useLocation();

    return (
        <Helmet title="Dashboard">
            <div className="dashboard-container">
                <Sidebar onNavigate={navigate} activePage={location.pathname} />
                <div className="main-content">
                    <NavBar />
                    <div className="page-content">
                        <Container fluid>
                            <Outlet />
                        </Container>
                    </div>
                </div>
            </div>
        </Helmet>
    );
};

export default Dashboard;
