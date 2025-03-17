import React, {useEffect, useState} from "react";
import { Container, Row, Col, Table, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';
import {toast} from "react-toastify";

const Dashboard = () => {
    const [salesteamMembers, setSalesteamMembers] = useState([]);

    const fetchSalesTeamMembers = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/salesteam");
            const data = await response.json();
            console.log(data.data);
            if (data.data && data.data.length > 0) {
                setSalesteamMembers(data.data);
            }
        } catch (error) {
            console.error("Error fetching sales team members:", error);
        }
    };

    useEffect(() => {
        fetchSalesTeamMembers();
    }, []);

    // Sample sales data
    const dailySales = [
        { id: 1, name: "Thushani", sales: 45000 },
        { id: 2, name: "Kalani", sales: 18000 },
        { id: 3, name: "Chathyrya", sales: 25000 }
    ];

    const monthlySales = [
        { id: 1, name: "Thushani", sales: 52000 },
        { id: 2, name: "Kalani", sales: 35000 },
        { id: 3, name: "Chathyrya", sales: 44000 }
    ];

    const dailyTotal = dailySales.reduce((acc, sale) => acc + sale.sales, 0);
    const monthlyTotal = monthlySales.reduce((acc, sale) => acc + sale.sales, 0);

    const salesData = [
        { name: "Daily Sales", value: dailyTotal },
        { name: "Monthly Sales", value: monthlyTotal }
    ];

    const [couponCode, setCouponCode] = useState("");
    const [saleteamCode, setSaleteamCode] = useState("");
    const [discount, setDiscount] = useState("");
    const [date, setDate] = useState("");
    const [promoImage, setPromoImage] = useState(null);

    const handleCouponSubmit = async (e) => {
        e.preventDefault();
        // Check if fields are filled
        if (!couponCode || !saleteamCode || !discount) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/coupone", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    couponCode,
                    saleteamCode,
                    discount,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Coupon ${couponCode} added successfully!`);
                // Clear form fields after successful submission
                setCouponCode("");
                setDiscount("");
                setSaleteamCode("");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error submitting coupon:", error);
            alert("Failed to add coupon. Please try again.");
        }
    };
    const handlePromotionSubmit = async (e) => {
        // e.preventDefault();
        // alert(`Promotion ${date} added!`);
        // setDate(""); setPromoImage(null);

        e.preventDefault();
        // Check if fields are filled
        if (!date || !promoImage) {
            alert("Please fill in all fields.");
            return;
        }
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/coupone", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    couponCode,
                    saleteamCode,
                    discount,
                }),
            });
            const data = await response.json();
            if (data.success) {
                toast.success(`Coupon ${couponCode} added successfully!`);
                // Clear form fields after successful submission
                setCouponCode("");
                setDiscount("");
                setSaleteamCode("");
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error submitting coupon:", error);
            alert("Failed to add coupon. Please try again.");
        }
    };
    const handleImageUpload = (event) => {
        setPromoImage(URL.createObjectURL(event.target.files[0]));
    };

    return (
        <Helmet title={'Dashboard'}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container className='dashboard'>
                    <h2>Sales Overview</h2>
                    <Row>
                        <Col md={6}>
                            <h4>Daily Sales</h4>
                            <Table striped>
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Salesperson</th>
                                    <th>Sales (Rs.)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {dailySales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{sale.id}</td>
                                        <td>{sale.name}</td>
                                        <td>{sale.sales}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                            <h5>Total: Rs.{dailyTotal}</h5>
                        </Col>
                        <Col md={6}>
                            <h4>Monthly Sales</h4>
                            <Table striped>
                                <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Salesperson</th>
                                    <th>Sales (Rs)</th>
                                </tr>
                                </thead>
                                <tbody>
                                {monthlySales.map((sale) => (
                                    <tr key={sale.id}>
                                        <td>{sale.id}</td>
                                        <td>{sale.name}</td>
                                        <td>{sale.sales}</td>
                                    </tr>
                                ))}
                                </tbody>
                            </Table>
                            <h5>Total: Rs.{monthlyTotal}</h5>
                        </Col>
                    </Row>

                    <Row>
                        <Col md={6}>
                            <h4>Manage Coupons</h4>
                            <div className="general">
                                <Form onSubmit={handleCouponSubmit}>
                                    <FormGroup>
                                        <Label for="coupon">Coupon Code</Label>
                                        <Input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" required />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="saleteamCode">Sale Team ID</Label>

                                        <Input type="select" name="saleteamCode" onChange={(e) => setSaleteamCode(e.target.value)} required >
                                            <option value="">Sale team ID</option>
                                            {salesteamMembers.map((member) => (
                                                <option key={member.stID} value={member.stID}>{member.stID}-({member.employeeName})</option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="discount">Discount Price</Label>
                                        <Input type="number" value={discount} onChange={(e) => setDiscount(e.target.value)} placeholder="Enter discount amount" required />
                                    </FormGroup>
                                    <Button color="primary" type="submit">Add Coupon</Button>
                                </Form>
                            </div>
                        </Col>
                        <Col md={6}>
                            <h4>Manage Promotions</h4>
                            <div className="general">
                                <Form onSubmit={handlePromotionSubmit}>
                                    <FormGroup>
                                        <Label for="date">Date</Label>
                                        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="promoImage">Upload Promotion Image</Label>
                                        <Input type="file" onChange={handleImageUpload} />
                                        {promoImage && <img src={promoImage} alt="Promotion" className="promo-img" />}
                                    </FormGroup>
                                    <Button color="primary" type="submit">Add Promotion</Button>
                                </Form>
                            </div>
                        </Col>
                    </Row>

                    <h2>Sales Chart</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={salesData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Legend />
                            <Bar dataKey="value" fill="#8884d8" />
                        </BarChart>
                    </ResponsiveContainer>
                </Container>
            </section>
        </Helmet>
    );
};

export default Dashboard;