import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";

const PaymentDialogBox = ({
  

  isOpen,
  onClose,
  paymentData,
  paymentMethod,
  refreshOrderList,
}) => {
  if (!isOpen) return null;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL= import.meta.env.VITE_IMG_URL
  const [selectedMethod, setSelectedMethod] = useState(1);
  const [paidAmount, setPaidAmount] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("percent"); // or "amount"
  const orderDetails = paymentData?.[0]?.orderDetails || [];
  const [serviceCharge, setServiceCharge] = useState(null);
  useEffect(() => {
    if (orderDetails.length > 0) {
      const totalAmount = orderDetails[0].totalamount;
      const calculatedAmount = calculateDiscountedAmount(
        totalAmount,
        discount,
        discountType,
        serviceCharge // Include service charge in calculation
      );
      setPaidAmount(calculatedAmount);
    }
  }, [discount, discountType, orderDetails, serviceCharge]);

  const calculateDiscountedAmount = (total, discount, type, serviceCharge) => {
    let discountedTotal = total;
    
    // Apply discount
    if (type === "percent") {
      discountedTotal -= (total * discount) / 100;
    } else if (type === "amount") {
      discountedTotal -= discount;
    }
  
    // Apply service charge
    if (serviceCharge) {
      discountedTotal += (discountedTotal * serviceCharge) / 100;
    }
  
    return discountedTotal;
  };
  const handleMethodChange = (event) => {
    setSelectedMethod(Number(event.target.value));
  };

  const handleDiscountChange = (event) => {
    setDiscount(Number(event.target.value));
  };

  const handleServiceCharge = (event) => {
    setServiceCharge(Number(event.target.value));
  };

  const handleDiscountTypeChange = (event) => {
    setDiscountType(event.target.value);
  };
  // get all booked table
  const getBookTable = () => {
    axios
      .get(`${API_BASE_URL}/bookedtable`)
      .then((res) => {
      })
      .catch((error) => {
        console.log(error);
        toast.error("Cant show table");
      });
  };
  const payPayment = (order_id) => {
    const formData = {
      payment_method_id: selectedMethod,
      paidAmount,
      order_id,
      discount: discount,
      service_charge: serviceCharge // Send actual service charge value
    };
  
    axios
      .post(`${API_BASE_URL}/makePayment/${order_id}`, formData)
      .then((response) => {
        console.log(response.data);
        toast.success("Payment Complete");
        getBookTable();
        refreshOrderList();
        onClose();
      })
      .catch((error) => {
        console.error(error);
        toast.error("Payment Failed");
      });
  };

  return (
    <div className="flex justify-center items-center fixed inset-0 z-50 outline-none">
  {/* Background Blur Effect */}
  <div className="fixed inset-0 bg-black opacity-50 backdrop-blur-sm" onClick={onClose}></div>

  <div className="relative w-1/4 bg-white rounded-md shadow-lg p-6 border border-[#1C1D3E] z-10">
    {/* Close Button */}
    <div className="flex justify-end">
      <button onClick={onClose} className="text-white bg-[#FB3F3F] px-3 py-1 rounded-md hover:scale-105 font-bold">X</button>
    </div>

    {/* Modal Content */}
    {orderDetails.length > 0 ? (
      <div>
        {/* Payment Method */}
        <label className="block text-sm font-semibold">Payment Method</label>
        <select value={selectedMethod} onChange={handleMethodChange} className="w-full border border-[#4CBBA1] rounded px-2 py-1 text-sm">
          {paymentMethod.map((method, index) => (
            <option key={index} value={method.payment_method_id}>{method.payment_method}</option>
          ))}
        </select>

        {/* Payment Info */}
        {(selectedMethod === 9 || selectedMethod === 4) && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h2 className="text-sm font-semibold mb-2">Payment Information</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <input type="text" placeholder="Card Number" className="border border-gray-400 px-2 py-1 rounded" />
              <input type="text" placeholder="MM / YY" className="border border-gray-400 px-2 py-1 rounded" />
              <input type="text" placeholder="CVV" className="border border-gray-400 px-2 py-1 rounded" />
              <input type="text" placeholder="Card Holder" className="border border-gray-400 px-2 py-1 rounded" />
            </div>
          </div>
        )}

        {/* Order Summary */}
        {orderDetails.map((val, index) => (
          <div key={index} className="mt-4 text-sm">
            <div className="flex justify-between px-3 py-2 border border-[#4CBBA1] rounded bg-gray-50">
              <span className="font-medium">Total</span>
              <span>{val.totalamount}</span>
            </div>
            {/* <div className="flex justify-between px-3 py-2 border border-[#4CBBA1] rounded bg-gray-50 mt-2">
              <span className="font-medium">Due</span>
              <span>{val.bill_amount}</span>
            </div> */}
          </div>
        ))}

        {/* Discount */}
        <div className="mt-4 text-sm">
          <label className="block font-semibold">Discount Type</label>
          <select value={discountType} onChange={handleDiscountTypeChange} className="w-full border border-[#4CBBA1] rounded px-2 py-1">
            <option value="percent">Percent(%)</option>
            <option value="amount">Fixed</option>
          </select>
        </div>

        <div className="mt-2 text-sm">
          <label className="block font-semibold">Discount</label>
          <input type="number" min={0} value={discount} onChange={handleDiscountChange} className="w-full border border-[#4CBBA1] rounded px-2 py-1" />
        </div>
        <div className="mt-2 text-sm">
          <label className="block font-semibold">Service Charge (%)</label>
          <input type="number" min={0} value={serviceCharge}  name="service_charge"
 onChange={handleServiceCharge} className="w-full border border-[#4CBBA1] rounded px-2 py-1" />
        </div>

        {/* Final Amount */}
        <div className="mt-4 text-center text-lg font-bold"> Final: ${paidAmount.toFixed(2)}</div>

        {/* Pay Button */}
        <button onClick={() => payPayment(orderDetails[0].order_id)} className="w-full mt-4 bg-[#1C1D3E] text-white py-2 rounded-md hover:bg-[#2B2F4A]">
          Pay Now
        </button>
      </div>
    ) : (
      <p className="text-center text-gray-600">Loading...</p>
    )}
  </div>
</div>
  );
};

export default PaymentDialogBox;
