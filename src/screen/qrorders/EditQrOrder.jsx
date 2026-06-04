import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SiFoodpanda } from "react-icons/si";
import QrOrdermodal from "../../components/QrOrdermodal";

// This page is for view the order and redirect the edit order...
const EditQrOrder = () => {
  const location = useLocation();
  const { orderId ,tableId} = location.state || {};
  const [isModalOpen, setIsModalOpen] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
   const[editData,setEditData]=useState([])
const [orderDetails,setOrderDetail]=useState([])
  const editQrData = async () => {
    console.log("order id", orderId);
    try {
      const response = await fetch(`${API_BASE_URL}/getQrOrderById/${orderId}`);
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      const data = await response.json();
      setEditData(data.orderDetails || []);
      setOrderDetail(data.menuItems || []); // Set orderDetails to state
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
};

const handleCloseModal = () => {
    setIsModalOpen(false);
};

  useEffect(() => {
    if (orderId) {
      editQrData();
    }
  }, [orderId]);


const navigate=useNavigate()
   const handleProceedEdit = () => {
      if (!orderId) { // Check if orderId is null, undefined, or falsy
        toast.error("Please select an order to edit."); // Alternatively, use a toast notification
        return;
      }
      
      // Navigate to the edit page with the orderId
      navigate(`/editQrorderdata/${tableId}`, { state: { orderId,tableId } });
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

        <div className="mt-4">
          <h2 className="text-lg font-semibold text-center mb-2">
            Your Order Details
          </h2>


          {editData.map((val, index) => (
        <div key={index} className="max-w-auto rounded overflow-hidden shadow-lg p-6 bg-white">
          <h2 className="text-md font-bold mb-2">Order Status :-{val.order_status_name}</h2>
          <p className="text-gray-700 text-base mb-4"> Total Price: ${val.totalamount}</p>
          <div className="flex justify-between">
            
            <button 
              onClick={handleOpenModal}
            className="bg-[#1C1D3E] text-white font-bold py-1 px-2 rounded">
              View
            </button>
            <button
              className="bg-[#3ba579] text-white font-bold py-1 px-2 rounded hover:bg-green-700 transition duration-200"
              onClick={handleProceedEdit}
            >
              Edit
            </button>
          </div>
        </div>
      ))}


         
        </div>
      </div>

      <QrOrdermodal
                isOpen={isModalOpen} 
                onClose={handleCloseModal} 
                menuItems={orderDetails} 
            />
    </>
  );
};

export default EditQrOrder;
