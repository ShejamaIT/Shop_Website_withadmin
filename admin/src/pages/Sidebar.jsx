import React from 'react';
import { useLocation } from 'react-router-dom';
import '../style/Sidebar.css';

const Sidebar = ({ onNavigate, activePage }) => {
    const location = useLocation();

    const menuItems = [
        {id: "dashboard", icon: "bx-grid-alt", label: "Dashboard", path: "/dashboard"},
        {id: "stock", icon: "bx-line-chart-down", label: "Graphs", path: "/dashboard/graphs"},
        {id: "products", icon: "bx-box", label: "Product", path: "/dashboard/products"},
        {id: "customers", icon: "bx-user", label: "Customer", path: "/dashboard/customers"},
        {id: "orders", icon: "bx-cart", label: "Place Order", path: "/dashboard/orders"},
        {id: "product_list", icon: "bx-list-ul", label: "Orders", path: "/dashboard/product_list"},
        {id: "deliveries", icon: "bxs-truck", label: "Deliveries", path: "/dashboard/delivery"},
        {id: "employees", icon: "bx-book-alt", label: "Employee", path: "/dashboard/employees"},
        {id: "suppliers", icon: "bx-coin-stack", label: "Supplier", path: "/dashboard/suppliers"},
        {id: "vehicles", icon: "bx-bus-school", label: "Vehicles", path: "/dashboard/vehicles"},
    ];
    return (
        <div className="sidebar">
            <div className="logo-details">
                <i className='bx bx-code-alt'></i>
                <span className="logo_name">Shejama</span>
            </div>
            <ul className="nav-links">
                {menuItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            className={location.pathname === item.path ? "active" : ""}
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate(item.path);
                            }}
                        >
                            <i className={`bx ${item.icon}`}></i>
                            <span className="links_name">{item.label}</span>
                        </a>
                    </li>
                ))}
                <li className="log_out">
                    <a href="#">
                        <i className='bx bx-log-out'></i>
                        <span className="links_name">Log out</span>
                    </a>
                </li>
            </ul>
        </div>
    );
};

export default Sidebar;
