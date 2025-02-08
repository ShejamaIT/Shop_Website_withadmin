import React from "react";
import {Route,Routes,Navigate} from "react-router-dom";
import AddProduct from "../pages/AddProducts";
import AllProducts from "../pages/AllProducts";
import Dashboard from "../pages/Dashboard";
import AllOrders from "../pages/AllOrders";
import Login from "../pages/Login";
import ProductDetails from "../pages/ProductDetails";
import OrderDetails from "../pages/OrderDetails";
import ItemDetails from "../pages/ItemDetails";
import SupplierDetails from "../pages/SupplierDetails";
import User from "../pages/User";
import SignUp from "../pages/SignUp";
import Orders from "../pages/Orders";
import AccepetOrderDetails from "../pages/AccepetOrder";
const Router = () => {
    return(
        <Routes>
        <Route path="/" element={<Navigate to='/login'/>}/>
            <Route path='login' element={<Login/>}/>
            <Route path='signUp' element={<SignUp/>}/>
            <Route path='dashboard' element={<Dashboard/>}/>
            <Route path='all-orders' element={<AllOrders/>}/>
            <Route path='dashboard/users' element={<User/>}/>
            <Route path='all-products' element={<AllProducts/>}/>
            <Route path='dashboard/add-products' element={<AddProduct/>}/>
            <Route path='dashboard/orders' element={<Orders/>}/>
            <Route path="dashboard/product-detail/:id" element={<ProductDetails />} />
            <Route path="order-detail/:id" element={<OrderDetails />} />
            <Route path="accept-order-detail/:id" element={<AccepetOrderDetails />} />
            <Route path="item-detail/:id" element={<ItemDetails />} />
            <Route path="supplier-detail/:id" element={<SupplierDetails />} />
        </Routes>
    ) ;
};

export default Router;
