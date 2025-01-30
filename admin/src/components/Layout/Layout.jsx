import React from "react";
import AdminNav from "../../pages/AdminNav";
import Footer from "../Footer/Footer";
import Routers from "../../router/Router";

const Layout = () =>{
    return <>
        <AdminNav/>
        <div>
            <Routers/>
        </div>
        <Footer/>
    </>
};

export default  Layout;