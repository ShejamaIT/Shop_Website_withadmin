import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Col, Container, Row } from "reactstrap";
import CategoryList from "../Ui/CategoryList";
import Helmet from "../Helmet/Helmet";
import CommonSection from "./CommonSection";

const ProductDisplay = () => {
    const { category } = useParams();
    const navigate = useNavigate();
    const decodedCategory = decodeURIComponent(category); // Decode URL-encoded category
    const [productsData, setProductsData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [subCategoryOne, setSubCategoryOne] = useState("");
    const [subCategoryTwo, setSubCategoryTwo] = useState("");
    const [subCategoriesOneOptions, setSubCategoriesOneOptions] = useState([]);
    const [subCategoriesTwoOptions, setSubCategoriesTwoOptions] = useState([]);
    const [showSubCategoryTwo, setShowSubCategoryTwo] = useState(false); // Controls visibility

    // Fetch products based on category
    useEffect(() => {
        if (!decodedCategory) return;

        const fetchProducts = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://localhost:5000/api/admin/getcategoryimg?category=${decodedCategory}`);
                const data = await response.json();
                setProductsData(data.success ? data.data : []);
            } catch (error) {
                console.error("Error fetching data:", error);
                setProductsData([]);
            } finally {
                setLoading(false);
            }
        };

        fetchProducts();
    }, [decodedCategory]);

    // Fetch subcategories when category changes
    useEffect(() => {
        if (!decodedCategory) return;

        const fetchSubCategories = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/admin/categories?name=${decodedCategory}`);
                const data = await response.json();
                setSubCategoriesOneOptions(data || []);
                setSubCategoryOne(""); // Reset first subcategory
                setSubCategoryTwo(""); // Reset second subcategory
                setShowSubCategoryTwo(false); // Hide second dropdown
            } catch (error) {
                console.error("Error fetching subcategories:", error);
                setSubCategoriesOneOptions([]);
            }
        };

        fetchSubCategories();
    }, [decodedCategory]);

    // Fetch second-level subcategories when Subcategory One changes
    useEffect(() => {
        if (!subCategoryOne) return;

        const fetchSubCategoriesTwo = async () => {
            try {
                const response = await fetch(`http://localhost:5000/api/admin/subcategories?name=${subCategoryOne}`);
                const data = await response.json();
                setSubCategoriesTwoOptions(data.subcategories || []);
                setSubCategoryTwo(""); // Reset selection
                setShowSubCategoryTwo(true); // Show the second dropdown
            } catch (error) {
                console.error("Error fetching second-level subcategories:", error);
                setSubCategoriesTwoOptions([]);
                setShowSubCategoryTwo(false); // Hide if error
            }
        };

        fetchSubCategoriesTwo();
    }, [subCategoryOne]);

    // Handle category change & redirect to new page
    const handleCategoryChange = (e) => {
        const newCategory = e.target.value;
        if (newCategory === "Filter By Category") return;

        navigate(`/products/${encodeURIComponent(newCategory)}`);
    };

    return (
        <Helmet title={decodedCategory}>
            <CommonSection title={decodedCategory} />

            {/* Category Filter */}
            <section>
                <Container>
                    <Row>
                        <Col lg="12">
                            <div className="filter__widget d-flex align-items-center gap-5">
                                {/* Main Category Dropdown (Changes URL & Reloads Page) */}
                                <select value={decodedCategory} onChange={handleCategoryChange}>
                                    <option>Filter By Category</option>
                                    <option value="Home Furniture">Home Furniture</option>
                                    <option value="Kids Furniture">Kids Furniture</option>
                                    <option value="Hotel Furniture">Hotel Furniture</option>
                                    <option value="Office Furniture">Office Furniture</option>
                                    <option value="Restaurant Furniture">Restaurant Furniture</option>
                                </select>

                                {/* Subcategory One Dropdown */}
                                {subCategoriesOneOptions.length > 0 && (
                                    <select value={subCategoryOne} onChange={(e) => setSubCategoryOne(e.target.value)}>
                                        {subCategoriesOneOptions.map((sub) => (
                                            <option key={sub.sb_c_id} value={sub.subcategory}>
                                                {sub.subcategory}
                                            </option>
                                        ))}
                                    </select>
                                )}

                                {/* Subcategory Two Dropdown (Hidden Initially) */}
                                {showSubCategoryTwo && (
                                    <select value={subCategoryTwo} onChange={(e) => setSubCategoryTwo(e.target.value)}>
                                        {subCategoriesTwoOptions.map((sub) => (
                                            <option key={sub.sb_cc_id} value={sub.subcategory}>
                                                {sub.subcategory}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            {/* Products List */}
            <section className="pt-0">
                <Container>
                    <Row>
                        {loading ? (
                            <h1 className="text-center fs-4">Loading...</h1>
                        ) : productsData.length === 0 ? (
                            <h1 className="text-center fs-4">No Products Found!</h1>
                        ) : (
                            <CategoryList data={productsData} />
                        )}
                    </Row>
                </Container>
            </section>
        </Helmet>
    );
};

export default ProductDisplay;
