import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";
const Cash_Register = ({ setIsCashRegisterOpen }) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const token = localStorage.getItem("token");
  const [isOpen, setOpen] = useState(true);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [formData, setFormData] = useState({
    opening_balance: "",
    openingnote: "",
  });
const navigate=useNavigate()
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
const [errors, setErrors] = useState({});
 const handleSubmit = (e) => {
  e.preventDefault();
  let validationErrors = {};

  if (!formData.opening_balance || formData.opening_balance <= 0) {
    validationErrors.opening_balance = "Cash in hand is required";
  }

  if (!formData.openingnote || formData.openingnote.trim() === "") {
    validationErrors.openingnote = "Opening note is required";
  }

  setErrors(validationErrors);

  if (Object.keys(validationErrors).length > 0) {
    return; // stop submission if there are errors
  }

  axios
    .post(`${API_BASE_URL}/cashregister`, formData, {
      headers: { Authorization: token },
    })
    .then((res) => {
      console.log(res.data);
      setIsCashRegisterOpen(true);
      localStorage.setItem("isCashRegisterOpen", true);
      localStorage.setItem("registerID", res.data.data.id);
      toast.success("Cash register successfully opened!");
      navigate("/order-list");
    })
    .catch((error) => {
      console.error(error);
      toast.error(
        error.response?.data?.message ||
          "An error occurred while opening the cash register."
      );
    });
};

  return (
    <>
      <div className="main_div  gap-x-4">
        <section className="side_section flex ">
          <div className={`${isOpen == false ? "hidden" : " hide-scrollbar h-screen overflow-y-auto w-[360px]"}`}>
            <Nav />
          </div>
          <header className=" ">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div w-full ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold text-2xl">
                Open Cash Register
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            <div className="mt-11 w-full">
              <div className="mt-28 border-[1px] border-[#4CBBA1] bg-white rounded-sm">
                <form onSubmit={handleSubmit}>
                  <div className="pt-11 pb-16 pr-24">
                   <div className="mb-11 flex gap-x-7">
  <label
    className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
    htmlFor="opening_balance"
  >
    Cash in hand:*
  </label>
  <div className="w-full">
    <input
      value={formData.opening_balance}
      onChange={handleChange}
      type="number"
      name="opening_balance"
      placeholder="Enter Amount"
      className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    />
    {errors.opening_balance && (
      <p className="text-red-500 text-sm mt-1">{errors.opening_balance}</p>
    )}
  </div>
</div>

                   <div className="mb-11 flex gap-x-7">
  <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
    Opening Note*
  </label>
  <div className="w-full">
    <textarea
      name="openingnote"
      placeholder="Opening Note"
      value={formData.openingnote}
      onChange={handleChange}
      className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
    ></textarea>
    {errors.openingnote && (
      <p className="text-red-500 text-sm mt-1">{errors.openingnote}</p>
    )}
  </div>
</div>
                    <HasPermission module="POS Invoice" action="create">
                      <div className="float-right flex ml-16 space-x-4">
                        <button
                          type="submit"
                          className="p-3 bg-[#1C1D3E] text-white rounded-md"
                        >
                          Open Register
                        </button>
                      </div>
                    </HasPermission>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Cash_Register;
