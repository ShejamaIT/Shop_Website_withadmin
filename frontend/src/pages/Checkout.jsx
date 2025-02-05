// import React, { useState } from "react";
// import { Container, Row, Col, Form, FormGroup } from "reactstrap";
// import Helmet from "../components/Helmet/Helmet";
// import CommonSection from "../components/Ui/CommonSection";
// import "../style/checkout.css";
// import { useSelector } from "react-redux";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";
//
// const Checkout = () => {
//     const totalQty = useSelector((state) => state.cart.totalQuantity);
//     const totalAmount = useSelector((state) => state.cart.totalAmount);
//     const cartItems = useSelector((state) => state.cart.cartItems);
//     const navigate = useNavigate();
//
//     const [delivery, setDelivery] = useState(false);
//     const [pickup, setPickup] = useState(false);
//     const [name, setName] = useState("");
//     const [email, setEmail] = useState("");
//     const [number, setNumber] = useState("");
//     const [address, setAddress] = useState("");
//     const [district, setDistrict] = useState("");
//     const [city, setCity] = useState("");
//     const [specialNote, setSpecialNote] = useState("");
//     const [coupon, setCoupon] = useState("");
//     const [deliveryCharge, setDeliveryCharge] = useState(0);
//     const [discount, setDiscount] = useState(0);
//     const [expectedDate, setExpectedDate] = useState("");
//     const [deliveryDates, setDeliveryDates] = useState([]);
//     const districts = ["Colombo", "Gampaha", "Kalutara", "Kandy"];
//
//     // Handle checkbox selection
//     const handleDeliveryChange = (e) => {
//         setDelivery(e.target.checked);
//         setPickup(false);
//         setDeliveryCharge(0);
//         setExpectedDate("");
//     };
//
//     const handlePickupChange = (e) => {
//         setPickup(e.target.checked);
//         setDelivery(false);
//         setDeliveryCharge(0);
//         setAddress("");
//         setDistrict("");
//         setExpectedDate("");
//     };
//
//     // Fetch delivery charge & schedule when district changes
//     const handleDistrictChange = async (e) => {
//         const selectedDistrict = e.target.value;
//         setDistrict(selectedDistrict);
//         setExpectedDate("");
//
//         if (!selectedDistrict || !delivery) {
//             setDeliveryCharge(0);
//             setDeliveryDates([]);
//             return;
//         }
//
//         try {
//             // Fetch delivery charge
//             const chargeResponse = await fetch(`http://localhost:5000/api/admin/delivery-schedule?district=${selectedDistrict}`);
//             const chargeData = await chargeResponse.json();
//             if (!chargeResponse.ok) throw new Error(chargeData.message || "Failed to fetch delivery rate");
//
//             setDeliveryCharge(chargeData.amount);
//
//             // Fetch delivery schedule
//             const scheduleResponse = await fetch(`http://localhost:5000/api/admin/delivery-schedule?district=${selectedDistrict}`);
//             const scheduleData = await scheduleResponse.json();
//             if (!scheduleResponse.ok) throw new Error(scheduleData.message || "Failed to fetch schedule");
//
//             if (scheduleData.upcomingDates.length > 0) {
//                 setDeliveryDates(scheduleData.upcomingDates);
//                 setExpectedDate(scheduleData.upcomingDates[0]); // Auto-fill first available date
//             } else {
//                 setDeliveryDates([]);
//                 setExpectedDate("No available dates");
//             }
//
//         } catch (error) {
//             toast.error(error.message || "Failed to fetch delivery details.");
//             setDeliveryCharge(0);
//             setDeliveryDates([]);
//         }
//     };
//
//     // Validate and apply discount
//     const handleCouponBlur = async () => {
//         if (!coupon.trim()) {
//             setDiscount(0);
//             return;
//         }
//
//         try {
//             const response = await fetch("http://localhost:5000/api/admin/coupone", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json" },
//                 body: JSON.stringify({ cpID: coupon }),
//             });
//
//             const result = await response.json();
//             if (!response.ok) {
//                 throw new Error(result.message || "Invalid coupon code");
//             }
//
//             if (result.success && result.data.length > 0) {
//                 setDiscount(result.data[0].discount);
//                 toast.success(`Coupon applied! Discount: Rs. ${result.data[0].discount}`);
//             } else {
//                 setDiscount(0);
//                 toast.error("Invalid or expired coupon.");
//             }
//         } catch (error) {
//             toast.error(error.message || "Failed to validate coupon.");
//             setDiscount(0);
//         }
//     };
//
//     const placeOrder = async () => {
//         const token = localStorage.getItem("token");
//         if (!token) {
//             toast.warning("Please log in to place an order.");
//             navigate("/signin");
//             return;
//         }
//
//         const finalTotal = totalAmount + deliveryCharge - discount;
//
//         const orderDetails = {
//             customerName: name,
//             deliveryMethod: delivery ? "Delivery" : "Pick Up",
//             customerAddress: delivery ? address : "N/A",
//             district: delivery ? district : "N/A",
//             email: email,
//             phoneNumber: number,
//             cartItems: cartItems.map(item => ({
//                 I_Id: item.id,
//                 qty: item.quantity,
//                 price: item.price
//             })),
//             totalAmount: finalTotal,
//             deliveryCharge: delivery ? deliveryCharge : 0,
//             discount: discount,
//             coupon: coupon || null,
//             expectedDate: delivery ? expectedDate : "N/A",
//             specialNote: specialNote,
//         };
//
//         try {
//             const response = await fetch("http://localhost:5000/api/admin/orders", {
//                 method: "POST",
//                 headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
//                 body: JSON.stringify(orderDetails),
//             });
//
//             const result = await response.json();
//             if (!response.ok) {
//                 throw new Error(result.message || "Failed to place order.");
//             }
//
//             toast.success("Order placed successfully!");
//             navigate("/home");
//         } catch (error) {
//             toast.error(error.message || "An error occurred while placing the order.");
//         }
//     };
//
//     return (
//         <Helmet title={"Checkout"}>
//             <CommonSection title={"Checkout"} />
//             <section>
//                 <Container>
//                     <Row>
//                         <Col lg={8}>
//                             <h6 className={"mb-4 fw-bold"}>Billing Information</h6>
//                             <Form className={"billing__form"}>
//                                 <FormGroup className="form__group">
//                                     <div className="delivery-options">
//                                         <input id="delivery" type="checkbox" checked={delivery} onChange={handleDeliveryChange} />
//                                         <label htmlFor="delivery" className="text-small">Delivery</label>
//
//                                         <input id="pickup" type="checkbox" checked={pickup} onChange={handlePickupChange} />
//                                         <label htmlFor="pickup" className="text-small">Pick Up</label>
//                                     </div>
//                                 </FormGroup>
//

//                                 {delivery && (
//                                     <>
//                                         <FormGroup className="form__group">
//                                             <input type="text" placeholder="Address" onChange={(e) => setAddress(e.target.value)} />
//                                         </FormGroup>
//
//                                         <FormGroup className="form__group">
//                                             <Row>
//                                                 <Col lg={6}>
//                                                     <select onChange={handleDistrictChange} className="form-control">
//                                                         <option value="">Select District</option>
//                                                         {districts.map((dist, index) => (
//                                                             <option key={index} value={dist}>{dist}</option>
//                                                         ))}
//                                                     </select>
//                                                 </Col>
//                                                 <Col lg={6}>
//                                                     <FormGroup className="form__group">
//                                                         <input type="text" placeholder="City" onChange={(e) => setCity(e.target.value)} />
//                                                     </FormGroup>
//                                                 </Col>
//                                                 {deliveryDates.length > 0 && (
//                                                     <Col lg={6}>
//                                                         <select onChange={(e) => setExpectedDate(e.target.value)} className="form-control">
//                                                             <option value="">Scheduled Delivery dates to your city</option>
//                                                             {deliveryDates.map((date, index) => (
//                                                                 <option key={index} value={date}>{date}</option>
//                                                             ))}
//                                                         </select>
//                                                     </Col>
//                                                 )}
//                                             </Row>
//                                         </FormGroup>
//                                     </>
//                                 )}
//                                 <FormGroup className="form__group">
//                                     <input
//                                         type="date"
//                                         value={expectedDate}
//                                         onChange={(e) => setExpectedDate(e.target.value)}
//                                         onFocus={(e) => e.target.style.color = "#000"}  // Make text visible on focus
//                                         onBlur={(e) => e.target.style.color = e.target.value ? "#000" : "#aaa"}  // Reset color if empty
//                                         style={{ color: expectedDate ? "#000" : "#aaa" }}  // Placeholder effect
//                                     />
//                                     Select Expected date to Delivery Or Pick up
//                                 </FormGroup>
//

//                             </Form>
//                         </Col>
//

//                     </Row>
//                 </Container>
//             </section>
//         </Helmet>
//     );
// };
//
// export default Checkout;


import React, { useState } from "react";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import "../style/checkout.css";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const Checkout = () => {
    const totalQty = useSelector((state) => state.cart.totalQuantity);
    const totalAmount = useSelector((state) => state.cart.totalAmount);
    const cartItems = useSelector((state) => state.cart.cartItems);
    const navigate = useNavigate();

    const [delivery, setDelivery] = useState(false);
    const [pickup, setPickup] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [address, setAddress] = useState("");
    const [district, setDistrict] = useState("");
    const [city, setCity] = useState("");
    const [specialNote, setSpecialNote] = useState("");
    const [coupon, setCoupon] = useState("");
    const [deliveryCharge, setDeliveryCharge] = useState(0);
    const [discount, setDiscount] = useState(0);
    const [expectedDate, setExpectedDate] = useState("");
    const [deliveryDates, setDeliveryDates] = useState([]);
    const districts = ["Colombo", "Gampaha", "Kalutara", "Kandy"];

    // Handle checkbox selection
    const handleDeliveryChange = (e) => {
        setDelivery(e.target.checked);
        setPickup(false);
        setDeliveryCharge(0);
        setExpectedDate("");
    };

    const handlePickupChange = (e) => {
        setPickup(e.target.checked);
        setDelivery(false);
        setDeliveryCharge(0);
        setAddress("");
        setDistrict("");
        setExpectedDate("");
    };

    // Fetch delivery charge & schedule when district changes
    const handleDistrictChange = async (e) => {
        const selectedDistrict = e.target.value;
        setDistrict(selectedDistrict);
        setExpectedDate("");

        if (!selectedDistrict || !delivery) {
            setDeliveryCharge(0);
            setDeliveryDates([]);
            return;
        }

        try {
            // Fetch delivery charge
            const chargeResponse = await fetch(`http://localhost:5000/api/admin/delivery-rate?district=${selectedDistrict}`);
            const chargeData = await chargeResponse.json();
            if (!chargeResponse.ok) throw new Error(chargeData.message || "Failed to fetch delivery rate");

            setDeliveryCharge(chargeData.amount);

            // Fetch delivery schedule
            const scheduleResponse = await fetch(`http://localhost:5000/api/admin/delivery-schedule?district=${selectedDistrict}`);
            const scheduleData = await scheduleResponse.json();
            if (!scheduleResponse.ok) throw new Error(scheduleData.message || "Failed to fetch schedule");

            setDeliveryDates(scheduleData.upcomingDates);
        } catch (error) {
            toast.error(error.message || "Failed to fetch delivery details.");
            setDeliveryCharge(0);
            setDeliveryDates([]);
        }
    };

    // Validate and apply discount
    const handleCouponBlur = async () => {
        if (!coupon.trim()) {
            setDiscount(0);
            return;
        }

        try {
            const response = await fetch("http://localhost:5000/api/admin/coupone", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ cpID: coupon }),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Invalid coupon code");
            }

            if (result.success && result.data.length > 0) {
                setDiscount(result.data[0].discount);
                toast.success(`Coupon applied! Discount: Rs. ${result.data[0].discount}`);
            } else {
                setDiscount(0);
                toast.error("Invalid or expired coupon.");
            }
        } catch (error) {
            toast.error(error.message || "Failed to validate coupon.");
            setDiscount(0);
        }
    };

    const placeOrder = async () => {
        const token = localStorage.getItem("token");
        if (!token) {
            toast.warning("Please log in to place an order.");
            navigate("/signin");
            return;
        }

        const finalTotal = totalAmount + deliveryCharge - discount;

        const orderDetails = {
            customerName: name,
            deliveryMethod: delivery ? "Delivery" : "Pick Up",
            customerAddress: delivery ? address : "N/A",
            district: delivery ? district : "N/A",
            city : city,
            email: email,
            phoneNumber: number,
            cartItems: cartItems.map(item => ({
                I_Id: item.id,
                qty: item.quantity,
                price: item.price
            })),
            totalAmount: finalTotal,
            deliveryCharge: delivery ? deliveryCharge : 0,
            discount: discount,
            coupon: coupon || null,
            expectedDate: delivery ? expectedDate : "N/A",
            specialNote: specialNote,
        };

        try {
            const response = await fetch("http://localhost:5000/api/admin/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify(orderDetails),
            });

            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.message || "Failed to place order.");
            }

            toast.success("Order placed successfully!");
            navigate("/home");
        } catch (error) {
            toast.error(error.message || "An error occurred while placing the order.");
        }
    };

    return (
        <Helmet title={"Checkout"}>
            <CommonSection title={"Checkout"} />
            <section>
                <Container>
                    <Row>
                        <Col lg={8}>
                            <h6 className={"mb-4 fw-bold"}>Billing Information</h6>
                            <Form className={"billing__form"}>
                                <FormGroup className="form__group">
                                    <div className="delivery-options">
                                        <input id="delivery" type="checkbox" checked={delivery} onChange={handleDeliveryChange} />
                                        <label htmlFor="delivery" className="text-small">Delivery</label>

                                        <input id="pickup" type="checkbox" checked={pickup} onChange={handlePickupChange} />
                                        <label htmlFor="pickup" className="text-small">Pick Up</label>
                                    </div>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text" placeholder="Enter your name" onChange={(e) => setName(e.target.value)} />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input type="email" placeholder="Enter your email" onChange={(e) => setEmail(e.target.value)} />
                                </FormGroup>

                                <FormGroup className="form__group">
                                    <input type="number" placeholder="Phone number" onChange={(e) => setNumber(e.target.value)} />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text" placeholder="City" onChange={(e) => setCity(e.target.value)} />
                                </FormGroup>
                                {delivery && (
                                    <>

                                        <Row>
                                            <Col lg={6}>
                                                <FormGroup className="form__group">
                                                    <select onChange={handleDistrictChange} className="form-control">
                                                        <option value="">Select District</option>
                                                        {districts.map((dist, index) => (
                                                            <option key={index} value={dist}>{dist}</option>
                                                        ))}
                                                    </select>
                                                </FormGroup>
                                            </Col>
                                            <Col lg={6}>
                                                <FormGroup className="form__group">
                                                    <input type="text" placeholder="Address" onChange={(e) => setAddress(e.target.value)} />
                                                </FormGroup>

                                            </Col>
                                        </Row>


                                        {deliveryDates.length > 0 && (
                                            <FormGroup className="form__group">
                                                <label>Scheduled Delivery Dates:</label>
                                                <ul>
                                                    {deliveryDates.map((date, index) => (
                                                        <li key={index}>{date}</li>
                                                    ))}
                                                </ul>
                                            </FormGroup>
                                        )}
                                    </>
                                )}

                                <FormGroup className="form__group">
                                    <input type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
                                    <text>Select Expected Date for Delivery or Pickup</text>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text" placeholder="Special Note" onChange={(e) => setSpecialNote(e.target.value)} />
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input
                                        type="text"
                                        placeholder="Coupon code"
                                        value={coupon}
                                        onChange={(e) => setCoupon(e.target.value)}
                                        onBlur={handleCouponBlur} // Call API only when user finishes typing
                                    />
                                    <span
                                        className="placeholder-text"
                                        onClick={() => document.querySelector('input[type="date"]').focus()}
                                    >
                                           if you want a Coupone code Please contact our sale team.
                                        </span>
                                </FormGroup>
                            </Form>
                        </Col>

                        <Col lg={4}>
                            <div className="checkout__cart">
                                <h6>Total Qty: <span>{totalQty} items</span></h6>
                                <h6>Subtotal: <span>Rs.{totalAmount}</span></h6>
                                <h6>Delivery: <span>Rs.{deliveryCharge}</span></h6>
                                <h6>Discount: <span>Rs.{discount}</span></h6>
                                <h4>Total cost: <span>Rs.{totalAmount + deliveryCharge - discount}</span></h4>

                                <button className="buy_btn auth__btn w-100" onClick={placeOrder}>
                                    Place an order
                                </button>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Checkout;
