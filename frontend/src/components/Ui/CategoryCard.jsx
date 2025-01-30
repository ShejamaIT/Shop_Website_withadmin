import React from "react";
import "../../style/Product-card.css";
import { motion } from "framer-motion";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";

const CategoryCard = ({ category }) => {
    const imageUrl = category?.img ? `data:image/jpeg;base64,${category.img}` : 'path/to/default-image.jpg'; // Default fallback image URL

    return (
        <Col lg='3' md='4' className="mb-2">
            <div className="product__item">
                <div className="product__img">
                    <motion.img
                        whileHover={{ scale: 0.9 }}
                        src={imageUrl}
                        alt={category?.subcategory || "Product"}
                    />
                </div>
                <div className="p-2 product__info">
                    <h3 className="product__name">
                        {/* You can uncomment and update this line if you want a link */}
                        {/* <Link to={`/shop/${category.subcategory}`}>{category.subcategory}</Link> */}
                    </h3>
                    <span>{category?.subcategory}</span>
                </div>
            </div>
        </Col>
    );
};

export default CategoryCard;
