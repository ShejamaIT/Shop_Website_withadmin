import React, {useEffect, useState} from "react";
import {Container, Row, Col, Button} from "reactstrap";
import Productimg from '../assets/images/double-sofa-03.png';
import '../style/allProducts.css';
import axios from "axios";
import {toast} from "react-toastify";
import userImg from "../assets/images/user-icon.png";
import {Link} from "react-router-dom";


const AllProducts = () =>{

    const [items, setItem] = useState([]);
    const [loading, setLoading] = useState(false);

    const getAllItems = async () => {
        console.log("Fetching Items...");
        setLoading(true);
        try {
            const response = await axios.get("http://localhost:4000/item", { withCredentials: true });
            setItem(response.data.data);
            console.log(items.length)
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        getAllItems();
    }, []);


    return <section>
        <Container>
            <Row>
                <Col>
                    <Button className={'add-product'}><Link to="/dashboard/add-products">Add-Product</Link></Button>
                </Col>
                <Col lg='12'>
                    <table className={'table table-bordered'}>
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>Title</th>
                                <th>Category</th>
                                <th>Price</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                        {items.length > 0 ? (
                            items.map(item => (
                                <tr key={item._id}>
                                    <td><img src={Productimg} alt="User" /></td>
                                    <td>{item.productName}</td>
                                    <td>{item.category}</td>
                                    <td>{item.price}</td>
                                    <td><button className="btn btn-danger">Delete</button></td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">No users found</td>
                            </tr>
                        )}
                        </tbody>
                    </table>
                </Col>
            </Row>
        </Container>
    </section>

};

export default AllProducts;
