import React from 'react';
import {useLocation, useNavigate} from 'react-router-dom';
import '../../style/Sidebar.css';
import Swal from "sweetalert2";

const AdminSidebar = ({ onNavigate, activePage }) => {
    const location = useLocation();
    const navigate = useNavigate()
    const handleLogout = async () => {
        const result = await Swal.fire({
            title: 'Do you want to logout?',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            confirmButtonColor: '#0a1d37',
            cancelButtonColor: '#D3D3D3',
            reverseButtons: true,
            customClass: {
                popup: 'rounded-popup',
            },
        });

        if (result.isConfirmed) {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    navigate('/SignIn');
                    return;
                }

                const response = await fetch('http://localhost:5001/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                    },
                });

                localStorage.clear();

                if (response.ok) {
                    navigate('/SignIn');
                } else {
                    const data = await response.json();
                }
            } catch (error) {
                console.error('Error during logout:', error);
            }
        }
    };

    const menuItems = [    //sidebarcontent
        {id: "dashboard", icon: "bx-grid-alt", label: "Dashboard", path: "/admin-dashboard"},
        //link with Router.js
        //     {id: "vehicles", icon: "bx-bus-school", label: "Vehicles", path: "/admin-dashboard/vehicles"}
        // id is button id
        //path:  --selects path from Router.js
        //  {id: "dashboard", icon: "bx-grid-alt", label: "itdept", path: "/admin-dashboard"},
        // {id: "dashboard", icon: "bx-grid-alt", label: "itdept", path: "/admin-dashboard"},
        // {id: "itDept" route path = ""
        //label: "ITDEPARTMENT" display text
        // path: "/admin-dashboard/itDept" router.js eke path eka match karagannawa

        // {id: "it_dept", icon: "bx-grid-alt", label: "ITDEPARTMENT", path: "/admin-dashboard/itDept"},
        {id: "price_list", icon: "bx-cabinet", label: "Item Price List", path: "/admin-dashboard/item_prices"},
        {id: "stock", icon: "bx-line-chart-down", label: "Graphs", path: "/admin-dashboard/graphs"},
        {id: "products", icon: "bx-box", label: "Products", path: "/admin-dashboard/products"},
        {id: "orders", icon: "bx-cart", label: "Invoice", path: "/admin-dashboard/orders"},
        {id: "product_list", icon: "bx-list-ul", label: "Orders", path: "/admin-dashboard/product_list"},
        {id: "deliveries", icon: "bxs-truck", label: "Deliveries", path: "/admin-dashboard/delivery"},
        {id: "deliveries", icon: "bxs-clipboard-check", label: "GatePasses", path: "/admin-dashboard/delivery"},
        {id: "customers", icon: "bx-user", label: "Customers", path: "/admin-dashboard/customers"},
        {id: "employees", icon: "bx-user-circle", label: "Employees", path: "/admin-dashboard/employees"},
        {id: "suppliers", icon: "bx-coin-stack", label: "Suppliers", path: "/admin-dashboard/suppliers"},
        {id: "vehicles", icon: "bx-bus-school", label: "Vehicles", path: "/admin-dashboard/vehicles"},
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
                    <a href="/admin/public" onClick={(e) => {
                        e.preventDefault(); // Prevent navigation
                        handleLogout();     // Call your logout function
                    }}>
                        <i className='bx bx-log-out'></i>
                        <span className="links_name">Log out</span>
                    </a>
                </li>

            </ul>
        </div>
    );
};

export default AdminSidebar;
