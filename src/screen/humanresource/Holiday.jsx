import React, { useState, useEffect, useRef, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { toast } from "react-toastify";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoIosAddCircleOutline } from "react-icons/io";
import CategoryDialogBox from "../../components/CategoryDialogBox";
import { AuthContext } from "../../store/AuthContext";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";

const headers = [
  "SL.",
  "Holiday Name",
  "From",
  "To",
  "Numner of Days",
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

const Holiday = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [searchName, setSearchName] = useState("");
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [holiday, setHoliday] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const holidayNameRef = useRef(null);
  const startDateRef = useRef(null);
  const endDateRef = useRef(null);
  const noOfDaysRef = useRef(null);

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const initialFormData = {
    holiday_name: "",
    start_date: "",
    end_date: "",
    no_of_days: "",
  };

  const [formdata, setFormdata] = useState(initialFormData);
  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validation: Check if any of the required fields are missing
    if (!formdata.holiday_name) {
      toast.warning("Please fill the holiday name");
      holidayNameRef.current.focus();
      return;
    }

    if (!formdata.start_date) {
      toast.warning("Please fill the start date");
      startDateRef.current.focus();
      return;
    }

    if (!formdata.end_date) {
      toast.warning("Please fill the end date");
      endDateRef.current.focus();
      return;
    }

    if (!formdata.no_of_days) {
      toast.warning("Please fill the number of days");
      noOfDaysRef.current.focus();
      return;
    }

    // Data to be sent to the API
    const data = {
      holiday_name: formdata.holiday_name,
      start_date: formdata.start_date,
      end_date: formdata.end_date,
      no_of_days: formdata.no_of_days,
    };

    axios
      .post(`${API_BASE_URL}/addholiday`, data, {
        headers: { Authorization: token },
      })
      .then((res) => {
        console.log("Holiday added successfully");
        toast.success("Holiday added successfully");
        setFormdata(initialFormData); // Reset the form
        getallholiday(); // Fetch updated holidays list
        setIsModalOpen(false); // Close modal
      })
      .catch((error) => {
        console.log(error);
        toast.error("Error in adding holiday data.");
      });
  };

  const getallholiday = async () => {
    await axios
      .get(`${API_BASE_URL}/allholidays`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        setHoliday(res.data.data);
        console.log("data recive hua", division);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getallholiday();
      return;
    }

    axios
      .get(`${API_BASE_URL}/allholidays`, {
        params: { searchItem: value },
        headers: { Authorization: token },
      })
      .then((res) => {
        setHoliday(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  //delete

  const handleDeleteClick = (id) => {
    setDeleteModalId(id);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setDeleteModalId(null);
  };

  const handleModalDelete = () => {
    DeleteHoliday(deleteModalId);
    handleModalClose();
  };
  const DeleteHoliday = (id) => {
    axios
      .delete(`${API_BASE_URL}/deleteholiday/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Holiday sucessfully..");
        getallholiday();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //edit
  const [formData2, setFormData2] = useState({
    holiday_name: "",
    start_date: "",
    end_date: "",
    no_of_days: "",
   created_by:""
  });
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen2(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/holiday/${id}`).then((response) => {
      setFormData2({
        holiday_name: response.data.data.holiday_name,
        start_date: response.data.data.start_date,
        end_date: response.data.data.end_date,
        no_of_days: response.data.data.no_of_days,
        created_by:response.data.data.created_by
      });
    });
  };
  const handleChange2 = (e) => {
    setFormData2({
      ...formData2,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit2 = (e) => {
  e.preventDefault();

  // Validation checks
  if (!formData2.holiday_name.trim()) {
    toast.error("Please enter Holiday Name.");
    return;
  }
  if (!formData2.start_date) {
    toast.error("Please select Holiday From date.");
    return;
  }
  if (!formData2.end_date) {
    toast.error("Please select Holiday To date.");
    return;
  }
  if (!formData2.no_of_days || formData2.no_of_days <= 0) {
    toast.error("Please enter a valid Number of Days.");
    return;
  }

  axios
    .put(`${API_BASE_URL}/updateholiday/${editId}`, formData2, {
      headers: { Authorization: token },
    })
    .then(() => {
      toast.success("Updated Successfully!");
      getallholiday();
      setIsModalOpen2(false); // Close the modal after submission
    })
    .catch((error) => {
      console.error("Error updating data:", error);
      toast.error("Something went wrong while updating holiday.");
    });
};


  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(holiday.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/allholidays`,{
        headers:{
          Authorization: token
        }
      });
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
      // Map your data structure as needed

      Holiday_Name: item.holiday_name,
      Start_Date: new Date(item.start_date).toLocaleDateString(),
      End_Date: new Date(item.end_date).toLocaleDateString(),
      No_Of_Days: item.no_of_days,
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
      { header: "Holoday Name", key: "Holoday_Name" },
      { header: "Start Date", key: "Start_Date" },
      { header: "End Date", key: "End_Date" },
      { header: "Number Of Days", key: "Number_Of_Days" },
  
    ];
    
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        Holoday_Name: item.holiday_name,
        Start_Date: new Date(item.start_date).toLocaleDateString(),
        End_Date:new Date(item.end_date).toLocaleDateString(),
        Number_Of_Days: item.no_of_days,
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
      item.holiday_name,
      new Date(item.start_date).toLocaleDateString(),
      new Date(item.end_date).toLocaleDateString(),
      item.no_of_days,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc,{
      head: [["Holoday Name", "Start Date","End Date","Number Of Days"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getallholiday();
  }, []);
  return (
    <>
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
              <h1 className=" font-semibold mb-3">All Holidays List</h1>

              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>
              <HasPermission module="Holiday" action="create">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
             gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Holidays
                </button>
              </HasPermission>
            </div>
            <div className=" mt-11  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5  gap-y-5  ">
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-900 pr-1">Display</label>
                    <div className="relative flex items-baseline border-[1px] border-[#4CBBA1] p-1 rounded">
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
                      placeholder="Search ..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
                    <button className="px-4 text-[#0f044a] text-sm">
                      <FaMagnifyingGlass />
                    </button>
                  </div>
                </div>
              </section>
            </div>

            <section className="tabledata">
              <div className="w-full mt-10 drop-shadow-md">
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
                    {holiday && holiday.length > 0 ? (
                      holiday
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
                              {row.holiday_name ? row.holiday_name : "No  Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.start_date ? row.start_date : "No  Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.end_date ? row.end_date : "No  Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.no_of_days ? row.no_of_days : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission module="Holiday" action="edit">
                                  <Tooltip
                                    message="Edit"
                                    key={row.payrl_holi_id}
                                  >
                                    <button
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      onClick={() =>
                                        handleEditClick(row.payrl_holi_id)
                                      }
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission module="Holiday" action="delete">
                                  <Tooltip message="Delete">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.payrl_holi_id)
                                        }
                                      >
                                        <FaRegTrashCan />
                                      </button>
                                    </div>
                                  </Tooltip>
                                </HasPermission>
                              </div>
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4">
                          No Data Found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="flex justify-between mt-7">
              {holiday && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(holiday.length / itemsPerPage))].map(
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
                        currentPage === Math.ceil(holiday.length / itemsPerPage)
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

      <CategoryDialogBox
        title={"Add New Holiday"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
       <div className="max-w-lg mx-auto p-6 bg-white rounded-lg ">
  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col">
        <label
          className="text-gray-700 font-semibold mb-1"
          htmlFor="holiday_name"
        >
          Holiday Name*
        </label>
        <input
          value={formdata.holiday_name}
          onChange={handleChange}
          name="holiday_name"
          placeholder="Enter Holiday Name"
          className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
          id="holiday_name"
          ref={holidayNameRef}
        />
      </div>

      <div className="flex flex-col">
        <label
          className="text-gray-700 font-semibold mb-1"
          htmlFor="start_date"
        >
          Holiday From*
        </label>
        <input
          value={formdata.start_date}
          onChange={handleChange}
          className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
          type="date"
          name="start_date"
          id="start_date"
          ref={startDateRef}
        />
      </div>

      <div className="flex flex-col">
        <label
          className="text-gray-700 font-semibold mb-1"
          htmlFor="end_date"
        >
          Holiday To*
        </label>
        <input
          value={formdata.end_date}
          onChange={handleChange}
          className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
          type="date"
          name="end_date"
          id="end_date"
          ref={endDateRef}
        />
      </div>

      <div className="flex flex-col">
        <label
          className="text-gray-700 font-semibold mb-1"
          htmlFor="no_of_days"
        >
          Number of Days*
        </label>
      <input
          value={formdata.no_of_days}
          onChange={handleChange}
          name="no_of_days"
          type="number"
          max={365}
          min={1}
          placeholder="0"
          className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
          id="no_of_days"
          ref={noOfDaysRef}
        />
      </div>
    </div>

    <div className="flex justify-end">
      <button
        type="submit"
        className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md hover:bg-[#1A1B2E] transition duration-200"
      >
        Save
      </button>
    </div>
  </form>
</div>
      </CategoryDialogBox>

      {isModalOpen2 && (
       <>
       <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
         <div className="w-full max-w-lg px-4"> {/* Set a max width for the modal */}
           <div className="py-6 bg-white rounded-lg shadow-md border border-gray-300">
             <div className="flex py-4 px-4 justify-between items-center border-b border-gray-300">
               <h2 className="text-xl font-semibold">Edit Holiday</h2>
               <button
                 onClick={() => setIsModalOpen2(false)}
                 className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-sm transition duration-200"
               >
                 X
               </button>
             </div>
             <div className="p-4">
               <form onSubmit={handleSubmit2} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                   <div className="flex flex-col">
                     <label
                       className="text-gray-700 font-semibold mb-1"
                       htmlFor="holiday_name"
                     >
                       Holiday Name*
                     </label>
                     <input
                       value={formData2.holiday_name}
                       onChange={handleChange2}
                       name="holiday_name"
                       placeholder="Enter Holiday Name"
                       className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                       id="holiday_name"
                       ref={holidayNameRef}
                     />
                   </div>
     
                   <div className="flex flex-col">
                     <label
                       className="text-gray-700 font-semibold mb-1"
                       htmlFor="start_date"
                     >
                       Holiday From*
                     </label>
                     <input
                       value={formData2.start_date}
                       onChange={handleChange2}
                       className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                       type="date"
                       name="start_date"
                       id="start_date"
                       ref={startDateRef}
                     />
                   </div>
     
                   <div className="flex flex-col">
                     <label
                       className="text-gray-700 font-semibold mb-1"
                       htmlFor="end_date"
                     >
                       Holiday To*
                     </label>
                     <input
                       value={formData2.end_date}
                       onChange={handleChange2}
                       className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                       type="date"
                       name="end_date"
                       id="end_date"
                       ref={endDateRef}
                     />
                   </div>
     
                   <div className="flex flex-col">
                     <label
                       className="text-gray-700 font-semibold mb-1"
                       htmlFor="no_of_days"
                     >
                       Number of Days*
                     </label>
                     <input
                       value={formData2.no_of_days}
                       onChange={handleChange2}
                       name="no_of_days"
                       type="number"
                       placeholder="0"
                       className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                       id="no_of_days"
                       ref={noOfDaysRef}
                     />
                   </div>
                 </div>
     
                 <div className="flex justify-end mt-6">
                   <button
                     type="submit"
                     className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md hover:bg-[#1A1B2E] transition duration-200"
                   >
                     Save
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       </div>
       <div className="opacity-50 fixed inset-0 z-40 bg-gray-800"></div>
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

export default Holiday;
