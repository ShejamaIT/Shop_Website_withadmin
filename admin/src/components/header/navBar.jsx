// import Cookies from "js-cookie";
// import axios from "axios";
// import { toast } from "react-toastify";
// import {NavLink, useNavigate} from "react-router-dom";
// import {Container, Row} from "reactstrap";
// import React from "react";
// import logo from "../../assets/images/logo.PNG";
// import {motion} from "framer-motion";
// import userIcon from "../../assets/images/user-icon.png";
//
// const admin_nav = [
//     {
//         display: 'Dashboard',
//         path: '/dashboard'
//     },
//     {
//         display: 'All-Products',
//         path: '/dashboard/all-products'
//     },
//     {
//         display: 'Orders',
//         path: '/dashboard/orders'
//     },
//     {
//         display: 'Users',
//         path: '/dashboard/users'
//     },
// ];
//
//
// const NavBar = () => {
//     const navigate = useNavigate();
//     const handleLogout = () => {
//         const headers = { 'Content-Type': 'application/json' };
//         console.log(Cookies.get("user_email"))
//         const body = {
//             email: Cookies.get("user_email"), // Assuming the email is stored in a cookie named 'user_email'
//         };
//
//         axios.post("http://localhost:4000/auth/logout", body, { headers: headers, withCredentials: true })
//             .then(response => {
//                 console.log(response);
//                 Cookies.remove("token");
//                 Cookies.remove("user");
//                 Cookies.remove("user_email");
//                 navigate("/login");
//                 toast.success('Logged out successfully.');
//             })
//             .catch(err => {
//                 toast.error('Failed to logout.');
//                 console.log(err);
//             });
//     };
//     return (
//         <>
//             <header className='admin__header'>
//                 <div className='admin_nav_top'>
//                     <Container>
//                         <div className='admin-nav-wrapper-top'>
//                             <div className="logo">
//                                 <img src={logo} alt="logo" />
//                                 <div>
//                                     <h2>Shejama Group</h2>
//                                 </div>
//                             </div>
//
//                             <div className="admin__navigation">
//                                 <ul className='admin__menu-list'>
//                                     {
//                                         admin_nav.map((item, index) => (
//                                             <li className="admin__menu-item" key={index}>
//                                                 <NavLink to={item.path} className={navClass => navClass.isActive ? 'active__admin_menu' : ''}>
//                                                     {item.display}
//                                                 </NavLink>
//                                             </li>
//                                         ))
//                                     }
//                                 </ul>
//                             </div>
//                             <div className="admin__nav-top-right">
//                                 <span><i className='ri-notification-3-line'></i></span>
//                                 <span><i className='ri-settings-2-line'></i></span>
//                                 <span onClick={handleLogout} style={{ cursor: "pointer" }}><i className='ri-logout-box-line'></i></span>
//                                 <motion.img
//                                     whileTap={{ scale: 1.2 }}
//                                     src={userIcon}
//                                     alt="usericon"
//                                 />
//                             </div>
//                         </div>
//                     </Container>
//                 </div>
//             </header>
//         </>
//     );
//
// };
//
// export default NavBar;


import React, {useRef, useEffect, useState} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import './Header.css';
import { motion } from "framer-motion";
import logo from '../../assets/images/logo.PNG';
import userIcon from '../../assets/images/user-icon.png';
import logoutIcon from '../../assets/images/logout.png';
import { Container, Row } from "reactstrap";
import { useSelector } from "react-redux";
// import Swal from 'sweetalert2';

const nav__link = [
    { path: 'home', display: 'Home' },
    { path: 'shop', display: 'Shop' },
    { path: 'cart', display: 'Cart' },
];

const NavBar = () => {
    const headerRef = useRef(null);
    const menuRef = useRef(null);
    const [logoutError, setLogoutError] = useState(null);
    const navigate = useNavigate();
    const totalQuantity = useSelector(state => state.cart.totalQuantity);

    const stickyHeaderFunc = () => {
        if (headerRef.current) {
            if (document.body.scrollTop > 80 || document.documentElement.scrollTop > 80) {
                headerRef.current.classList.add('sticky__header');
            } else {
                headerRef.current.classList.remove('sticky__header');
            }
        }
    };

    useEffect(() => {
        stickyHeaderFunc();
        window.addEventListener('scroll', stickyHeaderFunc);
        return () => {
            window.removeEventListener('scroll', stickyHeaderFunc);
        };
    }, []);

    const menuToggle = () => {
        if (menuRef.current) {
            menuRef.current.classList.toggle('active__menu');
        }
    };

    const navigateToCart = () => {
        navigate('/cart');
    };

    const navigateToLogin = () => {
        navigate('/profile');
    };
    const logout = async () => {
        // const result = await Swal.fire({
        //     imageUrl: logoutIcon,
        //     imageWidth: 50,
        //     imageHeight: 50,
        //     title: 'Do you want to logout?',
        //     showCancelButton: true,
        //     confirmButtonText: 'Yes',
        //     cancelButtonText: 'No',
        //     confirmButtonColor: '#24757e',
        //     cancelButtonColor: '#D3D3D3',
        //     reverseButtons: true,
        //     customClass: {
        //         popup: 'rounded-popup',
        //     },
        // });
        // if (result.isConfirmed) {
        //     try {
        //         const token = localStorage.getItem('token');
        //         if (!token) {
        //             navigate('/login');
        //             return;
        //         }
        //
        //         const response = await fetch('http://localhost:5000/api/auth/logout', {
        //             method: 'POST',
        //             headers: {
        //                 'Content-Type': 'application/json',
        //                 Authorization: `Bearer ${token}`,
        //             },
        //         });
        //
        //         localStorage.clear();
        //
        //         if (response.ok) {
        //             navigate('/');
        //         } else {
        //             const data = await response.json();
        //             setLogoutError(data.message);
        //         }
        //     } catch (error) {
        //         console.error('Error during logout:', error);
        //         setLogoutError('An unexpected error occurred.');
        //     }
        // }

    };

    return (
        <header className="header" ref={headerRef}>
            <Container className='header'>
                <Row>
                    <div className="nav__wrapper">
                        <div className="logo">
                            <img src={logo} alt="logo" />
                            <div>
                                <h1>Shejama Group</h1>
                            </div>
                        </div>
                        <div className="navigation" ref={menuRef} onClick={menuToggle}>
                            <ul className="menu">
                                {nav__link.map((item, index) => (
                                    <li className="nav__item" key={index}>
                                        <NavLink
                                            to={item.path}
                                            className={navClass => navClass.isActive ? 'nav__active' : ''}
                                        >
                                            {item.display}
                                        </NavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="nav__icons">
                            <span className="user_icon" onClick={navigateToLogin}>
                                <i className="ri-user-3-line"></i>
                            </span>
                            <span className="user_icon">
                                <i className='ri-settings-2-line'></i>
                            </span>
                            <div className="mobile__menu">
                                <span onClick={menuToggle}>
                                    <i className="ri-menu-line"></i>
                                </span>
                            </div>
                        </div>
                    </div>
                </Row>
            </Container>
        </header>
    );
};

export default NavBar;
