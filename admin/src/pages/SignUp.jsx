import React,{useState} from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form,FormGroup} from "reactstrap";
import { Link , useNavigate } from "react-router-dom";
import '../style/login.css';
import {  toast } from "react-toastify";
import axios from "axios";


const Signup = () => {

    const [username,setUsername]= useState('')
    const [email,setEmail]= useState('')
    const [password,setPassword]= useState('')
    //const [file,setFile]= useState(null)
    const navigate = useNavigate()

    const validateSubmition = (e) => {
        e.preventDefault();
        // validation
        if( username && email && password) {
            submitNewUser();
        } else {
            toast.error('Invalid Inputs..')
        }
    }

    const submitNewUser = () => {

        const headers = {'Content-Type': 'application/json'}

        let body = {
            username: username,
            email: email,
            password: password
        }

        axios.post("http://localhost:4000/auth/register", body, {headers: headers}).then(r => {
            toast.success('Register Successfully..')
            navigate('/login')

        }).catch(err => {
            toast.error('Something went wrong...')
        })

    }


    return (
        <Helmet title={'Signup'}>
            <section>
                <Container>
                    <Row>
                        <Col lg={6} className={'m-auto text-center'}>
                            <h3 className={'fw-bold mb-4'}>Signup</h3>

                            <Form className={'auth__form'} >
                                <FormGroup className={'form__group'}>
                                    <input type={'text'} placeholder={'Enter Username'}
                                           value={username} onChange={e=> setUsername(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className={'form__group'}>
                                    <input type={'email'} placeholder={'Enter your email'}
                                           value={email} onChange={e=> setEmail(e.target.value)}/>
                                </FormGroup>
                                <FormGroup className={'form__group'}>
                                    <input type={'password'} placeholder={'Enter your password'}
                                           value={password} onChange={e=> setPassword(e.target.value)}/>
                                </FormGroup>
                                {/*<FormGroup className={'form__group'}>*/}
                                {/*    <input type={'file'} onChange={e=> setFile(e.target.value)}/>*/}
                                {/*</FormGroup>*/}
                                <button type={'submit'} onClick={validateSubmition} className='btn auth__btn '>Create an account</button>
                                <p>Already have an account? <Link to={'/login'}>Login</Link></p>
                            </Form>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default  Signup;