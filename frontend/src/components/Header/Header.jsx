import React, {useRef, useEffect, useState} from "react";
import { NavLink, useNavigate } from "react-router-dom";
import './Header.css';
import { motion } from "framer-motion";
import logo from '../../assets/images/logo.PNG';
import userIcon from '../../assets/images/user-icon.png';
import logoutIcon from '../../assets/images/logout.png';
import { Container, Row } from "reactstrap";
import { useSelector } from "react-redux";
import Swal from 'sweetalert2';

const nav__link = [
    { path: 'home', display: 'Home' },
    { path: 'shop', display: 'Shop' },
];

const Header = () => {
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
        const result = await Swal.fire({
            imageUrl: logoutIcon,
            imageWidth: 50,
            imageHeight: 50,
            title: 'Do you want to logout?',
            showCancelButton: true,
            confirmButtonText: 'Yes',
            cancelButtonText: 'No',
            confirmButtonColor: '#24757e',
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
                    navigate('/login');
                    return;
                }

                const response = await fetch('http://localhost:5000/api/auth/logout', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                    },
                });

                localStorage.clear();

                if (response.ok) {
                    navigate('/');
                } else {
                    const data = await response.json();
                    setLogoutError(data.message);
                }
            } catch (error) {
                console.error('Error during logout:', error);
                setLogoutError('An unexpected error occurred.');
            }
        }

    };

    return (
        <header className="header" ref={headerRef}>
            <Container>
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
                            <span className="heart_icon">
                                <i className="ri-heart-line"></i>
                                {/*<span className="badge">1</span>*/}
                            </span>
                            <span className="cart_icon" onClick={navigateToCart}>
                                <i className="ri-shopping-cart-2-line"></i>
                                <span className="badge">{totalQuantity}</span>
                            </span>
                            <span className="cart_icon" onClick={navigateToLogin}>
                                <i className="ri-user-3-line"></i>
                            </span>
                            <span className="cart_icon" onClick={logout}>
                                <i className="ri-logout-box-r-line"></i>
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

export default Header;
