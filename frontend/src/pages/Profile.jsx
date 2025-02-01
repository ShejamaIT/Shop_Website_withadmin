import React, { useState, useEffect } from "react";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import { useNavigate } from "react-router-dom"; // Import for navigation
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import "../style/Profile.css";
import userSix from "../assets/images/user-06.png";

const Profile = () => {
    const [user, setUser] = useState({
        name: "",
        address: "",
        email: "",
        phone: "",
    });

    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate(); // Use navigate for redirection

    // Check for token in localStorage & Redirect if missing
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            alert("⚠️ Unauthorized Access! Please Sign In.");
            navigate("/signin"); // Redirect to Sign In page
        }
    }, [navigate]); // Run only when the component mounts

    const storedEmail = localStorage.getItem("email");

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/profile/${storedEmail}`);
                const data = await response.json();
                if (data.success) {
                    setUser(data.data);
                } else {
                    console.error("Failed to load profile:", data.message);
                }
            } catch (error) {
                console.error("Error fetching profile:", error);
            }
        };

        fetchProfile();
    }, [storedEmail]);

    // Handle Input Change
    const handleChange = (e) => {
        setUser({ ...user, [e.target.name]: e.target.value });
    };

    // Handle Form Submission (Update Profile)
    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch("http://localhost:5000/api/profile/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(user),
            });

            const data = await response.json();
            if (data.success) {
                alert("✅ Profile updated successfully!");
                setIsEditing(false);
            } else {
                alert("❌ Failed to update profile: " + data.message);
            }
        } catch (error) {
            console.error("Error updating profile:", error);
        }
    };

    return (
        <Helmet title="Profile">
            <CommonSection title="My Profile" />
            <section className="profile-section">
                <Container>
                    <div className="profile-card">
                        <Row>
                            {/* Left Column - Profile Info */}
                            <Col lg="4" md="5">
                                <div className="profile-info">
                                    <div className="profile-image">
                                        <img src={userSix} alt="Profile" className="profile-pic" />
                                        <label htmlFor="profile-upload" className="edit-profile">
                                            <input type="file" id="profile-upload" className="hidden-input" />
                                            Edit
                                        </label>
                                    </div>

                                    <Form onSubmit={handleSubmit}>
                                        <FormGroup>
                                            <Label>Name:</Label>
                                            <Label>Shaili Manamperi</Label>
                                            {/*<Input*/}
                                            {/*    type="text"*/}
                                            {/*    name="name"*/}
                                            {/*    value={user.name}*/}
                                            {/*    onChange={handleChange}*/}
                                            {/*    disabled={!isEditing}*/}
                                            {/*/>*/}
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Address:</Label>
                                            <Label>25/6,Disa place, Panadura</Label>
                                            {/*<Input*/}
                                            {/*    type="text"*/}
                                            {/*    name="address"*/}
                                            {/*    value={user.address}*/}
                                            {/*    onChange={handleChange}*/}
                                            {/*    disabled={!isEditing}*/}
                                            {/*/>*/}
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Email:</Label>
                                            {/*<Input type="email" value={user.email} disabled />*/}
                                            <Label>shailimanamperi@gmail.com</Label>
                                        </FormGroup>
                                        <FormGroup>
                                            <Label>Phone:</Label>
                                            <Label>0712330261</Label>
                                            {/*<Input*/}
                                            {/*    type="text"*/}
                                            {/*    name="phone"*/}
                                            {/*    value={user.phone}*/}
                                            {/*    onChange={handleChange}*/}
                                            {/*    disabled={!isEditing}*/}
                                            {/*/>*/}
                                        </FormGroup>

                                        {isEditing ? (
                                            <Button type="submit" color="primary">
                                                Save Changes
                                            </Button>
                                        ) : (
                                            <Button color="secondary" onClick={() => setIsEditing(true)}>
                                                Edit Profile
                                            </Button>
                                        )}
                                    </Form>
                                </div>
                            </Col>

                            {/* Right Column - My Orders */}
                            <Col lg="8" md="7">
                                <div className="my-orders">
                                    <h3>My Orders</h3>
                                    <div className="order-list">
                                        <p>No orders placed yet.</p>
                                    </div>
                                </div>
                            </Col>
                        </Row>
                    </div>
                </Container>
            </section>
        </Helmet>
    );
};

export default Profile;
