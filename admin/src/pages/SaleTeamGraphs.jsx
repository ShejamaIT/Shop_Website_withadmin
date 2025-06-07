// import React, { useEffect, useState } from 'react';
// import { Card, CardBody } from 'reactstrap';
// import { Line } from 'react-chartjs-2';
// import {
//     Chart as ChartJS,
//     CategoryScale,
//     LinearScale,
//     PointElement,
//     LineElement,
//     Tooltip,
//     Legend,
// } from 'chart.js';
// import '../style/AdminHome.css';
//
// ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend);
//
// const chartOptions = (xTitle, yTitle) => ({
//     responsive: true,
//     maintainAspectRatio: false,
//     plugins: {
//         legend: { display: true, position: 'top' },
//         tooltip: { enabled: true },
//     },
//     scales: {
//         y: {
//             beginAtZero: true,
//             title: {
//                 display: true,
//                 text: yTitle,
//             },
//         },
//         x: {
//             title: {
//                 display: true,
//                 text: xTitle,
//             },
//         },
//     },
// });
//
// const SaleTeamGraphs = () => {
//     const labelsMonthly = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
//         'August', 'September', 'October', 'November', 'December'];
//
//     const [monthlySummary, setMonthlySummary] = useState([]);
//
//     useEffect(() => {
//         fetchMonthlyData();
//     }, []);
//
//     const fetchMonthlyData = async () => {
//         try {
//             const response = await fetch("http://localhost:5001/api/admin/main/sales-team-monthly-summary");
//             const data = await response.json();
//             if (data.success) {
//                 setMonthlySummary(data.data);
//             }
//         } catch (error) {
//             console.error("Error fetching sales team data:", error);
//         }
//     };
//
//     // Create dataset for Chart.js from monthlySummary
//     const getChartData = (metric = 'totalOrder') => {
//         return {
//             labels: labelsMonthly,
//             datasets: monthlySummary.map((member, index) => ({
//                 label: member.employeeName,
//                 data: labelsMonthly.map(monthLabel => {
//                     const monthData = member.monthlyData.find(m => m.month === monthLabel);
//                     return monthData ? monthData[metric] : 0;
//                 }),
//                 borderColor: `hsl(${index * 50}, 70%, 50%)`,
//                 backgroundColor: `hsl(${index * 50}, 70%, 50%)`,
//                 fill: false,
//                 tension: 0.4,
//             }))
//         };
//     };
//
//     return (
//         <div className="home-content" id="home">
//             <div className="overview row-cards">
//                 <Card className="cards chart-card">
//                     <CardBody>
//                         <h5 className="card-title text-center">Sales Team - Monthly Order vs Issued</h5>
//                         <div style={{ height: '350px', marginBottom: '2rem' }}>
//                             <h6 className="text-center">Total Orders by Sales Team</h6>
//                             <Line data={getChartData('totalOrder')} options={chartOptions('Month', 'Orders (Rs.)')} />
//                         </div>
//                         <div style={{ height: '350px' }}>
//                             <h6 className="text-center">Total Issued by Sales Team</h6>
//                             <Line data={getChartData('totalIssued')} options={chartOptions('Month', 'Issued (Rs.)')} />
//                         </div>
//                     </CardBody>
//                 </Card>
//             </div>
//         </div>
//     );
// };
//
// export default SaleTeamGraphs;
import React, { useEffect, useState } from 'react';
import { Card, CardBody } from 'reactstrap';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import '../style/HomeContent.css';

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#FF8042', '#00C49F', '#FFBB28'];

const labelsMonthly = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const SaleTeamGraphs = () => {
    const [orderData, setOrderData] = useState([]);
    const [issuedData, setIssuedData] = useState([]);

    useEffect(() => {
        fetch("http://localhost:5001/api/admin/main/sales-team-monthly-summary")
            .then(res => res.json())
            .then(data => {
                if (data.success) {
                    console.log(data.data);
                    processGraphData(data.data);
                    
                }
            })
            .catch(err => console.error("Error loading data:", err));
    }, []);

    const processGraphData = (summary) => {
        const orderGraph = labelsMonthly.map((month) => {
            const obj = { name: month };
            summary.forEach(member => {
                const m = member.monthlyData.find(d => d.month === month);
                obj[member.employeeName] = m ? m.totalOrder : 0;
            });
            return obj;
        });

        const issuedGraph = labelsMonthly.map((month) => {
            const obj = { name: month };
            
            summary.forEach(member => {
                const m = member.monthlyData.find(d => d.month === month);
                obj[member.employeeName] = m ? m.totalIssued : 0;
            });
            return obj;
        });

        // console.log()

        setOrderData(orderGraph);
        setIssuedData(issuedGraph);
    };

    const renderBars = (sampleObj) =>
        Object.keys(sampleObj)
            .filter(key => key !== 'name')
            .map((key, index) => (
                <Bar key={key} dataKey={key} fill={COLORS[index % COLORS.length]} />
            ));

    return (
        <div className="home-content">
            <div className="overview row-cards">
                <Card className="cards chart-card mb-4">
                    <CardBody>
                        <h5 className="card-title text-center">Monthly Total Orders by Sales Team</h5>
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={orderData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `Rs.${value}`} />
                                    <Tooltip formatter={(value) => `Rs.${value}`} />
                                    <Legend />
                                    {orderData.length > 0 && renderBars(orderData[0])}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            </div>
            <div className="overview row-cards">
                <Card className="cards chart-card">
                    <CardBody>
                        <h5 className="card-title text-center">Monthly Total Issued by Sales Team</h5>
                        <div style={{ height: 400 }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={issuedData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis tickFormatter={(value) => `Rs.${value}`} />
                                    <Tooltip formatter={(value) => `Rs.${value}`} />
                                    <Legend />
                                    {issuedData.length > 0 && renderBars(issuedData[0])}
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardBody>
                </Card>
            </div>
        </div>
    );
};

export default SaleTeamGraphs;

