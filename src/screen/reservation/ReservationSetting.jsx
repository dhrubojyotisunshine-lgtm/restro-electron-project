import React, { useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";


import useFullScreen from "../../components/useFullScreen";
const ReservationSetting = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  
const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [formData, setFormData] = useState({
    reservation_open: "",
    reservation_close: "",
    maxreserveperson: "",
  });
  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  const submitSetting = (e) => {
    e.preventDefault();
  
    axios.put(`${API_BASE_URL}/setting/2`, formData)
      .then(() => {
        toast.success("Updated reservation setting successfully!");
        setFormData({
          reservation_open: "",
          reservation_close: "",
          maxreserveperson: "",
       } )
      })
      .catch((error) => {
        toast.error("Error updating data");
        console.error("Error updating data:", error);
      });
  };

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Reservation Setting
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>

            
            <div className=" mt-16 border border-teal-500 p-10 rounded-md flex justify-between">
            <form onSubmit={submitSetting} className="w-full">
    <div className="flex justify-between">
      <div>
        <div className="flex items-center gap-x-5 mr-4">
          <label
            htmlFor="reservation_open"
            className="font-semibold text-gray-800 w-[200px] text-right"
          >
            Available Time
          </label>
          <input
            onChange={handleChange}
            value={formData.reservation_open}
            type="date"
            id="reservation_open"
            name="reservation_open"
            className="mt-1 p-1 border border-[#4CBBA1] rounded-md"
          />
        </div>
        <div className="flex items-center mr-4 gap-x-5">
          <label
            htmlFor="reservation_close"
            className="font-semibold text-gray-800 w-[200px] text-right"
          >
            Closing Time
          </label>
          <input
            onChange={handleChange}
            value={formData.reservation_close}
            type="time"
            id="reservation_close"
            name="reservation_close"
            className="mt-5 p-1 border border-[#4CBBA1] rounded-sm w-[200px]"
          />
        </div>
        <div className="flex items-center mr-4 gap-x-5">
          <label
            htmlFor="maxreserveperson"
            className="font-semibold text-gray-800 w-[200px] text-right"
          >
            Max Reserve Person
          </label>
          <input
            onChange={handleChange}
            value={formData.maxreserveperson}
            type="number"
            name="maxreserveperson"
            id="maxreserveperson"
            className="mt-5 p-1 border border-[#4CBBA1] rounded-md"
          />
        </div>
      </div>

      <div className="flex flex-col justify-between">
        <span></span>
        <div className="flex gap-x-2">
          <button
            className="bg-[#4CBBA1] text-white py-2 px-4 rounded-sm"
            type="reset"
          >
            Reset
          </button>
          <button
            className="bg-[#1C1D3E] text-white py-2 px-4 rounded-sm"
            type="submit"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};
export default ReservationSetting;
