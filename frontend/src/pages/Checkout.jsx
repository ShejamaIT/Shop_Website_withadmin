import React, {useState } from "react";
import {Container, Row, Col, Form, FormGroup} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import CommonSection from "../components/Ui/CommonSection";
import '../style/checkout.css';
import { useSelector  } from "react-redux";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {toast} from "react-toastify";

const Checkout = () => {

    const totalQty = useSelector(state => state.cart.totalQuantity)
    const totalAmount = useSelector(state => state.cart.totalAmount)
    const cartItems = useSelector(state => state.cart.cartItems)
    const navigate = useNavigate()

    const [name , setName] = useState('');
    const [email , setEmail] = useState('');
    const [number , setNumber] = useState('');
    const [address , setAddress] = useState('');
    const [city , setCity] = useState('');
    const [postalcode , setPostalcode] = useState('');

    const placeOrder = () => {
        const headers = { 'Content-Type': 'application/json' };

        const orderDetails = {
            customerName: name,
            customerAddress: address,
            city: city,
            postalCode: postalcode,
            email: email,
            phoneNumber: number,
            cartItems: cartItems,
            totalAmount: totalAmount
        };
        console.log("orderDetails "+orderDetails);

        axios.post('http://localhost:4000/order', orderDetails, { headers: headers, withCredentials: true })
            .then(response => {
                console.log(response.data);
                toast.success('Order placed successfully.');
                navigate('/home'); // Example: Navigate to home page after successful order
            })
            .catch(error => {
                console.error(error);
                toast.error('Failed to place order. Please try again.');
            });
    };


    return (
        <Helmet title={'Checkout'}>
            <CommonSection title={'Checkout'}/>
            <section>
                <Container>
                    <Row>
                        <Col lg={8}>
                            <h6 className={'mb-4 fw-bold'}>Billing Information</h6>
                            <Form action="" className={'billing__form'}>
                                <FormGroup className="form__group">
                                    <input type="text"
                                           placeholder={'Enter your name'}
                                           onChange={e => setName(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="email"
                                           placeholder={'Enter your email'}
                                           onChange={e => setEmail(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="number"
                                           placeholder={'Phone number'}
                                           onChange={e => setNumber(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text"
                                           placeholder={'Address'}
                                           onChange={e => setAddress(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text"
                                           placeholder={'City'}
                                           onChange={e => setCity(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className="form__group">
                                    <input type="text"
                                           placeholder={'Postal code'}
                                           onChange={e => setPostalcode(e.target.value)}/>
                                </FormGroup>
                            </Form>
                        </Col>
                        <Col lg={4}>
                            <div className="checkout__cart">
                                <h6>Total Qty: <span>{totalQty} items</span></h6>
                                <h6>Subtotal: <span>{totalAmount}</span></h6>
                                <h6>
                                    <span>
                                        Shipping: <br/>
                                        (free shipping)
                                    </span>
                                    <span>$0</span>
                                </h6>
                                <h4>Total cost: <span>{totalAmount}</span></h4>

                                <button className='buy_btn auth__btn w-100' onClick={placeOrder}>Place an order</button>
                            </div>

                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
}

export default Checkout;
