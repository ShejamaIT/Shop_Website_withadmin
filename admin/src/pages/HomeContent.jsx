import React, {useEffect, useState} from 'react';
import { Card, CardBody, Table } from 'reactstrap';
import { Line } from 'react-chartjs-2';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,} from 'chart.js';
import '../style/HomeContent.css';
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);

const chartData = {
    labels: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    datasets: [
        {
            label: 'Monthly Income ($)',
            data: [120, 190, 300, 500, 200, 300, 400, 320, 280, 420, 390, 450],
            fill: false,
            borderColor: '#123593',
            tension: 0.4,
        },
    ],
};

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
};

const HomeContent = () => {
    const [income, setIncome] = useState(0);
    const [incomeIncreased, setIncomeIncreased] = useState("no");
    const [inOrders, setInOrders] = useState(0);
    const [outOrders, setOutOrders] = useState(0);
    const [inOrdersIncreased, setInOrdersIncreased] = useState("no");
    const [outOrdersIncreased, setOutOrdersIncreased] = useState("no");
    const [items, setItems] = useState([]);
    const [mdf, setMDF] = useState([]);
    const [mm, setMM] = useState([]);
    const [furnitures, setFurnitures] = useState([]);
    const [mattress, setMattress] = useState([]);
    useEffect(() => {
        fetchSaleIncome();
        fetchTodayOrders();
        fetchItems();
        fetchmonthlyCategorySales();
    }, []);

    const fetchSaleIncome = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/today-order-income");
            const data = await response.json();

            if (data.success) {
                setIncome(data.data.totalIncome);
                setIncomeIncreased(data.data.incomeIncreased); // Storing the comparison result
            }
        } catch (error) {
            console.error("Error fetching income:", error);
        }
    };

    const fetchTodayOrders = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/today-order-counts");
            const data = await response.json();

            if (data.success) {
                setInOrders(data.data.inOrders);
                setOutOrders(data.data.outOrders);
                setInOrdersIncreased(data.data.inOrdersIncreased);
                setOutOrdersIncreased(data.data.outOrdersIncreased);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    const fetchmonthlyCategorySales = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/monthly-issued-material-prices");
            const data = await response.json();
            console.log(data.MDF)
            if (data.success) {
                setMDF(data.MDF);
                setMM(data.MM);
                setFurnitures(data.Furniture);
                setMattress(data.Mattress);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };

    // Fetch all out of stock items
    const fetchItems = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/allitemslessone"); // Adjust API URL if needed
            const data = await response.json();
            setItems(data); // Assuming `data` contains the array of items
        } catch (err) {
            console.error("Fetch error:", err);
        }
    };

    return (
        <div className="home-content" id="home">
            <div className="welcome-card" style={{ marginTop: '-20px' }}>
                <Card className="m-3" style={{ borderRadius: '8px', background: 'linear-gradient(115deg, #97abff, #123593)', color: '#f5f7fa', boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)' }}>
                    <CardBody>
                        <h5 className="card-title">Welcome to dashboard !</h5>
                        <p className="card-text">Hello Admin, welcome to your Shejama Group Poss dashboard !</p>
                    </CardBody>
                </Card>
            </div>

            <div className="overview-boxes">
                {/* Overview boxes repeated */}
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Customers</div>
                        <div className="number">40</div>
                        <div className="indicator">
                            <i className='bx bx-up-arrow-alt'></i>
                            <span className="text">Up from yesterday</span>
                        </div>
                    </div>
                    <i className='bx bx-user-plus cart'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Today InOrders</div>
                        <div className="number">{inOrders}</div>

                        {inOrdersIncreased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from yesterday</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from yesterday</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bx-cart cart four'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Total OutOrders</div>
                        <div className="number">{outOrders}</div>

                        {outOrdersIncreased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from yesterday</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from yesterday</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bxl-shopify cart two'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Today Cashin</div>
                        <div className="number">Rs.{income}</div>

                        {incomeIncreased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from yesterday</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from yesterday</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bx-dollar-circle cart three'></i>
                </div>
            </div>
            <div className="overview-boxes">
                {/* Furniture Sale */}
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Furniture Sale</div>
                        <div className="number">Rs.{furnitures[0]?.totalPrice || 0}</div>

                        {furnitures[0]?.increased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from last month</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from last month</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bxs-store store'></i>
                </div>

                {/* MDF Sale */}
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">MDF Sale</div>
                        <div className="number">Rs.{mdf[0]?.totalPrice || 0}</div>

                        {mdf[0]?.increased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from last month</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from last month</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bxs-store store'></i>
                </div>

                {/* MM Sale */}
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">MM Sale</div>
                        <div className="number">Rs.{mm[0]?.totalPrice || 0}</div>

                        {mm[0]?.increased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from last month</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from last month</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bxs-store store'></i>
                </div>

                {/* Mattress Sale */}
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Mattress Sale</div>
                        <div className="number">Rs.{mattress[0]?.totalPrice || 0}</div>

                        {mattress[0]?.increased === "yes" ? (
                            <div className="indicator">
                                <i className='bx bx-up-arrow-alt'></i>
                                <span className="text">Up from last month</span>
                            </div>
                        ) : (
                            <div className="indicator">
                                <i className='bx bx-down-arrow-alt down'></i>
                                <span className="text">Down from last month</span>
                            </div>
                        )}
                    </div>
                    <i className='bx bxs-store store'></i>
                </div>

            </div>

            <div className="overview row-cards">
                <Card className="cards chart-card">
                    <CardBody>
                        <h5 className="card-title text-center">Monthly Income of last 12 months</h5>
                        <div style={{height: '300px'}}>
                            <Line data={chartData} options={chartOptions}/>
                        </div>
                    </CardBody>
                </Card>

                <Card id="outStockTable" className="cards table-card">
                <CardBody>
                        <h5 className="card-title text-center">Out of Stock Products</h5>
                        <div className="out-stock-table-wrapper" style={{ height: '200px' }}>
                            <Table striped responsive className="mb-0 out-stock-table">
                                <thead>
                                <tr>
                                    <th scope="col">ID</th>
                                    <th scope="col">Item</th>
                                    <th scope="col">Description</th>
                                </tr>
                                </thead>
                                <tbody>
                                {/* Mapping over the items to create table rows */}
                                {items.length > 0 ? (
                                    items.map((item) => (
                                        <tr key={item.I_Id}> {/* Assuming each item has a unique `id` */}
                                            <td>{item.I_Id}</td>
                                            <td>{item.I_name}</td> {/* Assuming each item has a `itemName` */}
                                            <td>{item.descrip}</td> {/* Assuming each item has a `description` */}
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="3" className="text-center">No out of stock products</td>
                                    </tr>
                                )}
                                </tbody>
                            </Table>
                        </div>
                    </CardBody>
                </Card>

            </div>
        </div>
    );
};

export default HomeContent;
