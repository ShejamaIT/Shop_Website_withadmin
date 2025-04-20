import React, { useState, useEffect } from "react";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/placeorder.css";

const PlaceOrder = ({ onPlaceOrder }) => {
    const [formData, setFormData] = useState({c_ID:"",title:"",FtName: "", SrName: "", email: "", phoneNumber: "",occupation:"",workPlace:"",
        otherNumber: "", address: "", city: "", district: "", specialNote: "", dvStatus: "", expectedDate: "", couponCode: "",balance:""});
    const [items, setItems] = useState([]);
    const [selectedItems, setSelectedItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // Fixed: should be a string
    const [coupons, setCoupons] = useState([]);
    const [deliveryDates, setDeliveryDates] = useState([]);
    const [deliveryPrice, setDeliveryPrice] = useState(0);
    const [districts, setDistricts] = useState([]);
    const [deliveryRates, setDeliveryRates] = useState({});
    const [discountAmount, setDiscountAmount] = useState(0);
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
    const [orderType, setOrderType] = useState("On-site");

    useEffect(() => {
        fetchItems();fetchCoupons();fetchCustomers();
    }, []);
    const fetchItems = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/allitems");
            const data = await response.json();setItems(data || []);setFilteredItems(data || []);
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
    }, [selectedItems, deliveryPrice, discountAmount]); // Recalculate when dependencies change
    // const handleChange = (e) => {
    //     const { name, value, type, checked } = e.target;
    //
    //     setFormData((prev) => ({
    //         ...prev,
    //         [name]: type === "checkbox" ? checked : value, // Handle checkbox separately
    //     }));
    //
    //     // Clear delivery price when changing status
    //     if (name === "dvtype" || name === "dvStatus") {
    //         setDeliveryPrice(0);
    //     }
    //
    //     if (name === "district") {
    //         setDeliveryPrice(deliveryRates[value] || 0);
    //         fetchDeliveryDates(value);
    //     }
    //
    //     if (name === "couponCode") {
    //         const selectedCoupon = coupons.find((c) => c.coupon_code === value);
    //         setDiscountAmount(selectedCoupon ? selectedCoupon.discount : 0);
    //     }
    //
    //     // If switching to Direct Delivery, reset district & expectedDate
    //     if (name === "dvtype" && value === "Direct") {
    //         setFormData((prev) => ({ ...prev, district: "", expectedDate: "", deliveryCharge: "" }));
    //     }
    //
    //     // If Direct Delivery, use input field value as delivery charge instead of district rates
    //     if (name === "deliveryCharge" && formData.dvtype === "Direct") {
    //         setDeliveryPrice(value);
    //     }
    //
    //     // If Expected Date is selected for Direct, check delivery availability
    //     if (name === "expectedDate" && formData.dvtype === "Direct") {
    //         checkDeliveryAvailability(value);
    //     }
    //
    //     // If the address change checkbox is unchecked, remove the newAddress field
    //     if (name === "isAddressChanged" && !checked) {
    //         setFormData((prev) => ({
    //             ...prev,
    //             newAddress: "", // Reset new address
    //         }));
    //     }
    // };
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
                    address: "",
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
            setDiscountAmount(selectedCoupon ? selectedCoupon.discount : 0);
        }
    };

    const checkDeliveryAvailability = async (date) => {
        try {
            // Mock API call to check delivery availability (Replace with real API)
            const response = await fetch(`http://localhost:5001/api/admin/main/check-delivery?date=${date}`);
            const result = await response.json();
            console.log(result.available);
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
        setSelectedItems((prevItems) => {
            const existingItem = prevItems.find((selected) => selected.I_Id === item.I_Id);
            if (existingItem) {
                // If item already exists, increase its qty
                return prevItems.map((selected) =>
                    selected.I_Id === item.I_Id ? { ...selected, qty: selected.qty + 1 } : selected
                );
            } else {
                // If item is new, add it with qty = 1
                return [...prevItems, { ...item, qty: 1, price: item.price }];
            }
        });
        setSearchTerm("");
        setFilteredItems([]);
    };

    const handleQtyChange = (e, itemId) => {
        const value = parseInt(e.target.value) || 1;
        setSelectedItems((prevItems) =>
            prevItems.map((item) => item.I_Id === itemId ? { ...item, qty: value  } : item)
        );
    };
    const handleRemoveItem = (itemId) => {
        setSelectedItems((prevItems) => prevItems.filter((item) => item.I_Id !== itemId));
    };
    const calculateTotalPrice = () => {
        const itemTotal = selectedItems.reduce((total, item) => total + item.price * item.qty, 0);
        setTotalItemPrice(itemTotal);
        const total = Number((Number(itemTotal) - Number(discountAmount) ) + Number(deliveryPrice));
        setTotalBillPrice(total);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.FtName || !formData.SrName || !formData.email || !formData.phoneNumber || selectedItems.length === 0) {
            toast.error("Please fill all details and add at least one item.");
            return;
        }

        if (formData.dvStatus === "Delivery" && formData.dvtype === "Combined" &&(!formData.address || !formData.district || !formData.expectedDate)) {
            toast.error("Please complete all delivery details.");
            return;
        }
        const fullName = `${formData.FtName} ${formData.SrName}`.trim();

        const orderData = {
            ...formData,
            isNewCustomer,
            orderType,
            items: selectedItems.map(item => ({ I_Id: item.I_Id, qty: item.qty, price: item.price * item.qty })),
            deliveryPrice, discountAmount, totalItemPrice, totalBillPrice,
        };
        console.log(orderData);
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/orders", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(orderData),
            });

            const result = await response.json();

            if (response.ok) {
                toast.success("Order placed successfully!");
                handleClear();
                setTimeout(() => {
                    window.location.reload(); // Auto-refresh the page
                }, 1000);
            } else {
                toast.error(result.message || "Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error submitting order data:", error);
            toast.error("Error submitting order data. Please try again.");
        }

    };
    const handleClear = () => {
        setFormData({c_ID:"",title:"",FtName: "",id:"" ,SrName: "", email: "", phoneNumber: "", otherNumber: "", address: "",occupation:"",workPlace:"",
            city: "", district: "",specialNote: "", expectedDate: "", couponCode: "", dvStatus: "",type:"",category:"",balance:""});
        setSelectedItems([]);setSearchTerm("");setDeliveryPrice(0);setDiscountAmount(0);setTotalItemPrice(0);setTotalBillPrice(0);
    };
    const handleSearchChange1 = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (!value.trim()) {
            setFilteredCustomers([]);
            setShowDropdown(false);
        } else {
            const filtered = customers.filter(
                (customer) =>
                    customer.SrName.toLowerCase().includes(value.toLowerCase()) ||
                    customer.FtName.toLowerCase().includes(value.toLowerCase()) ||
                    customer.id.toLowerCase().includes(value) ||
                    customer.contact1.toLowerCase().includes(value)||
                    customer.contact2.toLowerCase().includes(value)
            );
            setFilteredCustomers(filtered);
            setShowDropdown(filtered.length > 0);
        }
    };
    const handleSelectCustomer = (customer) => {
        setFormData((prevData) => ({
            ...prevData,
            c_ID: customer.c_ID,
            title: customer.title,
            FtName: customer.FtName ,
            SrName: customer.SrName,
            email: customer.email,
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
        handleClear(); // Call handleClear when switching customer type
    };

    return (
        <Container className="place-order-container">
            <h3 className="text-center">Place an Order</h3>
            <Row>
                <Col lg="8" className="mx-auto">
                    <Form onSubmit={handleSubmit}>
                        <div className='order-details'>
                            <h5 className='text-center underline'>Order Type</h5><hr/>
                            <Row>
                            <Label className="fw-bold">Select Order Type</Label>
                            <div className="d-flex gap-3">
                                <Label>
                                    <Input
                                        type="radio"
                                        name="orderType"
                                        value="On-site"
                                        checked={orderType === "On-site"} // Check if this radio button is selected
                                        onChange={() => setOrderType("On-site")} // Update the state when selected
                                    />{" "}
                                    On-Site
                                </Label>
                                <Label>
                                    <Input
                                        type="radio"
                                        name="orderType"
                                        value="Walking"
                                        checked={orderType === "Walking"} // Check if this radio button is selected
                                        onChange={() => setOrderType("Walking")} // Update the state when selected
                                    />{" "}
                                    Walking
                                </Label>
                            </div>
                        </Row>
                            <h5 className='text-center underline'>Customer Details</h5><hr/>
                            <Row>
                                <Label className="fw-bold">Select Customer Type</Label>
                                <div className="d-flex gap-3">
                                    <Label>
                                        <Input
                                            type="radio"
                                            name="customerType"
                                            checked={isNewCustomer}
                                            onChange={() => setCustomer("New")}
                                        /> New Customer
                                    </Label>
                                    <Label>
                                        <Input
                                            type="radio"
                                            name="customerType"
                                            checked={!isNewCustomer}
                                            onChange={() => setCustomer("Previous")}
                                        /> Previous Customer
                                    </Label>
                                </div>
                            </Row>
                            {!isNewCustomer && (
                                <>
                                    <FormGroup>
                                        <Label className="fw-bold">Search Customer</Label>
                                        <Input
                                            type="text"
                                            placeholder="Search by name, NIC, or contact"
                                            value={searchTerm}
                                            onChange={handleSearchChange1}
                                        />
                                        {searchTerm && filteredCustomers.length > 0 && (
                                            <div className="dropdown">
                                                {filteredCustomers.map((customer) => (
                                                    <div
                                                        key={customer.id}
                                                        onClick={() => handleSelectCustomer(customer)}
                                                        className="dropdown-item"
                                                    >
                                                        {customer.FtName} {customer.SrName} ({customer.id})
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </FormGroup>
                                </>
                            )}
                            <Row>
                                <Col md={3}>
                                    <FormGroup>
                                        <Label for="type" className="fw-bold">Title</Label>
                                        <Input type="select" name="title" id="title" value={formData.title} onChange={handleChange} required>
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
                                        <Input type="text" name="FtName" value={formData.FtName} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md={4}>
                                    <FormGroup>
                                        <Label className="fw-bold">Last Name</Label>
                                        <Input type="text" name="SrName" value={formData.SrName} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="fw-bold">Phone Number</Label>
                                        <Input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="fw-bold">Optional Number</Label>
                                        <Input type="text" name="otherNumber" value={formData.otherNumber} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                            </Row>
                            <Row>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="fw-bold">NIC</Label>
                                        <Input type="text" name="id" value={formData.id} onChange={handleChange} required />
                                    </FormGroup>
                                </Col>
                                {!isNewCustomer && (
                                    <Col md={6}>
                                        <FormGroup>
                                            <Label className="fw-bold">Previous Balance</Label>
                                            <Input type="text" name="balance" value={formData.balance} onChange={handleChange} required />
                                        </FormGroup>
                                    </Col>
                                )}
                            </Row>
                            <FormGroup>
                                <Label className="fw-bold">Email</Label>
                                <Input type="text" name="email" value={formData.email} onChange={handleChange} required />
                            </FormGroup>
                            <Row>
                                <Col md={6}>
                                    <FormGroup>
                                        <Label className="fw-bold">Category</Label>
                                        <Input type="select" name="category" id="category" value={formData.category} onChange={handleChange} required>
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
                                        <Input type="select" name="type" id="type" value={formData.type} onChange={handleChange} required>
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
                                    <Input type="text" name="t_name" value={formData.t_name} onChange={handleChange} required />
                                    {errors.t_name && <small className="text-danger">{errors.t_name}</small>}
                                </FormGroup>
                            )}
                            {["Walking", "On site"].includes(formData.type) && (
                                <>
                                    <FormGroup>
                                        <Label for="occupation" className="fw-bold">Occupation</Label>
                                        <Input type="text" name="occupation" value={formData.occupation} onChange={handleChange} required />
                                        {errors.occupation && <small className="text-danger">{errors.occupation}</small>}
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="workPlace" className="fw-bold">Work Place</Label>
                                        <Input type="text" name="workPlace" value={formData.workPlace} onChange={handleChange} required />
                                        {errors.workPlace && <small className="text-danger">{errors.workPlace}</small>}
                                    </FormGroup>
                                </>
                            )}
                            <FormGroup>
                                <Label className="fw-bold">Address</Label>
                                <Input type="text" name="address" value={formData.address} onChange={handleChange} required />
                            </FormGroup>
                        </div>
                        <div className='order-details'>
                            <h5 className='text-center underline'>Order Details</h5><hr/>
                            <FormGroup>
                                <Label className="fw-bold">Item Selection</Label>
                                <Input type="text" placeholder="Search items" value={searchTerm} onChange={handleSearchChange} />
                                {searchTerm && filteredItems.length > 0 && (
                                    <div className="dropdown">
                                        {filteredItems.map((item) => (
                                            <div key={item.I_Id} onClick={() => handleSelectItem(item)} className="dropdown-item">
                                                {item.I_name} - Rs.{item.price}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </FormGroup>
                            {selectedItems.map((item) => (
                                <Row key={item.I_Id} className="mt-2">
                                    <Col md={4}><Label>{item.I_name} - Rs.{item.price}</Label></Col>
                                    <Col md={4}><Input type="number" value={item.qty} onChange={(e) => handleQtyChange(e, item.I_Id)} /></Col>
                                    <Col md={2}><Button color="danger" onClick={() => handleRemoveItem(item.I_Id)}>Remove</Button></Col>
                                </Row>
                            ))}
                            <FormGroup>
                                <Label className="fw-bold">Coupon Code</Label>
                                <Input type="select" name="couponCode" onChange={handleChange}>
                                    <option value="">Select Coupon</option>
                                    {coupons.map((coupon) => (
                                        <option key={coupon.id} value={coupon.coupon_code}>{coupon.coupon_code}({coupon.employee_name}) - {coupon.discount} Off</option>
                                    ))}
                                </Input>
                            </FormGroup>
                            <FormGroup>
                                <Label className="fw-bold">Special Note</Label><Input type="textarea" name="specialNote" onChange={handleChange}></Input>
                            </FormGroup>
                        </div>

                        <div className="order-details">
                            <h5 className="text-center underline">Delivery Details</h5>
                            <hr />

                            {/* Delivery Method Selection */}
                            <FormGroup>
                                <Label className="fw-bold">Delivery Method</Label>
                                <div className="d-flex gap-3">
                                    <Label>
                                        <Input type="radio" name="dvStatus" value="Delivery" onChange={handleChange} /> Delivery
                                    </Label>
                                    <Label>
                                        <Input type="radio" name="dvStatus" value="Pickup" onChange={handleChange} /> Pickup
                                    </Label>
                                </div>
                            </FormGroup>

                            {/* Delivery Type (Direct / Combined) */}
                            {formData.dvStatus === "Delivery" && (
                                <FormGroup>
                                    <Label className="fw-bold">Delivery Type</Label>
                                    <div className="d-flex gap-3">
                                        <Label>
                                            <Input type="radio" name="dvtype" value="Direct" onChange={handleChange} /> Direct
                                        </Label>
                                        <Label>
                                            <Input type="radio" name="dvtype" value="Combined" onChange={handleChange} /> Combined
                                        </Label>
                                    </div>
                                </FormGroup>
                            )}

                            {/* Direct Delivery Fields */}
                            {formData.dvtype === "Direct" && (
                                <>
                                    <FormGroup>
                                        <Label className="fw-bold">Address</Label>
                                        <Input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </FormGroup>

                                    {/* Checkbox for Address Change */}
                                    <FormGroup check>
                                        <Label check>
                                            <Input
                                                type="checkbox"
                                                name="isAddressChanged"
                                                checked={formData.isAddressChanged || false}
                                                onChange={handleChange}
                                            />
                                            Changed Address
                                        </Label>
                                    </FormGroup>

                                    {/* Optional New Address Field */}
                                    {formData.isAddressChanged && (
                                        <FormGroup>
                                            <Label className="fw-bold">New Address</Label>
                                            <Input
                                                type="text"
                                                name="newAddress"
                                                value={formData.newAddress || ""}
                                                onChange={handleChange}
                                                required
                                            />
                                        </FormGroup>
                                    )}

                                    <FormGroup>
                                        <Label className="fw-bold">Expected Date</Label>
                                        <Input type="date" name="expectedDate" onChange={handleChange} />
                                    </FormGroup>

                                    {/* Display Delivery Availability */}
                                    {formData.expectedDate && (
                                        <p className={`text-${availableDelivery ? "success" : "danger"}`}>
                                            {availableDelivery ? "Delivery is available on this date" : "No delivery available on this date"}
                                        </p>
                                    )}

                                    <FormGroup>
                                        <Label className="fw-bold">Delivery Charge</Label>
                                        <Input type="number" name="deliveryCharge" onChange={handleChange} />
                                    </FormGroup>
                                </>
                            )}

                            {/* Combined Delivery Fields */}
                            {formData.dvtype === "Combined" && (
                                <>
                                    <FormGroup>
                                        <Label className="fw-bold">Address</Label>
                                        <Input
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleChange}
                                            required
                                        />
                                    </FormGroup>

                                    {/* Checkbox for Address Change */}
                                    <FormGroup check>
                                        <Label check>
                                            <Input
                                                type="checkbox"
                                                name="isAddressChanged"
                                                checked={formData.isAddressChanged || false}
                                                onChange={handleChange}
                                            />
                                            Changed Address
                                        </Label>
                                    </FormGroup>

                                    {/* Optional New Address Field */}
                                    {formData.isAddressChanged && (
                                        <FormGroup>
                                            <Label className="fw-bold">New Address</Label>
                                            <Input
                                                type="text"
                                                name="newAddress"
                                                value={formData.newAddress || ""}
                                                onChange={handleChange}
                                                required
                                            />
                                        </FormGroup>
                                    )}

                                    <FormGroup>
                                        <Label className="fw-bold">District</Label>
                                        <Input
                                            type="select"
                                            name="district"
                                            value={formData.district}
                                            onChange={handleChange}
                                            required
                                        >
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

                            {/* Pickup Fields */}
                            {formData.dvStatus === "Pickup" && (
                                <>
                                    <FormGroup>
                                        <Label className="fw-bold">City</Label>
                                        <Input type="text" name="city" onChange={handleChange} />
                                    </FormGroup>

                                    <FormGroup>
                                        <Label className="fw-bold">Expected Date</Label>
                                        <Input type="date" name="expectedDate" onChange={handleChange} />
                                    </FormGroup>
                                </>
                            )}
                        </div>


                        <h5>Delivery Fee: Rs.{deliveryPrice}</h5><h5>Discount: Rs.{discountAmount}</h5><h5>Total Item Price: Rs.{totalItemPrice}</h5><h4>Total Bill Price: Rs.{totalBillPrice}</h4>
                        <Row>
                            <Col md="6"><Button type="submit" color="primary" block>Place Order</Button></Col>
                            <Col md="6"><Button type="button" color="danger" block onClick={handleClear}>Clear</Button></Col>
                        </Row>
                    </Form>
                </Col>
            </Row>
            <Popup open={openPopup} onClose={() => setOpenPopup(false)} modal closeOnDocumentClick>
                <div className="p-4">
                    <h4 style={{ color: "red" }}>Validation Errors</h4>
                    <ul>
                        {errors.map((error, index) => (
                            <li key={index} style={{ color: "red" }}>{error}</li>
                        ))}
                    </ul>
                    <button className="btn btn-primary mt-2" onClick={() => setOpenPopup(false)}>Close</button>
                </div>
            </Popup>
        </Container>
    );
};
export default PlaceOrder;
