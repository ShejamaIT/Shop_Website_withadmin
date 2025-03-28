import React from "react";

import "../../style/Product-card.css";
import {motion} from "framer-motion";
import { Col } from "reactstrap";
import {Link} from "react-router-dom";
import { toast } from 'react-toastify';

import { useDispatch } from "react-redux";
import { cartActions } from "../../redux/slices/cartSlice";

const ProductCard = ({item}) =>{

    const dispatch = useDispatch()

    const addToCart = ()=>{
        dispatch(
            cartActions.addItem({
                id: item.I_Id,
                I_name: item.I_name,
                price: item.price,
                img : item.img,
            })
        );
        toast.success('Product Added Successfully.')
    };
    return (
        <Col lg='3' md='4' className="mb-2">
            <div className="product__item">
                <div className="product__img">
                    <motion.img whileHover={{scale: 0.9}} src={item.img}/>
                </div>
                <div className="p-2 product__info">
                    <h3 className="product__name">
                        <Link to={`/shop/${item.I_Id}`}>{item.I_name}</Link></h3>
                    <span>{item.category}</span>
                </div>
                <div
                    className="product_card-bottom d-flex align-items-center justify-content-between p-2">
                    <span className="price">Rs.{item.price}</span>
                    <motion.span whileTap={{scale: 1.2}} onClick={addToCart}>
                    <i className="ri-add-line"></i>
                </motion.span>
                </div>
            </div>
        </Col>
    );
};

export default ProductCard;
