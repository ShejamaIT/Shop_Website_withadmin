import React, { useState, useEffect } from 'react';
import CommonSection from "../components/Ui/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container, Row, Col } from "reactstrap";
import "../style/shop.css";
import ProductDisplay from "../components/Ui/ProductDisplay";
import ProductList from "../components/Ui/ProductList"; // Component for random products

const Shop = () => {
    const [selectedCategory, setSelectedCategory] = useState('');
    const [randomProducts, setRandomProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch 12 random products when the page loads
    useEffect(() => {
        const fetchRandomProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch("http://localhost:5000/api/admin/get3items");
                const data = await response.json();
                console.log(data);
                setRandomProducts(data);
            } catch (error) {
                console.error("Error fetching random products:", error);
                setRandomProducts([]);
            } finally {
                setLoading(false);
            }
        };

        fetchRandomProducts();
    }, []);

    // Handle category filter change
    const handleFilter = (e) => {
        const newCategory = e.target.value === "Filter By Category" ? "" : e.target.value;
        setSelectedCategory(newCategory);
    };

    return (
        <Helmet title={'Shop'}>
            <CommonSection title="Products" />

            {/* Category Filter */}
            <section>
                <Container>
                    <Row>
                        <Col lg='3' md='6'>
                            <div className="filter__widget">
                                <select onChange={handleFilter}>
                                    <option>Filter By Category</option>
                                    <option value="Home Furniture">Home Furniture</option>
                                    <option value="Kids Furniture">Kids Furniture</option>
                                    <option value="Hotel Furniture">Hotel Furniture</option>
                                    <option value="Office Furniture">Office Furniture</option>
                                    <option value="Restaurant Furniture">Restaurant Furniture</option>
                                </select>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Show either random products OR filtered products */}
            <section className="pt-0">
                <Container>
                    <Row>
                        {loading ? (
                            <h1 className="text-center fs-4">Loading...</h1>
                        ) : selectedCategory ? (
                            // Show filtered products only
                            <ProductDisplay category={selectedCategory} />
                        ) : randomProducts.length === 0 ? (
                            <h1 className="text-center fs-4">No Products are found!</h1>
                        ) : (
                            // Show random products when no category is selected
                            <ProductList data={randomProducts} />
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default Shop;
