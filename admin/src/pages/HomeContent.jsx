import React from 'react';
import { Card, CardBody, Table } from 'reactstrap';
import { Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend,
} from 'chart.js';

import '../style/HomeContent.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Tooltip,
    Legend
);

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
                        <div className="box-topic">Total Products</div>
                        <div className="number">11</div>
                        <div className="indicator">
                            <i className='bx bx-down-arrow-alt down'></i>
                            <span className="text">Down From Today</span>
                        </div>
                    </div>
                    <i className='bx bx-cart cart four'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Total Orders</div>
                        <div className="number">38</div>
                        <div className="indicator">
                            <i className='bx bx-up-arrow-alt'></i>
                            <span className="text">Up from yesterday</span>
                        </div>
                    </div>
                    <i className='bx bxl-shopify cart two'></i>
                </div>

                <div className="box">
                    <div className="right-side">
                        <div className="box-topic">Total Profit</div>
                        <div className="number">$12</div>
                        <div className="indicator">
                            <i className='bx bx-up-arrow-alt'></i>
                            <span className="text">Up from yesterday</span>
                        </div>
                    </div>
                    <i className='bx bxs-dollar-circle cart three'></i>
                </div>
            </div>

            <div className="overview row-cards">
                <Card className="cards chart-card">
                    <CardBody>
                        <h5 className="card-title text-center">Monthly Income of last 12 months</h5>
                        <div style={{ height: '300px' }}>
                            <Line data={chartData} options={chartOptions} />
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
                                {/* Dynamic rows */}
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
