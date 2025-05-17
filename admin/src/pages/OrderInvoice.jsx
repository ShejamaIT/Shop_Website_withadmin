import React, { useState, useEffect } from "react";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/placeorder.css";
import '../style/OrderManagement .css'
import AddNewItem from "../pages/AddNewItem";
import AddNewCoupone from "../pages/AddNewCoupone";
import Helmet from "../components/Helmet/Helmet";
import Swal from "sweetalert2";
import FinalInvoice1 from "./FinalInvoice1";
import MakeDeliveryNoteNow from "./MakeDeliveryNoteNow";
import ReceiptView from "./ReceiptView";
import DeliveryNoteViewNow from "./DeliveryNoteViewNow";

const OrderInvoice = ({ onPlaceOrder }) => {
    const [formData, setFormData] = useState({c_ID:"",title:"",FtName: "", SrName: "", phoneNumber: "",occupation:"",workPlace:"",issuable:"",
        otherNumber: "", address: "", city: "",orderDate:"", district: "", specialNote: "", dvStatus: "", expectedDate: "", couponCode: "",balance:"",advance:""});
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Fixed: should be a string
    const [coupons, setCoupons] = useState([]);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [deliveryPrice, setDeliveryPrice] = useState("0");
    const [districts, setDistricts] = useState([]);
    const [deliveryRates, setDeliveryRates] = useState({});
    const [discountAmount, setDiscountAmount] = useState(0);
    const [specialdiscountAmount, setSpecialDiscountAmount] = useState(0);
    const [totalItemPrice, setTotalItemPrice] = useState(0);
    const [totalBillPrice, setTotalBillPrice] = useState(0);
    const [customers, setCustomers] = useState([]);
    const [filteredCustomers, setFilteredCustomers] = useState([]); // Stores search results
    const [errors, setErrors] = useState([]);
    const [openPopup, setOpenPopup] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDropdown, setShowDropdown] = useState(false); // Controls dropdown visibility
    const [isNewCustomer, setIsNewCustomer] = useState(true); // State to determine new or previous customer
    const [availableDelivery, setAvailableDelivery] = useState(null);
    const [orderType, setOrderType] = useState("Walking");
    const [showModal, setShowModal] = useState(false);
    const [showModal1, setShowModal1] = useState(false);
    const [showModal2, setShowModal2] = useState(false);
    const [showModal3, setShowModal3] = useState(false);
    const [discount, setDiscount] = useState("0");
    const [advance, setAdvance] = useState("0");
    const [balance, setBalance] = useState("0");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [saleteam , setSaleTeam] = useState([]);
    const [receiptData, setReceiptData] = useState(null);
    const [showReceiptView, setShowReceiptView] = useState(false);
    const [showDeliveryView, setShowDeliveryView] = useState(false);
    const [receiptDataD, setReceiptDataD] = useState(null);

    useEffect(() => {
        fetchItems();fetchCoupons();fetchCustomers();
    }, []);
    const fetchItems = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/allitems");
            const data = await response.json();
            setItems(data || []);
            setFilteredItems(data || []);
        } catch (error) {
            toast.error("Error fetching items.");
        }
    };
    const fetchCoupons = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/coupon-details");
            const data = await response.json();
            setCoupons(data.data || []);
        } catch (error) {
            toast.error("Error fetching coupons.");
        }
    };
    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/allcustomers`);
            const data = await response.json();

            if (response.ok) {
                setCustomers(data);
                setFilteredCustomers(data); // Initialize filtered list
            } else {
                setCustomers([]);
                setFilteredCustomers([]);
                setError(data.message || "No customers available.");
            }
        } catch (error) {
            setCustomers([]);
            setFilteredCustomers([]);
            setError("Error fetching customers.");
        } finally {
            setLoading(false);
        }
    };
    useEffect(() => {
        calculateTotalPrice();
    }, [selectedItems, deliveryPrice, discountAmount,advance,balance]); // Recalculate when dependencies change
    const calculateTotalPrice = () => {
        // Calculate the total special discount for all selected items
        const totalSpecialDiscount = selectedItems.reduce((total, item) => {
            // Sum up the discount for each item
            const specialDiscount = item.discount || 0;
            return total + specialDiscount * item.qty; // Multiply by quantity to get the total discount for each item
        }, 0);

        // Update the specialdiscountAmount state with the total special discount
        setSpecialDiscountAmount(totalSpecialDiscount);

        // Calculate the item total by applying the special discount and summing up the price for all items
        const itemTotal = selectedItems.reduce((total, item) => {
            const unitPrice = item.originalPrice ?? item.price; // Fallback to price if no originalPrice
            const specialDiscount = item.discount || 0;
            const discountedPrice = unitPrice - specialDiscount;
            return total + discountedPrice * item.qty; // Add the item total to the overall total
        }, 0);

        // Set the total item price state
        setTotalItemPrice(itemTotal);

        // Calculate the final total bill price (subtract coupon discount and add delivery fee)
        const total = Number(itemTotal) - Number(discountAmount || 0) + Number(deliveryPrice || 0);

        // Set the total bill price state
        setTotalBillPrice(total);

        // Advance is a string, so parse and calculate balance
        const adv = parseFloat(advance) || 0;
        const remaining = total - adv;
        setBalance(remaining >= 0 ? remaining.toFixed(2) : "0.00");
    };
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData((prev) => {
            let updatedForm = {
                ...prev,
                [name]: type === "checkbox" ? checked : value,
            };
            // If switching to Pickup, reset all Delivery-related fields
            if (name === "dvStatus" && value === "Pickup") {
                updatedForm = {
                    ...updatedForm,
                    dvtype: "",
                    district: "",
                    // address: "",
                    isAddressChanged: false,
                    newAddress: "",
                    expectedDate: "",
                    deliveryCharge: "",
                };
                setDeliveryPrice(0);
            }
            // If switching to Direct Delivery, reset some fields
            if (name === "dvtype" && value === "Direct") {
                updatedForm = {
                    ...updatedForm,
                    district: "",
                    expectedDate: "",
                    deliveryCharge: "",
                };
            }
            // If Address change is unchecked, clear new address
            if (name === "isAddressChanged" && !checked) {
                updatedForm.newAddress = "";
            }
            return updatedForm;
        });
        // Handle delivery price updates
        if (name === "district") {
            setDeliveryPrice(deliveryRates[value] || 0);
            fetchDeliveryDates(value);
        }
        // If entering Direct delivery charge manually
        if (name === "deliveryCharge" && formData.dvtype === "Direct") {
            setDeliveryPrice(value);
        }
        // Check delivery availability for Direct
        if (name === "expectedDate" && formData.dvtype === "Direct") {
            checkDeliveryAvailability(value);
        }
        // Handle coupon code
        if (name === "couponCode") {
            const selectedCoupon = coupons.find((c) => c.coupon_code === value);
            // Set discount amount
            setDiscountAmount(selectedCoupon ? selectedCoupon.discount : 0);
            // If a valid coupon is found, set the saleteam info
            if (selectedCoupon) {
                setSaleTeam([
                    {
                        id: selectedCoupon.sales_team_id,
                        name: selectedCoupon.employee_name
                    }
                ]);
            } else {
                setSaleTeam([]); // Clear if no matching coupon
            }
        }
    };
    const checkDeliveryAvailability = async (date) => {
        try {
            // Mock API call to check delivery availability (Replace with real API)
            const response = await fetch(`http://localhost:5001/api/admin/main/check-delivery?date=${date}`);
            const result = await response.json();
            setAvailableDelivery(result.available);
        } catch (error) {
            console.error("Error checking delivery availability:", error);
        }
    };
    const fetchDeliveryDates = async (district) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/delivery-schedule?district=${district}`);
            const data = await response.json();setDeliveryDates(data.upcomingDates || []);
        } catch (error) {
            toast.error("Error fetching delivery dates.");
            setDeliveryDates([]);
        }
    };
    useEffect(() => {
        const fetchDeliveryRates = async () => {
            try {
                const response = await fetch("http://localhost:5001/api/admin/main/delivery-rates");
                const data = await response.json();

                if (data.success) {
                    const districtList = data.data.map((rate) => rate.district);
                    const rateMap = {};
                    data.data.forEach((rate) => {
                        rateMap[rate.district] = rate.amount; // Store delivery price for each district
                    });
                    setDistricts(districtList);
                    setDeliveryRates(rateMap);
                }
            } catch (error) {
                toast.error("Error fetching delivery rates.");
            }
        };
        fetchDeliveryRates();
    }, []);
    const handleSearchChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredItems(items);
        } else {
            const filtered = items.filter((item) =>
                item.I_Id.toString().includes(value) || item.I_name.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredItems(filtered);
        }
    };
    const handleSelectItem = (item) => {
        setSelectedItem(item);
        setQuantity(1);
        setSearchTerm("");
        setFilteredItems([]);
    };
    const handleAddToOrder = () => {
        if (!selectedItem) return;
        // Check if issuable is empty
        if (!formData.issuable || formData.issuable.trim() === "") {
            toast.error("Please select whether the item is issuable: Now or Later.");
            return;
        }
        if (formData.issuable === 'Now') {
            if (selectedItem.availableQty < quantity) {
                Swal.fire("There are not enough stocks for the requirement.");
                return; // prevent further processing
            }
        }
        const specialDiscount = parseFloat(discount) || 0;
        const discountedPrice = selectedItem.price - specialDiscount;

        const existingItemIndex = selectedItems.findIndex(
            (i) => i.I_Id === selectedItem.I_Id
        );

        if (existingItemIndex !== -1) {
            const updatedItems = [...selectedItems];
            updatedItems[existingItemIndex].qty += quantity;
            updatedItems[existingItemIndex].discount = specialDiscount;
            updatedItems[existingItemIndex].price = discountedPrice;
            updatedItems[existingItemIndex].originalPrice = selectedItem.price;
            setSelectedItems(updatedItems);
        } else {
            setSelectedItems([
                ...selectedItems,
                {
                    ...selectedItem,
                    qty: quantity,
                    discount: specialDiscount,
                    price: discountedPrice,
                    originalPrice: selectedItem.price,
                    itemName: selectedItem.I_name,
                    unitPrice: selectedItem.price,
                },
            ]);
        }

        setSelectedItem(null);
        setQuantity(1);
        setDiscount("");
    };
    const handleRemoveItem = (index) => {
        const updatedItems = [...selectedItems];
        updatedItems.splice(index, 1); // Remove 1 item at the given index
        setSelectedItems(updatedItems);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Basic validation
        if (!formData.FtName || !formData.phoneNumber || selectedItems.length === 0) {
            toast.error("Please fill all details and add at least one item.");
            return;
        }

        if (formData.dvStatus === "Delivery" && formData.dvtype === "Combined" &&
            (!formData.address || !formData.district || !formData.expectedDate)) {
            toast.error("Please complete all delivery details.");
            return;
        }

        // ✅ Add advance and balance
        const updatedFormData = {
            ...formData,
            advance: parseFloat(advance).toFixed(2),
            balance: parseFloat(balance).toFixed(2),
            city: formData.address,
        };

        // ✅ Calculate totals correctly
        const itemList = selectedItems.map(item => {
            const unitPrice = parseFloat(item.originalPrice || item.price || 0);
            const discount = parseFloat(item.discount || 0);
            const grossPrice = unitPrice - discount;
            const netPrice = grossPrice * item.qty;

            return {
                I_Id: item.I_Id,
                itemName:item.itemName,
                material: item.material,
                qty: item.qty,
                price: netPrice,
                discount: discount,
            };
        });
        const items = selectedItems.map(item => {
            const unitPrice = parseFloat(item.originalPrice || item.price || 0);
            const discount = parseFloat(item.discount || 0);
            const grossPrice = unitPrice - discount;
            const netPrice = grossPrice * item.qty;

            return {
                itemId: item.I_Id,
                itemName:item.itemName,
                color: item.color,
                quantity: item.qty,
                price: netPrice,
                discount: discount,
                unitPrice: item.unitPrice,
            };
        });

        // ✅ Calculate totalItemPrice and totalBillPrice from selectedItems
        const totalItemPrice = itemList.reduce((sum, item) => sum + parseFloat(item.price), 0);
        const totalBillPrice = totalItemPrice + parseFloat(deliveryPrice || 0) - parseFloat(discountAmount || 0) - parseFloat(specialdiscountAmount || 0);

        const orderData = {
            ...updatedFormData,
            isNewCustomer,
            orderType,
            items: itemList,
            deliveryPrice,
            discountAmount,
            totalItemPrice: totalItemPrice.toFixed(2),
            totalBillPrice: totalBillPrice.toFixed(2),
            specialdiscountAmount,
        };

        try {
            const response = await fetch("http://localhost:5001/api/admin/main/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();
            const { orderId } = result.data;
            if (response.ok) {
                toast.success("Order placed successfully!");
                // Construct selectedOrder based on response + orderData
                if (formData.issuable === 'Now' && formData.dvStatus === "Delivery"){
                    const newOrder = {
                        orderId:orderId ,
                        orderDate: new Date().toLocaleDateString(),
                        phoneNumber: formData.phoneNumber,
                        payStatus: formData.advance > 0 ? 'Advanced' : 'Pending',
                        deliveryStatus: formData.dvStatus,
                        deliveryCharge: deliveryPrice,
                        discount: discountAmount,
                        specialDiscount: specialdiscountAmount,
                        advance: parseFloat(advance),
                        items: items,
                        balance:parseFloat(balance),
                        totalPrice:totalBillPrice,
                        customerName:formData.FtName+" "+formData.SrName,

                    };
                    setSelectedOrder(newOrder);
                    // Optionally, open invoice modal here
                    setShowModal2(true);
                }


            } else {
                toast.error(result.message || "Something went wrong. Please try again.");
            }

        } catch (error) {
            console.error("Error submitting order data:", error);
            toast.error("Error submitting order data. Please try again.");
        }
    };
    const handleSubmit3 = async (formData) => {
        const updatedData = {
            orID: selectedOrder.orderId,
            orderDate: selectedOrder.orderDate,
            delStatus: formData.deliveryStatus,
            delPrice: formData.delivery,
            discount: selectedOrder.discount,
            subtotal: formData.subtotal,
            total: formData.billTotal,
            advance: formData.totalAdvance,
            payStatus: formData.paymentType,
            stID: saleteam[0]?.id,
            paymentAmount: formData.addedAdvance || 0,
            selectedItems: formData.selectedItems,
            balance: formData.billTotal - formData.totalAdvance, // assuming balance calculation
            salesperson: saleteam[0]?.name,
            items: selectedOrder.items,
        };
        try {
            // Make API request to the /isssued-order endpoint
            const response = await fetch('http://localhost:5001/api/admin/main/issued-items', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData),
            });
            const result = await response.json();
            if (response.ok) {
                toast.success("Update order Successfully");
                setReceiptData(updatedData);  // Set data for receipt
                setShowReceiptView(true);         // Show receipt view
            } else {
                console.error("Error:", result.message);
            }
        } catch (error) {
            console.error("Error making API request:", error.message);
        }
    };
    const handleSubmit2 = async (formData1) => {
        const updatedReceiptData = {
            order:{
                orderId: selectedOrder.orderId,
                customerName:selectedOrder.customerName,
                balance: parseFloat(balance) || 0,
                address:formData.address,
                contact1:formData.phoneNumber,
                contact2:formData.otherNumber,
                total:totalBillPrice,
                advance:advance,
            },
            vehicleId: formData1.vehicleId,
            driverName: formData1.driverName,
            driverId: formData1.driverId,
            hire: formData1.hire || 0,
            balanceToCollect: formData1.balanceToCollect || 0,
            selectedDeliveryDate: formData.expectedDate, // Default to today's date if empty
            district: formData.district || "Unknown",
        };
        try {
            // Prepare the data for the API request
            const deliveryNoteData = {
                driverName: formData1.driverName,
                driverId: formData1.driverId,
                vehicleName: formData1.vehicleId, // Ensure correct field name
                hire: formData1.hire || 0,
                date: updatedReceiptData.selectedDeliveryDate,
                order:{
                    orderId: selectedOrder.orderId,
                    balance: parseFloat(balance) || 0,
                    address:formData.address,
                    contact1:formData.phoneNumber,
                    contact2:formData.otherNumber,
                },
                district: formData.district || "Unknown",
                balanceToCollect: formData.balanceToCollect || 0,
            };
            //Make the API call
            const response = await fetch("http://localhost:5001/api/admin/main/create-delivery-note-now", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(deliveryNoteData),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Error creating delivery note.");
            }

            toast.success("Delivery note created successfully.");
            setReceiptDataD(updatedReceiptData);
            setShowModal3(false);
            setShowDeliveryView(true);
        } catch (error) {
            console.error("Error while submitting delivery note:", error);
            toast.error(error.message || "An unexpected error occurred while submitting the delivery note.");
        }
    };
    const viewHandle = async (formData) => {
        setShowModal2(false);
        setShowModal3(true);
    }
    const handleClear = () => {
        setFormData({c_ID:"",title:"",FtName: "",id:"" ,SrName: "", phoneNumber: "", otherNumber: "", address: "",occupation:"",workPlace:"",
            city: "", district: "",specialNote: "", expectedDate: "", couponCode: "", dvStatus: "",type:"",category:"",balance:"",advance:""});
        setSelectedItems([]);setSearchTerm("");setDeliveryPrice(0);setDiscountAmount(0);setTotalItemPrice(0);setTotalBillPrice(0);setAdvance(0);
    };
    const handleSelectCustomer = (customer) => {
        setFormData((prevData) => ({
            ...prevData,
            c_ID: customer.c_ID,
            title: customer.title,
            FtName: customer.FtName ,
            SrName: customer.SrName,
            phoneNumber: customer.contact1,
            otherNumber: customer.contact2,
            address: customer.address,
            city: customer.city,
            district: customer.district,
            specialNote: customer.specialNote,
            id: customer.id,
            balance: customer.balance,
            type: customer.type,
            category: customer.category,
            occupation : customer.occupation,
            workPlace : customer.workPlace
        }));

        // Clear search term to hide dropdown
        setSearchTerm("");
        setFilteredCustomers([]);
    };
    const setCustomer = (value) => {
        if (value === "New") {
            setIsNewCustomer(true);
        } else {
            setIsNewCustomer(false);
        }
        // handleClear(); // Call handleClear when switching customer type
    };
    const handlePhoneNumberBlur = async (phoneNumber) => {
        if (!phoneNumber) return;

        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/customer/check-customer?phone=${phoneNumber}`);
            const data = await response.json();

            if (data.exists) {
                toast.info(`Customer already exists: ${data.customerName}`);
                setCustomer("Previous");
                handleSelectCustomer(data.data);
            } else {
                toast.success("Customer does not exist, continue creating order.");
                setCustomer("New");
            }
        } catch (error) {
            console.error("Error checking customer:", error.message);
            toast.error("Failed to check customer.");
        }
    };
    const handleButtonClick = () => {
        setShowModal(true);
    };
    const handleAddNewCoupon = () => {
        setShowModal1(true);
    };
    const handleAddItem = async (newItem) => {
        try {
            const materialToSend = newItem.material === "Other" ? newItem.otherMaterial : newItem.material;

            const formDataToSend = new FormData();
            formDataToSend.append("I_Id", newItem.I_Id);
            formDataToSend.append("I_name", newItem.I_name);
            formDataToSend.append("Ca_Id", newItem.Ca_Id);
            formDataToSend.append("sub_one", newItem.sub_one);
            formDataToSend.append("sub_two", newItem.sub_two || "None");
            formDataToSend.append("descrip", newItem.descrip);
            formDataToSend.append("color", newItem.color);
            formDataToSend.append("material", materialToSend);
            formDataToSend.append("price", newItem.price);
            formDataToSend.append("warrantyPeriod", newItem.warrantyPeriod);
            formDataToSend.append("cost", newItem.cost);
            formDataToSend.append("s_Id", newItem.s_Id);
            formDataToSend.append("minQty", newItem.minQty);

            if (newItem.img) {
                formDataToSend.append("img", newItem.img);
            } else {
                toast.error("Main image is required.");
                return;
            }

            if (newItem.img1) formDataToSend.append("img1", newItem.img1);
            if (newItem.img2) formDataToSend.append("img2", newItem.img2);
            if (newItem.img3) formDataToSend.append("img3", newItem.img3);

            const submitResponse = await fetch("http://localhost:5001/api/admin/main/add-item", {
                method: "POST",
                body: formDataToSend,
            });

            const submitData = await submitResponse.json();

            if (submitResponse.ok) {
                toast.success("✅ Item added successfully!");
                fetchItems(); // make sure this exists in your parent component
            } else {
                toast.error(submitData.message || "❌ Failed to add item.");
            }
        } catch (error) {
            console.error("❌ Error submitting form:", error);
            toast.error("❌ An error occurred while adding the item.");
        }
    };
    const handleAddCoupon = async (newCoupon) => {
        const { couponCode, saleteamCode, discount } = newCoupon;
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/coupone", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ couponCode, saleteamCode, discount }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`Coupon ${couponCode} added successfully!`);
                fetchCoupons();
            } else {
                alert(`Error: ${data.message}`);
            }
        } catch (error) {
            console.error("Error submitting coupon:", error);
            alert("Failed to add coupon. Please try again.");
        }
    };

    return (
        <Helmet title="Place order">
            <div id="order" className="order-container mx-auto p-4">
                <h1 className="text-2xl font-bold mb-4">Order Invoice</h1>
                <Form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className='order-details'>
                        <h2 className="text-xl font-bold mb-2">Order Type</h2>
                        <hr/>
                        <Row>
                            <Col md={6}>
                                <Label className="block text-sm font-medium text-gray-700">Select Order Type</Label>
                                <div className="d-flex gap-3">
                                    <div>
                                        <Input
                                            type="radio"
                                            name="orderType"
                                            value="Walking"
                                            checked={orderType === "Walking"} // Check if this radio button is selected
                                            onChange={() => setOrderType("Walking")} // Update the state when selected
                                        />{" "}
                                        Walking
                                    </div>
                                    <div>
                                        <Input
                                            type="radio"
                                            name="orderType"
                                            value="On-site"
                                            checked={orderType === "On-site"} // Check if this radio button is selected
                                            onChange={() => setOrderType("On-site")} // Update the state when selected
                                        />{" "}
                                        On-Site
                                    </div>
                                </div>
                            </Col>
                            <Col md={6}>
                                <div>
                                    <label>Placing Date</label>
                                    <Input
                                        type="date"
                                        name="orderDate"
                                        value={formData.orderDate}
                                        onChange={handleChange}
                                    />
                                </div>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <Label className="block text-sm font-medium text-gray-700 mb-1">Issuable</Label>
                                
                                <Input type="select" name="issuable" id="issuable" value={formData.issuable}
                                       onChange={handleChange} required>
                                    <option >--Select--</option>
                                    <option value="Now">Now</option>
                                    <option value="Later">Later</option>
                                </Input>
                            </Col>

                        </Row>

                        <h2 className="text-l font-bold mb-2 mt-2">Customer Details</h2>
                        <hr/>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Phone Number</Label>
                                    <Input
                                        type="text"
                                        name="phoneNumber"
                                        value={formData.phoneNumber}
                                        onChange={handleChange}
                                        onBlur={() => handlePhoneNumberBlur(formData.phoneNumber)}
                                        required
                                    />
                                </FormGroup>
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Optional Number</Label>
                                    <Input
                                        type="text"
                                        name="otherNumber"
                                        value={formData.otherNumber}
                                        onChange={handleChange}
                                        onBlur={() => handlePhoneNumberBlur(formData.otherNumber)}
                                    />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={3}>
                                <FormGroup className="mt-2">
                                    <Label for="type" className="fw-bold">Title</Label>
                                    <Input type="select" name="title" id="title" value={formData.title}
                                           onChange={handleChange} required>
                                        <option value="">Title</option>
                                        <option value="Mr">Mr</option>
                                        <option value="Mrs">Mrs</option>
                                        <option value="Ms">Ms</option>
                                        <option value="Dr">Dr</option>
                                        <option value="Rev">Rev</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label className="fw-bold">First Name</Label>
                                    <Input type="text" name="FtName" value={formData.FtName} onChange={handleChange}
                                           required/>
                                </FormGroup>
                            </Col>
                            <Col md={4}>
                                <FormGroup>
                                    <Label className="fw-bold">Last Name</Label>
                                    <Input type="text" name="SrName" value={formData.SrName} onChange={handleChange}
                                           required/>
                                </FormGroup>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">NIC</Label>
                                    <Input type="text" name="id" value={formData.id} onChange={handleChange}
                                    />
                                </FormGroup>
                            </Col>
                            {!isNewCustomer && (
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="fw-bold">Previous Balance</Label>
                                        <Input type="text" name="balance" value={formData.balance}
                                               onChange={handleChange} required/>
                                    </FormGroup>
                                </Col>
                            )}
                        </Row>
                        <FormGroup>
                            <Label className="fw-bold">Address</Label>
                            <Input type="text" name="address" value={formData.address} onChange={handleChange}
                                   required/>
                        </FormGroup>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Category</Label>
                                    <Input type="select" name="category" id="category" value={formData.category}
                                           onChange={handleChange} required>
                                        <option value="">Select Category</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Credit">Credit</option>
                                        <option value="Loyal">Loyal</option>
                                    </Input>
                                </FormGroup>
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label className="fw-bold">Type</Label>
                                    <Input type="select" name="type" id="type" value={formData.type}
                                           onChange={handleChange} required>
                                        <option value="">Select type</option>
                                        <option value="Walking">Walking</option>
                                        <option value="On site">On site</option>
                                        <option value="Shop">Shop</option>
                                        <option value="Force">Force</option>
                                        <option value="Hotel">Hotel</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        {/* Show t_name input only for Shop, Force, Hotel */}
                        {["Shop", "Force", "Hotel"].includes(formData.type) && (
                            <FormGroup>
                                <Label for="t_name" className="fw-bold">{formData.type} Name</Label>
                                <Input type="text" name="t_name" value={formData.t_name} onChange={handleChange}
                                       required/>
                                {errors.t_name && <small className="text-danger">{errors.t_name}</small>}
                            </FormGroup>
                        )}
                        {["Walking", "On site"].includes(formData.type) && (
                            <>
                                <FormGroup>
                                    <Label for="occupation" className="fw-bold">Occupation</Label>
                                    <Input type="text" name="occupation" value={formData.occupation}
                                           onChange={handleChange} required/>
                                    {errors.occupation &&
                                        <small className="text-danger">{errors.occupation}</small>}
                                </FormGroup>
                                <FormGroup>
                                    <Label for="workPlace" className="fw-bold">Work Place</Label>
                                    <Input type="text" name="workPlace" value={formData.workPlace}
                                           onChange={handleChange} required/>
                                    {errors.workPlace && <small className="text-danger">{errors.workPlace}</small>}
                                </FormGroup>
                            </>
                        )}

                    </div>
                    <div className='order-details'>
                        <h2 className="text-xl font-bold mb-2">Order Details</h2>
                        <hr/>
                        <FormGroup>
                            <Label className="fw-bold">Item Selection</Label>

                            {/* Search + Button Row */}
                            <div className="d-flex gap-2 align-items-start mb-2">
                                <Input
                                    type="text"
                                    placeholder="Search items"
                                    value={searchTerm}
                                    onChange={handleSearchChange}
                                    style={{flex: 4}}
                                />
                                <button
                                    type="button"  // <-- Add this line
                                    className="btn btn-primary"
                                    style={{flex: 1, whiteSpace: "nowrap"}}
                                    onClick={handleButtonClick}
                                >
                                    Add New
                                </button>

                            </div>

                            {/* Filtered List */}
                            {searchTerm && filteredItems.length > 0 && (
                                <div className="border rounded bg-white shadow-sm max-h-40 overflow-auto">
                                    {filteredItems.map((item) => (
                                        <div
                                            key={item.I_Id}
                                            onClick={() => handleSelectItem(item)}
                                            className="dropdown-item px-3 py-2 border-bottom cursor-pointer hover:bg-light"
                                            style={{cursor: 'pointer'}}
                                        >
                                            {item.I_name} - Rs.{item.price}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </FormGroup>

                        <FormGroup className="flex flex-col mb-4">
                            {/* Row 1: Item Info */}
                            <div className="w-full px-2 mb-2">
                                <label className="block text-sm font-medium text-gray-700">Item</label>
                                <input
                                    type="text"
                                    value={selectedItem ? `${selectedItem.I_name} - Rs.${selectedItem.price}` : ""}
                                    className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                    disabled
                                />
                            </div>
                        </FormGroup>
                        <FormGroup className="flex flex-col mb-4">
                            {/* Row 1: Unit Price, Quantity, Discount, Total, Remove Button */}
                            <div className="w-full flex flex-wrap gap-2 px-2">
                                {/* Unit Price */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700">Unit Price</label>
                                    <input
                                        type="number"
                                        value={selectedItem ? selectedItem.price : ""}
                                        className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                        disabled
                                    />
                                </div>
                                {/* Special Discount */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700">Special Discount</label>
                                    <input
                                        type="text"
                                        value={discount}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*\.?\d*$/.test(value)) {
                                                setDiscount(value);
                                            }
                                        }}
                                        className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                        placeholder="Enter discount"
                                    />
                                </div>

                                {/* Quantity */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700">Quantity</label>
                                    <input
                                        type="text"
                                        value={quantity}
                                        onChange={(e) => {
                                            const value = e.target.value;
                                            if (/^\d*$/.test(value)) {
                                                setQuantity(value);
                                            }
                                        }}
                                        onBlur={() => {
                                            if (quantity === "" || parseInt(quantity) < 1) {
                                                setQuantity("1");
                                            }
                                        }}
                                        className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                        placeholder="Enter quantity"
                                    />
                                </div>


                                {/* Total */}
                                <div className="flex-1 min-w-[150px]">
                                    <label className="block text-sm font-medium text-gray-700">Total</label>
                                    <input
                                        type="number"
                                        value={selectedItem ? ((selectedItem.price - discount) * quantity).toFixed(2) : ""}
                                        className="mt-1 p-2 border border-gray-300 rounded-md w-full"
                                        disabled
                                    />
                                </div>

                                {/* Remove Button */}
                                <div className="flex">
                                    <Button
                                        color="danger"
                                        className="text-sm" // reduced padding and smaller text
                                        disabled={!selectedItem}
                                        onClick={() => {
                                            setSelectedItem(null);
                                            setDiscount(0);
                                            setQuantity(1);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </FormGroup>
                        <button
                            type="button"
                            id="addOrderDetail"
                            className="bg-green-500 text-white p-2 rounded-md"
                            onClick={handleAddToOrder}
                        >
                            Add to Order
                        </button>
                        {/* Order Details Table */}
                        <div className="overflow-auto max-w-full">
                            <table className="min-w-[600px] bg-white border rounded-lg shadow-md mb-6 mt-3">
                                <thead className="bg-blue-500 text-white">
                                <tr>
                                    <th>Product</th>
                                    <th>Unit Price</th>
                                    <th>Special Discount</th>
                                    <th>Gross Total</th>
                                    <th>Qty</th>
                                    <th>Net Total</th>
                                    <th>Remove</th>
                                </tr>
                                </thead>
                                <tbody>
                                {selectedItems.length > 0 ? (
                                    selectedItems.map((item, index) => {
                                        const unitPrice = item.originalPrice || item.price;
                                        const discount = item.discount || 0;
                                        const grossTotal = unitPrice - discount;
                                        const netTotal = grossTotal * item.qty;

                                        return (
                                            <tr key={index}>
                                                <td className="">{item.I_name}</td>
                                                <td>Rs.{unitPrice.toFixed(2)}</td>
                                                <td>Rs.{discount.toFixed(2)}</td>
                                                <td>Rs.{grossTotal.toFixed(2)}</td>
                                                <td>{item.qty}</td>
                                                <td className="font-semibold text-green-700">Rs.{netTotal.toFixed(2)}</td>
                                                <td>
                                                    <button
                                                        onClick={() => handleRemoveItem(index)}
                                                        className="text-red-600 hover:text-red-800"
                                                        title="Remove Item"
                                                    >
                                                        🗑️
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-3 text-gray-500">
                                            No items added yet.
                                        </td>
                                    </tr>
                                )}
                                </tbody>
                            </table>
                        </div>

                        <FormGroup>
                            <Label className="fw-bold">Coupon Code</Label>
                            <Row>
                                <Col md={8}>
                                    <Input type="select" name="couponCode" onChange={handleChange}>
                                        <option value="">Select Coupon</option>
                                        {coupons.map((coupon) => (
                                            <option key={coupon.id}
                                                    value={coupon.coupon_code}>{coupon.coupon_code}({coupon.employee_name})
                                                - {coupon.discount} Off</option>
                                        ))}
                                    </Input>
                                </Col>
                                <Col md={4}>
                                    <Button color="primary" block onClick={handleAddNewCoupon}>
                                        Add New
                                    </Button>
                                </Col>
                            </Row>
                        </FormGroup>

                        <FormGroup>
                            <Label className="fw-bold">Special Note</Label><Input type="textarea" name="specialNote"
                                                                                  onChange={handleChange}></Input>
                        </FormGroup>
                    </div>
                    <div className="order-details">
                        <h5 className="text-center underline">Delivery Details</h5>
                        <hr/>
                        <FormGroup>
                            <Label className="fw-bold">Delivery Method</Label>
                            <div className="d-flex gap-3">
                                <Label>
                                    <Input type="radio" name="dvStatus" value="Delivery"
                                           onChange={handleChange}/> Delivery
                                </Label>
                                <Label>
                                    <Input type="radio" name="dvStatus" value="Pickup" onChange={handleChange}/> Pickup
                                </Label>
                            </div>
                        </FormGroup>
                        {formData.dvStatus === "Delivery" && (
                            <FormGroup>
                                <Label className="fw-bold">Delivery Type</Label>
                                <div className="d-flex gap-3">
                                    <Label>
                                        <Input type="radio" name="dvtype" value="Direct"
                                               onChange={handleChange}/> Direct
                                    </Label>
                                    <Label>
                                        <Input type="radio" name="dvtype" value="Combined"
                                               onChange={handleChange}/> Combined
                                    </Label>
                                </div>
                            </FormGroup>
                        )}
                        {formData.dvtype === "Direct" && (
                            <>
                                <FormGroup>
                                    <Label className="fw-bold">Address</Label>
                                    <Input type="text" name="address" value={formData.address} onChange={handleChange}
                                           readOnly/>
                                </FormGroup>
                                <FormGroup check>
                                    <Label check>
                                        <Input type="checkbox" name="isAddressChanged"
                                               checked={formData.isAddressChanged || false} onChange={handleChange}/>
                                        Changed Address
                                    </Label>
                                </FormGroup>
                                {formData.isAddressChanged && (
                                    <FormGroup>
                                        <Label className="fw-bold">New Address</Label>
                                        <Input type="text" name="newAddress" value={formData.newAddress || ""}
                                               onChange={handleChange} required/>
                                    </FormGroup>
                                )}
                                <FormGroup>
                                    <Label className="fw-bold">Expected Date</Label>
                                    <Input type="date" name="expectedDate" onChange={handleChange}/>
                                </FormGroup>
                                {formData.expectedDate && (
                                    <p className={`text-${availableDelivery ? "success" : "danger"}`}>
                                        {availableDelivery ? "Delivery is available on this date" : "No delivery available on this date"}
                                    </p>
                                )}
                                <FormGroup>
                                    <Label className="fw-bold">Delivery Charge</Label>
                                    <Input type="text" name="deliveryCharge" onChange={handleChange}/>
                                </FormGroup>
                            </>
                        )}
                        {formData.dvtype === "Combined" && (
                            <>
                                <FormGroup>
                                    <Label className="fw-bold">Address</Label>
                                    <Input type="text" name="address" value={formData.address} onChange={handleChange}
                                           required/>
                                </FormGroup>
                                <FormGroup check>
                                    <Label check>
                                        <Input type="checkbox" name="isAddressChanged"
                                               checked={formData.isAddressChanged || false} onChange={handleChange}/>
                                        Changed Address
                                    </Label>
                                </FormGroup>
                                {formData.isAddressChanged && (
                                    <FormGroup>
                                        <Label className="fw-bold">New Address</Label>
                                        <Input type="text" name="newAddress" value={formData.newAddress || ""}
                                               onChange={handleChange} required/>
                                    </FormGroup>
                                )}
                                <FormGroup>
                                    <Label className="fw-bold">District</Label>
                                    <Input type="select" name="district" value={formData.district}
                                           onChange={handleChange} required>
                                        <option value="">Select District</option>
                                        {districts.map((district) => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </Input>
                                </FormGroup>
                                {deliveryDates.length > 0 ? (
                                    <FormGroup>
                                        <Label className="fw-bold">Expected Delivery Date</Label>
                                        <Input type="select" name="expectedDate" onChange={handleChange}>
                                            <option value="">Select Date</option>
                                            {deliveryDates.map((date, index) => (
                                                <option key={index} value={date}>{date}</option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                ) : (
                                    <FormGroup>
                                        <Label className="fw-bold">Expected Delivery Date</Label>
                                        <Input type="date" name="expectedDate" onChange={handleChange}></Input>
                                    </FormGroup>
                                )}
                            </>
                        )}
                        {formData.dvStatus === "Pickup" && (
                            <>
                                <FormGroup>
                                    <Label className="fw-bold">City</Label>
                                    <Input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </FormGroup>

                                <FormGroup>
                                    <Label className="fw-bold">Expected Date</Label>
                                    <Input
                                        type="date"
                                        name="expectedDate"
                                        onChange={handleChange}
                                    />
                                </FormGroup>
                            </>
                        )}
                    </div>
                    <div className="order-details mt-4 space-y-2 border rounded-lg p-4 bg-white shadow-sm w-full max-w-md">
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Delivery Fee</span>
                            <span>Rs.{deliveryPrice}</span>
                        </div>
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Special Discount</span>
                            <span>Rs.{specialdiscountAmount}</span>
                        </div>
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Coupon Discount</span>
                            <span>Rs.{discountAmount}</span>
                        </div>
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Total Item Price</span>
                            <span>Rs.{totalItemPrice}</span>
                        </div>
                        <div
                            className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2 mt-2">
                            <span>Total Bill Price</span>
                            <span>Rs.{totalBillPrice}</span>
                        </div>
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Advance </span>
                            <span>
                            <Input
                                type="text"
                                name="advance"
                                value={advance}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    // Allow only numbers and a single dot
                                    if (/^\d*\.?\d*$/.test(val)) {
                                        setAdvance(val);
                                    }
                                }}
                                required
                            />
                        </span>
                        </div>
                        <div className="flex justify-between text-base text-gray-700">
                            <span>Balance</span>
                            <span>Rs.{balance}</span>
                        </div>
                    </div>
                    <Row>
                        <Col md="6"><Button type="submit" color="primary" block>Place Order</Button></Col>
                        <Col md="6"><Button type="button" color="danger" block
                                            onClick={handleClear}>Clear</Button></Col>
                    </Row>
                </Form>

                {showModal && (
                    <AddNewItem
                        setShowModal={setShowModal}
                        handleSubmit2={handleAddItem}
                    />
                )}

                {showModal1 && (
                    <AddNewCoupone
                        setShowModal1={setShowModal1}
                        handleSubmit2={handleAddCoupon}
                    />
                )}
                {showModal2 && selectedOrder && (
                    <FinalInvoice1
                        selectedOrder={selectedOrder}
                        setShowModal2={setShowModal2}
                        handlePaymentUpdate={handleSubmit3}
                        handleDeliveryNote={viewHandle}
                    />
                )}
                {showReceiptView && (
                    <ReceiptView
                        receiptData={receiptData}
                        setShowReceiptView={setShowReceiptView}
                    />
                )}
                {showModal3 && selectedOrder && (
                    <MakeDeliveryNoteNow
                        selectedOrders={selectedOrder}
                        setShowModal={setShowModal3}
                        handleDeliveryUpdate={handleSubmit2}
                    />
                )}
                {showDeliveryView && (
                    <DeliveryNoteViewNow
                        receiptData={receiptDataD}
                        setShowDeliveryView={setShowDeliveryView}
                    />
                )}
                <Popup open={openPopup} onClose={() => setOpenPopup(false)} modal closeOnDocumentClick>
                    <div className="p-4">
                        <h4 style={{color: "red"}}>Validation Errors</h4>
                        <ul>
                            {errors.map((error, index) => (
                                <li key={index} style={{color: "red"}}>{error}</li>
                            ))}
                        </ul>
                        <button className="btn btn-primary mt-2" onClick={() => setOpenPopup(false)}>Close</button>
                    </div>
                </Popup>
            </div>
        </Helmet>

    );
};
export default OrderInvoice;
