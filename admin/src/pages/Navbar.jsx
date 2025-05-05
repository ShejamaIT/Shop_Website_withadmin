import React, { useEffect, useState } from 'react';
import '../style/Navbar.css';
import { BiMenu, BiSearch } from 'react-icons/bi';
import userIcon from '../assets/images/user-icon.png';

const Navbar = () => {
    const [empName, setEmpName] = useState(""); // ✅ State for employee name

    useEffect(() => {
        const eid = localStorage.getItem('EID');

        const fetchEmployees = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/employees");
                const data = await response.json();

                if (data.success && Array.isArray(data.employees)) {
                    const currentEmp = data.employees.find(emp => emp.E_Id.toString() === eid);
                    if (currentEmp) {
                        setEmpName(currentEmp.name); // ✅ Set employee name
                    }
                }
            } catch (err) {
                console.error("Error fetching employees:", err);
            }
        };

        fetchEmployees();
    }, []);

    return (
        <nav className="navbar">
            <div className="sidebar-button">
                <BiMenu className="sidebarBtn"/>
                <span className="dashboard">Dashboard</span>
            </div>
            {/*<div className="search-box">*/}
            {/*    <input id="searchInput" type="text" placeholder="Search..."/>*/}
            {/*    <BiSearch id="searchBtn"/>*/}
            {/*</div>*/}
            <div className="profile-details">
                <img src={userIcon} alt="Profile"/>
                <span className="admin_name">{empName || "User"}</span>
            </div>

        </nav>
    );
};

export default Navbar;
