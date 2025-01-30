import React, { useState } from "react";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col, Form, FormGroup } from "reactstrap";
import '../style/addProduct.css';
import { toast } from "react-toastify";
import axios from "axios";
import {Navigate, useNavigate} from "react-router-dom";

const AddProduct = () => {
    const [enterTitle, setEnterTitle] = useState('');
    const [enterShortDesc, setShortDesc] = useState('');
    const [enterDescription, setDescription] = useState('');
    const [enterCategory, setCategory] = useState('');
    const [enterPrice, setPrice] = useState('');
    const [enterImage, setImage] = useState(null);
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const addProduct = async (e) => {
        e.preventDefault();
        setLoading(true);
        const productData = {
            productName: enterTitle,
            category: enterCategory,
            price: enterPrice,
            shortDesc: enterShortDesc,
            description: enterDescription,
        };

        try {
            const response = await axios.post("http://localhost:4000/item/", productData, {
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (enterImage) {
                const formData = new FormData();
                formData.append("imgUrl", enterImage);
                await axios.post(`http://localhost:4000/item/${response.data.data._id}/upload`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
            }
            setLoading(false);
            toast.success('Product saved successfully...');
            navigate('/dashboard/all-products');

        } catch (err) {
            setLoading(false);
            toast.error('Something went wrong...');
            console.log(err);
        }
    }



    return (
        <Helmet title='Add-Products'>
            <section>
                <Container>
                    <Row>
                        <Col lg='12'>
                            {
                                loading ? <h4 className='py-5'>Loading....</h4> : <>
                                    <h4 className='mb-5'>Add Products</h4>
                                    <Form onSubmit={addProduct}>
                                        <FormGroup className="form__group">
                                            <span>Product Title</span>
                                            <input type='text'
                                                   placeholder='Double Sofa'
                                                   value={enterTitle}
                                                   onChange={e => setEnterTitle(e.target.value)}
                                                   required />
                                        </FormGroup>
                                        <FormGroup className="form__group">
                                            <span>Short Description</span>
                                            <input type='text'
                                                   placeholder='Short description...'
                                                   value={enterShortDesc}
                                                   onChange={e => setShortDesc(e.target.value)}
                                                   required />
                                        </FormGroup>
                                        <FormGroup className="form__group">
                                            <span>Description</span>
                                            <input type='text'
                                                   placeholder='Description...'
                                                   value={enterDescription}
                                                   onChange={e => setDescription(e.target.value)}
                                                   required />
                                        </FormGroup>
                                        <div className='d-flex align-items-center justify-content-between gap-5'>
                                            <FormGroup className="form__group w-50">
                                                <span>Price</span>
                                                <input type='number'
                                                       placeholder='Price'
                                                       value={enterPrice}
                                                       onChange={e => setPrice(e.target.value)}
                                                       required />
                                            </FormGroup>
                                            <FormGroup className="form__group w-50">
                                                <span>Category</span>
                                                <select className='w-100 p-2'
                                                        value={enterCategory}
                                                        onChange={e => setCategory(e.target.value)}>
                                                    <option value='chair'>Chair</option>
                                                    <option value='sofa'>Sofa</option>
                                                    <option value='mobile'>Mobile</option>
                                                    <option value='watch'>Watch</option>
                                                </select>
                                            </FormGroup>
                                        </div>
                                        <FormGroup className="form__group">
                                            <span>Product Image</span>
                                            <input type='file'
                                                   onChange={e => setImage(e.target.files[0])}
                                                   required />
                                        </FormGroup>
                                        <button className="primary__btn btn" type='submit'>Add Product</button>
                                    </Form>
                                </>
                            }
                        </Col>
                    </Row>
                </Container>
            </section>
        </Helmet>
    )
};

export default AddProduct;
