import React, { useState, useEffect } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import '../style/productDetails.css';
import axios from "axios";
import {useParams} from "react-router-dom";

const ProductDetails = () => {
    const { id } = useParams(); // Get id parameter from URL

    const [product, setProduct] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await axios.get(`http://localhost:4000/item/${id}/details`);
                setProduct(response.data.data);
                console.log(response.data.data.imgUrl); // Check if this logs the correct image URL
                setLoading(false);
            } catch (err) {
                console.error(err);
                setError(err.message);
                setLoading(false);
            }
        };

        fetchProduct();
    }, [id]);

    const imageUrl = product.imgUrl; // Assuming product.imgUrl is like "http://localhost:4000/uploads/images/1719478644510.png"
    const relativeImagePath = imageUrl.split('http://localhost:4000')[1];
    console.log(relativeImagePath);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p>Error: {error}</p>;
    }

    if (!product) {
        return <p>Product not found</p>;
    }

    return (
        <Helmet title={`Product Details - ${product.productName}`}>
            <section>
                <Container>
                    <Row>
                        <Col lg='12'>
                            <h4 className='mb-5'>{product.productName} Details</h4>
                            <div className="product-details">
                                <div className="product-image">
                                    <img src={relativeImagePath} alt={product.productName} />
                                </div>
                                <div className="product-info">
                                    <p><strong>Product Name:</strong> {product.productName}</p>
                                    <p><strong>Category:</strong> {product.category}</p>
                                    <p><strong>Price:</strong> {product.price}</p>
                                    <p><strong>Short Description:</strong> {product.shortDesc}</p>
                                    <p><strong>Description:</strong> {product.description}</p>
                                </div>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ProductDetails;
