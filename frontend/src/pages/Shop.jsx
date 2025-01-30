import React , {useState} from 'react';
import CommonSection from "../components/Ui/CommonSection";
import Helmet from "../components/Helmet/Helmet";
import { Container , Row , Col } from "reactstrap";
import products from "../assets/data/products";

import "../style/shop.css";
import ProductList from "../components/Ui/ProductList";

const Shop = () =>{

    const [productsData , setProductsData] = useState(products)

    const handleFilter = e =>{
        const filter = e.target.value
        if (filter === 'Home_Furniture'){
            const filteredProducts = products.filter(
                (item) => item.category === 'Home_Furniture'
            );
            setProductsData(filteredProducts);
        }


        if (filter === 'mobile'){
            const filteredProducts = products.filter(
                (item) => item.category === 'mobile'
            );
            setProductsData(filteredProducts);
        }

        if (filter === 'chair'){
            const filteredProducts = products.filter(
                (item) => item.category === 'chair'
            );
            setProductsData(filteredProducts);
        }

        if (filter === 'watch'){
            const filteredProducts = products.filter(
                (item) => item.category === 'watch'
            );
            setProductsData(filteredProducts);
        }

        if (filter === 'wireless'){
            const filteredProducts = products.filter(
                (item) => item.category === 'wireless'
            );
            setProductsData(filteredProducts);
        }
    }

    const handleSearch = e =>{
        const searchTerm = e.target.value

        const searchedProducts = products.filter(item =>
            item.productName.toLowerCase().includes(searchTerm.toLowerCase()))

        setProductsData(searchedProducts)
    }

    return(
        <Helmet title={'Shop'}>
            <CommonSection title="Products"/>
            <section>
                <Container>
                    <Row>
                        <Col lg='3' md='6'>
                            <div className="filter__widget">
                                <select onChange={handleFilter}>
                                <option>Filter By Category</option>
                                    <option value="Home_Furniture">Home Furniture</option>
                                    <option value="mobile">Mobile</option>
                                    <option value="chair">Chair</option>
                                    <option value="watch">Watch</option>
                                    <option value="wireless">Wireless</option>
                                </select>
                            </div>
                        </Col>
                        <Col lg='3' md='6' className='text-end'>
                            <div className="filter__widget">
                                <select>
                                    <option>Sort By</option>
                                    <option value="ascending">Ascending</option>
                                    <option value="descending">Descending</option>
                                </select>
                            </div>
                        </Col>
                        <Col lg='6' md='12'>
                            <div className="search__box">
                                <input type="text" placeholder="Search....." onChange={handleSearch} />
                                <span><i className="ri-search-line"></i></span>
                            </div>
                        </Col>
                    </Row>
                </Container>
            </section>

            <section className = "pt-0">
                <Container>
                    <Row>
                        {
                            productsData.length === 0 ?(
                                <h1 className="text-center fs-4">No Products are found!</h1>
                            ):(
                                <ProductList data={productsData}/>
                            )
                        }
                    </Row>
                </Container>
            </section>
        </Helmet>
    )
};

export default Shop;
