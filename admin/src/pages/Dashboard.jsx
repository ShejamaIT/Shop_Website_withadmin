import React, {useEffect, useState} from "react";
import {Container, Row, Col, Nav} from "reactstrap";
import Helmet from "../components/Helmet/Helmet";
import TableThree from "../components/tables/TableThree";
import NavBar from "../components/header/navBar";
import '../style/Dashboard.css';

const Dashboard = () =>{


    return (
        <Helmet title={'Dashboard'}>
            <section >
                <Row>
                    <NavBar/>
                </Row>
                <Container className='dashboard'>
                    <Row>
                        <TableThree/>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );

};

export default Dashboard;
