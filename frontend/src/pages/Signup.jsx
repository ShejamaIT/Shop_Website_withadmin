import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import "../style/Signup.css"; // Import the CSS file

const Signup = () => {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission

        // Check if all fields are filled
        if (!name || !email || !password) {
            alert("⚠️ Please fill out all fields.");
            return;
        }

        // Validate password length
        if (password.length < 6) {
            alert("⚠️ Password must be at least 6 characters.");
            return;
        }

        console.log({ name, email, password });

        try {
            // Send POST request to the backend API
            const response = await fetch("http://localhost:5000/api/admin/custsignup", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const result = await response.json();

            // Check if the sign-up was successful
            if (result.success) {
                alert("✅ Sign-up successful! Redirecting to login...");
                window.location.href = "/signin"; // Redirect to the login page after successful signup
            } else {
                alert("❌ Sign-up failed: " + result.message);
            }
        } catch (error) {
            console.error("Error during sign-up:", error);
            alert("❌ An error occurred. Please try again.");
        }
    };


    return (
        <Helmet title="Sign Up">
            {/*<CommonSection title="Sign up" />*/}
            <section>
                <Container>
                            <div className="text-center mt-4">
                                <h1 className="h2">Get started</h1>
                            </div>

                            <div className="card">
                                <div className="card-body">
                                    <div className="m-sm-3">
                                        <Form id="signup-form" className="signup-form" onSubmit={handleSubmit}>
                                            <FormGroup className="form__group">
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    placeholder="Enter your name"
                                                    value={name}
                                                    onChange={(e) => setName(e.target.value)}
                                                    required
                                                />
                                            </FormGroup>
                                            <FormGroup className="form__group">
                                                <input
                                                    type="email"
                                                    className="form-control"
                                                    placeholder="Enter your email"
                                                    value={email}
                                                    onChange={(e) => setEmail(e.target.value)}
                                                    required
                                                />
                                            </FormGroup>
                                            <FormGroup className="form__group">
                                                <input
                                                    type="password"
                                                    className="form-control"
                                                    placeholder="Enter password"
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    required
                                                />
                                            </FormGroup>

                                            <div className="d-grid gap-2 mt-3">
                                                <button type="submit" className="btn btn-lg btn-primary">
                                                    Sign up
                                                </button>
                                            </div>
                                        </Form>
                                    </div>
                                </div>
                            </div>
                            <div className="text-center mb-3">
                                Already have an account? <a href="/signin">Log In</a>
                            </div>
                </Container>
            </section>
        </Helmet>
    );
};

export default Signup;
