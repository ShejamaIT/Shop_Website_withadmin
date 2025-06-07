import React, {useState, useEffect, useRef} from "react";
import Popup from 'reactjs-popup';
import 'reactjs-popup/dist/index.css';
import { toast } from "react-toastify";
import { Container, Row, Col, Form, FormGroup, Label, Input, Button, ModalHeader, ModalBody, ModalFooter, Modal, Card, CardBody, CardTitle, CardText} from "reactstrap";
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
import { v4 as uuidv4 } from 'uuid';

const OrderInvoice = ({ onPlaceOrder }) => {
    const [formData, setFormData] = useState({c_ID:"",title:"",FtName: "", SrName: "", phoneNumber: "",occupation:"",workPlace:"",issuable:"",payment:"", subPayment: '',
        otherNumber: "", address: "", city: "",orderDate:"", district: "", specialNote: "", dvStatus: "", expectedDate: "", couponCode: "",balance:"",advance:""});
    const [items, setItems] = useState([]);
    const [selectedItem, setSelectedItem] = useState(null);
    const [quantity, setQuantity] = useState("");
    const [selectedItems, setSelectedItems] = useState([]);
    const [selectedItems1, setSelectedItems1] = useState([]);
    const [selectedItemsQty, setSelectedItemsQTY] = useState([]);
    const [interestValue , setInterestValue] = useState(0);
    const [rate , setRate] = useState(0);
    const [netAmount , setNetAmount] = useState(0);
    const [transferBank , setTranferBank] = useState("");
    const [chequeAmount , setChequeAmount] = useState(0);
    const [bank , setBank] = useState("");
    const [branch , setBranch] = useState("");
    const [chequeNumber , setChequeNumber] = useState("");
    const [accountNumber , setAccountNumber] = useState("");
    const [chequeDate , setChequeDate] = useState("");
    const [combinedCardBalance , setCombinedCardBalance] = useState(0);
    const [combinedChequeBalance , setCombinedChequeBalance] = useState(0);
    const [combinedCreditBalance , setCombinedCreditBalance] = useState(0);
    const [combinedTransferBalance , setCombinedTranferBalance] = useState(0);
    const [cardPortion, setCardPortion] = useState(0);
    const [chequePortion, setChequePortion] = useState(0);
    const [creditPortion , setCreditPortion] = useState(0);
    const [transferPortion , setTransferPortion] = useState(0);
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
    const [fulltotalPay , setFullTotalPay] = useState(0);
    const [creditAmount , setCreditAmount] = useState(0);
    const [creditExpectedDate , setCreditExpectedDate] = useState('');
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
    const [showStockModal1, setShowStockModal1] = useState(false);
    const [showStockModal2, setShowStockModal2] = useState(false);
    const [selectedItemForReserve, setSelectedItemForReserve] = useState(null);
    const [selectedItemForProduction , setSelectedItemForProduction] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const debounceTimeout = useRef(null);
    const [itemdetails, setItemDetails] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [suppliers, setSuppliers] = useState([]);
    const [loadingSuppliers, setLoadingSuppliers] = useState(true);
    const [productionData, setProductionData] = useState({itemId: '', supplierId: '', qty: '', expecteddate: '', specialnote: ''});
    const [processedItems, setProcessedItems] = useState([]);
    const [PurchaseId, setPurchaseId] = useState("");
    const subPaymentOptions = {
            Cash: ['Cash', 'Transfer'],
            Card: ['Debit Card', 'Credit Card'],
            // Cheque: ['Bank Cheque', 'Post-dated Cheque'],
            // Credit: ['30 Days', '60 Days'],
            Combined: ['Cash & Card','Cash & Cheque','Cash & Credit','Cash & Transfer']
    };
     const currentDate = new Date().toLocaleDateString();
    const currentTime = new Date().toLocaleTimeString();

    useEffect(() => {
        fetchItems();fetchCoupons();fetchCustomers();
    }, []);
    const fetchItems = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/allitems");
            const data = await response.json();
            console.log(data);
            setItems(data || []);
            setFilteredItems(data || []);
            return data;  // ✅ This ensures that fetchItems returns the data
        } catch (error) {
            toast.error("Error fetching items.");
            return [];  // ✅ Return an empty array if there's an error
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
                // If the response is OK, assume data is either an array or empty
                setCustomers(data || []);
                setFilteredCustomers(data || []);
                setError(""); // Clear any previous error
            } else {
                // Only show error if backend explicitly says something went wrong (e.g., 500)
                setCustomers([]);
                setFilteredCustomers([]);
                setError(data.message || "Something went wrong.");
            }
        } catch (error) {
            // Network or unexpected error
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
    useEffect(() => {
        const fixedRate = 2.5;
        const numericBill = parseFloat(totalBillPrice) || 0;
        const cashAmount = parseFloat(combinedCardBalance) || 0;
        const chequeAmount = parseFloat(combinedChequeBalance) || 0;
        const creditAdvance = parseFloat(creditAmount) || 0;
        const transferAdvance = parseFloat(combinedTransferBalance) || 0;


        const isCardPayment = formData.payment === "Card" &&
            (formData.subPayment === "Debit Card" || formData.subPayment === "Credit Card");

        const isCombinedCashCard = formData.payment === "Combined" &&
            formData.subPayment === "Cash & Card";

        const isCombinedCashCheque = formData.payment === "Combined" &&
            formData.subPayment === "Cash & Cheque";

        const isCombinedCashCredit = formData.payment === "Combined" &&
            formData.subPayment === "Cash & Credit";    

        const isCombinedCashTransfer = formData.payment === "Combined" &&
            formData.subPayment === "Cash & Transfer"; 

        const isCreditPayment = formData.payment === "Credit";

        if (isCardPayment) {
            const interest = (numericBill * fixedRate) / 100;
            const net = numericBill + interest;

            setRate(fixedRate);
            setInterestValue(interest);
            setNetAmount(net);
            setAdvance(numericBill);
            setBalance(0);
            setCardPortion(numericBill);
            setFullTotalPay(net);
        } else if (isCombinedCashCard) {
            const cardAmount = numericBill - cashAmount;
            const interest = (cardAmount * fixedRate) / 100;
            const cardTotal = cardAmount + interest;
            const fullPaid = cashAmount + cardAmount;
            const fullTotal = cashAmount + cardTotal;

            setRate(fixedRate);
            setInterestValue(interest);
            setNetAmount(cardTotal);
            setCardPortion(cardAmount);
            setAdvance(fullPaid);
            setBalance(0);
            setFullTotalPay(fullTotal);
        }  else if (isCombinedCashCheque) {
            const chequePart = numericBill - chequeAmount;
            const fullPaid = chequeAmount + chequePart;

            setChequePortion(chequePart);
            setAdvance(fullPaid); // Total amount paid via cash + cheque
            setBalance(0);
            setFullTotalPay(fullPaid); // No interest logic for cheque
        } else if (isCreditPayment) {
            const balance = numericBill - creditAdvance;
            setAdvance(creditAdvance);
            setBalance(balance > 0 ? balance : 0);
        } else if (isCombinedCashCredit) {
            const creditPart = numericBill - combinedCreditBalance;
            const fullPaid = combinedCreditBalance;

            setCreditPortion(creditPart);
            setAdvance(fullPaid); // Cash paid
            setBalance(creditPart > 0 ? creditPart : 0); // Credit portion is the remaining
            setFullTotalPay(numericBill); // No interest
        } else if (isCombinedCashTransfer) {
            const transferPart = numericBill - combinedTransferBalance;
            const fullpaid = parseFloat(transferPart) + parseFloat(combinedTransferBalance);

            setTransferPortion(transferPart);
            setAdvance(fullpaid); // Cash part
            setBalance(transferPart > 0 ? transferPart : 0); // Transfer part
            setFullTotalPay(numericBill); // No interest
        }else {
            setRate(0);
            setInterestValue(0);
            setNetAmount(0);
            setCardPortion(0);
            setAdvance(0);
            setBalance(0);
            setFullTotalPay(0);
        }
    }, [formData.payment, formData.subPayment, totalBillPrice, combinedCardBalance,combinedTransferBalance,combinedChequeBalance, creditAmount]);

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
    const handleChange1 = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: value,
            // Reset subPayment when payment changes
            ...(name === 'payment' && { subPayment: '' })
        }));
    };

    const secondOptions = subPaymentOptions[formData.payment] || [];
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
        fetchPurchaseID();
    }, []);
    const handleSearchChange = (e) => {
        fetchItems();
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
    const handleAddToOrder = async () => {
        const updatedItems = await fetchItems();  // Wait for the updated items list

        if (!selectedItem) return;

        // Use `updatedItems` to find the selected item
        const updatedSelectedItem = updatedItems.find(item => item.I_Id === selectedItem.I_Id);
        
        if (!updatedSelectedItem) {
            toast.error("Selected item not found in updated list.");
            return;
        }

        // Check if the item is issuable: Now or Later
        if (!formData.issuable || formData.issuable.trim() === "") {
            toast.error("Please select whether the item is issuable: Now or Later.");
            return;
        }

        // Stock check (if issuable is 'Now')
        if (formData.issuable === 'Now') {
            console.log("Latest AvailableQty:", updatedSelectedItem.availableQty, "Requested:", quantity);
            if (updatedSelectedItem.availableQty < quantity) {
                Swal.fire("There are not enough stocks for the requirement.");
                return;
            }
        }

        // Calculate discount and price
        const specialDiscount = parseFloat(discount) || 0;
        const discountedPrice = updatedSelectedItem.price - specialDiscount;

        // Update `selectedItems` array
        const existingIndex = selectedItems.findIndex(item => item.I_Id === updatedSelectedItem.I_Id);
        let updatedSelectedItems = [...selectedItems];

        if (existingIndex !== -1) {
            updatedSelectedItems[existingIndex].qty += quantity;
            updatedSelectedItems[existingIndex].discount = specialDiscount;
            updatedSelectedItems[existingIndex].price = discountedPrice;
            updatedSelectedItems[existingIndex].originalPrice = updatedSelectedItem.price;
        } else {
            updatedSelectedItems.push({
                ...updatedSelectedItem,
                qty: quantity,
                discount: specialDiscount,
                price: discountedPrice,
                originalPrice: updatedSelectedItem.price,
                itemName: updatedSelectedItem.I_name,
                unitPrice: updatedSelectedItem.price,
            });
        }

        // Update selectedItems state
        setSelectedItems(updatedSelectedItems);

        // Add expanded items with unique UID
        const newFlatItems = Array.from({ length: quantity }, () => ({
            ...updatedSelectedItem,
            uid: uuidv4(),
            qty: 1,
            discount: specialDiscount,
            price: discountedPrice,
            originalPrice: updatedSelectedItem.price,
            itemName: updatedSelectedItem.I_name,
            unitPrice: updatedSelectedItem.price,
            status: "",
        }));

        // Update selectedItemsQTY state
        setSelectedItemsQTY(prev => [...prev, ...newFlatItems]);

        // Reset fields
        setSelectedItem(updatedSelectedItem); // Optionally set `selectedItem` to the one just added
        setQuantity(1);
        setDiscount("");

        // Optionally reset `formData` or other states if needed
    };

    const handleRemoveItem = (index) => {
        const updatedItems = [...selectedItems];
        const removedItem = updatedItems.splice(index, 1)[0]; // Remove and capture the item

        setSelectedItems(updatedItems);

        // Remove all entries in selectedItemsQTY with the same I_Id
        setSelectedItemsQTY(prev =>
            prev.filter(item => item.I_Id !== removedItem.I_Id)
        );
    };
    const fetchSuppliers = async (id) => {
        try {
            const response = await fetch(`http://localhost:5001/api/admin/main/item-suppliers?I_Id=${id}`);
            if (!response.ok) throw new Error("Failed to fetch supplier details.");
            const data = await response.json();
            setSuppliers(data.suppliers);
        } catch (err) {
            console.error("Error fetching supplier details:", err);
            setError(err.message);
        } finally {
            setLoadingSuppliers(false);
        }
    };
    // Handle form changes
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setProductionData((prevFormData) => ({
            ...prevFormData,
            [name]: value
        }));
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

        let cardPayment = null;
        let tranferPayment = null;
        let chequePayment = null;
        let cashCardPayment = null;
        let creditPayment = null;
        let combinedChequePayment = null;
        let combinedCreditPayment = null;
        let combinedTransferPayment = null;

        if (formData.payment === "Cheque") {
            chequePayment = {
                amount: parseFloat(chequeAmount).toFixed(2),
                chequeNumber,
                bank,
                branch,
                accountNumber,
                chequeDate,
            };
        }
        if (formData.payment === "Cash" && formData.subPayment === 'Transfer') {
            tranferPayment = {
               bank : transferBank, 
            };
        }
        if (formData.payment === 'Card') {
            cardPayment = {
                // amount : parseFloat(totalBillPrice).toFixed(2),
                interestValue: parseFloat(interestValue).toFixed(2),
                type: formData.subPayment,
                netAmount: parseFloat(netAmount).toFixed(2),
                rate: parseFloat(rate).toFixed(2),
            };
        }
        if (formData.payment === "Credit") {
            creditPayment = {
                amount: parseFloat(creditAmount).toFixed(2),
                balance : parseFloat(balance).toFixed(2),
                expectdate: creditExpectedDate,
            };
        }
        if (formData.payment === 'Combined' && formData.subPayment === 'Cash & Card') {
            cashCardPayment = {
                cardBalance: parseFloat(cardPortion).toFixed(2),
                interestValue: parseFloat(interestValue).toFixed(2),
                type: formData.subPayment,
                netAmount: parseFloat(netAmount).toFixed(2),
                rate: parseFloat(rate).toFixed(2),
                fullpaidAmount : parseFloat(fulltotalPay),
            };
        }
        if (formData.payment === 'Combined' && formData.subPayment === 'Cash & Cheque') {
            combinedChequePayment = {
                chequeBalance: parseFloat(chequePortion).toFixed(2),
                cashBalance: parseFloat(combinedChequeBalance).toFixed(2),
                type: formData.subPayment,
                chequeNumber,bank, branch,accountNumber,chequeDate,
            };
        }
        if (formData.payment === 'Combined' && formData.subPayment === 'Cash & Credit') {
            combinedCreditPayment = {
                creditBalance: parseFloat(creditPortion).toFixed(2),
                cashBalance: parseFloat(combinedCreditBalance).toFixed(2),
                type: formData.subPayment,
                expectedDate: creditExpectedDate
            };
        }
        if (formData.payment === 'Combined' && formData.subPayment === 'Cash & Transfer') {
            combinedTransferPayment = {
                cashAmount: parseFloat(combinedTransferBalance) || 0,
                transferAmount: parseFloat(transferPortion) || 0,
                bank: transferBank || '',
            };
        }
        // ✅ Assemble and clean the final form data
        const updatedFormData = {
            ...formData,
            advance: parseFloat(advance || 0).toFixed(2),
            balance: parseFloat(balance || 0).toFixed(2),
            city: formData.address,
            cardPayment, chequePayment,cashCardPayment,tranferPayment,creditPayment,combinedChequePayment,combinedCreditPayment,combinedTransferPayment,
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
        const fullOrderData = {
            ...orderData,
            processedItems,
        };

        try {
            if (formData.issuable === 'Later') {
                try {
                    const fullOrderData = {
                        ...orderData,
                        processedItems,
                    };
            
                    console.log("📝 Sending Full Order Data:", fullOrderData);
            
                    const response = await fetch("http://localhost:5001/api/admin/main/later-order", {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(fullOrderData),
                    });
            
                    const result = await response.json();
            
                    if (response.ok && result.success) {
                        const { orderId, orderDate, expectedDate } = result.data;
                        toast.success(`Order placed successfully! Order ID: ${orderId}`);
                        console.log("✅ Order Success:", { orderId, orderDate, expectedDate });
                    } else {
                        toast.error(result.message || "Failed to place the order.");
                        console.error("❌ Order Error:", result.message || result);
                    }
            
                } catch (error) {
                    toast.error("An error occurred while placing the order.");
                    console.error("❌ Network/Server Error:", error);
                }
            } else if (formData.issuable === 'Now'){
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
                
                
                } else {
                    toast.error(result.message || "Something went wrong. Please try again.");
                }
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
            deliveryStatus: formData.deliveryStatus,
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
            const response = await fetch('http://localhost:5001/api/admin/main/issued-items-Now', {
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
    };

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
    const fetchPurchaseID = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/newPurchasenoteID");
            const data = await response.json();
            setPurchaseId(data.PurchaseID);
        } catch (err) {
            toast.error("Failed to load Purchase ID.");
        }
    };
    const handleAddItem = async (newItem) => {
        try {
            // Resolve actual material value
            const materialToSend = newItem.material === "Other" ? newItem.otherMaterial : newItem.material;

            // Validate required fields
            if (!newItem.img) {
                toast.error("Main image is required.");
                return;
            }

            // Prepare FormData for item upload
            const formDataToSend = new FormData();
            formDataToSend.append("I_Id", newItem.I_Id);
            formDataToSend.append("I_name", newItem.I_name);
            formDataToSend.append("Ca_Id", newItem.Ca_Id);
            formDataToSend.append("sub_one", newItem.sub_one);
            formDataToSend.append("sub_two", newItem.sub_two || "None");
            formDataToSend.append("descrip", newItem.descrip);
            formDataToSend.append("color", newItem.color || "N/A");
            formDataToSend.append("material", materialToSend);
            formDataToSend.append("price", newItem.price);
            formDataToSend.append("warrantyPeriod", newItem.warrantyPeriod || "N/A");
            formDataToSend.append("cost", newItem.cost);
            formDataToSend.append("s_Id", newItem.s_Id);
            formDataToSend.append("minQty", newItem.minQty);

            // Append images
            formDataToSend.append("img", newItem.img);
            if (newItem.img1) formDataToSend.append("img1", newItem.img1);
            if (newItem.img2) formDataToSend.append("img2", newItem.img2);
            if (newItem.img3) formDataToSend.append("img3", newItem.img3);

            // Calculate total cost for initial stock
            const cost = Number(newItem.cost);
            const quantity = Number(newItem.startStock);
            const ItemTotal = cost * quantity;

            // Prepare order data for stock entry
            const orderData = {
                purchase_id: PurchaseId,
                supplier_id: newItem.s_Id,
                date: currentDate,
                time: currentTime,
                itemTotal: ItemTotal,
                delivery: 0,
                invoice: "-",
                items: {
                    I_Id: newItem.I_Id,
                    material: materialToSend,
                    color: newItem.color || "N/A",
                    unit_price: newItem.price,
                    price: cost,
                    quantity: quantity,
                    total_price: ItemTotal.toFixed(2),
                },
            };
            console.log(orderData);

            // Submit item creation
            const submitResponse = await fetch("http://localhost:5001/api/admin/main/add-item", {
                method: "POST",
                body: formDataToSend,
            });

            const submitData = await submitResponse.json();

            if (!submitResponse.ok) {
                toast.error(submitData.message || "❌ Failed to add item.");
                return;
            }

            toast.success("✅ Item added successfully!");

            // Submit stock addition
            const stockResponse = await fetch("http://localhost:5001/api/admin/main/addStock", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            const stockResult = await stockResponse.json();

            if (!stockResponse.ok) {
                toast.error(stockResult.message || "❌ Failed to save purchase.");
                return;
            }

            toast.success("✅ Purchase saved successfully!");
            fetchItems(); // Optional chaining if fetchItems is passed from props/context

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
   const handleStatusChange = (index, newStatus, item) => {
        const updatedItems = [...selectedItemsQty];
        const updatedItem = { ...updatedItems[index], status: newStatus };
        updatedItems[index] = updatedItem;
        setSelectedItemsQTY(updatedItems);

        const identifier = updatedItem.uid;

        const removeByUid = (array) => array.filter(i => i.uid !== identifier);

        setProcessedItems(prev => removeByUid(prev)); // clear from any status

        if (newStatus === "Booked") {
            const strippedItem = {
                I_Id: updatedItem.I_Id,
                material: updatedItem.material,
                uid: updatedItem.uid,
                unitPrice: updatedItem.unitPrice,
                discount: updatedItem.discount || 0,
                status: "Booked"
            };
            setProcessedItems(prev => [...prev, strippedItem]);
        } else if (newStatus === "Reserved") {
            setSelectedItemForReserve(updatedItem);
            setShowStockModal1(true);
        } else if (newStatus === "Production") {
            fetchSuppliers(updatedItem.I_Id);
            setSelectedItemForProduction(updatedItem);
            setShowStockModal2(true);
        }

        setTimeout(() => {
            console.log("📦 All Processed Items:", processedItems);
            console.log("🔒 Reserved:", processedItems.filter(i => i.status === "Reserved"));
            console.log("🏭 Production:", processedItems.filter(i => i.status === "Production"));
            console.log("📦 Booked:", processedItems.filter(i => i.status === "Booked"));
        }, 200);
    };

    const handleProduction = (e) => {
        e.preventDefault();

        if (!selectedItemForProduction) return;

        const updatedItem = {
            I_Id: selectedItemForProduction.I_Id,
            material: selectedItemForProduction.material,
            uid: selectedItemForProduction.uid,
            unitPrice: selectedItemForProduction.unitPrice,
            discount: selectedItemForProduction.discount || 0,
            productionData: { ...productionData },
            status: "Production"
        };

        setProcessedItems(prev => [
            ...prev.filter(i => i.uid !== updatedItem.uid),
            updatedItem
        ]);

        setSelectedItemsQTY(prev =>
            prev.map(i => i.uid === updatedItem.uid ? { ...i, status: "Production" } : i)
        );

        setSelectedItemForProduction(null);
        setProductionData({
            supplierId: "",
            qty: "",
            expectdate: "",
            specialnote: ""
        });
        setShowStockModal2(false);
    };

   const ReservedItem = async (selectedItems, selectedItemForReserve) => {
        if (!selectedItems || selectedItems.length === 0 || !selectedItemForReserve) return;

        const reservedWithPid = selectedItems.map(item => ({
            I_Id: selectedItemForReserve.I_Id,
            material: selectedItemForReserve.material,
            uid: selectedItemForReserve.uid,
            unitPrice: selectedItemForReserve.unitPrice,
            discount: selectedItemForReserve.discount || 0,
            pid_Id: item.pid_Id,
            status: "Reserved"
        }));

        setProcessedItems(prev => [
            ...prev.filter(i => !reservedWithPid.find(r => r.uid === i.uid)),
            ...reservedWithPid
        ]);

        setShowStockModal1(false);
    };

    const handleSearchChange1 = (e) => {
        const term = e.target.value;
        setSearchTerm(term);
        console.log(term)

        const filtered = itemdetails.filter((item) =>
            item.I_Id.toString().toLowerCase().includes(term.toLowerCase())
        );
        setFilteredItems(filtered);
        setDropdownOpen(term.trim() !== "" && filtered.length > 0);

        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }

        debounceTimeout.current = setTimeout(() => {
            const itemId = selectedItemForReserve?.itemId || selectedItemForReserve?.I_Id;
            fetchStockDetails(itemId);
        }, 500);
    };
    const fetchStockDetails = async (itemId) => {
        if (!itemId) {
            setItemDetails([]);
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch("http://localhost:5001/api/admin/main/get-stock-detail", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ itemId }),
            });

            if (!response.ok) {
                throw new Error(await response.text());
            }

            const data = await response.json();
            console.log(data);
            setItemDetails(data.stockDetails || []);
            if (!data.stockDetails?.length) {
                toast.error("No stock details found.");
            }
        } catch (error) {
            toast.error("Error fetching stock: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };
    const handleSelectedItem = (item) => {
        if (!selectedItems1.some((selected) => selected.I_Id === item.I_Id)) {
            setSelectedItems1([...selectedItems1, { ...item, qty: 1, price: item.price }]); // Ensure price is initialized
        }
        setSearchTerm("");
        setFilteredItems([]);
        setDropdownOpen(false); // Close dropdown after selection
    };
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error: {error}</p>;

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
                                        On-Line
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
                        <button type="button" id="addOrderDetail" className="bg-green-500 text-white p-2 rounded-md" onClick={handleAddToOrder}>
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
                        {formData.issuable === "Later" && (
                            <div className="overflow-auto max-w-full">
                                <table className="min-w-[600px] bg-white border rounded-lg shadow-md mb-6 mt-3">
                                    <thead className="bg-blue-500 text-white">
                                    <tr>
                                        <th>Id</th>
                                        <th>Product</th>
                                        <th>Status</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {selectedItemsQty.length > 0 ? (
                                        selectedItemsQty.map((item, index) => (
                                            <tr key={index}>
                                                <td>{index + 1}</td>
                                                <td>{item.I_name}</td>
                                                <td>
                                                    <select
                                                        className="border border-gray-300 rounded p-1"
                                                        value={item.status || ""}
                                                        onChange={(e) => handleStatusChange(index, e.target.value, item)}
                                                    >
                                                        <option value="">Select Status</option>
                                                        <option value="Booked">Booked</option>
                                                        <option value="Reserved">Reserved</option>
                                                        <option value="Production">Production</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="2" className="text-center text-gray-500 py-2">No items added yet.</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        )}
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
                            <Label className="fw-bold">Special Note</Label>
                            <Input type="textarea" name="specialNote" onChange={handleChange}></Input>
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
                    <div className="order-details mt-4 border rounded-lg p-4 bg-white shadow-sm w-full max-w-md">
                        <div className="custom-line-items space-y-2">
                            {[
                                { label: 'Total Item Price', value: totalItemPrice },
                                { label: 'Delivery Fee', value: deliveryPrice },
                                { label: 'Special Discount', value: specialdiscountAmount },
                                { label: 'Coupon Discount', value: discountAmount },
                            ].map((item, index) => (
                                <div key={index} className="custom-line-item flex justify-between border-b pb-1">
                                    <span className="custom-label">{item.label}</span>
                                    <span className="custom-value">Rs.{item.value}</span>
                                </div>
                            ))}

                            <div className="custom-total flex justify-between font-semibold border-t pt-3 mt-3">
                                <span className="custom-label">Gross Amount</span>
                                <span className="custom-value">Rs.{totalBillPrice}</span>
                            </div>
                        </div>
                    </div>

                    <div className="order-details">
                        <h5 className="text-center underline">Payment Methods</h5>
                        <hr/>
                        <Row>
                            <Label className="fw-bold">Payment Method</Label>
                            <Col md={6}>
                                <FormGroup>
                                    <Input
                                        type="select"
                                        name="payment"
                                        id="payment"
                                        value={formData.payment}
                                        onChange={handleChange}
                                        required
                                    >
                                        <option value="">Select Payment Option</option>
                                        <option value="Cash">Cash</option>
                                        <option value="Card">Card</option>
                                        <option value="Cheque">Cheque</option>
                                        <option value="Credit">Credit</option>
                                        <option value="Combined">Combined</option>
                                    </Input>
                                </FormGroup>
                            </Col>
                            <Col md={6}>
                                <FormGroup>
                                    <Input
                                        type="select"
                                        name="subPayment"
                                        id="subPayment"
                                        value={formData.subPayment}
                                        onChange={handleChange1}
                                       
                                        disabled={!formData.payment}
                                    >
                                        <option value="">Select Sub Option</option>
                                        {secondOptions.map((opt) => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </Input>
                                </FormGroup>
                            </Col>
                        </Row>
                        
                        {formData.payment === "Cash" && (formData.subPayment === "Cash") && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Payment Amount</span>
                                    <span className="custom-info-value">
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
                                            className="w-full text-right" // Optional: Align input text to the right
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Balance</span>
                                    <span className="custom-info-value">Rs.{balance}</span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Cash" && (formData.subPayment === "Transfer") && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Payment Amount</span>
                                    <span className="custom-info-value">
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
                                            className="w-full text-right" // Optional: Align input text to the right
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Bank</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="bank"
                                            value={transferBank}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setTranferBank(val);
                                                
                                            }}
                                            required
                                            className="w-full text-right" // Optional: Align input text to the right
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Balance</span>
                                    <span className="custom-info-value">Rs.{balance}</span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Card" && (formData.subPayment === "Debit Card" || formData.subPayment === "Credit Card") && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Payment Amount</span>
                                    <span className="custom-info-value">Rs.{parseFloat(totalBillPrice).toFixed(2)}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Interest Rate (%)</span>
                                    <span className="custom-info-value">{rate}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Interest Value</span>
                                    <span className="custom-info-value">Rs.{interestValue.toFixed(2)}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Net Amount</span>
                                    <span className="custom-info-value">Rs.{netAmount.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Cheque" && (
                            <>
                                <div className="custom-info-row">
                                <span className="custom-info-label">Payment Amount</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="amount"
                                    value={chequeAmount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d*$/.test(val)) {
                                        setChequeAmount(val);
                                        setAdvance(val); // Reflect in general payment state
                                        }
                                    }}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Cheque Number</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="chequeNumber"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Bank</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="bank"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Branch</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="branch"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Account Number</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="accountNumber"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Cheque Date</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="date"
                                    name="chequeDate"
                                    value={chequeDate}
                                    onChange={(e) => setChequeDate(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Credit" && (
                            <>
                                <div className="custom-info-row">
                                <span className="custom-info-label">Payment Amount</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="amount"
                                    value={creditAmount}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (/^\d*\.?\d*$/.test(val)) {
                                        setCreditAmount(val);
                                        setAdvance(val); // Reflect in general payment state
                                        }
                                    }}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Expected Date</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="date"
                                    name="expectedDate"
                                    value={creditExpectedDate}
                                    onChange={(e) => setCreditExpectedDate(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Balance</span>
                                    <span className="custom-info-value">Rs.{balance}</span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Combined" && (formData.subPayment === "Cash & Card") && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Cash Amount</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="advance"
                                            value={combinedCardBalance}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Allow only numbers and a single dot
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                    setCombinedCardBalance(val);
                                                }
                                            }}
                                            required
                                            className="w-full text-right" // Optional: Align input text to the right
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Card Balance</span>
                                    <span className="custom-info-value">Rs.{parseFloat(cardPortion).toFixed(2)}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Interest Rate (%)</span>
                                    <span className="custom-info-value">{rate}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Interest Value</span>
                                    <span className="custom-info-value">Rs.{interestValue.toFixed(2)}</span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Net Amount</span>
                                    <span className="custom-info-value">Rs.{netAmount.toFixed(2)}</span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Combined" && (formData.subPayment === "Cash & Cheque") && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Cash Amount</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="advance"
                                            value={combinedChequeBalance}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                // Allow only numbers and a single dot
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                    setCombinedChequeBalance(val);
                                                }
                                            }}
                                            required
                                            className="w-full text-right" // Optional: Align input text to the right
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Cheque Balance</span>
                                    <span className="custom-info-value">Rs.{parseFloat(chequePortion).toFixed(2)}</span>
                                </div>
                                <div className="custom-info-row">
                                <span className="custom-info-label">Cheque Number</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="chequeNumber"
                                    value={chequeNumber}
                                    onChange={(e) => setChequeNumber(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Bank</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="bank"
                                    value={bank}
                                    onChange={(e) => setBank(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Branch</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="branch"
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Account Number</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="text"
                                    name="accountNumber"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>

                                <div className="custom-info-row">
                                <span className="custom-info-label">Cheque Date</span>
                                <span className="custom-info-value">
                                    <Input
                                    type="date"
                                    name="chequeDate"
                                    value={chequeDate}
                                    onChange={(e) => setChequeDate(e.target.value)}
                                    required
                                    className="w-full text-right"
                                    />
                                </span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Combined" && formData.subPayment === "Cash & Credit" && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Cash Amount</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="advance"
                                            value={combinedCreditBalance}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                    setCombinedCreditBalance(val);
                                                }
                                            }}
                                            required
                                            className="w-full text-right"
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Credit Balance</span>
                                    <span className="custom-info-value">
                                        Rs.{parseFloat(creditPortion).toFixed(2)}
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Expected Date</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="date"
                                            name="expectedDate"
                                            value={creditExpectedDate}
                                            onChange={(e) => setCreditExpectedDate(e.target.value)}
                                            required
                                            className="w-full text-right"
                                        />
                                    </span>
                                </div>
                            </>
                        )}

                        {formData.payment === "Combined" && formData.subPayment === "Cash & Transfer" && (
                            <>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Cash Amount</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="advance"
                                            value={combinedTransferBalance}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                if (/^\d*\.?\d*$/.test(val)) {
                                                    setCombinedTranferBalance(val); // ✅ make sure you're using the correct setter
                                                }
                                            }}
                                            required
                                            className="w-full text-right"
                                        />
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Transfer Balance</span>
                                    <span className="custom-info-value">
                                        Rs.{parseFloat(transferPortion).toFixed(2)}
                                    </span>
                                </div>
                                <div className="custom-info-row">
                                    <span className="custom-info-label">Bank</span>
                                    <span className="custom-info-value">
                                        <Input
                                            type="text"
                                            name="bank"
                                            value={transferBank}
                                            onChange={(e) => {
                                                const val = e.target.value;
                                                setTranferBank(val);
                                            }}
                                            required
                                            className="w-full text-right"
                                        />
                                    </span>
                                </div>
                            </>
                        )}
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
                <Modal isOpen={showStockModal1} toggle={() => setShowStockModal1(!showStockModal1)}>
                    <ModalHeader toggle={() => setShowStockModal1(!showStockModal1)}>Special Reserved</ModalHeader>
                    <ModalBody>
                        {selectedItemForReserve && (
                            <div classNamee="mb-3">
                                <strong>Selected Item ID:</strong>{" "}
                                {selectedItemForReserve.itemId || selectedItemForReserve.I_Id || "N/A"}
                            </div>
                        )}

                        <FormGroup style={{position: "relative"}}>
                            <Label>Search Item by ID</Label>
                            <Input
                                type="text"
                                value={searchTerm}
                                onChange={handleSearchChange1}
                                placeholder="Type to search..."
                                autoComplete="off"
                            />
                            {dropdownOpen && filteredItems.length > 0 && (
                                <div
                                    className="dropdown"
                                    style={{
                                        position: "absolute",
                                        zIndex: 100,
                                        backgroundColor: "white",
                                        border: "1px solid #ddd",
                                        width: "100%",
                                        maxHeight: "200px",
                                        overflowY: "auto",
                                    }}
                                >
                                    {filteredItems.map((item) => (
                                        <div
                                            key={item.I_Id + item.stock_Id}
                                            onClick={() => handleSelectedItem(item)}
                                            className="dropdown-item"
                                            style={{ padding: "8px", cursor: "pointer" }}
                                        >
                                            {item.I_Id} - {item.pid_Id} - {item.stock_Id}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </FormGroup>

                        <Label className="mt-3">Selected Items</Label>
                        <table className="selected-items-table">
                            <thead>
                            <tr>
                                <th>Item ID</th>
                                <th>Batch ID</th>
                                <th>Stock ID</th>
                            </tr>
                            </thead>
                            <tbody>
                            {selectedItems1.map((item, index) => (
                                <tr key={index}>
                                    <td>{item.I_Id}</td>
                                    <td>{item.pid_Id}</td>
                                    <td>{item.stock_Id}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </ModalBody>
                    <ModalFooter>
                        <Button
                            color="primary"
                             onClick={() => ReservedItem(selectedItems1, selectedItemForReserve)}
                        >
                            Pass
                        </Button>
                        <Button color="secondary" onClick={() => setShowStockModal1(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Modal>
                <Modal isOpen={showStockModal2} toggle={() => setShowStockModal2(!showStockModal2)}>
                    <ModalHeader toggle={() => setShowStockModal2(!showStockModal2)}>
                        Supplier Production
                    </ModalHeader>
                    <ModalBody>
                        <Form onSubmit={handleProduction}>
                            <FormGroup>
                                <Label for="supplierId"><strong>Select Supplier</strong></Label>
                                <Input
                                    type="select"
                                    name="supplierId"
                                    id="supplierId"
                                    value={productionData.supplierId}
                                    onChange={handleFormChange}
                                >
                                    <option value="">-- Select Supplier --</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.s_ID} value={supplier.s_ID}>
                                            {supplier.name} (ID: {supplier.s_ID}) - {supplier.contact}
                                        </option>
                                    ))}
                                </Input>
                            </FormGroup>

                            <Card className="supplier-order-card">
                                <CardBody>
                                    <Row>
                                        <Col lg={6}>
                                            <FormGroup>
                                                <Label for="supplierId"><strong>Supplier ID</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="supplierId"
                                                    id="supplierId"
                                                    value={productionData.supplierId}
                                                    disabled
                                                />
                                            </FormGroup>
                                        </Col>
                                        <Col lg={6}>
                                            <FormGroup>
                                                <Label for="qty"><strong>Order Quantity</strong></Label>
                                                <Input
                                                    type="text"
                                                    name="qty"
                                                    id="qty"
                                                    value={productionData.qty}
                                                    onChange={handleFormChange}
                                                />
                                            </FormGroup>
                                        </Col>
                                    </Row>
                                    <FormGroup>
                                        <Label for="expectdate"><strong>Expected Date</strong></Label>
                                        <Input
                                            type="date"
                                            name="expectdate"
                                            id="expectdate"
                                            value={productionData.expectdate}
                                            onChange={handleFormChange}
                                        />
                                    </FormGroup>
                                    <FormGroup>
                                        <Label for="specialnote"><strong>Special Note</strong></Label>
                                        <Input
                                            type="textarea"
                                            name="specialnote"
                                            id="specialnote"
                                            value={productionData.specialnote}
                                            onChange={handleFormChange}
                                        />
                                    </FormGroup>
                                </CardBody>
                            </Card>
                        </Form>
                    </ModalBody>
                    <ModalFooter>
                        <Button color="primary" onClick={handleProduction}>
                            Pass
                        </Button>
                        <Button color="secondary" onClick={() => setShowStockModal2(false)}>
                            Cancel
                        </Button>
                    </ModalFooter>
                </Modal>
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
