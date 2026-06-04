import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import { FaRegEdit } from "react-icons/fa";
import Papa from "papaparse";
import ExcelJS from "exceljs";

import useFullScreen from "../../components/useFullScreen";
import jsPDF from "jspdf";
import { AuthContext } from "../../store/AuthContext";
import autoTable from "jspdf-autotable";
import { FaRegTrashCan } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
const headers = [
  "SL.",
  "Customer Name",

  "Table No.",
  "Person",
  "Start Time",
  "End Time",
  "Booking Date",

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
const Reservation = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const { token, userId } = useContext(AuthContext);
const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [searchName, setSearchName] = useState("");
  const [errors, setErrors] = useState({});
  
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  // get all data

  const validateForm = () => {
  const newErrors = {};
  
  if (!formData2.customer_name.trim()) {
    newErrors.customer_name = "Customer name is required";
  }
  if (!formData2.customer_email.trim()) {
    newErrors.customer_email = "Customer email is required";
  }
  
  if (!formData2.customer_mobile.trim()) {
    newErrors.customer_mobile = "Mobile number is required";
  }
  if (!formData2.reserveday) {
    newErrors.reserveday = "Booking date is required";
  }
  if (!formData2.formtime) {
    newErrors.formtime = "Start time is required";
  }
  if (!formData2.totime) {
    newErrors.totime = "End time is required";
  }
  
  setErrors(newErrors);
  return Object.keys(newErrors).length === 0;
};
 const getReservationData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/reservation`, {
      headers: {
        authorization: token,
      },
    });
    console.log(response.data);
    setData(response.data.data);
  } catch (error) {
    toast.error("Can't get data");
    console.error(error);
  }
};

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getReservationData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/reservation`, {
        params: { searchItem: value },
          headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };
  // delete

  const handleDeleteClick = (id) => {
    setDeleteModalId(id);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setDeleteModalId(null);
  };

  const handleModalDelete = () => {
    DeleteUnit(deleteModalId);
    handleModalClose();
  };
  const DeleteUnit = (id) => {
    axios
      .delete(`${API_BASE_URL}/reservation/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("delete sucessfully..");
        getReservationData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData2, setFormData2] = useState({
    customer_name: "",
    customer_email: "",
    customer_mobile: "",
    reserveday: "",
    formtime: "",
    totime: "",
    tablename: "",
    person_capacity: "",
    created_by: "",
  });

  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);

    // Fetch data for the given ID
    axios
      .get(`${API_BASE_URL}/reservation/${id}`)
      .then((response) => {

        const data = response.data.data; // Assuming the data structure you shared

        // Parse the date to get the format compatible with the date input (YYYY-MM-DD)
        const parsedDate = data.date ? new Date(data.date).toISOString().split("T")[0] : "";

        // Auto-fill form with fetched data
        setFormData2({
          customer_name: data.customer_name || "",
          customer_email: data.customer_email || "",
          customer_mobile: data.customer_phone || "",
          reserveday: parsedDate || "",
          formtime: data.start_time || "",
          totime: data.end_time || "",
          tablename: data.tablename || "",
          person_capacity: data.person_capicity || "",
          created_by: data.created_by || "",
        });
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  // Handle form field changes
  const handleChange2 = (e) => {
    setFormData2({
      ...formData2,
      [e.target.name]: e.target.value,
    });
  };

  // Handle form submission
  const handleSubmit2 = (e) => {
    e.preventDefault();
      if (!validateForm()) {
    return; 
  }
    console.log(formData2)
    axios
      .put(`${API_BASE_URL}/reservationbook/${editId}`, formData2)
      .then(() => {
        toast.success("Customer details updated successfully!");
        getReservationData(); // Refresh reservation data if needed
       
        setIsModalOpen(false); // Close modal after update
      })
      .catch((error) => {
        console.error("Error updating data:", error);
          const errorMessage =
                    error.response && error.response.data && error.response.data.message
                      ? error.response.data.message
                      : "Error in updating data";
                      
                  toast.error(errorMessage);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/reservation`);
      return response.data.data; // Assuming the data you need is in `response.data.data`
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // Rethrow the error to handle it in the calling function if needed
    }
  };

  const handleDownload = async (type) => {
    const data = await fetchData();

    if (type === "csv") downloadCSV(data);
    else if (type === "excel") downloadExcel(data);
    else if (type === "pdf") downloadPDF(data);
  };
  // download for CSV file..
  const downloadCSV = async () => {
    const data = await fetchData(); // Fetch data
    const csvData = data.map((item) => ({
    
      Customer_Name: item.customer_name,
      Table_Name: item.tablename,
      Capicity: item.person_capicity,
      Date:  new Date(item.date).toLocaleDateString(),
      Start_Time:item.start_time,
      End_Time:item.end_time,
    }));

    const csvString = Papa.unparse(csvData);
    const blob = new Blob([csvString], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "data.csv"; // CSV file name
    a.click();
    window.URL.revokeObjectURL(url);
  };


  // download for EXCEL
  const downloadExcel = async () => {
    const data = await fetchData(); // Fetch your data

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Define the columns and map headers
    worksheet.columns = [
      { header: "Customer Name", key: "customer_name" },
      { header: "Table_Name", key: "table_Name" },
      { header: "Capicity", key: "capicity" },
      { header: "Booking Date", key: "date" },
      { header: "Start_Time", key: "start_time" },
      { header: "End_Time", key: "end_time" },
    ];


   

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        customer_name: item.customer_name,
        table_Name: item.tablename,
        capicity: item.person_capicity,
        date:new Date(item.date).toLocaleDateString(),
        start_time: item.start_time,
        end_time: item.end_time,
      });
    });

    // Create and download the file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.xlsx";
    a.click();
    window.URL.revokeObjectURL(url);
  };


  
  // download for PDF

  const downloadPDF = async () => {
    const data = await fetchData(); // Fetch data
    const doc = new jsPDF();

    // Map the data to rows for the PDF
    const rows = data.map((item) => [
      item.customer_name,
      item.tablename,
      item.person_capicity,
      new Date(item.date).toLocaleDateString(),
      item.start_time,
      item.end_time,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc,{
      head: [
        [
          "Customer Name",
          "Table Name",
          "Capicity ",
          "Date",
          "Start Time",
          "End Time",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };










  useEffect(() => {
    getReservationData();
  }, []);

  const navigate = useNavigate();
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
                Reservation List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>

            <div className=" flex justify-between mt-11">
              <span></span>
              <HasPermission module="All Reservations" action="create">

              <button
                onClick={() => {
                  navigate("/add-booking");
                }}
                className=" bg-[#4CBBA1] h-[46px] w-[165px] text-wrap rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
              >
                <IoIosAddCircleOutline className=" font-semibold text-lg" />
                Take A Reservation
              </button>
              </HasPermission>
            </div>
            {/* Search Bar */}

            <div className=" mt-11  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5  gap-y-5  ">
                  <div className="flex items-center space-x-2 ">
                    <label className="text-gray-900 pr-1">Display</label>
                    <div className="relative flex  items-baseline border-[1px] border-[#4CBBA1] p-1 rounded">
                      <h1>05 X</h1>
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="appearance-none w-16 pl-3 pr-8 py-1 rounded-md text-gray-700 focus:outline-none"
                      >
                        <option value={5}>5</option>
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-700"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          ></path>
                        </svg>
                      </div>
                    </div>
                    <h1>Records per page</h1>
                  </div>

                 <div className="w-full sm:w-auto flex gap-x-4 downloadbutton">
                    <button
                      onClick={() => handleDownload("csv")}
                      className="hover:bg-[#1C1D3E] text-[#000] hover:scale-110 duration-300 hover:text-white border-[2px] border-zinc-300 rounded-md py-2 px-11 w-full sm:w-auto"
                    >
                      {" "}
                      CSV
                    </button>
                    <button
                      onClick={() => handleDownload("excel")}
                      className="hover:bg-[#1C1D3E] text-[#000] hover:scale-110 duration-300 hover:text-white border-[2px] border-zinc-300 rounded-md py-2 px-11 w-full sm:w-auto"
                    >
                      {" "}
                      Excel
                    </button>
                    <button
                      onClick={() => handleDownload("pdf")}
                      className="hover:bg-[#1C1D3E] text-[#000] hover:scale-110 duration-300 hover:text-white border-[2px] border-zinc-300 rounded-md py-2 px-11 w-full sm:w-auto"
                    >
                      {" "}
                      PDF
                    </button>
                  </div>

                  <div className="flex m-auto px-4 rounded-md border-[1px]   border-gray-900">
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search menu..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
                    <button
                      // onClick={handleSearch}
                      className="px-4 text-[#0f044a] text-sm"
                    >
                      <FaMagnifyingGlass />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section className="tabledata">
              <div className="w-full mt-10 drop-shadow-md">
                <div>
                  <table className="min-w-full bg-white text-center">
                    <thead>
                      <tr>
                        {headers.map((header, index) => (
                          <th
                            key={index}
                            className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.length > 0 ? (
                        data
                          .slice(
                            (currentPage - 1) * itemsPerPage,
                            currentPage * itemsPerPage
                          )
                          .map((row, index) => (
                            <tr key={index}>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {index + 1}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.customer_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.tablename}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.person_capicity}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.start_time}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.end_time}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.date
  ? (() => {
      const date = new Date(row.date);
      const yyyy = date.getUTCFullYear();
      const mm = String(date.getUTCMonth() + 1).padStart(2, '0');
      const dd = String(date.getUTCDate()).padStart(2, '0');
      return `${dd}/${mm}/${String(yyyy).slice(-2)}`;
    })()
  : "No date"}

                              </td>
 
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">

                                  <HasPermission module="All Reservations" action="edit">
                                  <Tooltip message="Edit">
                                    <button
                                      onClick={() =>
                                        handleEditClick(row.reserveid)
                                      }
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                  </HasPermission>
                                  <HasPermission module="All Reservations" action="delete"> <Tooltip message="Clear Booking">
                                    <button
                                      onClick={() =>
                                        handleDeleteClick(row.reserveid)
                                      }
                                      className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegTrashCan />
                                    </button>
                                  </Tooltip></HasPermission>
                                 
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="py-2 px-4 text-center">
                            No Data found related to this table.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <div className="flex justify-between mt-7">
              {data.length > 0 && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(data.length / itemsPerPage))].map(
                      (_, index) => {
                        return (
                          <button
                            onClick={() => selectPage(index + 1)}
                            key={index}
                            className={`h-[46px] w-[50px] cursor-pointer border-[1px] border-[#1C1D3E] ${
                              currentPage === index + 1
                                ? "bg-[#1C1D3E] text-white"
                                : ""
                            }`}
                          >
                            {index + 1}
                          </button>
                        );
                      }
                    )}
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={
                        currentPage === Math.ceil(data.length / itemsPerPage)
                      }
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>

      {isModalOpen && (
  <>
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-auto">
      <div className="w-1/3 p-4">
        <div className="bg-white rounded-md shadow-md border border-[#1C1D3E]">
          {/* Modal Header */}
          <div className="flex justify-between items-center px-4 py-3 border-b border-black">
            <h2 className="text-lg font-semibold">Edit Reservation</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="bg-red-500 text-white font-bold px-2 rounded hover:scale-105"
            >
              X
            </button>
          </div>

          {/* Modal Content */}
          <form onSubmit={handleSubmit2} className="px-4 py-5 space-y-5">
            {/* Table Info */}
            <div className="flex justify-between text-sm font-medium text-gray-800">
              <p>Table: {formData2.tablename}</p>
              <p>Capacity: {formData2.person_capacity}</p>
            </div>

            {/* Customer Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData2.customer_name}
                  onChange={handleChange2}
                  placeholder="Name"
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                  
                />
                  {errors.customer_name && (
    <p className="text-red-500 text-xs mt-1">{errors.customer_name}</p>
  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData2.customer_email}
                  onChange={handleChange2}
                  placeholder="Email"
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                />
                  {errors.customer_email && (
    <p className="text-red-500 text-xs mt-1">{errors.customer_email}</p>
  )}
              </div>
            </div>

            {/* Mobile & Date */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mobile</label>
                <input
                  type="number"
                  name="customer_mobile"
                  value={formData2.customer_mobile}
                  onChange={handleChange2}
                  placeholder="Mobile"
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                />
                 {errors.customer_mobile && (
    <p className="text-red-500 text-xs mt-1">{errors.customer_mobile}</p>
  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Booking Date</label>
                <input
                  type="date"
                  name="reserveday"
                  value={formData2.reserveday}
                  onChange={handleChange2}
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                />
                  {errors.reserveday && (
    <p className="text-red-500 text-xs mt-1">{errors.reserveday}</p>
  )}
              </div>
            </div>

            {/* Time Info */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  name="formtime"
                  value={formData2.formtime}
                  onChange={handleChange2}
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                />
                     {errors.formtime && (
    <p className="text-red-500 text-xs mt-1">{errors.formtime}</p>
  )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  name="totime"
                  value={formData2.totime}
                  onChange={handleChange2}
                  className="w-full px-2 py-1 border border-[#4CBBA1] rounded text-gray-700 focus:outline-none"
                />
                   {errors.totime && (
    <p className="text-red-500 text-xs mt-1">{errors.totime}</p>
  )}  
              </div>
            </div>

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
             
              <button
                type="submit"
                className="p-2 bg-[#1C1D3E] text-white rounded hover:opacity-90"
              >
               Update Booking
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    <div className="fixed inset-0 z-40 bg-slate-800 opacity-60"></div>
  </>
)}

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </>
  );
};

export default Reservation;
