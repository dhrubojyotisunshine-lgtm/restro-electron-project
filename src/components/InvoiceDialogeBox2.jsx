import React, { useEffect, useState,useContext,forwardRef  } from "react";
import axios from "axios";
import { AuthContext } from "../store/AuthContext";
export const InvoiceDialogBox2 = React.forwardRef((props, ref) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL=import.meta.env.VITE_IMG_URL
  const { userId, username } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  const [data, setData] = useState(null);
  const { billData } = props;
  console.log('Bill Data inside InvoiceDialogBox2:', billData); // Log bill data
  const fetchImageData = () => {
    axios
      .get(`${API_BASE_URL}/websetting`, { headers: { Authorization: token } })
      .then((response) => {
        setData(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching image data:", error);
      });
  };

  useEffect(() => {
    fetchImageData();
  }, []);

  if (!billData || billData.length === 0) {
    return <div>There is nothing to print</div>; // Handle empty data scenario
  }

  const orderDetails = billData[0]?.orderDetails[0];
  const menuItems = billData[0]?.menuItems;


  const formatAmount = (amount) => {
    const num = parseFloat(amount);
    return isNaN(num) ? "0.00" : num.toFixed(2);
  };
  const logoUrls = data.map((val) => {
   
      return `${VITE_IMG_URL}${val.logo}`; // Correctly concatenate APP_URL with val.logo
 
  });
  const logoUrls2 = data.map((val) => {
   
    return `${VITE_IMG_URL}${val.logo_footer}`; // Correctly concatenate APP_URL with val.logo

});



  return (
    <div ref={ref} style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
    <h1>Invoice Details</h1>
    <p><strong>Order ID:</strong> {orderDetails?.order_id}</p>
    <p><strong>Customer Name:</strong> {orderDetails?.customer_name}</p>
    <p><strong>Email:</strong> {orderDetails?.customer_email}</p>
    <p><strong>Phone:</strong> {orderDetails?.customer_phone}</p>
    <p><strong>Address:</strong> {orderDetails?.customer_address}</p>
    <p><strong>Waiter:</strong> {orderDetails?.waiter_first_name} {orderDetails?.waiter_last_name}</p>
    <p><strong>Order Date:</strong> {orderDetails?.order_date}</p>
    <p><strong>Total Amount:</strong> {orderDetails?.totalamount}</p>
    <p><strong>VAT:</strong> {orderDetails?.VAT}</p>
    <p><strong>Bill Amount:</strong> {orderDetails?.bill_amount}</p>

    <h3>Items Ordered</h3>
    <table style={{ width: '100%', border: '1px solid #ccc', borderCollapse: 'collapse' }}>
      <thead>
        <tr>
          <th style={{ padding: '8px', textAlign: 'left' }}>Product Name</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Quantity</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Price</th>
          <th style={{ padding: '8px', textAlign: 'left' }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {menuItems?.map((item) => (
          <tr key={item.row_id}>
            <td style={{ padding: '8px' }}>{item.ProductName} ({item.variantName})</td>
            <td style={{ padding: '8px' }}>{item.menuqty}</td>
            <td style={{ padding: '8px' }}>${item.price}</td>
            <td style={{ padding: '8px' }}>${(item.price * item.menuqty).toFixed(2)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <h3>Total</h3>
    <p><strong>Bill Amount:</strong> ${orderDetails?.bill_amount}</p>
    <p><strong>Discount:</strong> ${orderDetails?.discount}</p>
    <p><strong>Service Charge:</strong> ${orderDetails?.service_charge || 'N/A'}</p>
    <p><strong>Grand Total:</strong> ${(orderDetails?.bill_amount - (orderDetails?.discount || 0) + (orderDetails?.service_charge || 0)).toFixed(2)}</p>
  </div>
  );
});
