import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AdminDashboard from "../pages/Dashboard/AdminDashboard";
import CashierDashboard from "../pages/Dashboard/CashierDashboard";
import SaleTeamDashboard from "../pages/Dashboard/SaleTeamDashboard";
import DriverDashboard from "../pages/Dashboard/DriverDashboard";
import AllOrders from "../pages/AllOrders";
import AllProducts from "../pages/AllProducts";
import AllCustomers from "../pages/AllCustomers";
import AllSuppliers from "../pages/AllSuppliers";
import AllEmployees from "../pages/AllEmployees";
import AllVehicles from "../pages/AllVehicles";
import AllDeliveryNotes from "../pages/AllDeliveryNotes";
import PlaceOrder from "../pages/Placeorder";
import Orders from "../pages/OrderManagement";
import AdminHome from "../pages/AdminHome";
import LoginPage from "../pages/LoginPage";
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
import DeliveryNoteDetailsDrive from "../pages/DeliveryNoteDetailsDrive";
import DeliveryNotes from "../pages/DeliveryNotes";
import ReturnedOrderDetails from "../pages/ReturnedOrder";
import AdvancePayment from "../pages/AdancePayment";
import PurchaseNoteDetails from "../pages/PurchaseNoteDetails";
import AllGrahps from "../pages/AllGraphs";
import AllDeliveryNotesDrive from "../pages/AllDeliveryNotesDriver";
import TableItemPriceList from "../components/tables/TableItemPriceList";

const Router = () => {
    return (
        <Routes>
            <Route path="/" element={<Navigate to="/SignIn" />} />
            <Route path="/SignIn" element={<LoginPage />} />

            <Route path="/admin-dashboard" element={<AdminDashboard />}>
                <Route index element={<AdminHome />} />
                <Route path="item_prices" element={<TableItemPriceList />} />
                <Route path="customers" element={<AllCustomers />} />
                <Route path="itDept" element={<AllCustomers />} />
 {/*{id: "it_dept", icon: "bx-grid-alt", label: "ITDEPARTMENT", path: "/admin-dashboard/itDept"},*/}

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
                <Route path="item_prices" element={<TableItemPriceList />} />
                <Route path="orders" element={<PlaceOrder />} />
            </Route>
            <Route path="/user-dashboard" element={<SaleTeamDashboard />}>
                <Route index element={<AdminHome />} />
                <Route path="item_prices" element={<TableItemPriceList />} />
                <Route path="product_list" element={<AllOrders />} />
                <Route path="orders" element={<PlaceOrder />} />
                <Route path="leave" element={<AllLeaves />} />
            </Route>
            <Route path="/driver-dashboard" element={<DriverDashboard />}>
                <Route index element={<AdminHome />} />
                <Route path="delivery" element={<AllDeliveryNotesDrive />} />
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
            <Route path="deliveryNote-detail-drive/:id" element={<DeliveryNoteDetailsDrive />} />
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
