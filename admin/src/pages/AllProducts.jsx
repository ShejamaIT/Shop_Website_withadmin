import React, {useEffect, useState} from "react";
import {Container, Row, Col, Button} from "reactstrap";
import '../style/allProducts.css';
import Helmet from "../components/Helmet/Helmet";
import NavBar from "../components/header/navBar";
import TableTwo from "../components/tables/TableTwo";


const AllProducts = () =>{

    const [items, setItem] = useState([]);
    const [loading, setLoading] = useState(false);

    const getAllItems = async () => {
        // console.log("Fetching Items...");
        // setLoading(true);
        // try {
        //     const response = await axios.get("http://localhost:4000/item", { withCredentials: true });
        //     setItem(response.data.data);
        //     console.log(items.length)
        // } catch (err) {
        //     console.log(err);
        // } finally {
        //     setLoading(false);
        // }
    };
    useEffect(() => {
        getAllItems();
    }, []);


    return (
        <Helmet title={'All-Products'}>
            <section >
                <Row>
                    <NavBar/>
                </Row>
                <Container className='all-products'>
                    <Row>
                        <TableTwo/>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );


};

export default AllProducts;
