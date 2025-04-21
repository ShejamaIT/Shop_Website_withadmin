import React from 'react';
import '../style/Sidebar.css';

const Sidebar = ({ onNavigate, activePage }) => {
    const menuItems = [
        { id: "dashboard", icon: "bx-grid-alt", label: "Dashboard" },
        { id: "customers", icon: "bx-user", label: "Customer" },
        { id: "products", icon: "bx-box", label: "Product" },
        { id: "product_list", icon: "bx-list-ul", label: "Product List" },
        { id: "orders", icon: "bx-cart", label: "Order" },
        { id: "stock", icon: "bx-pie-chart-alt-2", label: "Stock" },
        { id: "suppliers", icon: "bx-coin-stack", label: "Supplier" },
        { id: "returns", icon: "bx-arrow-back", label: "Return" },
        { id: "employees", icon: "bx-book-alt", label: "Employee" },
    ];

    return (
        <div className="sidebar">
            <div className="logo-details">
                <i className='bx bx-code-alt'></i>
                <span className="logo_name">Pos System</span>
            </div>
            <ul className="nav-links">
                {menuItems.map(item => (
                    <li key={item.id}>
                        <a
                            href="#"
                            className={activePage === item.id ? "active" : ""}
                            onClick={(e) => {
                                e.preventDefault();
                                onNavigate(item.id);
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
