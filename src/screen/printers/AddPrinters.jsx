import React, { useState,useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import axios from "axios";
import useFullScreen from "../../components/useFullScreen"
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";
import HasPermission from "../../store/HasPermission";

const AddPrinters = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const initialFormData = {
    printername: "",
    connectiontype: "",
    capabilityprofile: "",
    characterperline: "",
    IPaddress: "",
    port: "",
  };
  const [formErrors, setFormErrors] = useState({});
  const token = localStorage.getItem("token");
  const [formdata, setFormdata] = useState(initialFormData);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const [isOpen, setOpen] = useState(true);
const handleSubmit = (e) => {
  e.preventDefault();

  let errors = {};
  let isValid = true;

  // Loop through all fields to check if empty
  Object.entries(formdata).forEach(([key, value]) => {
    if (!value || value.toString().trim() === "") {
      errors[key] = `${key.replace(/([A-Z])/g, " $1")} is required`;
      isValid = false;
    }
  });

  setFormErrors(errors);

  if (!isValid) return; // Stop submit if any errors

  const data = {
    printername: formdata.printername,
    connectiontype: formdata.connectiontype,
    capabilityprofile: formdata.capabilityprofile,
    characterperline: formdata.characterperline,
    IPaddress: formdata.IPaddress,
    port: formdata.port,
  };

  axios
    .post(`${API_BASE_URL}/addprinter`, data, { headers: { Authorization: token } })
    .then(() => {
      toast.success("Printer added successfully");
      setFormdata(initialFormData);
      setFormErrors({});
    })
    .catch((error) => {
      console.error(error);
    });
};


  return (
    <div className="main_div ">
      <section className="side_section flex">
        <div className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
          <Nav />
        </div>
        <header className="">
          <Hamburger toggled={isOpen} toggle={setOpen} />
        </header>
        <div className="contant_div w-full ml-4 pr-7 mt-4">
          <div className="activtab flex justify-between">
            <h1 className="flex items-center justify-center gap-1 font-semibold">
              Add Printer
            </h1>

            <div className="notification flex gap-x-5">
              <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
             
            <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
            </div>
          </div>

          <div className="mt-28 border-[1px] border-[#4CBBA1] bg-white rounded-sm">
            <form onSubmit={handleSubmit}>
              <div className="pt-11 pb-16 pr-24">
                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                    htmlFor="printername"
                  >
                    Printer Name
                  </label>

                  <input
                    value={formdata.printername}
                    onChange={handleChange}
                    name="printername"
                    placeholder="Printer Name"
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="printername"
                  />
                </div>

                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto text-nowrap w-[300px] text-right text-gray-700 font-semibold mb-2"
                    htmlFor="connectiontype"
                  >
                    Connection Type
                  </label>

                  <select
                    value={formdata.connectiontype}
                    onChange={handleChange}
                    name="connectiontype"
                    id="connectiontype"
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select Connection Type</option>
                    <option value="network">Network</option>
                    <option value="windows">Window</option>
                    <option value="linux">Linux</option>
                  </select>
                </div>

                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto text-nowrap w-[300px] text-right text-gray-700 font-semibold mb-2"
                    htmlFor="capabilityprofile"
                  >
                    Capability Profile
                  </label>
                  <select
                    value={formdata.capabilityprofile}
                    onChange={handleChange}
                    name="capabilityprofile"
                    id="capabilityprofile"
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select Capability Profile</option>
                    <option value="Default">Default</option>
                    <option value="simple">Simple</option>
                  </select>
                </div>

                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto text-nowrap text-gray-700 w-[300px] text-right font-semibold mb-2"
                    htmlFor="characterperline"
                  >
                    Characters per line
                  </label>
                  <input
                    value={formdata.characterperline}
                    onChange={handleChange}
                    name="characterperline"
                    type="number"
                    placeholder="0"
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="characterperline"
                  />
                </div>

                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto text-nowrap text-gray-700 w-[300px] text-right font-semibold mb-2"
                    htmlFor="IPaddress"
                  >
                    IP Address
                  </label>
                  <input
                    value={formdata.IPaddress}
                    onChange={handleChange}
                    name="IPaddress"
                    placeholder="IP Address"
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="IPaddress"
                  />
                </div>

                <div className="mb-11 flex gap-x-7">
                  <label
                    className="m-auto text-nowrap text-gray-700 w-[300px] text-right font-semibold mb-2"
                    htmlFor="port"
                  >
                    Port
                  </label>
                  <input
                    value={formdata.port}
                    onChange={handleChange}
                    name="port"
                    type="number"
                    placeholder="0"
                    defaultValue={5000}
                    className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="port"
                  />
                </div>

                <div className="float-right flex ml-16 space-x-4">
                  <button
                    type="reset"
                    className="w-[104px] h-[42px] bg-[#4CBBA1] text-gray-50 rounded-md"
                    onClick={() => setFormdata(initialFormData)}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md"
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
  );
};

export default AddPrinters;
