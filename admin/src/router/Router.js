import React from "react";
import {Route,Routes,Navigate} from "react-router-dom";
import AddProduct from "../pages/AddProducts";
import AllProducts from "../pages/AllProducts";
import Dashboard from "../pages/Dashboard";
import AllOrders from "../pages/AllOrders";
import Login from "../pages/Login";
import ProductDetails from "../pages/PurchaseNoteDetails";
import OrderDetails from "../pages/OrderDetails";
import ItemDetails from "../pages/ItemDetails";
import SupplierDetails from "../pages/Supplier";
import User from "../pages/User";
import SignUp from "../pages/SignUp";
import Orders from "../pages/Orders";
import AccepetOrderDetails from "../pages/AccepetOrder";
import CompleteOrderDetails from "../pages/CompletedOrders";
import SaleteamDetail  from "../pages/SaleteamDetail";
import AllSuppliers from "../pages/AllSuppliers";
import IssuedOrderDetails from "../pages/IssuedOrder";
import DeliveryNoteDetails from "../pages/DeliveryNoteDetails";
import DeliveryNotes from "../pages/DeliveryNotes";
import ReturnedOrderDetails from "../pages/ReturnedOrder";
import AllCustomer from "../pages/AllCustomers";
import PlaceOrder from "../pages/Placeorder";
import AllEmployees from "../pages/AllEmployees";
import AdvancePayment from "../pages/AdancePayment";
import PurchaseNoteDetails from "../pages/PurchaseNoteDetails";
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
            <Route path='all-employee' element={<AllEmployees/>}/>
            <Route path='all-suppliers' element={<AllSuppliers/>}/>
            <Route path='all-customers' element={<AllCustomer/>}/>
            <Route path='dashboard/add-products' element={<AddProduct/>}/>
            <Route path='dashboard/orders' element={<Orders/>}/>
            <Route path="dashboard/product-detail/:id" element={<ProductDetails />} />
            <Route path="order-detail/:id" element={<OrderDetails />} />
            <Route path="accept-order-detail/:id" element={<AccepetOrderDetails />} />
            <Route path="issued-order-detail/:id" element={<IssuedOrderDetails />} />
            <Route path="deliveryNote-detail/:id" element={<DeliveryNoteDetails />} />
            <Route path="complete-order-detail/:id" element={<CompleteOrderDetails />} />
            <Route path="retruned-order-detail/:id" element={<ReturnedOrderDetails />} />
            <Route path="item-detail/:id" element={<ItemDetails />} />
            <Route path="supplier-detail/:id" element={<SupplierDetails />} />
            <Route path="saleteam-detail/:id" element={<SaleteamDetail />} />
            <Route path="create-delivery-note" element={<DeliveryNotes />} />
            <Route path="place-order" element={<PlaceOrder />} />
            <Route path="advance" element={<AdvancePayment />} />
            <Route path="purchase-detail/:id" element={<PurchaseNoteDetails />} />
        </Routes>
    ) ;
};

export default Router;
