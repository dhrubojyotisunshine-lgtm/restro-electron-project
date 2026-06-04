import axios from "axios";
import React, { useEffect, useState,useContext } from "react";
import { toast } from "react-toastify";

const SplitpayModal = ({
    isOpen,
    onClose,
    paymentData,
    paymentMethod,
    Orderids,
    refreshOrderList,
  }) => 
    
    {
    if (!isOpen) return null;
    if (!isOpen) return null;
      const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
      const [selectedMethod, setSelectedMethod] = useState([1]);
      const [paidAmount, setPaidAmount] = useState(0);
      const [discount, setDiscount] = useState(0);
      const [discountType, setDiscountType] = useState("percent"); // or "amount"
      const orderDetails = paymentData[0];
     
      
  useEffect(() => {
    if (orderDetails.length > 0) {
      // Calculate the combined total amount from all orders
      
  
      // Calculate the discounted amount based on the total amount
      const calculatedAmount = calculateDiscountedAmount(
        total,
        discount,
        discountType
      );
  
      // Update the paid amount state
      setPaidAmount(calculatedAmount);
    }
  }, [discount, discountType, orderDetails]);
  
console.log(orderDetails)

const total = orderDetails.reduce((acc, item) => {
  const qty = parseFloat(item.menu_qty) || 0; // Ensure qty is a number
  const price = parseFloat(item.total_price) || 0; // Ensure price is a number
  const vat = parseFloat(item.Product_vat) || 0; // Ensure vat is a number

  // Calculate the total price of add-ons
  const addonsPrice = item.add_ons && item.add_ons.length > 0
    ? item.add_ons.reduce((addonAcc, val) => {
        const addonQty = parseFloat(val.quantity) || 0; // Ensure addon quantity is a number
        const addonPrice = parseFloat(val.price) || 0; // Ensure addon price is a number
        return addonAcc + (addonQty * addonPrice); // Accumulate the add-on total
      }, 0)
    : 0; // Default to 0 if no add-ons

  return acc + (qty * price) + vat + addonsPrice; // Accumulate the total
}, 0).toFixed(2); 

  const calculateDiscountedAmount = (total, discount, type) => {
    if (type === "percent") {
      return total - (total * discount) / 100;
    } else if (type === "amount") {
      return total - discount;
    }
    return total;
  };

  const handleMethodChange = (event) => {
    setSelectedMethod(Number(event.target.value));
  };

  const handleDiscountChange = (event) => {
    setDiscount(Number(event.target.value));
  };

  const handleDiscountTypeChange = (event) => {
    setDiscountType(event.target.value);
  };

//merge paynment
 
  const payPayment = () => {
    const formData = {
      payment_method_id: selectedMethod,
      paidAmount,
      sub_order_ids: Orderids,
      discount: discount,
      
    };
    console.log(formData)

    axios
      .post(`${API_BASE_URL}/paysplit`, formData)
      .then((response) => {
        console.log("split pay response",response.data);
        refreshOrderList()
        toast.success("Partial payment complete remaining payments due.")
        onClose(); // Close the modal after payment
      })
      .catch((error) => {
        console.error(error);
        toast.error("Payment Failed");
      });
  };
    
  return (
    <div>
    <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
      <div className="w-8/12 px-20">
        <div className="py-4 bg-white rounded-md shadow-md border-[1px] border-[#1C1D3E]">
          <div className="flex  py-5 px-4 justify-between items-center ">
            <span></span>
            <button
              onClick={onClose}
              className="text-white bg-[#FB3F3F] px-2  rounded-md hover:scale-105 font-bold"
            >
              X
            </button>
          </div>
          <div className="container mx-auto p-4">
          <h2 className="text-xl font-bold mb-4">Order Table</h2>
          <table className="min-w-full bg-white border border-gray-300">
  <thead>
    <tr className="bg-gray-200">
      <th className="py-2 px-4 border-b text-center">SL.</th>
      <th className="py-2 px-4 border-b text-center">Product Name</th>
      <th className="py-2 px-4 border-b text-center">Total Amount</th>
    </tr>
  </thead>
  <tbody>
    {orderDetails.map((order, index) => {
      // Convert values to numbers
      const menuPrice = parseFloat(order.total_price) * parseInt(order.menu_qty);
      const vatAmount = parseFloat(order.Product_vat);
      
      // Calculate total add-on price
      const addOnTotal = order.add_ons && order.add_ons.length > 0 
        ? order.add_ons.reduce((sum, addOn) => sum + (parseFloat(addOn.price) * parseInt(addOn.quantity)), 0)
        : 0;

      // Final total amount
      const totalAmount = menuPrice + vatAmount + addOnTotal;

      return (
        <tr key={order.order_menu_id} className="hover:bg-gray-100">
          <td className="py-2 px-4 border-b text-center">{index + 1}</td>
          <td className="py-2 px-4 border-b text-center">{order.variantName}</td>
          <td className="py-2 px-4 border-b text-center">${totalAmount.toFixed(2)}</td>
        </tr>
      );
    })}
  </tbody>
</table>
      </div>

          <div className="px-6">
            {orderDetails.length > 0 ? (
              <div className="flex justify-between w-full p-4 rounded-lg shadow-md border border-[#4CBBA1]">
                <div className="flex-1">
                  <label className="block mb-2">Payment Method</label>
                  <select
                    value={selectedMethod}
                    onChange={handleMethodChange}
                    className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    name="paymentMethod"
                    id="paymentMethod"
                  >
                    {paymentMethod.map((method, index) => (
                      <option key={index} value={method.payment_method_id}>
                        {method.payment_method}
                      </option>
                    ))}
                  </select>
                  {(selectedMethod === 9 || selectedMethod === 4) && (
                    <div className="mt-4">
                      <div className="w-full max-w-lg mx-auto p-8">
                        <div className="bg-white rounded-lg shadow-lg p-6">
                          <h2 className="text-lg font-medium mb-6">
                            Payment Information
                          </h2>
                          <form>
                            <div className="grid grid-cols-2 gap-6">
                              <div className="col-span-2 sm:col-span-1">
                                <label
                                  htmlFor="card-number"
                                  className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                  Card Number
                                </label>
                                <input
                                  type="text"
                                  name="card-number"
                                  id="card-number"
                                  placeholder="0000 0000 0000 0000"
                                  className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label
                                  htmlFor="expiration-date"
                                  className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                  Expiration Date
                                </label>
                                <input
                                  type="text"
                                  name="expiration-date"
                                  id="expiration-date"
                                  placeholder="MM / YY"
                                  className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label
                                  htmlFor="cvv"
                                  className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                  CVV
                                </label>
                                <input
                                  type="text"
                                  name="cvv"
                                  id="cvv"
                                  placeholder="000"
                                  className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                              </div>
                              <div className="col-span-2 sm:col-span-1">
                                <label
                                  htmlFor="card-holder"
                                  className="block text-sm font-medium text-gray-700 mb-2"
                                >
                                  Card Holder
                                </label>
                                <input
                                  type="text"
                                  name="card-holder"
                                  id="card-holder"
                                  placeholder="Full Name"
                                  className="w-full py-3 px-4 border border-gray-400 rounded-lg focus:outline-none focus:border-blue-500"
                                />
                              </div>
                            </div>
                            <div className="mt-8">
                              <button
                                type="button"
                                className="w-full bg-[#4CBBA1] hover:bg-[#90d8c7] text-white font-medium py-3 rounded-lg focus:outline-none"
                              >
                                Submit
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col ml-4">
                  
<div className="flex justify-between px-3 border-[1px] mb-8 border-[#4CBBA1] py-3 rounded-sm shadow-[#4CBBA1] shadow-sm">
                        <h1>Total Amount</h1>
                        <input
                          type="text"
                          value={paidAmount}
                          readOnly
                          className="text-right"
                        />
                      </div>
                  <div className="">
                    <label className="block mb-2">Discount Type</label>
                    <select
                      className="w-full p-2 border rounded border-[#4CBBA1]"
                      value={discountType}
                      onChange={handleDiscountTypeChange}
                    >
                      <option value="percent">Percent(%)</option>
                      <option value="amount"> Fixed</option>
                    </select>
                  </div>

                  <div className="mt-4">
                    <label className="block mb-2">Discount</label>
                    <input
                      min={0}
                      type="number"
                      className="w-full p-2 border rounded border-[#4CBBA1]"
                      value={discount}
                      onChange={handleDiscountChange}
                    />
                  </div>

                  <div className="mt-4">
                    <h1 className="block mb-2 font-bold">
                      Final Amount: {paidAmount.toFixed(2)}
                    </h1>
                  </div>

                  <div className=" flex justify-between mt-5">

                 
                    <button
                      type="button"
                      onClick={() => payPayment()}
                      className="bg-[#1C1D3E] float-right text-white py-2 px-4 rounded-md hover:bg-[#2B2F4A] text-nowrap"
                    >
                      Pay Now
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-center text-gray-600">Loading...</p>
            )}
          </div>
        </div>
      </div>
    </div>
    <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
  </div>
  )
}

export default SplitpayModal
