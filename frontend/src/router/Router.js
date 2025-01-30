import React from "react";
import {Route,Routes,Navigate} from "react-router-dom";

import Home from "../pages/Home";
import Shop from "../pages/Shop";
import Cart from "../pages/Cart";
import ProductDetail from "../pages/ProductDetail";
import Checkout from "../pages/Checkout";


const Router = () => {
    return(
        <Routes>
        <Route path="/" element={<Navigate to='/home'/>}/>
            <Route path='home' element={<Home/>}/>
            <Route path='shop' element={<Shop/>}/>
            <Route path='cart' element={<Cart/>}/>
            <Route path='productDetail' element={<ProductDetail/>}/>
            <Route path='checkout' element={<Checkout/>}></Route>
            <Route path="/shop/:id" element={<ProductDetail />} />
        </Routes>
    ) ;
};

export default Router;