import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiFoodpanda } from "react-icons/si";
import {FaRegTrashAlt} from "react-icons/fa";
import { toast } from "react-toastify";
import axios from "axios";
const Checkout_Order = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
    const location = useLocation();
    const navigate = useNavigate();
    // const { orderDetails} =
    // location.state || {}; // Retrieve passed state
    const initialOrderDetails = location.state?.orderDetails || [];
    const tableId= location.state?.tableId  || [];
      // Customer Input States
     const [customerName, setCustomerName] = useState("");
     const [customerMobile, setCustomerMobile] = useState("");
     const [customerNote, setCustomerNote] = useState("");
     const [orderDetails, setOrderDetails] = useState(initialOrderDetails);
    // Increase quantity
    const increaseQuantity = (index) => {
        const updatedOrder = [...orderDetails];
        updatedOrder[index].quantity += 1;
        updatedOrder[index].totalAmount =
          updatedOrder[index].quantity * parseFloat(updatedOrder[index].price);
        setOrderDetails(updatedOrder);
      };
    
      // Decrease quantity
      const decreaseQuantity = (index) => {
        const updatedOrder = [...orderDetails];
        if (updatedOrder[index].quantity > 1) {
          updatedOrder[index].quantity -= 1;
          updatedOrder[index].totalAmount =
            updatedOrder[index].quantity * parseFloat(updatedOrder[index].price);
          setOrderDetails(updatedOrder);
        } else {
          removeItem(index);
        }
      };
    
      // Remove item
      const removeItem = (index) => {
        const updatedOrder = orderDetails.filter((_, i) => i !== index);
        setOrderDetails(updatedOrder);
      };
    
      // Calculate totals
      const totalProductAmount = orderDetails.reduce((acc, item) => {
        // Calculate product total
        let productTotal = parseFloat(item.totalAmount);
      
        // Calculate add-on total if add-ons exist
        if (item.checkedaddons && item.checkedaddons.length > 0) {
          const addonsTotal = item.checkedaddons.reduce(
            (addonAcc, addon) =>
              addonAcc + parseFloat(addon.price) * parseFloat(addon.add_on_quantity),
            0
          );
          productTotal += addonsTotal;
        }
      
        // Add product total (with add-ons) to the accumulator
        return acc + productTotal;
      }, 0);
    
      const totalVAT = orderDetails.reduce(
        (acc, item) =>
          acc + (parseFloat(item.totalAmount) * parseFloat(item.productvat)) / 100,
        0
      );
    
      const grandTotal = totalProductAmount + totalVAT;
    

      const handlePlaceOrder = async () => {
        try {
          // Validate input fields
          if (!customerName.trim() || !customerMobile.trim()) {
            toast.error("Please enter your name and mobile number");
            return;
          }
      
          // Prepare the order data
          const orderData = {
            customer_name: customerName.trim(),
            customer_phone: customerMobile.trim(),
            customer_note: customerNote?.trim() || "",
            order_details: orderDetails,
            grand_total: grandTotal,
            VAT: totalVAT,
          };
      
          // Send the order data to the API
          const response = await axios.post(`${API_BASE_URL}/qrorderplace`, orderData);
      
          // Handle successful response
          if (response.status === 201) {
            toast.success("Order placed successfully!");
            const { orderId } = response.data; // Corrected line
            // Clear the form and reset states
            setOrderDetails([]);
            setCustomerName("");
            setCustomerMobile("");
            setCustomerNote("");
            
            // Pass the orderId via navigation
            navigate(`/editqrorder/${tableId}`, { state: { orderId, tableId } });
            
            console.log("Final Order Data:", orderData, response, orderId,tableId);
            console.log("Final Order Response:", response);
            console.log("Order ID:", orderId);
          }
        } catch (error) {
          // Handle API error
          console.error("Error placing order:", error);
          toast.error("Something went wrong. Please try again.");
        }
      };
      
      
  return (
    <>
        <div className="bg-gray-100 min-h-screen p-4 font-sans">
      {/* Header */}

               <header className="items-center">
    <div className="flex items-center justify-center h-11 w-full bg-[#1C1D3E] rounded-md shadow-md p-2">
        <SiFoodpanda className="text-3xl text-zinc-50 mr-2" />
        <h1 className="text-xl font-bold text-gray-50">Goo Food</h1>
    </div>
</header>

      {/* Order Items */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Your Order</h2>
        {orderDetails.length > 0 ? (
          orderDetails.map((item, index) => (
            <div
              key={index}
              className="bg-white rounded-md shadow p-3 mb-3 flex flex-col"
            >
              <div className="flex justify-between mb-1">
                <span className="font-medium text-gray-700">
                  {item.variantName}
                </span>
                <span className="text-gray-500">${item.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-1">
                {/* Check if checkedaddons is available and has length > 0 */}
{item.checkedaddons && item.checkedaddons.length > 0 && (
  <div className="text-gray-500 text-sm mb-2">
    <span className="font-medium text-gray-700">Add-ons:</span>
    <ul className="ml-4 list-disc">
      {item.checkedaddons.map((addon, index) => (
        <li key={index} className="text-gray-500 text-sm">
          {addon.add_on_name} (Qty: {addon.add_on_quantity}) - ${parseFloat(addon.price).toFixed(2)}
        </li>
      ))}
    </ul>
  </div>
)}
                {/* <span className="text-gray-500">${item.totalAmount.toFixed(2)}</span> */}
              </div>
              <div className="text-gray-500 text-sm mb-2 flex justify-between">
                <div>
                Quantity: {item.quantity}
                </div>
              
 {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => decreaseQuantity(index)}
                    className="bg-[#d74747] text-white  p-1  rounded-xl"
                  >
                    -
                  </button>
                  <span className="text-gray-800 font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => increaseQuantity(index)}
                    className="bg-[#56de58] text-white p-1 rounded"
                  >
                    +
                  </button>
                  <button
                  onClick={() => removeItem(index)}
                  className="text-red-500 hover:underline"
                >
                   <FaRegTrashAlt className="text-red-600  font-bold cursor-pointer" />
                 
                </button>
                </div>
               
              </div>
              </div>

             
            </div>
          ))
        ) : (
          <p className="text-gray-500">No items in your order.</p>
        )}
      </div> 

         {/* Totals */}
         <div className="bg-white rounded-md shadow p-4 mt-4">
          <div className="flex justify-between mb-2">
            <span className="font-medium text-gray-700">Total Product Amount:</span>
            <span className="text-gray-600">${totalProductAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-medium text-gray-700">Total VAT:</span>
            <span className="text-gray-600">${totalVAT.toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold text-lg">
            <span className="text-gray-800">Grand Total:</span>
            <span className="text-gray-800">${grandTotal.toFixed(2)}</span>
          </div>
        </div>


      {/* Customer Input Fields */}
      <div className="mt-4">
        <h2 className="text-lg font-semibold mb-2">Customer Details</h2>
        <input
          type="text"
          placeholder="Your Name"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="number"
          placeholder="Mobile Number"
          value={customerMobile}
          onChange={(e) => setCustomerMobile(e.target.value)}
          className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Note (Optional)"
          value={customerNote}
          onChange={(e) => setCustomerNote(e.target.value)}
          rows="3"
          className="w-full p-2 mb-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      {/* Place Order Button */}
      <button
        onClick={handlePlaceOrder}
        className="w-full bg-[#4CBBA1] text-white font-semibold p-3 rounded-md "
      >
        Place Order
      </button>
    </div>
    </>
  )
}

export default Checkout_Order
