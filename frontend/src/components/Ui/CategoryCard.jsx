import React, { useState, useEffect } from "react";
import "../../style/Product-card.css";
import { motion } from "framer-motion";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";
import ProductList from "./ProductList";
import CategoryList from "./CategoryList";

const CategoryCard = ({ category }) => {
    const [productsData, setProductsData] = useState([]);
    const imageUrl = category?.img ? `data:image/jpeg;base64,${category.img}` : 'path/to/default-image.jpg'; // Default fallback image URL

    // Conditional rendering based on category
    const isHomeFurniture = category?.category === "Home Furniture";

    useEffect(() => {
        // If the category is not "Home Furniture", fetch product data for this category
        if (!isHomeFurniture) {
            // Assuming you fetch products by category, adjust the API call accordingly
            fetch(`/api/products?category=${category?.category}`)
                .then((res) => res.json())
                .then((data) => setProductsData(data))
                .catch((error) => console.error("Error fetching products:", error));
        }
    }, [category?.category, isHomeFurniture]);

    return (
        <Col lg="3" md="4" className="mb-2">
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

                    {/* Conditional rendering based on category */}
                    {isHomeFurniture ? (
                        <CategoryList category={category} />
                    ) : (
                        <ProductList products={productsData} />
                    )}
                </div>
            </div>
        </Col>
    );
};

export default CategoryCard;
