import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import "../style/Signup.css"; // Import the CSS file


const Signin = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(true);

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault(); // Prevent default form submission behavior

        // Check if email and password are provided
        if (!email || !password) {
            alert("⚠️ Please enter both email and password.");
            return;
        }

        // Handle form submission (e.g., login API call)
        console.log({ email, password, rememberMe });

        try {
            // Send POST request to the backend API
            const response = await fetch("http://localhost:5000/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, password }),
            });

            const result = await response.json();

            // Check if login was successful
            if (result.success) {
                alert("✅ Login successful! Redirecting...");
                // Save token to local storage
                localStorage.setItem("token", result.data.token);
                localStorage.setItem("email", result.data.email);
                window.location.href = "/"; // Redirect to the homepage after successful login
            } else {
                alert("❌ Login failed: " + result.message);
            }
        } catch (error) {
            console.error("Error during login:", error);
            alert("❌ An error occurred. Please try again.");
        }
    };
    return (
        <Helmet title="Sign In">
            {/*<CommonSection title="Sign in" />*/}
            <section>
                <Container>
                    <div className="text-center mt-4 head">
                        <h1 className="h2">Welcome back!</h1>
                    </div>

                    <div className="card">
                        <div className="card-body">
                            <div className="m-sm-3">
                                <Form id="signin-form" className="signin-form" onSubmit={handleSubmit}>
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
                                            placeholder="Enter your password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </FormGroup>
                                    {/*<FormGroup check className="form__group">*/}
                                    {/*    <input*/}
                                    {/*        id="rememberMe"*/}
                                    {/*        type="checkbox"*/}
                                    {/*        checked={rememberMe}*/}
                                    {/*        onChange={(e) => setRememberMe(e.target.checked)}*/}
                                    {/*    />*/}
                                    {/*    <label htmlFor="rememberMe" className="text-small">*/}
                                    {/*        Remember me*/}
                                    {/*    </label>*/}
                                    {/*</FormGroup>*/}

                                    <div className="d-grid gap-2 mt-3">
                                        <button type="submit" className="btn btn-lg btn-primary">
                                            Sign in
                                        </button>
                                    </div>
                                </Form>
                            </div>
                        </div>
                    </div>

                    <div className="text-center mb-3">
                        Don't have an account? <a href="/signup">Sign up</a>
                    </div>
                </Container>
            </section>
        </Helmet>
    );

};

export default Signin;
