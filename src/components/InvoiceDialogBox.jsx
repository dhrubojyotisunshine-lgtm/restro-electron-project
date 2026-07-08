import React, { useEffect, useState,useContext } from "react";
import axios from "axios";
const DialogBox = ({ isOpen, onClose, invoiceDatas}) => {

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL= import.meta.env.VITE_IMG_URL;
  const [data, setData] = useState(null);
  const token = localStorage.getItem("token");

  const fetchImageData = () => {
    axios
      .get(`${API_BASE_URL}/websetting`, { headers: { Authorization: token } })
      .then((response) => {
        setData(response.data.data);
        console.log("data shiw to imag",data)
      })
      .catch((error) => {
        console.error("Error fetching image data:", error);
      });
  };

  useEffect(() => {
    fetchImageData();
  }, []);
  const logoUrls = data?.map((val) => `${VITE_IMG_URL}${val.logo}`) || [];




  if (!isOpen) return null;
  if (!invoiceDatas || invoiceDatas.length === 0) {
    return <div>Loading...</div>;
  }
  const orderDetails = invoiceDatas[0].orderDetails;
  const menuItems = invoiceDatas[0].menuItems;
  return (
    <div>
    <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50">
      <div className="w-full max-w-[210mm] h-auto bg-white shadow-lg rounded-md p-8 print:p-4">
        <div className="border border-gray-300 rounded-md p-6">
          <div className="flex justify-between items-center mb-6">
            <div className="flex flex-col items-start gap-2">
              <img src={logoUrls} alt="Logo" className="w-24 h-auto" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{data?.[0]?.restro_name}</h1>
                <p className="text-sm text-gray-600">{data?.[0]?.address}</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Invoice</h2>
              <p className="text-sm text-gray-700">Invoice No: {orderDetails[0]?.saleinvoice}</p>
              <p className="text-sm text-gray-700">Order Status: {orderDetails[0]?.order_status_name}</p>
              <p className="text-sm text-gray-700">Billing Date: {new Date(orderDetails[0]?.bill_date).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit" })}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="font-semibold text-gray-800 mb-1">Billing From:</h3>
              <p className="text-sm text-gray-700">{data?.[0]?.restro_name}</p>
            </div>
            <div className="text-right">
              <h3 className="font-semibold text-gray-800 mb-1">Billing To:</h3>
              <p className="text-sm text-gray-700">{orderDetails[0]?.customer_name}</p>
              <p className="text-sm text-gray-700">Address: {orderDetails[0]?.customer_address}</p>
              <p className="text-sm text-gray-700">Mobile: {orderDetails[0]?.customer_phone}</p>
              <p className="text-sm text-gray-700">
                Customer Type: {
                  orderDetails[0]?.cutomertype === 99 ? "QR Customer" :
                  orderDetails[0]?.cutomertype === 4 ? "Take Away" :
                  orderDetails[0]?.cutomertype === 3 ? "Third Party" :
                  orderDetails[0]?.cutomertype === 2 ? "Online Customer" :
                  orderDetails[0]?.cutomertype === 1 ? "Dine In" :
                  "Unknown"
                }
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="py-3 px-4 text-left border-b">Item</th>
                  <th className="py-3 px-4 text-left border-b">Variant</th>
                  <th className="py-3 px-4 text-left border-b">Price</th>
                  <th className="py-3 px-4 text-left border-b">Quantity</th>
                  <th className="py-3 px-4 text-left border-b">Total</th>
                </tr>
              </thead>
              <tbody>
                {orderDetails.flatMap((orderDetail) => {
                  return menuItems
                    .filter(item => item.order_id === orderDetail.order_id)
                    .map((menuItem) => (
                      <tr key={menuItem.row_id} className="hover:bg-gray-50">
                        <td className="py-2 px-4 border-b text-sm">{menuItem.ProductName}</td>
                        <td className="py-2 px-4 border-b text-sm">{menuItem.variantName}</td>
                        <td className="py-2 px-4 border-b text-sm">{menuItem.price}</td>
                        <td className="py-2 px-4 border-b text-sm">{menuItem.menuqty}</td>
                        <td className="py-2 px-4 border-b text-sm">{(menuItem.price * menuItem.menuqty)}</td>
                      </tr>
                    ));
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="text-right mt-6">
          <button
            onClick={onClose}
            className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
    <div className="opacity-50 fixed inset-0 z-40 bg-gray-800"></div>
  </div>
  );
};

export default DialogBox;