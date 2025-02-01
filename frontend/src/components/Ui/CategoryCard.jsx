import React, { useState, useEffect } from "react";
import "../../style/Product-card.css";
import { motion } from "framer-motion";
import { Col } from "reactstrap";
import { Link } from "react-router-dom";
import ProductList from "./ProductList";
import CategoryList from "./CategoryList";

const CategoryCard = ({ category }) => {
    console.log(category);
    const [data, setData] = useState([]); // This will store the fetched products or subcategories
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const isHomeFurniture = category?.category === "Home Furniture";
    const imageUrl = category?.img ? `data:image/jpeg;base64,${category.img}` : "path/to/default-image.jpg";

    // Handle category click
    const handleCategoryClick = async () => {
        console.log(category.category, category.subcategory);
        setLoading(true);
        setError(null);

        try {
            let response;

            // If it's "Home Furniture", fetch subcategories or products
            if (isHomeFurniture) {
                // Fetch subcategories for "Home Furniture"
                response = await fetch(`http://localhost:5000/api/admin/getcategorytwoimg`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: category.subcategory
                    }),
                });
            } else {
                // For other categories, fetch products
                response = await fetch(`http://localhost:5000/api/admin/gettypeid`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        category: category.category,
                        sub_one: category.subcategory,
                        sub_two: "None" // Assuming "None" here means no second-level subcategory
                    }),
                });
            }

            if (!response.ok) throw new Error("Failed to fetch data");
            const result = await response.json();
            if (!result.success) throw new Error(result.message);

            console.log(result.data);
            setData(result.data); // Set the fetched data (either subcategories or products)
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
                    <h3 className="product__name text-center">{category?.subcategory}</h3>
                </div>
            </div>

            {loading && <p>Loading...</p>}
            {error && <p className="text-danger">{error}</p>}

            {/* Render CategoryList or ProductList based on data */}
            {isHomeFurniture ? <CategoryList data={data} /> : <ProductList data={data} />}
        </Col>
    );
};

export default CategoryCard;
