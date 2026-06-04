import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { AuthContext } from "../../store/AuthContext";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";
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
const DeleteModal = ({ show, onClose, onDelete,type }) => {
  if (!show) {
    return null;
  }
  return (
    <div
  className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
  onClick={onClose} // Close when clicking outside
>
  <div
    className="bg-white rounded-lg p-6 w-1/3 border-[2px] border-[#4CBBA1] shadow-lg"
    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
  >
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Delete {type}
      </h2>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this {type}?
      </p>
      <div className="flex gap-x-3 justify-center items-center">
        <button
          onClick={onDelete}
          className="bg-[#FB3F3F] text-white px-6 py-2 rounded-md text-lg"
        >
          OK
        </button>
        <button
          onClick={onClose}
          className="bg-gray-400 text-white px-6 py-2 rounded-md text-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>

  );
};

const AddOns = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const ActionButtons = [
    { btn: "Copy" },
    { btn: "CSV" },
    { btn: "Excel" },
    { btn: "PDF" },
    { btn: "Column Visibility" },
  ];
  const headers = ["SL.", "Add On Name", "Price", "Status", "Action"];
  const [data, setData] = useState([]);
  const [isOpen, setOpen] = useState(true);
  const initialFormData = {
    add_on_name: "",
    price: "",
    is_active: 1,
  };
  const token = localStorage.getItem("token");
const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryID, setSelectedCategoryID] = useState(null);
  const [formData, setFormData] = useState(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [addOnName, setaddOnName] = useState("");
  const [price, setPrice] = useState("");
  const [isActive, setIsActive] = useState("");
  const [searchName, setSearchName] = useState("");

  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsEditModalOpen(false);

        setShowModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDeleteClick = (CategoryID) => {
    setSelectedCategoryID(CategoryID);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedCategoryID(null);
  };

  const handleModalDelete = () => {
    deleteCategory(selectedCategoryID);
    handleModalClose();
  };

  const [currentAddOns, setCurrentAddOns] = useState({
    add_on_id: "",
    add_on_name: "",
    price: "",
    is_active: "",
    created_by:""
  });
  // Handle edit button click
  const handleEditClick = (id) => {
    setIsEditModalOpen(true);
    axios.get(`${API_BASE_URL}/addonbyid/${id}`).then((response) => {
      const data = response.data.data[0];
      // Set current add-on details to auto-fill the form
      setCurrentAddOns({
        add_on_id: data.add_on_id,
        add_on_name: data.add_on_name,
        price: data.price,
        is_active: data.is_active,
        created_by:data.created_by
      });
    });
  };

 const updateAddOn = async (add_on_Id) => {
  // Basic validation before API call
  if (!currentAddOns.add_on_name || !currentAddOns.add_on_name.trim()) {
    toast.error("Add-On Name is required");
    return;
  }
  if (!currentAddOns.price || !currentAddOns.price.trim()) {
    toast.error("Price is required");
    return;
  }

  try {
    await axios.put(`${API_BASE_URL}/addons/${add_on_Id}`, {
      add_on_name: currentAddOns.add_on_name.trim(),
      price: currentAddOns.price.trim(),
      is_active: currentAddOns.is_active,
      created_by: currentAddOns.created_by
    });
    toast.success("Add-On updated successfully");
    setIsEditModalOpen(false);
    getAddOnData();
  } catch (error) {
    console.error("Error updating Add-On:", error);
    toast.error("Failed to update Add-On. Please try again.");
  }
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.add_on_name) {
      toast.error("Add One Name is required");
      return;
    }
    if (!formData.price) {
      toast.error("Add One Price is required");
      return;
    }
    try {
      const res = await axios.post(`${API_BASE_URL}/addons`, formData,{
        headers:{
          Authorization: token
        }
      });
      console.log(res);

      toast.success("Add-ons added successfully");
      setFormData(initialFormData);
      getAddOnData();
    } catch (error) {
      console.error("Error", error);
    }
  };

  const getAddOnData = () => {
    axios
      .get(`${API_BASE_URL}/addons`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        console.log(res.data);
        setData(res.data.data);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // filter data
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getAddOnData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/addons`, {
        params: { searchItem: value },
        headers:{
          Authorization: token
        }
      
      })
      .then((res) => {
        setData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  const deleteCategory = (CategoryID) => {
    axios
      .delete(`${API_BASE_URL}/addons/${CategoryID}`)
      .then((res) => {
        console.log(res.data);
        toast.success("Delete add on Sucessfully");
        getAddOnData();
      })
      .catch((err) => {
        console.error("Error deleting category:", err);
      });
  };

  const selectPage = (page) => {
    const totalPages = Math.ceil(data.length / itemsPerPage);
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/addons`);
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

      Add_On_Name: item.add_on_name ? `${item.add_on_name}` : "No add on Found",
      Price: item.price,
      Status: item.is_active === 1 ? "Active" : "Not active",
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
      { header: "Add On Name", key: "add_on_name" },
      { header: "Price", key: "price" },
      { header: "Status", key: "status" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        add_on_name: item.add_on_name
          ? `${item.add_on_name}`
          : "No add on Found",
        price: item.price,
        status: item.is_active === 1 ? "Active" : "Not active",
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
      item.add_on_name ? `${item.add_on_name}` : "No add on Found",
      item.price,
      item.is_active === 1 ? "Active" : "Not active",
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
  autoTable(doc,{
      head: [["Add On Name", "Price", "Status"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getAddOnData();
  }, []);
  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : ""}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Add Ons
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
                </div>
            </div>

            <div className="  mt-11 border-[1px] border-[#4CBBA1] bg-white p-8 rounded-sm">
              <form
                action=""
                className=" flex justify-between items-center"
                onSubmit={handleSubmit}
              >
                <div>
                  <div className="mb-4 flex   justify-between gap-x-5">
                    <label
                      className=" m-auto text-nowrap text-gray-700  font-semibold mb-2"
                      htmlFor="categoryName"
                    >
                      Add One Name*
                    </label>
                    <input
                      name="add_on_name"
                      type="text"
                      value={formData.add_on_name}
                      onChange={handleChange}
                      placeholder="Add One Name"
                      className="shadow border border-[#4CBBA1] w-[300px] rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                    />
                  </div>

                  <div className="mb-4 flex   justify-between gap-x-5  items-center">
                    <label
                      className=" m-auto text-nowrap text-gray-700   font-semibold mb-2"
                      htmlFor="categoryName"
                    >
                      Price*
                    </label>
                    <input
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      type="number"
                      min={1}
                      placeholder="Price"
                      className="shadow border border-[#4CBBA1]  w-[300px] rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-4 flex   justify-between gap-x-5  items-center">
                    <label
                      className=" m-auto text-nowrap text-gray-900   font-semibold mb-2"
                      htmlFor="categoryName"
                    >
                      Status
                    </label>
                    <select
                      value={formData.is_active}
                      onChange={handleChange}
                      name="is_active"
                      className="shadow border border-[#4CBBA1] w-[300px]  rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>

                  <div className=" flex  ml-16 space-x-4">
                    <HasPermission module="Add Ons" action="delete">
                      <button
                        type="reset"
                        className="w-[104px] h-[42px] bg-[#4CBBA1] text-gray-50 rounded-md"
                      >
                        Reset
                      </button>
                    </HasPermission>
                    <HasPermission module="Add Ons" action="create">
                      <button
                        type="submit"
                        className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md"
                      >
                        Save
                      </button>
                    </HasPermission>
                  </div>
                </div>
              </form>
            </div>
            <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
              <div className="activtab flex justify-between">
                <h1 className=" flex items-center justify-center gap-1 font-semibold">
                  Add On List
                </h1>
              </div>
              {/* Search Bar */}
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
                    <div className="flex m-auto px-4 rounded-md border-[1px]  border-gray-900">
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
                                  {row.add_on_name}
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  {row.price}
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  {row.is_active === 1 ? "Active" : "Inactive"}
                                </td>

                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <div className="flex justify-center gap-x-2 font-bold">
                                    <HasPermission
                                      module="Add Ons"
                                      action="edit"
                                    >
                                      <Tooltip message="Edit">
                                        <button
                                          onClick={() =>
                                            handleEditClick(row.add_on_id)
                                          }
                                          className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                        >
                                          <FaRegEdit />
                                        </button>
                                      </Tooltip>
                                    </HasPermission>
                                    <HasPermission
                                      module="Add Ons"
                                      action="delete"
                                    >
                                      {" "}
                                      <Tooltip message="Delete">
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(row.add_on_id)
                                          }
                                          className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        >
                                          <FaRegTrashCan />
                                        </button>
                                      </Tooltip>
                                    </HasPermission>
                                  </div>
                                </td>
                              </tr>
                            ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="py-2 px-4 text-center">
                              No results found
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
          {/* Previous Button */}
          <button
            onClick={() => selectPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          {/* Page Number Buttons */}
          {[...Array(Math.ceil(data.length / itemsPerPage))].map((_, index) => (
            <button
              onClick={() => selectPage(index + 1)}
              key={index}
              className={`h-[46px] w-[50px] cursor-pointer border-[1px] border-[#1C1D3E] ${
                currentPage === index + 1 ? "bg-[#1C1D3E] text-white" : ""
              }`}
            >
              {index + 1}
            </button>
          ))}

          {/* Next Button */}
          <button
            onClick={() => selectPage(currentPage + 1)}
            disabled={currentPage === Math.ceil(data.length / itemsPerPage)}
            className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    )}
  </div>

            </div>
          </div>
        </section>
      </div>
      {isEditModalOpen && (
       <>
       <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
         <div className="w-96 p-6"> {/* Reduced width to 24rem (96) */}
           <div className="py-4 bg-white rounded-md shadow-md border border-[#1C1D3E]">
             <div className="flex py-3 px-4 justify-between items-center border-b border-gray-300">
               <h2 className="text-lg font-semibold">Edit Add-on</h2>
               <button
                 onClick={() => setIsEditModalOpen(false)}
                 className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold rounded"
               >
                 X
               </button>
             </div>
             <div className="p-6">
               <form
                 onSubmit={(e) => {
                   e.preventDefault();
                   updateAddOn(currentAddOns.add_on_id);
                 }}
               >
                 <div className="mb-4">
                   <label className="block mb-1">Add-On Name*</label>
                   <input
                     type="text"
                     value={currentAddOns.add_on_name}
                     onChange={(e) =>
                       setCurrentAddOns({
                         ...currentAddOns,
                         add_on_name: e.target.value,
                       })
                     }
                     className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1C1D3E]"
                   />
                 </div>
                 <div className="mb-4">
                   <label className="block mb-1">Price*</label>
                   <input
                     type="text"
                     value={currentAddOns.price}
                     onChange={(e) =>
                       setCurrentAddOns({
                         ...currentAddOns,
                         price: e.target.value,
                       })
                     }
                     className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1C1D3E]"
                   />
                 </div>
                 <div className="mb-4">
                   <label className="block mb-1">Status</label>
                   <select
                     value={currentAddOns.is_active}
                     onChange={(e) =>
                       setCurrentAddOns({
                         ...currentAddOns,
                         is_active: e.target.value,
                       })
                     }
                     className="w-full p-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#1C1D3E]"
                   >
                     <option value="">Select Option</option>
                     <option value="1">Active</option>
                     <option value="0">Inactive</option>
                   </select>
                 </div>
                 <div className="flex justify-end">
                   <button
                     type="submit"
                     className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md hover:bg-[#FB3F3F] transition duration-200"
                   >
                     Update
                   </button>
                 </div>
               </form>
             </div>
           </div>
         </div>
       </div>
       <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
     </>
      )}
     <DeleteModal
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
        type={"Add-on"}
      />
    </>
  );
};

export default AddOns;
