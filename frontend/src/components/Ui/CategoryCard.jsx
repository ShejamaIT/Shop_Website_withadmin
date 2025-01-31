import React, { useState, useEffect } from "react";
import "../../style/Product-card.css";
import { motion } from "framer-motion";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";
import ProductList from "./ProductList";
import CategoryList from "./CategoryList";

const CategoryCard = ({ category }) => {
    console.log(category);
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isHomeFurniture = category?.category === "Home Furniture";
    const imageUrl = category?.img ? `data:image/jpeg;base64,${category.img}` : "path/to/default-image.jpg";

    // Handle category click
    const handleCategoryClick = async () => {
        console.log(category.category,category.subcategory);
        setLoading(true);
        setError(null);

        try {
            let response;

            if (isHomeFurniture) {
                // Fetch Category Images
                response = await fetch(`http://localhost:5000/api/admin/getcategorytwoimg`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: category.subcategory
                    }),
                });
            } else {
                // Fetch Type ID & Items
                response = await fetch(`http://localhost:5000/api/admin/gettypeid`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: category.category,
                        sub_one : category.subcategory,
                        sub_two : "None"
                    }),
                });
            }

            if (!response.ok) throw new Error("Failed to fetch data");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);
            console.log(result.data);
            setData(result.data);
        } catch (err) {
            setError(err.message);
            console.error("Error fetching data:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Col lg="3" md="4" className="mb-2">
            <div className="product__item" onClick={handleCategoryClick}>
                <div className="product__img">
                    <motion.img whileHover={{ scale: 0.9 }} src={imageUrl} alt={category?.subcategory || "Product"} />
                </div>
                <div className="p-2 product__info">
                    <h3 className="product__name">{category?.subcategory}</h3>
                    <span>{category?.subcategory}</span>
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">{error}</p>}

            {isHomeFurniture ? <CategoryList categories={data} /> : <ProductList products={data} />}
        </Col>
    );
};

export default CategoryCard;
