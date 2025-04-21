import React from 'react';
import '../style/Navbar.css'; // assuming you'll put your styles in this file
import { BiMenu, BiSearch } from 'react-icons/bi';

const Navbar = () => {
    return (
        <nav className="navbar">
            <div className="sidebar-button">
                <BiMenu className="sidebarBtn" />
                <span className="dashboard">Dashboard</span>
            </div>

            <div className="search-box">
                <input id="searchInput" type="text" placeholder="Search..." />
                <BiSearch id="searchBtn" />
            </div>

            <div className="profile-details">
                <img src="admin/src/assets/images/profile.jpeg" alt="Profile" />
                <span className="admin_name">Nimna Kaveesha</span>
            </div>
        </nav>
    );
};

export default Navbar;
