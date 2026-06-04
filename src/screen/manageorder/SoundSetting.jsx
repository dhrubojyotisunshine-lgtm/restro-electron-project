import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaRegEdit } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";

const SoundSetting = () => {
  const [isOpen, setOpen] = useState(true);
  const [sound, setSound] = useState();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;

  const addSound = (e) => {
    e.preventDefault();
  
    if (!sound) {
      toast.error("Please select a sound");
      return;
    }
  
    const formData = new FormData();
    formData.append("notifysound", sound);
  
    axios
      .post(`${API_BASE_URL}/createsound`, formData)
      .then((response) => {
        console.log(response.data);
        toast.success("Sound added successfully.");
  
        // Clear form after successful submission
        setSound(null); // Clear the sound state
        e.target.reset(); // Reset the form fields
      })
      .catch((error) => {
        console.error(error);
        toast.error("Something went wrong.");
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
                Sound Setting
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              </div>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <form onSubmit={addSound}>
                <div className="border-[1px] border-[#4CBBA1] p-11 flex justify-between items-center rounded">
                  <div>
                    <label htmlFor="file" className="font-semibold">
                      Upload Notification Sound
                    </label>
                    <input
                      onChange={(e) => {
                        setSound(e.target.files[0]); // Set the selected file
                      }}
                      type="file"
                      id="notifysound"
                     name="notifysound"
                      className="ml-4"
                      accept="audio/*" // Restrict to audio files only
                    />
                  </div>

                  <div className="flex flex-col justify-between gap-y-9">
                    <button
                      className="h-[40px] w-[104px] text-white font-semibold bg-[#1C1D3E] rounded"
                      type="submit"
                    >
                      Save
                    </button>
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

export default SoundSetting;
