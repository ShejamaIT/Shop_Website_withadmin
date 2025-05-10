import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
import CashierDashboard from "../pages/Dashboard/CashierDashboard";
import UserDashboard from "../pages/Dashboard/UserDashboard";
import AllOrders from "../pages/AllOrders";
import AllProducts from "../pages/AllProducts";
import AllCustomers from "../pages/AllCustomers";
import AllSuppliers from "../pages/AllSuppliers";
import AllEmployees from "../pages/AllEmployees";
import AllVehicles from "../pages/AllVehicles";
import AllDeliveryNotes from "../pages/AllDeliveryNotes";
import PlaceOrder from "../pages/Placeorder";
import Orders from "../pages/OrderManagement";
import HomeContent from "../pages/HomeContent";
import AuthSection from "../pages/AuthSection";
import AllLeaves from "../pages/AllLeaves";

// Details pages
import OrderDetails from "../pages/OrderDetails";
import ItemDetails from "../pages/ItemDetails";
import SupplierDetails from "../pages/Supplier";
import User from "../pages/User";
import AccepetOrderDetails from "../pages/AccepetOrder";
import CompleteOrderDetails from "../pages/CompletedOrders";
import SaleteamDetail from "../pages/SaleteamDetail";
import IssuedOrderDetails from "../pages/IssuedOrder";
import DeliveryNoteDetails from "../pages/DeliveryNoteDetails";
import DeliveryNotes from "../pages/DeliveryNotes";
import ReturnedOrderDetails from "../pages/ReturnedOrder";
import AdvancePayment from "../pages/AdancePayment";
import PurchaseNoteDetails from "../pages/PurchaseNoteDetails";
import AllGrahps from "../pages/AllGraphs";
import TableItemPriceList from "../components/tables/TableItemPriceList";

const Router = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/SignIn" />} />
            <Route path="/SignIn" element={<AuthSection />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />}>
                <Route index element={<HomeContent />} />
                <Route path="item_prices" element={<TableItemPriceList />} />
                <Route path="customers" element={<AllCustomers />} />
                <Route path="products" element={<AllProducts />} />
                <Route path="orders" element={<PlaceOrder />} />
                <Route path="product_list" element={<AllOrders />} />
                <Route path="graphs" element={<AllGrahps />} />
                <Route path="suppliers" element={<AllSuppliers />} />
                <Route path="employees" element={<AllEmployees />} />
                <Route path="delivery" element={<AllDeliveryNotes />} />
                <Route path="vehicles" element={<AllVehicles />} />
            </Route>

            <Route path="/chashier-dashboard" element={<CashierDashboard />}>
                <Route index element={<PlaceOrder />} />
                <Route path="orders" element={<PlaceOrder />} />
            </Route>
            <Route path="/user-dashboard" element={<UserDashboard />}>
                <Route index element={<HomeContent />} />
                <Route path="product_list" element={<AllOrders />} />
                <Route path="orders" element={<PlaceOrder />} />
                <Route path="leave" element={<AllLeaves />} />
            </Route>

            {/* Other non-dashboard routes */}
            <Route path="dashboard/add-products" element={<AllProducts />} />
            <Route path="dashboard/users" element={<User />} />
            <Route path="dashboard/orders" element={<Orders />} />
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
    );
};

export default Router
