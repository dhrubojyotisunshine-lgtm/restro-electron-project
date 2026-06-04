import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../../store/AuthContext";
import { FaRegEye, FaRegEdit, FaCheck } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
const headers = [
  "SL.",
  "Order ID",
  "Customer Name ",
  "Customer Type ",
  "Amount",

  "Action",
];
const Tooltip = ({ message, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <span className="absolute bottom-7 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">
        {message}
      </span>
    </div>
  );
};

const DraftOrder = ({ isOpen, onClose }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  if (!isOpen) return null;
  const [draftorder, setDraftorder] = useState([]);
  const [isDeletOpen, setIsDeletOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const closeModaldelete = () => setIsDeletOpen(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const getDratOrder = () => {
    axios
      .get(`${API_BASE_URL}/getdraft`,{
        headers: {
          Authorization: token,
          },
      })
      .then((res) => {
        console.log(res.data);
        setDraftorder(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(canceldata.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
  };
 // cancle order process
 const deleteOrder = (order_id) => {
    setSelectedOrderId(order_id);
    setIsDeletOpen(true);
  };

  const navigate=useNavigate()
    const handleEditClick = (id) => {
      // Fetch data for the given ID
          navigate(`/edit-order/${id}`); // Navigate to the edit page with the role ID
       
    };

  const DeletModal = ({ isOpen, onClose, order_id }) => {
    if (!isOpen) return null;
    const [anyreason, setAnyreason] = useState(""); // renamed to match backend

    const cancelOrder = (order_id) => {
      axios
      .post(
        `${API_BASE_URL}/cancelOrder/${order_id}`,
        { anyreason }, 
        { headers: { "Content-Type": "application/json" } } 
      )
      .then((response) => {
        console.log(response.data);
        getDratOrder(); // Assuming this fetches updated order data
        onClose(); // Close modal after successful cancellation
        toast.success("Order cancel sucessfully.")
      })
        .catch((error) => {
          console.error(error);
        });
    };


 
   
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      {/* Background Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-55"></div>

      {/* Modal Container */}
      <div className="relative bg-white rounded-lg shadow-lg w-1/4 p-5 border border-gray-300">
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-3">
          <h2 className="text-lg font-semibold">Cancel Order</h2>
          <button
            onClick={onClose}
            className="text-white bg-red-500 px-3 py-1 rounded-md hover:bg-red-600"
          >
            X
          </button>
        </div>

        {/* Modal Content */}
        <div className="space-y-4">
          <div className="flex justify-between">
            <h1 className="font-medium">Order ID:</h1>
            <span className="text-gray-700">{order_id}</span>
          </div>
          
          <div>
            <label className="font-medium">Cancel Reason:</label>
            <textarea
              rows={3}
              id="message"
              name="message"
              required
              placeholder="Enter reason..."
              className="w-full p-2 text-sm border rounded border-gray-300 focus:ring-2 focus:ring-teal-400"
              value={anyreason}
              onChange={(e) => setAnyreason(e.target.value)}
            ></textarea>
          </div>

          <button
            onClick={() => cancelOrder(order_id)}
            className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600"
          >
            Confirm Cancel
          </button>
        </div>
      </div>
    </div>
      </>
    );
  };
  useEffect(() => {
    getDratOrder();
  }, []);

  return (
    <>

<div>
      <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
        <div className="w-3/5 px-10">
          <div className=" py-1  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
            <div className="flex  py-1 px-4 justify-between items-center border-b-[1px] border-black">
              <h2 className="text-xl  font-semibold ">Draft Orders</h2>
              <button
                onClick={onClose}
                className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
              >
                X
              </button>
            </div>
            <div className="">
            <div className="p-4">
        <table className="min-w-full bg-white border-collapse">
          <thead>
            <tr>
              {headers.map((header, index) => (
                <th key={index} className="py-3 px-3 bg-[#4CBBA1] text-white text-sm">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {draftorder.length > 0 ? (
              draftorder.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((row, index) => (
                <tr key={index} className="border-b text-center">
                  <td className="py-2 px-3 border border-[#4CBBA1]">{index + 1}</td>
                  <td className="py-2 px-3 border border-[#4CBBA1]">{row.order_id}</td>
                  <td className="py-2 px-3 border border-[#4CBBA1]">{row.customer_name}</td>
                  <td className="py-2 px-3 border border-[#4CBBA1]">{row.customer_type}</td>
                  <td className="py-2 px-3 border border-[#4CBBA1]">{row.totalamount}$</td>

                  {/* Action Buttons */}
                  <td className="py-2 px-3 border border-[#4CBBA1]">
                    <div className="flex justify-evenly items-center">
                      <button
                        onClick={() => handleEditClick(row.order_id)}
                        className="bg-[#1C1D3E] px-2 py-1 text-white text-sm rounded-md hover:bg-[#2D2E4F]"
                      >
                        Add to Cart
                      </button>

                      <button
                        onClick={() => deleteOrder(row.order_id)}
                        className="bg-[#a02828] px-2 py-1 text-white text-sm rounded-md hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="py-2 px-3 text-center">
                  No Draft Orders Available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {/* Pagination Controls */}
      {draftorder.length > 0 && (
        <div className="flex justify-end space-x-2 mt-6">
          <button
            onClick={() => selectPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="px-4 py-2 border border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {[...Array(Math.ceil(draftorder.length / itemsPerPage))].map((_, index) => (
            <button
              key={index}
              onClick={() => selectPage(index + 1)}
              className={`px-3 py-2 border border-[#1C1D3E] ${
                currentPage === index + 1 ? "bg-[#1C1D3E] text-white" : ""
              }`}
            >
              {index + 1}
            </button>
          ))}

          <button
            onClick={() => selectPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(draftorder.length / itemsPerPage)}
            className="px-4 py-2 border border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      </div>

             
            </div>
          </div>
        </div>
      </div>
      <div className=" opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
    </div>

    <DeletModal
                            isOpen={isDeletOpen}
                            order_id={selectedOrderId}
                            onClose={closeModaldelete}
                          />
    </>
   
  );
};

export default DraftOrder;
