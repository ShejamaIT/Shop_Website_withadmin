import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Table, Button } from "reactstrap";
import NavBar from "../components/header/navBar";
import Helmet from "../components/Helmet/Helmet";
import "../style/SaleteamDetail.css";

const SaleteamDetail = () => {
    const { id } = useParams(); // Get sales team ID from URL
    const [salesteamMember, setSalesteamMember] = useState(null);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate(); // Initialize navigate

    useEffect(() => {
        if (!id) {
            // If id is undefined or null, handle the error
            setError("Sales team ID is missing or invalid.");
            setLoading(false);
            return; // Don't proceed with the API call if id is invalid
        }
        fetchOrder();
    }, [id]); // Run this effect when 'id' changes

    const fetchOrder = async () => {
        console.log(id);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/orders/by-sales-team?stID=${id}`);
            if (!response.ok) throw new Error("Failed to fetch order details.");
            const data = await response.json();
            console.log(data.data.orders);
            if (data.data) {
                setOrders(data.data.orders);
            } else {
                setError("No order details available for this sales team.");
            }
            console.log(data.data.memberDetails);
            if (data.data) {
                setSalesteamMember(data.data.memberDetails);
            } else {
                setError("No member details available for this sales team.");
            }
            setLoading(false);
        } catch (err) {
            console.error("Error fetching order details:", err);
            setError(err.message);
            setLoading(false);
        }
    };

    const calculateOrderSummary = () => {
        const totalOrders = orders.length;
        const totalPrice = orders.reduce((acc, order) => acc + order.totalPrice, 0); // Adjust to field name from your response
        return { totalOrders, totalPrice };
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
    };

    if (loading) return <p className="loading-text">Loading team details...</p>;
    if (error) return <p className="error-text">Something went wrong: {error}</p>;

    const { totalOrders, totalPrice } = calculateOrderSummary();
    return (
        <Helmet title={`Sales Team Detail`}>
            <section>
                <Row>
                    <NavBar />
                </Row>
                <Container>
                    <Row>
                        <Col lg="12">
                            <h2 className="salesteam-title">Sales Team Member: {salesteamMember?.employeeName}</h2>

                            {/* Sales Team Member Details */}
                            <div className="salesteam-details">
                                <Table bordered className="member-table">
                                    <tbody>
                                    <tr>
                                        <td><strong>Employee Name</strong></td>
                                        <td>{salesteamMember?.employeeName}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Employee ID</strong></td>
                                        <td>{salesteamMember?.stID}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Phone</strong></td>
                                        <td>{salesteamMember?.employeeContact}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Nic</strong></td>
                                        <td>{salesteamMember?.employeeNic}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Target</strong></td>
                                        <td>Rs.{salesteamMember?.target}</td>
                                    </tr>
                                    </tbody>
                                </Table>
                            </div>

                            {/* Orders for this Sales Team Member */}
                            <div className="order-details">
                                <h4 className="sub-title">Orders Summary</h4>
                                <Table bordered className="orders-table">
                                    <tbody>
                                    <tr>
                                        <td><strong>Total Orders</strong></td>
                                        <td>{totalOrders}</td>
                                    </tr>
                                    <tr>
                                        <td><strong>Total Sales Value</strong></td>
                                        <td>Rs. {totalPrice}</td>
                                    </tr>
                                    </tbody>
                                </Table>

                                {/* Orders List */}
                                <h4 className="sub-title">Order Details</h4>
                                <Table striped bordered className="items-table">
                                    <thead>
                                    <tr>
                                        <th>Order ID</th>
                                        <th>Order Date</th>
                                        <th>Total Amount</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {orders.map((order, index) => (
                                        <tr key={index}>
                                            <td>{order.orderId}</td> {/* Adjust field names as per response */}
                                            <td>{formatDate(order.orderDate)}</td> {/* Adjust field names as per response */}
                                            <td>Rs. {order.totalPrice}</td> {/* Adjust field names as per response */}
                                        </tr>
                                    ))}
                                    </tbody>
                                </Table>
                            </div>

                            <div className="text-center mt-4">
                                <Button color="primary" onClick={() => navigate("/all-saleteam")}>Back to Sales Team</Button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default SaleteamDetail;



// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Container, Row, Col, Table, Button } from "reactstrap";
// import NavBar from "../components/header/navBar";
// import Helmet from "../components/Helmet/Helmet";
// import "../style/SaleteamDetail.css";
//
// const SaleteamDetail = () => {
//     const { id } = useParams(); // Get sales team ID from URL
//     const [salesteamMember, setSalesteamMember] = useState(null);
//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigate = useNavigate(); // Initialize navigate
//
//     useEffect(() => {
//         fetchSalesTeamDetails();
//     }, [id]);
//
//     const fetchSalesTeamDetails = async () => {
//         try {
//             // Replace with your API to fetch sales team member details based on the sales team ID
//             const memberResponse = await fetch(`http://localhost:5001/api/admin/main/salesteam/${id}`);
//             const ordersResponse = await fetch(`http://localhost:5001/api/admin/main/orders/by-sales-team?stID=${id}`);
//
//             if (!memberResponse.ok || !ordersResponse.ok) throw new Error("Failed to fetch data.");
//
//             const memberData = await memberResponse.json();
//             const ordersData = await ordersResponse.json();
//
//             setSalesteamMember(memberData.data);
//             setOrders(ordersData.data);
//             setLoading(false);
//         } catch (err) {
//             console.error("Error fetching data:", err);
//             setError(err.message);
//             setLoading(false);
//         }
//     };
//
//     const calculateOrderSummary = () => {
//         const totalOrders = orders.length;
//         const totalPrice = orders.reduce((acc, order) => acc + order.totPrice, 0); // Adjust to field name from your response
//         return { totalOrders, totalPrice };
//     };
//
//     const formatDate = (dateString) => {
//         const date = new Date(dateString);
//         return date instanceof Date && !isNaN(date) ? date.toLocaleDateString() : "N/A";
//     };
//
//     if (loading) return <p className="loading-text">Loading team details...</p>;
//     if (error) return <p className="error-text">Something went wrong: {error}</p>;
//
//     const { totalOrders, totalPrice } = calculateOrderSummary();
//
//     return (
//         <Helmet title={`Sales Team Detail`}>
//             <section>
//                 <Row>
//                     <NavBar />
//                 </Row>
//                 <Container>
//                     <Row>
//                         <Col lg="12">
//                             <h2 className="salesteam-title">Sales Team Member: {salesteamMember?.employeeName}</h2>
//
//                             {/* Sales Team Member Details */}
//                             <div className="salesteam-details">
//                                 <Table bordered className="member-table">
//                                     <tbody>
//                                     <tr>
//                                         <td><strong>Employee Name</strong></td>
//                                         <td>{salesteamMember?.employeeName}</td>
//                                     </tr>
//                                     <tr>
//                                         <td><strong>Employee ID</strong></td>
//                                         <td>{salesteamMember?.stID}</td>
//                                     </tr>
//                                     <tr>
//                                         <td><strong>Email</strong></td>
//                                         <td>{salesteamMember?.email}</td>
//                                     </tr>
//                                     <tr>
//                                         <td><strong>Phone</strong></td>
//                                         <td>{salesteamMember?.phone}</td>
//                                     </tr>
//                                     </tbody>
//                                 </Table>
//                             </div>
//
//                             {/* Orders for this Sales Team Member */}
//                             <div className="order-details">
//                                 <h4 className="sub-title">Orders Summary</h4>
//                                 <Table bordered className="orders-table">
//                                     <tbody>
//                                     <tr>
//                                         <td><strong>Total Orders</strong></td>
//                                         <td>{totalOrders}</td>
//                                     </tr>
//                                     <tr>
//                                         <td><strong>Total Sales Value</strong></td>
//                                         <td>Rs. {totalPrice}</td>
//                                     </tr>
//                                     </tbody>
//                                 </Table>
//
//                                 {/* Orders List */}
//                                 <h4 className="sub-title">Order Details</h4>
//                                 <Table striped bordered className="items-table">
//                                     <thead>
//                                     <tr>
//                                         <th>Order ID</th>
//                                         <th>Order Date</th>
//                                         <th>Total Amount</th>
//                                     </tr>
//                                     </thead>
//                                     <tbody>
//                                     {orders.map((order, index) => (
//                                         <tr key={index}>
//                                             <td>{order.OrID}</td> {/* Adjust field names as per response */}
//                                             <td>{formatDate(order.orDate)}</td> {/* Adjust field names as per response */}
//                                             <td>Rs. {order.totPrice}</td> {/* Adjust field names as per response */}
//                                         </tr>
//                                     ))}
//                                     </tbody>
//                                 </Table>
//                             </div>
//
//                             <div className="text-center mt-4">
//                                 <Button color="primary" onClick={() => navigate("/all-saleteam")}>Back to Sales Team</Button>
//                             </div>
//                         </Col>
//                     </Row>
//                 </Container>
//             </section>
//         </Helmet>
//     );
// };
//
// export default SaleteamDetail;


// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Container, Row, Col, Table, Button } from "reactstrap";
// import NavBar from "../components/header/navBar";
// import Helmet from "../components/Helmet/Helmet";
// import "../style/SaleteamDetail.css";
//
// const SaleteamDetail = () => {
//     const { id } = useParams(); // Get sales team ID from URL
//     const [salesteamMember, setSalesteamMember] = useState(null);
//     const [orders, setOrders] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [error, setError] = useState(null);
//     const navigate = useNavigate(); // Initialize navigate
//
//     useEffect(() => {
//         // Logic to fetch data will go here
//     }, [id]);
//
//     const calculateOrderSummary = () => {
//         // Logic to calculate total orders and price
//         return { totalOrders: 0, totalPrice: 0 };
//     };
//
//     const formatDate = (dateString) => {
//         // Logic to format date
//         return "N/A";
//     };
//
//     // if (loading) return <p className="loading-text">Loading...</p>;
//     // if (error) return <p className="error-text">{error}</p>;
//
//     const { totalOrders, totalPrice } = calculateOrderSummary();
//
//     return (
//         <Helmet title={`Sales Team Detail`}>
//             <section>
//                 <Container>
//                     <Row>
//                         <Col lg="12">
//                             {/*<h2 className="salesteam-title">Sales Team Member: {salesteamMember?.employeeName}</h2>*/}
//
//                             {/* Sales Team Member Details */}
//                             {/*<div className="salesteam-details">*/}
//                             {/*    <Table bordered className="member-table">*/}
//                             {/*        <tbody>*/}
//                             {/*        <tr>*/}
//                             {/*            <td><strong>Employee Name</strong></td>*/}
//                             {/*            <td>{salesteamMember?.employeeName}</td>*/}
//                             {/*        </tr>*/}
//                             {/*        <tr>*/}
//                             {/*            <td><strong>Employee ID</strong></td>*/}
//                             {/*            <td>{salesteamMember?.stID}</td>*/}
//                             {/*        </tr>*/}
//                             {/*        <tr>*/}
//                             {/*            <td><strong>Email</strong></td>*/}
//                             {/*            <td>{salesteamMember?.email}</td>*/}
//                             {/*        </tr>*/}
//                             {/*        <tr>*/}
//                             {/*            <td><strong>Phone</strong></td>*/}
//                             {/*            <td>{salesteamMember?.phone}</td>*/}
//                             {/*        </tr>*/}
//                             {/*        </tbody>*/}
//                             {/*    </Table>*/}
//                             {/*</div>*/}
//
//                             {/* Orders for this Sales Team Member */}
//                             <div className="order-details">
//                                 <h4 className="sub-title">Orders Summary</h4>
//                                 <Table bordered className="orders-table">
//                                     <tbody>
//                                     <tr>
//                                         <td><strong>Total Orders</strong></td>
//                                         <td>{totalOrders}</td>
//                                     </tr>
//                                     <tr>
//                                         <td><strong>Total Sales Value</strong></td>
//                                         <td>Rs. {totalPrice}</td>
//                                     </tr>
//                                     </tbody>
//                                 </Table>
//
//                                 {/* Orders List */}
//                                 <h4 className="sub-title">Order Details</h4>
//                                 <Table striped bordered className="items-table">
//                                     <thead>
//                                     <tr>
//                                         <th>Order ID</th>
//                                         <th>Order Date</th>
//                                         <th>Total Amount</th>
//                                     </tr>
//                                     </thead>
//                                     <tbody>
//                                     {/* Loop through orders */}
//                                     </tbody>
//                                 </Table>
//                             </div>
//
//                             <div className="text-center mt-4">
//                                 <Button color="primary" onClick={() => navigate("/all-saleteam")}>Back to Sales Team</Button>
//                             </div>
//                         </Col>
//                     </Row>
//                 </Container>
//             </section>
//         </Helmet>
//     );
// };
//
// export default SaleteamDetail;
