import React from "react";
import "../../style/TableThree.css"; // Importing the stylesheet

const packageData = [
    {
        name: "Free Package",
        price: 0.0,
        invoiceDate: "Jan 13, 2023",
        status: "Paid",
    },
    {
        name: "Standard Package",
        price: 59.0,
        invoiceDate: "Jan 13, 2023",
        status: "Paid",
    },
    {
        name: "Business Package",
        price: 99.0,
        invoiceDate: "Jan 13, 2023",
        status: "Unpaid",
    },
    {
        name: "Standard Package",
        price: 59.0,
        invoiceDate: "Jan 13, 2023",
        status: "Pending",
    },
];

const TableThree = () => {
    return (
        <div className="table-container">
            <div className="table-wrapper">
                <span className='text-info'>All Orders</span>
                <table className="styled-table">
                    <thead>
                    <tr>
                        <th>Order Id</th>
                        <th>Order Date</th>
                        <th>Status</th>
                        <th>Total Price</th>
                        <th>Actions</th>
                    </tr>
                    </thead>
                  {/*  <tbody>*/}
                  {/*  {packageData.map((packageItem, index) => (*/}
                  {/*      <tr key={index}>*/}
                  {/*          <td>*/}
                  {/*              <div className="package-info">*/}
                  {/*                  <h5>{packageItem.name}</h5>*/}
                  {/*                  <p className="price">${packageItem.price}</p>*/}
                  {/*              </div>*/}
                  {/*          </td>*/}
                  {/*          <td>{packageItem.invoiceDate}</td>*/}
                  {/*          <td>*/}
                  {/*<span className={`status ${packageItem.status.toLowerCase()}`}>*/}
                  {/*  {packageItem.status}*/}
                  {/*</span>*/}
                  {/*          </td>*/}
                  {/*          <td className="action-buttons">*/}
                  {/*              <button className="view-btn">👁️</button>*/}
                  {/*              <button className="edit-btn">✏️</button>*/}
                  {/*              <button className="delete-btn">🗑️</button>*/}
                  {/*          </td>*/}
                  {/*      </tr>*/}
                  {/*  ))}*/}
                  {/*  </tbody>*/}
                </table>
            </div>
        </div>
    );
};

export default TableThree;
