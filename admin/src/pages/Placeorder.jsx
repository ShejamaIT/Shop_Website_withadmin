import React, { useState, useEffect } from "react";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button } from "reactstrap";
import "../style/placeorder.css";

const PlaceOrder = ({ onPlaceOrder }) => {
    const [formData, setFormData] = useState({
        customerName: "",
        email: "",
        phoneNumber: "",
        otherNumber: "",
        address: "",
        city: "",
        district: "",
        specialNote: "",
        dvStatus: "",
        expectedDate: "",
        couponCode: "",
    });
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
    const [errors, setErrors] = useState([]);
    const [openPopup, setOpenPopup] = useState(false);
    useEffect(() => {
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

        fetchItems();
        fetchCoupons();
    }, []);

    useEffect(() => {
        calculateTotalPrice();
    }, [selectedItems, deliveryPrice, discountAmount]); // Recalculate when dependencies change

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (name === "district") {
            setDeliveryPrice(deliveryRates[value] || 0);
            fetchDeliveryDates(value);
        }
        if (name === "couponCode") {
            const selectedCoupon = coupons.find((c) => c.coupon_code === value);
            setDiscountAmount(selectedCoupon ? selectedCoupon.discount : 0);
        }
    };
    const fetchDeliveryDates = async (district) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/delivery-schedule?district=${district}`);
            const data = await response.json();
            setDeliveryDates(data.upcomingDates || []);
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
        if (!selectedItems.some((selected) => selected.I_Id === item.I_Id)) {
            setSelectedItems([...selectedItems, { ...item, qty: 1, price: item.price }]); // Ensure price is initialized
        }
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
        setTotalBillPrice((itemTotal - discountAmount ) + deliveryPrice);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.customerName || !formData.email || !formData.phoneNumber || selectedItems.length === 0) {
            toast.error("Please fill all details and add at least one item.");
            return;
        }
        if (formData.dvStatus === "Delivery" && (!formData.address || !formData.district || !formData.expectedDate)) {
            toast.error("Please complete all delivery details.");
            return;
        }

        const orderData = {
            ...formData,
            items: selectedItems.map(item => ({ I_Id: item.I_Id, qty: item.qty ,price: item.price * item.qty })),
            deliveryPrice,
            discountAmount,
            totalItemPrice,
            totalBillPrice,
        };
        if (validateForm()) {
            try {
                // Make a POST request to the server to add the supplier and items
                const response = await fetch("http://localhost:5001/api/admin/main/orders", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(orderData),
                });
                const result = await response.json();
                if (response.ok) {
                    // Show success message and clear the form
                    toast.success("Order placed successfully!");
                    handleClear();
                } else {
                    // Show error message if something goes wrong
                    toast.error(result.message || "Something went wrong. Please try again.");
                }
            } catch (error) {
                console.error("Error submitting supplier data:", error);
                toast.error("Error submitting supplier data. Please try again.");
            }
        }
    };
    const validateForm = () => {
        const validationErrors = [];
        if (!formData.dvStatus) validationErrors.push("Please select a delivery method.");
        if (!formData.customerName.trim()) validationErrors.push("Customer name is required.");
        if (!formData.email.trim() || !/\S+@\S+\.\S+/.test(formData.email))
            validationErrors.push("A valid email address is required.");
        if (!formData.phoneNumber.trim() || !/^\d{10}$/.test(formData.phoneNumber))
            validationErrors.push("A valid 10-digit phone number is required.");
        if (formData.otherNumber.trim() && !/^\d{10}$/.test(formData.otherNumber))
            validationErrors.push("If provided, the optional number must be a valid 10-digit number.");

        if (selectedItems.length === 0) validationErrors.push("Please select at least one item.");
        selectedItems.forEach((item) => {
            if (!item.qty || item.qty <= 0) validationErrors.push(`Quantity for ${item.I_name} must be at least 1.`);
        });
        if (formData.dvStatus === "Delivery") {
            if (!formData.city.trim()) validationErrors.push("City is required for delivery.");
            if (!formData.address.trim()) validationErrors.push("Address is required for delivery.");
            if (!formData.district.trim()) validationErrors.push("District is required for delivery.");
            if (!formData.expectedDate) validationErrors.push("Please select an expected delivery date.");
        } else if (formData.dvStatus === "Pickup") {
            if (!formData.city.trim()) validationErrors.push("City is required for pickup.");
            if (!formData.expectedDate) validationErrors.push("Please select an expected pickup date.");
        }
        if (validationErrors.length > 0) {
            setErrors(validationErrors);
            setOpenPopup(true); // Open popup with errors
            return false;
        }
        return true;
    };
    const handleClear = () => {
        setFormData({
            customerName: "",
            email: "",
            phoneNumber: "",
            otherNumber: "",
            address: "",
            city: "",
            district: "",
            specialNote: "",
            expectedDate: "",
            couponCode: "",
            dvStatus: "",
        });
        setSelectedItems([]);
        setSearchTerm("");
        setDeliveryPrice(0);
        setDiscountAmount(0);
        setTotalItemPrice(0);
        setTotalBillPrice(0);
    };
    return (
        <Container className="place-order-container">
            <Row>
                <Col lg="8" className="mx-auto">
                    <h3 className="text-center">Place an Order</h3>
                    <Form onSubmit={handleSubmit}>
                        <FormGroup>
                            <Label>Delivery Method</Label>
                            <div className="d-flex gap-3">
                                <Label>
                                    <Input type="radio" name="dvStatus" value="Delivery" onChange={handleChange} /> Delivery
                                </Label>
                                <Label>
                                    <Input type="radio" name="dvStatus" value="Pickup" onChange={handleChange} /> Pickup
                                </Label>
                            </div>
                        </FormGroup>

                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Customer Name</Label>
                                    <Input type="text" name="customerName" value={formData.customerName} onChange={handleChange} required />
                                </FormGroup>
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label>Email</Label>
                                    <Input type="text" name="email" value={formData.email} onChange={handleChange} required />
                                </FormGroup>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={6}>
                                <FormGroup>
                                    <Label>Phone Number</Label>
                                    <Input type="text" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} required />
                                </FormGroup>
                            </Col>

                            <Col md={6}>
                                <FormGroup>
                                    <Label>Optional Number</Label>
                                    <Input type="text" name="otherNumber" value={formData.otherNumber} onChange={handleChange} required />
                                </FormGroup>
                            </Col>
                        </Row>
                        <FormGroup>
                            <Label>Item Selection</Label>
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
                        {formData.dvStatus === "Delivery" && (
                            <>
                                <FormGroup>
                                    <Label>City</Label>
                                    <Input type="text" name="city" onChange={handleChange}></Input>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Address</Label>
                                    <Input type="text" name="address" value={formData.address} onChange={handleChange} required />
                                </FormGroup>
                                <FormGroup>
                                    <Label>District</Label>
                                    <Input type="select" name="district" value={formData.district} onChange={handleChange} required>
                                        <option value="">Select District</option>
                                        {districts.map((district) => (
                                            <option key={district} value={district}>{district}</option>
                                        ))}
                                    </Input>
                                </FormGroup>
                                {deliveryDates.length > 0 ? (
                                    <FormGroup>
                                        <Label>Expected Delivery Date</Label>
                                        <Input type="select" name="expectedDate" onChange={handleChange}>
                                            <option value="">Select Date</option>
                                            {deliveryDates.map((date, index) => (
                                                <option key={index} value={date}>{date}</option>
                                            ))}
                                        </Input>
                                    </FormGroup>
                                ) : (
                                    <FormGroup>
                                        <Label>Expected Delivery Date</Label>
                                        <Input type="date" name="expectedDate" onChange={handleChange}></Input>
                                    </FormGroup>
                                )}
                            </>
                        )}
                        {formData.dvStatus === "Pickup" && (
                            <>
                                <FormGroup>
                                    <Label>City</Label>
                                    <Input type="text" name="city" onChange={handleChange}></Input>
                                </FormGroup>
                                <FormGroup>
                                    <Label>Expected Date</Label>
                                    <Input type="date" name="expectedDate" onChange={handleChange}></Input>
                                </FormGroup>
                            </>
                        )}
                        <FormGroup>
                            <Label>Coupon Code</Label>
                            <Input type="select" name="couponCode" onChange={handleChange}>
                                <option value="">Select Coupon</option>
                                {coupons.map((coupon) => (
                                    <option key={coupon.id} value={coupon.coupon_code}>{coupon.coupon_code}({coupon.employee_name}) - {coupon.discount} Off</option>
                                ))}
                            </Input>
                        </FormGroup>

                        <FormGroup>
                            <Label>Special Note</Label>
                            <Input type="textarea" name="specialNote" onChange={handleChange}></Input>
                        </FormGroup>
                        <h5>Delivery Fee: Rs.{deliveryPrice}</h5>
                        <h5>Discount: Rs.{discountAmount}</h5>
                        <h5>Total Item Price: Rs.{totalItemPrice}</h5>
                        <h4>Total Bill Price: Rs.{totalBillPrice}</h4>
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
