const fetchCustomers = async () => {
    setLoading(true);
    try {
        const response = await fetch(`http://localhost:5001/api/admin/main/allcustomers?filter=${filter}`);
        const data = await response.json();

        const customersArray = Array.isArray(data) ? data : [];

        if (response.ok) {
            setCustomers(customersArray);
            setFilteredCustomers(customersArray); // ✅ always an array
        } else {
            setCustomers([]);
            setFilteredCustomers([]);
            setError(data.message || "No customers available.");
        }
    } catch (error) {
        setCustomers([]);
        setFilteredCustomers([]);
        setError("Error fetching customers.");
        console.error("Error fetching customers:", error);
    } finally {
        setLoading(false);
    }
};
