import React, { useEffect, useState } from 'react';
import '../style/Navbar.css';
import { BiMenu } from 'react-icons/bi';
import userIcon from '../assets/images/user-icon.png';

const Navbar = () => {
    const [empName, setEmpName] = useState("");
    const [leaveCount, setLeaveCount] = useState(0);

    useEffect(() => {
        const eid = localStorage.getItem('EID');
        const type = localStorage.getItem('type');

        const fetchEmployees = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/employees");
                const data = await response.json();

                if (data.success && Array.isArray(data.employees)) {
                    const currentEmp = data.employees.find(emp => emp.E_Id.toString() === eid);
                    if (currentEmp) {
                        setEmpName(currentEmp.name);
                    }
                }
            } catch (err) {
                console.error("Error fetching employees:", err);
            }
        };

        const fetchLeaveCounts = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/applied-leaves");
                const data = await response.json();
                if (!response.ok) throw new Error(data.message || "Failed to fetch leaves");
                setLeaveCount(data.count || 0);
            } catch (err) {
                console.error("Error fetching leave counts:", err);
            }
        };

        fetchEmployees();
        if (type === 'ADMIN') {
            fetchLeaveCounts();
        }
    }, []);

    return (
        <nav className="navbar">
            <div className="sidebar-button">
                <BiMenu className="sidebarBtn" />
                <span className="dashboard">Dashboard</span>
            </div>
            <div className="profile-details">
                <div className="notification-icon">
                    <i className='bx bx-bell'></i>
                    {leaveCount > 0 && <span className="notification-badge">{leaveCount}</span>}
                </div>
                <img src={userIcon} alt="Profile" />
                <span className="admin_name">{empName || "User"}</span>
            </div>
        </nav>
    );
};

export default Navbar;
