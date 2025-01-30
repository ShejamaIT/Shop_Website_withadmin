import React, { useState, useEffect } from "react";
import { Container, Row } from "reactstrap";
import CategoryList from "../Ui/CategoryList";

const ProductDisplay = ({ category }) => {
    const [productsData, setProductsData] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!category || category === "Filter By Category") {
            setProductsData([]); // Clear products if no category is selected
            return;
        }

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/admin/getcategoryimg?category=${category}`);
                const data = await response.json();
                if (data.success) {
                    setProductsData(data.data);
                } else {
                    setProductsData([]);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
                setProductsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [category]);

    return (
        <section className="pt-0">
            <Container>
                <Row>
                    {loading ? (
                        <h1 className="text-center fs-4">Loading...</h1>
                    ) : productsData.length === 0 ? (
                        <h1 className="text-center fs-4">No Products are found!</h1>
                    ) : (
                        <CategoryList data={productsData} />
                    )}
                </Row>
            </Container>
        </section>
    );
};

export default ProductDisplay;
