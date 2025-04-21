import React, { useState } from 'react';
import '../style/AuthSection.css';
import { Link , useNavigate } from "react-router-dom";
import logo from '../assets/images/HelloShoeShop.png'; // Adjust the path as needed

const AuthSection = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const navigate = useNavigate();
    const toggleClass = isSignUp ? 'container active' : 'container';

    const submitLogin = () => {
        navigate("/dashboard");
        // const headers = {'Content-Type': 'application/json'}
        //
        // let body = {
        //     email: email,
        //     password: password
        // }
        // console.log(body);
        //
        // axios.post("http://localhost:4000/auth/login", body, {headers: headers}).then(r => {
        //     Cookies.set("token", r.data.token);
        //     Cookies.set("user_email", r.data.data.email);
        //     navigate("/dashboard");
        //     toast.success('Login Sucessfully..')
        //
        // }).catch(err => {
        //     toast.error('Something went wrong...')
        //     console.log(err)
        // })

    }

    return (
        <section id="process" className="login-process">
            <div className={toggleClass} id="container">
                <div className="form-container sign-up-form">
                    <form id="signUpForm">
                        <h1 className="heading">Create Account</h1>
                        {/*<img className="logo" src={logo} alt="Shoe Shop Logo" width="150px" />*/}
                        <span>or use your email for registration</span>
                        <input id="signUp-email" type="email" placeholder="Email" required />
                        <input id="signUp-password" type="password" placeholder="Password" required />
                        <select id="signUp-role" required>
                            <option value="" disabled selected>Select Role</option>
                            <option value="USER">User</option>
                            <option value="ADMIN">Manager</option>
                        </select>
                        <div className="btn-panel">
                            <button id="signUpBtn" type="submit">Sign Up</button>
                        </div>
                    </form>
                </div>

                <div className="form-container sign-in-form">
                    <form id="signInForm">
                        <h1 className="heading">Sign In</h1>
                        {/*<img className="logo" src={logo} alt="Shoe Shop Logo" width="150px" />*/}
                        <span>or use your email password</span>
                        <input id="signIn-email" type="email" placeholder="Email" required />
                        <input id="signIn-password" type="password" placeholder="Password" required />
                        <a href="#">Forget Your Password?</a>
                        <button id="signInBtn"  onClick={submitLogin} type="submit">Sign In</button>
                    </form>
                </div>

                <div className="toggle-container">
                    <div className="toggle">
                        <div className="toggle-panel toggle-left-panel">
                            <h1>Welcome Back!</h1>
                            <p>Register now for a personalized experience with HelloShoes Poss Management System!</p>
                            <button className="hidden" id="signInToggle" onClick={() => setIsSignUp(false)}>Sign In</button>
                        </div>
                        <div className="toggle-panel toggle-right-panel">
                            <h1>Hello, Officer!</h1>
                            <p>Register now for a personalized experience with HelloShoes Poss Management System!</p>
                            <button className="hidden" id="signUpToggle" onClick={() => setIsSignUp(true)}>Sign Up</button>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AuthSection;
