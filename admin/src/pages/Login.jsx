import React,{useState} from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form,FormGroup} from "reactstrap";
import { Link , useNavigate } from "react-router-dom";
import '../style/login.css';
import {  toast } from "react-toastify";
import axios from "axios";
import Cookies from 'js-cookie';


const Login = () => {

    const navigate = useNavigate()
    const [email,setEmail]= useState('')
    const [password,setPassword]= useState('')

    const validateSubmition = (e) => {
        e.preventDefault();
        // validation
        if( email && password) {
            submitLogin();
        } else {
            toast.error('Invalid Inputs..')
        }
    }

    const submitLogin = () => {

        const headers = {'Content-Type': 'application/json'}

        let body = {
            email: email,
            password: password
        }
        console.log(body);

        axios.post("http://localhost:4000/auth/login", body, {headers: headers}).then(r => {
            Cookies.set("token", r.data.token);
            Cookies.set("user_email", r.data.data.email);
            navigate("/dashboard");
            toast.success('Login Sucessfully..')

        }).catch(err => {
            toast.error('Something went wrong...')
            console.log(err)
        })

    }


    return (
        <Helmet title={'Login'}>
            <section>
                <Container>
                    <Row>
                        <Col lg={6} className={'m-auto text-center'}>
                            <h3 className={'fw-bold mb-4'}>Login</h3>

                            <Form className={'auth__form'}>
                                <FormGroup className={'form__group'}>
                                    <input type={'email'} placeholder={'Enter your email'}
                                           value={email} onChange={e=> setEmail(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className={'form__group'}>
                                    <input type={'password'} placeholder={'Enter your password'}
                                           value={password} onChange={e=> setPassword(e.target.value)}/>
                                </FormGroup>

                                <button type={'submit'} onClick={validateSubmition} className='btn auth__btn'>Login</button>
                                <p>Don't have an account? <Link to={'/signup'}>Create an account</Link></p>

                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default  Login;
