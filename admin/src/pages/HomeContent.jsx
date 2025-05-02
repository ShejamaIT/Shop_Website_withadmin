import React, {useEffect, useState} from 'react';
import { Card, CardBody, Table } from 'reactstrap';
import { Line } from 'react-chartjs-2';
import {Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend,} from 'chart.js';
import {PieChart, Pie, Cell, ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Bar} from "recharts";
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
const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"];

const HomeContent = () => {
    const [income, setIncome] = useState(0);
    const [incomeIncreased, setIncomeIncreased] = useState("no");
    const [todayInTotalPrice, setTodayInTotalPrice] = useState(0);
    const [todayOutTotalPrice, setTodayOutTotalPrice] = useState(0);
    const [todayInPriceIncreased, setTodayInPriceIncreased] = useState("no");
    const [todayOutPriceIncreased, setTodayOutPriceIncreased] = useState("no");
    const [thisMonthInTotalPrice, setThisMonthInTotalPrice] = useState(0);
    const [thisMonthOutTotalPrice, setThisMonthOutTotalPrice] = useState(0);
    const [thisMonthInPriceIncreased, setThisMonthInPriceIncreased] = useState("no");
    const [thisMonthOutPriceIncreased, setThisMonthOutPriceIncreased] = useState("no");
    const [thisMonthHire, setThisMonthHire] = useState(0);
    const [hireIncreased, setHireIncreased] = useState("no");
    const [todayHire, setTodayHire] = useState(0);
    const [todayhireIncreased, settodayHireIncreased] = useState("no");
    const [walkingTotalThisMonth, setWalkingTotalThisMonth] = useState(0);
    const [onsiteTotalThisMonth, setOnsiteTotalThisMonth] = useState(0);
    const [walkingComparison, setWalkingComparison] = useState('no');
    const [onsiteComparison, setOnsiteComparison] = useState('no');
    const [items, setItems] = useState([]);
    const [mdf, setMDF] = useState([]);
    const [mm, setMM] = useState([]);
    const [furnitures, setFurnitures] = useState([]);
    const [mattress, setMattress] = useState([]);
    const [data, setData] = useState([]);
    useEffect(() => {
        fetchSaleIncome();
        fetchItems();
        fetchmonthlyCategorySales();
        fetchOrderSummary();
        fetchMonthlyHire();
        fetchMonthlyNetTotalSummary();
        fetchmonthlyCategory();
    }, []);
    const fetchmonthlyCategory = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/monthly-issued-material-prices");
            const result = await response.json();

            if (result.success) {
                const chartData = [
                    { name: "MDF", value: result.MDF[0]?.totalPrice || 0 },
                    { name: "MM", value: result.MM[0]?.totalPrice || 0 },
                    { name: "Furniture", value: result.Furniture[0]?.totalPrice || 0 },
                    { name: "Mattress", value: result.Mattress[0]?.totalPrice || 0 },
                ];
                setData(chartData);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };
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
    const fetchOrderSummary = async () => {
        try {
            const response = await fetch("http://localhost:5001/api/admin/main/order-summary");
            const data = await response.json();

            if (data.success) {
                // Today's data
                setTodayInTotalPrice(data.today.in.total);
                setTodayOutTotalPrice(data.today.out.total);
                setTodayInPriceIncreased(data.today.compare.inIncreased);
                setTodayOutPriceIncreased(data.today.compare.outIncreased);

                // This month's data
                setThisMonthInTotalPrice(data.thisMonth.in.total);
                setThisMonthOutTotalPrice(data.thisMonth.out.total);
                setThisMonthInPriceIncreased(data.thisMonth.compare.inIncreased);
                setThisMonthOutPriceIncreased(data.thisMonth.compare.outIncreased);
            }
        } catch (error) {
            console.error("Fetch error:", error);
        }
    };
    const fetchMonthlyHire = async () => {
        try {
            const res = await fetch("http://localhost:5001/api/admin/main/monthly-hire-summary");
            const data = await res.json();

            if (data.success) {
                setTodayHire(data.todayHire);
                settodayHireIncreased(data.todayIncreased);
                setThisMonthHire(data.thisMonthHire);
                setHireIncreased(data.hireIncreased);
            }
        } catch (error) {
            console.error("Error fetching monthly hire summary:", error);
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
    const fetchMonthlyNetTotalSummary = async () => {
        try {
            const response = await fetch('http://localhost:5001/api/admin/main/monthly-net-total-summary');
            const data = await response.json();
            console.log(data);
            if (data.success) {
                setWalkingTotalThisMonth(data.walking.thisMonthTotal);
                setWalkingComparison(data.walking.compare.increased);

                setOnsiteTotalThisMonth(data.onsite.thisMonthTotal);
                setOnsiteComparison(data.onsite.compare.increased);
            }
        } catch (error) {
            console.error("Error fetching monthly net total summary:", error);
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
            <div className="welcome-card" style={{marginTop: '-20px'}}>
                <Card className="m-3" style={{
                    borderRadius: '8px',
                    background: 'linear-gradient(115deg, #97abff, #123593)',
                    color: '#f5f7fa',
                    boxShadow: '0 1px 1px rgba(0, 0, 0, 0.1)'
                }}>
                    <CardBody>
                        <h5 className="card-title">Welcome to dashboard !</h5>
                        <p className="card-text">Hello Admin, welcome to your Shejama Group Poss dashboard !</p>
                    </CardBody>
                </Card>
            </div>

            <div className="overview-boxes">
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Daily InOrders</div>
                        <div className="number">Rs.{todayInTotalPrice.toFixed(2)}</div>
                        {/* Display total price */}

                        {todayInPriceIncreased === "yes" ? (
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
                        <div className="box-topic">Daily OutOrders</div>
                        <div className="number">Rs.{todayOutTotalPrice.toFixed(2)}</div>
                        {/* Display total price */}

                        {todayOutPriceIncreased === "yes" ? (
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
                        <div className="box-topic">Month Inorders</div>
                        <div className="number">Rs.{thisMonthInTotalPrice.toFixed(2)}</div>
                        {/* Display total price */}

                        {thisMonthInPriceIncreased === "yes" ? (
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
                    <i className='bx bx-cart cart three'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Month Outorders</div>
                        <div className="number">Rs.{thisMonthOutTotalPrice.toFixed(2)}</div>
                        {/* Display total price */}

                        {thisMonthOutPriceIncreased === "yes" ? (
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
                    <i className='bx bxl-shopify cart one'></i>
                </div>
            </div>
            <div className="overview-boxes">
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Daily Hire</div>
                        <div className="number">Rs.{todayHire.toFixed(2)}</div>

                        {todayhireIncreased === "yes" ? (
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
                    <i className='bx bxs-truck store3'></i>
                </div>
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Monthly Hire</div>
                        <div className="number">Rs.{thisMonthHire.toFixed(2)}</div>

                        {hireIncreased === "yes" ? (
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
                    <i className='bx bxs-truck delivery'></i>
                </div>
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Total shop sale</div>
                        <div className="number">Rs.{walkingTotalThisMonth.toFixed(2)}</div>

                        {walkingComparison === "yes" ? (
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
                    <i className='bx bxs-store cart one'></i>
                </div>
                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Total Onsite sale</div>
                        <div className="number">Rs.{onsiteTotalThisMonth.toFixed(2)}</div>

                        {onsiteComparison === "yes" ? (
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
                    <i className='bx bxs-store cart two'></i>
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
                        <div className="out-stock-table-wrapper" style={{height: '200px'}}>
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
                                            <td>{item.I_name}</td>
                                            {/* Assuming each item has a `itemName` */}
                                            <td>{item.descrip}</td>
                                            {/* Assuming each item has a `description` */}
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

            <div className="overview row-cards">
                <Card className="cards chart-card">
                    <CardBody>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" />
                                <YAxis tickFormatter={(value) => `Rs.${value}`} />
                                <Tooltip formatter={(value) => `Rs.${value}`} />
                                <Legend />
                                <Bar dataKey="value" fill="#8884d8">
                                    {data.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                    </CardBody>
                </Card>
                <Card id="outStockTable" className="cards table-card">
                    <CardBody>
                        <div className="overview-boxes">
                            <div className="box">
                                <div className="right-side">
                                    <div className="box-topic">Furniture Sale</div>
                                    <div className="number">Rs.{furnitures[0]?.totalPrice.toFixed(2) || 0.00}</div>

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
                                <i className='bx bxs-package store'></i>
                            </div>

                            <div className="box">
                                <div className="right-side">
                                    <div className="box-topic">MDF Sale</div>
                                    <div className="number">Rs.{mdf[0]?.totalPrice.toFixed(2) || 0.00}</div>

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
                                <i className='bx bxs-package store2'></i>
                            </div>
                        </div>
                    </CardBody>
                </Card>
                <Card id="outStockTable" className="cards table-card">
                    <CardBody>
                        <div className="overview-boxes">
                            <div className="box">
                                <div className="right-side">
                                    <div className="box-topic">MM Sale</div>
                                    <div className="number">Rs.{mm[0]?.totalPrice.toFixed(2) || 0.00}</div>

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
                                {/*<i className='bx bxs-shopping-bags'></i>*/}
                                <i className='bx bxs-shopping-bags store1'></i>
                            </div>

                            <div className="box">
                                <div className="right-side">
                                    <div className="box-topic">Mattress Sale</div>
                                    <div className="number">Rs.{mattress[0]?.totalPrice.toFixed(2) || 0.00}</div>

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
                                <i className='bx bxs-shopping-bags store3'></i>
                                {/*<i className='bx bxs-store '></i>*/}
                            </div>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default HomeContent;
