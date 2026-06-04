import axios from "axios";
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../store/AuthContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

const CashRegisterModel = ({ isOpen, onClose, setIsCashRegisterOpen}) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { token } = useContext(AuthContext);
  if (!isOpen) return null;
  const navigate=useNavigate()
  const time = new Date();
  const currentdate = time.toLocaleString();
  const [data, setData] = useState([]);
  const[id,setId]=useState()
  const[note,setNote]=useState("")
  const id2=localStorage.getItem("registerID")
  
  const getregisterData = async () => {
    const response = await axios.get(`${API_BASE_URL}/closeregister/${id2}`, {
      headers: { Authorization: token },
    });
    setData(response.data.data);
    setId(response.data.data.id)
    console.log(response.data);
  };
  const openDateTime = new Date(
    `${data.openDate}T${data.openTime}`
  ).toLocaleString();

  const handleregister = (id) => {
    console.log("closing_balance", data.closingBalance);
    
    axios
      .put(`${API_BASE_URL}/cashregisters/${id}`, {
        closing_balance: data.closingBalance,
        closing_note: note,
        closedate: currentdate,
      })
      .then((res) => {
        console.log(res.data);
        onClose();
        setIsCashRegisterOpen(false);
        localStorage.removeItem("registerID");
        localStorage.removeItem("isCashRegisterOpen"); // ✅ THIS LINE
        navigate("/case-register");
        toast.success("Cash register closed successfully!");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to close the cash register.");
      });
  };
  
  






  useEffect(() => {
    getregisterData();
  }, []);

  return (
    <div>
    <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
      <div className="w-full max-w-md mx-4 px-6"> {/* Reduced width */}
        <div className="py-4 bg-white rounded-md shadow-md border border-[#1C1D3E]">
          <div className="flex py-5 px-4 justify-between items-center border-b border-gray-300">
            <h2 className="text-xl font-semibold">
              Current Register {openDateTime} - {currentdate}
            </h2>
            <button
              onClick={onClose}
              className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
            >
              &times;
            </button>
          </div>
          <div>
            <section className="tabledata">
              <div className="p-6">
                {/* Table */}
                <table className="w-full border-collapse border border-[#4CBBA1] mb-6">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="border border-[#4CBBA1] p-2 text-left">
                        Payment Mode
                      </th>
                      <th className="border border-[#4CBBA1] p-2 text-left">
                        Sale
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-[#4CBBA1] p-2">
                        Cash in hand
                      </td>
                      <td className="border border-[#4CBBA1] p-2">
                        {data.openBalance}
                      </td>
                    </tr>
                    <tr>
                      <td className="border border-[#4CBBA1] p-2">
                        Cash Payment:
                      </td>
                      <td className="border border-[#4CBBA1] p-2">
                        {parseInt(data.closingBalance).toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals Section */}
                <div className="total-section mb-6 border border-[#4CBBA1] p-2">
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Sale:</span>
                    {/* <span>{data.closingBalance}</span> */}
                    {parseInt(data.closingBalance).toFixed(2)}
                  </div>
                  <div className="flex justify-between">
                    <span className="font-semibold">Total Payment:</span>
                    <span>
                      {Math.ceil(
                        (parseInt(data.openBalance) || 0) +
                        (parseInt(data.closingBalance) || 0)
                      ).toFixed(2)}
</span>
                  </div>
                </div>

                {/* Closing Note */}
                <div>
                  <label
                    htmlFor="closing_note"
                    className="block font-semibold mb-2"
                  >
                    Closing Note:
                  </label>
                  <textarea
                    onChange={(e) => {
                      setNote(e.target.value);
                    }}
                    id="closing_note"
                    name="closing_note"
                    className="w-full p-2 border border-[#4CBBA1] rounded-md focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                    rows="4"
                    placeholder="Enter your closing notes here..."
                  ></textarea>
                </div>

                <div className="mt-5">
                  <h1 className="text-lg font-semibold">
                    User: {data.username}
                  </h1>
                  <h1 className="text-lg font-semibold">
                    Email: {data.Email}
                  </h1>
                </div>
              </div>

              <div className="flex justify-between p-3">
                <span></span>

                <div className="flex gap-x-2 items-center">
                  <button
                    className="bg-[#6f65a7] text-white font-bold p-2 rounded-md"
                    onClick={onClose}
                  >
                    Close
                  </button>

                  <button
                    onClick={() => handleregister(id)}
                    className="bg-[#6f65a7] text-white font-bold p-2 rounded-md"
                  >
                    Close Register
                  </button>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
    <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
  </div>
  );
};

export default CashRegisterModel;
