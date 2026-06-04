import React, { useContext, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";
import { useNavigate } from "react-router-dom";
const AddBooking = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(true);
  const [freeTable, setFreeTable] = useState([]);
  //table name and table seat number
  const [tname, setTname] = useState("");
  const [tseat, setTseat] = useState("");
  const [cModal, setCmodal] = useState(false);
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    customer_mobile: "",
    reserveday: "",
    formtime: "",
    totime: "",
  });
  const token = localStorage.getItem("token");
  const [errors, setErrors] = useState({});
  const today = new Date().toISOString().split("T")[0];
  // set data for filter
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.reserveday) {
      newErrors.reserveday = "Please select a date";
    }

    if (!formData.formtime) {
      newErrors.formtime = "Please select a start time";
    }

    if (!formData.totime) {
      newErrors.totime = "Please select an end time";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // get free table
  // const checkAvailability = async (e) => {
  //   e.preventDefault(); // Prevent default form submission
  //    if (!validateForm()) {
  //   toast.error("Please fill all required fields");
  //   return;
  // }
  //   const { reserveday, formtime, totime } = formData;

  //   try {
  //     const response = await axios.get(
  //       `${API_BASE_URL}/getavailablereservationtables`,
  //       {
  //         params: {
  //           formtime,
  //           totime,
  //           reserveday,
  //         },
  //         headers: {
  //           Authorization: token
  //           }
  //       }
  //     );
  //     setFreeTable(response.data.data);

  //     toast.success("Availability checked!");
  //     // Optionally, you can display the available tables here
  //   } catch (error) {
  //     console.error("Error fetching available tables:", error);
  //     toast.error("Error fetching available tables");
  //   }
  // };

  const checkAvailability = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill all required fields");
      return;
    }

    const { reserveday, formtime, totime } = formData;

    try {
      const response = await axios.get(
        `${API_BASE_URL}/getavailablereservationtables`,
        {
          params: {
            formtime,
            totime,
            reserveday,
          },
          headers: {
            Authorization: token,
          },
        },
      );

      const tables = response.data.data;

      setFreeTable(tables);

      // ✅ If no tables available
      if (tables.length === 0) {
        toast.info("No tables available for selected date & time");
      } else {
        toast.success("Tables available!");
      }
    } catch (error) {
      console.error("Error fetching available tables:", error);
      toast.error("Error fetching available tables");
    }
  };

  // Booking Table

  const bookTable = async (id) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tableunbookbyid/${id}`);
      console.log(res.data);
      const tableData = res.data.data;
      setTname(tableData.tablename);
      setTseat(tableData.person_capicity);

      // Update formData with table name and seat capacity
      setFormData((prevFormData) => ({
        ...prevFormData,
        tablename: tableData.tablename,
        person_capacity: tableData.person_capicity,
      }));

      setCmodal(true);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error fetching data");
    }
  };

  const handleModalClose = () => {
    setCmodal(false);
  };

  const handelChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const submitAddcustomer = (e) => {
    e.preventDefault();

    // Check if formData has all necessary fields filled
    if (!formData.customer_name) {
      toast.error("Please fill customer name");
      return;
    }
    if (!formData.customer_email) {
      toast.error("Please fill customer email");
      return;
    }
    if (!formData.customer_mobile) {
      toast.error("Please fill customer_mobile");
      return;
    }
    axios
      .post(`${API_BASE_URL}/reservationbook`, formData, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setCmodal(false); // Close modal on success
        toast.success("Table booked successfully");
        setFormData({}); // Clear form data
        checkAvailability(); // Refresh available tables
        navigate("/reservation");
      })
      .catch((error) => {
        console.error("Error in booking table:", error);

        // Show error message if available
        const errorMessage =
          error.response && error.response.data && error.response.data.message
            ? error.response.data.message
            : "Error in booking table";

        toast.error(errorMessage);
      });
  };

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div
            className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Add Booking
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />{" "}
              </div>
            </div>
            {/* Form for check availablity */}
            <div className=" mt-16 border border-teal-500 p-10 rounded-md">
              <form onSubmit={checkAvailability}>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col mr-4">
                    <label
                      htmlFor="reserveday"
                      className="font-semibold text-gray-800"
                    >
                      Date *
                    </label>
                    <input
                      type="date"
                      name="reserveday"
                      id="reserveday"
                      min={today}
                      value={formData.reserveday}
                      onChange={handleInputChange}
                      className="mt-1 p-1 border border-[#4CBBA1] rounded-md"
                    />
                  </div>
                  <div className="flex flex-col mr-4">
                    <label
                      htmlFor="formtime"
                      className="font-semibold text-gray-800"
                    >
                      Start Time *
                    </label>
                    <input
                      type="time"
                      name="formtime"
                      id="formtime"
                      value={formData.formtime}
                      onChange={handleInputChange}
                      className="mt-1 p-1 border border-[#4CBBA1] rounded-sm w-[200px]"
                    />
                  </div>

                  <div className="flex flex-col mr-4">
                    <label
                      htmlFor="totime"
                      className="font-semibold text-gray-800"
                    >
                      End Time *
                    </label>
                    <input
                      type="time"
                      name="totime"
                      id="totime"
                      value={formData.totime}
                      onChange={handleInputChange}
                      className="mt-1 p-1 border border-[#4CBBA1] rounded-sm w-[200px]"
                    />
                  </div>
                  <HasPermission module="Add Booking" action="access">
                    {" "}
                    <button
                      type="submit"
                      className="bg-[#1C1D3E] text-white py-2 px-4 rounded-sm"
                    >
                      Check Availability
                    </button>
                  </HasPermission>
                </div>
              </form>
            </div>
            {/* Table section */}
            <div className="mt-2">
              <div className="p-5 h-[700px] overflow-y-scroll">
                {/* Check if freeTable is defined and an array */}
                {Array.isArray(freeTable) && freeTable.length === 0 ? (
                  <div className="flex items-center justify-center w-full h-full">
                    <h1 className="text-gray-500 text-lg">
                      Please fill detais to see available tables..
                    </h1>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-6">
                    {freeTable.map((val, index) => (
                      <div
                        key={val.tableid}
                        className="border-[#4CBBA1] border-[1px]  w-auto rounded-md"
                      >
                        <div className="">
                          <div className="p-2 flex flex-col items-center justify-center">
                            <div className="flex flex-row items-center gap-x-5 mb-3 justify-between">
                              <div className="image w-[60px] h-[60px]">
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  viewBox="0 0 48 48"
                                >
                                  <g id="Dining_Table" data-name="Dining Table">
                                    <path
                                      d="M28.555,39.7,26.445,38.3A1,1,0,0,1,26,37.465V25H22V37.465a1,1,0,0,1-.445.832L19.445,39.7a1,1,0,0,0-.445.832V41a1,1,0,0,0,1,1h8a1,1,0,0,0,1-1v-.465A1,1,0,0,0,28.555,39.7Z"
                                      id="id_101"
                                      style={{ fill: "rgb(76, 187, 161)" }}
                                    ></path>
                                    <rect
                                      x="9"
                                      y="19"
                                      width="29"
                                      height="4"
                                      rx="1"
                                      id="id_102"
                                    ></rect>
                                    <path
                                      d="M25,9.054V8h1a1,1,0,0,0,0-2H22a1,1,0,0,0,0,2h1V9.054A10.019,10.019,0,0,0,14.2,17H33.8A10.019,10.019,0,0,0,25,9.054Zm-2.3,4.087a6.026,6.026,0,0,0-3.462,2.205,1,1,0,0,1-1.588-1.217,8.036,8.036,0,0,1,4.617-2.941,1,1,0,1,1,.433,1.953Z"
                                      id="id_103"
                                    ></path>
                                    <path
                                      d="M47.5,16.679a1.994,1.994,0,0,0-1.5-.679H44.921A2,2,0,0,0,43,17.481l-2.587,9.662H34.244a2.99,2.99,0,0,0-2.894,2.25L31.065,30.5h0A2,2,0,0,0,33,33h.069l-1.931,7.758a1,1,0,0,0,.73,1.212.961.961,0,0,0,.242.03,1,1,0,0,0,.97-.758L35.127,33H42.3l1.826,8.217A1,1,0,0,0,45.1,42a1.018,1.018,0,0,0,.218-.024,1,1,0,0,0,.76-1.193l-1.764-7.936A3,3,0,0,0,46.375,30.4l1.608-12.132A2.005,2.005,0,0,0,47.5,16.679Z"
                                      id="id_104"
                                    ></path>
                                    <path
                                      d="M16.58,32.227a1.993,1.993,0,0,0,.357-1.727h0l-.286-1.106a2.988,2.988,0,0,0-2.893-2.25H7.593L5.006,17.481A2,2,0,0,0,3.08,16H1.994A2,2,0,0,0,.018,18.264L1.626,30.4a3,3,0,0,0,2.057,2.451L1.919,40.783a1,1,0,0,0,1.953.434L5.7,33h7.176l2.051,8.242A1,1,0,0,0,15.9,42a.961.961,0,0,0,.242-.03,1,1,0,0,0,.729-1.212L14.935,33h.07A1.981,1.981,0,0,0,16.58,32.227Z"
                                      id="id_105"
                                    ></path>
                                  </g>
                                </svg>
                              </div>
                            </div>

                            <div>
                              <div className="w-[200px]">
                                <div className="flex">
                                  <h1 className="text-nowrap w-28">
                                    Table Name:
                                  </h1>
                                  <h1 className="text-nowrap">
                                    {val.tablename}
                                  </h1>
                                </div>

                                <div className="flex">
                                  <h1 className="text-nowrap w-28">Seat:</h1>
                                  <h1 className="text-nowrap">
                                    {val.person_capicity}
                                  </h1>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="w-full text-center py-3 px-4">
                          <button
                            className="bg-[#4cbbb2] w-full text-[#fff] rounded-md p-4"
                            onClick={() => bookTable(val.tableid)}
                          >
                            Book Table
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
      <DialogBoxSmall
        isOpen={cModal}
        title={"Book Table"}
        onClose={handleModalClose}
      >
        <div className="">
          <form
            onSubmit={submitAddcustomer}
            className="bg-white rounded px-8 pt-6 pb-11 mb-4"
          >
            <div className="flex justify-between p-2">
              <h1>Table Name: {tname}</h1>
              <h1>Table Capacity: {tseat}</h1>
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Customer Name*
              </label>
              <input
                type="text"
                onChange={handelChange}
                value={formData.customer_name}
                name="customer_name"
                placeholder="Customer Name"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email Address*
              </label>
              <input
                type="text"
                onChange={handelChange}
                value={formData.customer_email}
                name="customer_email"
                placeholder="Customer E-mail"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Mobile*
              </label>
              <input
                type="number"
                onChange={handelChange}
                value={formData.customer_mobile}
                name="customer_mobile"
                placeholder="Mobile Number"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Booking Date*
              </label>
              <input
                type="date"
                onChange={handelChange}
                value={formData.reserveday}
                name="reserveday"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Start Time
              </label>
              <input
                type="time"
                onChange={handelChange}
                value={formData.formtime}
                name="formtime"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                End Time
              </label>
              <input
                type="time"
                onChange={handelChange}
                value={formData.totime}
                name="totime"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>

            <div className="flex mt-4 float-right gap-x-3">
              <HasPermission module="Add Booking" action="delete">
                <button
                  className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                  type="reset"
                >
                  Reset
                </button>
              </HasPermission>
              <HasPermission module="Add Booking" action="create">
                <button
                  className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                  type="submit"
                >
                  Book
                </button>
              </HasPermission>
            </div>
          </form>
        </div>
      </DialogBoxSmall>
    </>
  );
};
export default AddBooking;
