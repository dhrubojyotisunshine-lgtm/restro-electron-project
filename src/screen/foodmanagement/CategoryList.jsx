import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import * as XLSX from "xlsx";
import { toast } from "react-toastify";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoIosAddCircleOutline } from "react-icons/io";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import CategoryDialogBox from "../../components/CategoryDialogBox";
import EditDialogBox from "../../components/EditDialogBox";
import HasPermission from "../../store/HasPermission";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../store/AuthContext";
import Papa from "papaparse";
import ExcelJS from "exceljs";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";

const headers = [
  "SL.",
  "Image",
  "Category Name ",
  "parent Menu",
  "Status",
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
// delete category modal
const DeleteModal = ({ show, onClose, onDelete, type }) => {
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
const CategoryList = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const token = localStorage.getItem("token");
  const [data, setData] = useState([]);
  const [dataa, setDataa] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedCategoryID, setSelectedCategoryID] = useState(null);
  const [editId, setEditId] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchName, setSearchName] = useState("");
  const navigate = useNavigate();
  const [kitchenData, setKitchenData] = useState([]);

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setShowModal(false);
        setIsModalOpen(false);
        setEditModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const handleDeleteClick = (CategoryID) => {
    setSelectedCategoryID(CategoryID);
    setShowModal(true);
  };
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedCategoryID(null);
  };

  const handleModalDelete = () => {
    deleteCategory(selectedCategoryID);
    handleModalClose();
  };

  const initialFormData = {
    name: "",
    parentid: "",
    offerstartdate: "",
    offerendate: "",
    status: 1,
  };

  const currentFormData = {
    name: "",
    parentid: "",
    offerstartdate: "",
    offerendate: "",
    status: 1,
    isoffer: false,
    UserIDInserted: "",
  };

  // Form data
  const [formdata, setFormdata] = useState(initialFormData);
  const [formdata1, setFormdata1] = useState(currentFormData);

  const handleEditClick = (id) => {
    setEditId(id);
    setEditModal(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/data/${id}`).then((response) => {
      setFormdata1({
        name: response.data.data.Name,
        parentid: response.data.data.parentid,
        offerstartdate: response.data.data.offerstartdate,
        offerendate: response.data.data.offerendate,
        status: response.data.data.CategoryIsActive,
        isoffer: response.data.data.isoffer,
        UserIDInserted: response.data.data.UserIDInserted,
        kitchen_id: response.data.data.kitchen_id,
      });
    });
  };

  // File
  const [file, setFile] = useState(null);
  const handleImageChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleImageChange2 = (e) => {
    setFile(e.target.files[0]);
  };
  const handleCheckboxChange1 = (e) => {
    setIsChecked(e.target.checked);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formdata.name) {
      toast.error("Category Name is required");
      return;
    }

    const data = new FormData();
    data.append("name", formdata.name);
    data.append("parentid", formdata.parentid);
    data.append("offerstartdate", formdata.offerstartdate);
    data.append("offerendate", formdata.offerendate);
    data.append("status", formdata.status);
    data.append("image", file);
    data.append("isoffer", isChecked);

    axios
      .post(`${API_BASE_URL}/data`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("Data sent successfully");

        // Reset the form data to initial state
        setFormdata(initialFormData);
        setFile(null);

        setIsChecked(false);
        getData();
        fetchData();
        setIsModalOpen(false);
        toast.success("Category added sucessfully.");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handalchange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handalchange2 = (e) => {
    setFormdata1({ ...formdata1, [e.target.name]: e.target.value });
  };

  const getData = () => {
    axios
      .get(`${API_BASE_URL}/data`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setData(res.data);
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // fetch data and show in table

  const fetchData = () => {
    axios
      .get(`${API_BASE_URL}/data`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setDataa(res.data);
        console.log(res.data);
      })
      .catch((error) => console.error(error));
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      fetchData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/data`, {
        params: { searchName: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setDataa(res.data.length > 0 ? res.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  const getkitchenData = () => {
    axios
      .get(`${API_BASE_URL}/getkitchen`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("Kitchen API response:", res.data);

        setKitchenData(res.data);
      });
  };

  useEffect(() => {
    fetchData();
    getData();
    getkitchenData();
  }, []);

  // delete category
  const deleteCategory = (CategoryID) => {
    axios
      .delete(`${API_BASE_URL}/data/${CategoryID}`)
      .then((res) => {
        console.log(res.data);
        fetchData();
        toast.success("Category Delete Sucessfully.");
      })
      .catch((err) => {
        console.error("Error deleting category:", err);
      });
  };

  const handleSubmit2 = (e) => {
    e.preventDefault();

    if (!formdata1.name || !formdata1.name.trim()) {
      toast.error("Category Name is required");
      return;
    }

    const data = new FormData();
    data.append("name", formdata1.name);
    data.append("parentid", formdata1.parentid);
    data.append("offerstartdate", formdata1.offerstartdate);
    data.append("offerendate", formdata1.offerendate);
    data.append("status", formdata1.status);
    data.append("isoffer", isChecked);
    data.append("kitchen_id", formdata1.kitchen_id); // ✅ MUST

    // Only append image if a new file is selected
    if (file) {
      data.append("image", file);
    }

    axios
      .put(`${API_BASE_URL}/data/${editId}`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      })
      .then((res) => {
        toast.success("Category updated successfully");
        setEditModal(false);
        setFile(null);
        fetchData();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Failed to update. Please try again.");
      });
  };

  const [isOpen, setOpen] = useState(true);

  const selectepage = (page) => {
    if (page > 0 && page <= Math.ceil(dataa.length / 5)) {
      setCurrentPage(page);
    }
  };

  const fetchDatas = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/data`, {
        headers: {
          Authorization: token,
        },
      });
      return response.data; // Assuming the data you need is in `response.data.data`
    } catch (error) {
      console.error("Error fetching data:", error);
      throw error; // Rethrow the error to handle it in the calling function if needed
    }
  };

  const handleDownload = async (type) => {
    const data = await fetchDatas();

    if (type === "csv") downloadCSV(data);
    else if (type === "excel") downloadExcel(data);
    else if (type === "pdf") downloadPDF(data);
  };
  // download for CSV file..
  const downloadCSV = async () => {
    const data = await fetchDatas(); // Fetch data
    const csvData = data.map((item) => ({
      // Map your data structure as needed
      Image: item.CategoryImage ? `${item.CategoryImage}` : "No image found",
      Category_Name: item.Name,
      parent_Menu: item.parent_name
        ? `${item.parent_name}`
        : "No parent menu found",
      Status: item.CategoryIsActive === 1 ? "Active" : "Not Active",
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
    const data = await fetchDatas(); // Fetch your data

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Define the columns and map headers
    worksheet.columns = [
      { header: "Image", key: "image" },
      { header: "Category Name", key: "category_name" },
      { header: "Parent Menu", key: "parent_menu" },
      { header: "Status", key: "status" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        image: item.CategoryImage ? `${item.CategoryImage}` : "No image found",
        category_name: item.Name,
        parent_menu: item.parent_name
          ? `${item.parent_name}`
          : "No parent menu found",
        status: item.CategoryIsActive === 1 ? "Active" : "Not Active",
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
    const data = await fetchDatas(); // Fetch data
    const doc = new jsPDF();

    // Map the data to rows for the PDF
    const rows = data.map((item) => [
      item.CategoryImage ? `${item.CategoryImage}` : "No image found",
      item.Name,
      item.parent_name ? `${item.parent_name}` : "No parent menu found",
      item.CategoryIsActive === 1 ? "Active" : "Not Active",
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Image", "Category Name ", "parent Menu", "Status"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={isOpen ? "" : "hidden"}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Category List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white rounded-lg shadow-sm">
              {/* Left spacer (for alignment) */}
              <div className="hidden sm:block flex-1"></div>

              {/* Action buttons container */}
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                {/* Add Category Button (conditionally rendered) */}
                <HasPermission module="Category List" action="create">
                  <button
                    onClick={() => navigate("/add-category")}
                    className="bg-[#4CBBA1] hover:bg-[#3CA991] text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-300 transform hover:scale-105 w-full sm:w-auto mt-4 sm:mt-0"
                  >
                    <IoIosAddCircleOutline className="text-xl" />
                    Add Category
                  </button>
                </HasPermission>
              </div>
            </div>

            {/* Search Bar */}
            <div className=" mt-5  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5 gap-y-5 ">
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
                  <div className="flex m-auto   px-4   rounded-md border-[1px] border-gray-900">
                    <button className="px-4 text-[#0f044a] text-sm">
                      <FaMagnifyingGlass />
                    </button>
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search Product..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
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
                    {dataa.length > 0 &&
                      dataa
                        .slice(currentPage * 5 - 5, currentPage * 5)
                        .map((row, index) => (
                          <tr key={index}>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {index + 1}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <img
                                src={`${VITE_IMG_URL}` + row.CategoryImage}
                                alt={row.Name}
                                className="w-[80px] h-[60px] mx-auto  text-wrap text-sm"
                              />
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.Name}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.parent_name}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.CategoryIsActive === 1
                                ? "Active"
                                : "Inactive"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Category List"
                                  action="edit"
                                >
                                  {" "}
                                  <Tooltip
                                    message="Edit Category"
                                    key={row.CategoryID}
                                  >
                                    <button
                                      onClick={() =>
                                        handleEditClick(row.CategoryID)
                                      }
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission
                                  module="Category List"
                                  action="delete"
                                >
                                  {" "}
                                  <Tooltip message="Delete Category">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.CategoryID)
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
                        ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pagination */}

            {dataa.length > 0 && (
              <div className="mt-10">
                <div className="float-right flex items-center space-x-2">
                  <button
                    onClick={() => selectepage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  {[...Array(Math.ceil(dataa.length / 5))].map((_, index) => {
                    return (
                      <button
                        onClick={() => selectepage(index + 1)}
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
                  })}
                  <button
                    onClick={() => selectepage(currentPage + 1)}
                    disabled={currentPage === Math.ceil(dataa.length / 5)}
                    className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
      <CategoryDialogBox
        title={"Add New Category"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
        <div className="max-w-md mx-auto">
          {" "}
          {/* Set a maximum width and center the form */}
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded px-6 pt-6 pb-8 " // Reduced padding
          >
            <div className="flex flex-col gap-y-6">
              {" "}
              {/* Changed to flex-col for better stacking */}
              <div className="category">
                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="categoryName"
                  >
                    Category Name*
                  </label>
                  <input
                    className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="categoryName"
                    type="text"
                    name="name"
                    placeholder="Enter Category Name"
                    value={formdata.name}
                    onChange={handalchange}
                  />
                </div>

                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="parentCategory"
                  >
                    Parent Category
                  </label>
                  <select
                    className="shadow border border-[#4CBBA1] rounded w-2/3 py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="parentCategory"
                    name="parentid"
                    value={formdata.parentid}
                    onChange={handalchange}
                  >
                    <option value="">Select option</option>
                    {data.map((category, index) => (
                      <option key={index} value={category.CategoryID}>
                        {category.Name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="image"
                  >
                    Image
                  </label>
                  <input
                    className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="image"
                    name="image"
                    accept="image/*"
                    type="file"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="offer_category">
                <div className="mb-6">
                  <div className="flex gap-2">
                    <label
                      className="text-nowrap font-semibold text-gray-700 w-[130px]"
                      htmlFor="offer"
                    >
                      Offer
                    </label>
                    <input
                      value={isChecked}
                      checked={isChecked}
                      type="checkbox"
                      name="isoffer"
                      id="offer"
                      onChange={handleCheckboxChange}
                      className="size-5 custom-checkbox"
                    />
                  </div>
                </div>

                {isChecked && (
                  <span className="text-gray-700 text-sm">
                    <div>
                      <div className="mb-4 flex gap-x-5 justify-between items-center">
                        <label
                          className="block text-nowrap text-gray-700 w-1/3 font-semibold mb-2"
                          htmlFor="offerStartDate"
                        >
                          Offer Start Date
                        </label>
                        <input
                          className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerStartDate"
                          type="date"
                          placeholder="Offer Start Date"
                          name="offerstartdate"
                          value={formdata.offerstartdate}
                          onChange={handalchange}
                        />
                      </div>
                      <div className="mb-4 flex gap-x-5 justify-between items-center">
                        <label
                          className="block text-nowrap text-gray-700 w-1/3 font-semibold mb-2"
                          htmlFor="offerEndDate"
                        >
                          Offer End Date
                        </label>
                        <input
                          className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerEndDate"
                          type="date"
                          placeholder="Offer End Date"
                          name="offerendate"
                          value={formdata.offerendate}
                          onChange={handalchange}
                        />
                      </div>
                    </div>
                  </span>
                )}

                <div className="flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-gray-700 w-1/3 font-semibold mb-2"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    className="shadow border border-[#4CBBA1] rounded w-2/3 py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="status"
                    name="status"
                    value={formdata.status}
                    onChange={handalchange}
                  >
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div className="flex mt-6 justify-end gap-x-3">
                  <button
                    className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                    type="reset"
                  >
                    Reset
                  </button>
                  <button
                    className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </CategoryDialogBox>

      {editModal && (
        <EditDialogBox
          title={"Edit Category"}
          isOpen={editModal}
          onClose={() => {
            setEditModal(false);
          }}
        >
          <div className="max-w-md mx-auto">
            <form
              onSubmit={handleSubmit2}
              className="bg-white rounded px-6 pt-4 pb-6 mb-4"
            >
              <div className="flex flex-col gap-y-4">
                <div className="category">
                  <div className="mb-4 flex flex-col">
                    <label
                      className="block text-gray-700 font-semibold mb-1"
                      htmlFor="categoryName"
                    >
                      Category Name*
                    </label>
                    <input
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="categoryName"
                      type="text"
                      name="name"
                      placeholder="Enter Category Name"
                      value={formdata1.name}
                      onChange={handalchange2}
                    />
                  </div>

                  <div className="mb-4 flex flex-col">
                    <label
                      className="block text-gray-700 font-semibold mb-1"
                      htmlFor="parentCategory"
                    >
                      Parent Category
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                      name="parentid"
                      value={formdata1.parentid}
                      onChange={handalchange2}
                    >
                      <option value="">Select option</option>
                      {data.map((category, index) => (
                        <option key={index} value={category.CategoryID}>
                          {category.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 flex flex-col">
                    <label
                      className="block text-gray-700 font-semibold mb-1"
                      htmlFor="kitchen_id"
                    >
                      Assign Kitchen*
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="kitchen_id"
                      name="kitchen_id"
                      value={formdata1.kitchen_id}
                      onChange={handalchange2}
                    >
                      <option value="">Select option</option>
                      {kitchenData.map((val, index) => (
                        <option key={index} value={val.id}>
                          {val.kitchen_name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="mb-4 flex flex-col">
                    <label
                      className="block text-gray-700 font-semibold mb-1"
                      htmlFor="image"
                    >
                      Image
                    </label>
                    <input
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="image"
                      name="image"
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange2}
                    />
                  </div>
                </div>

                <div className="offer_category">
                  <div className="mb-4 flex items-center">
                    <label
                      className="text-gray-700 font-semibold mr-2"
                      htmlFor="offer"
                    >
                      Offer
                    </label>
                    <input
                      value={isChecked}
                      checked={isChecked}
                      type="checkbox"
                      name="isoffer"
                      id="offer"
                      onChange={handleCheckboxChange1}
                      className="size-5 custom-checkbox"
                    />
                  </div>

                  {isChecked && (
                    <div className="flex flex-col gap-y-4">
                      <div className="mb-4 flex flex-col">
                        <label
                          className="block text-gray-700 font-semibold mb-1"
                          htmlFor="offerStartDate"
                        >
                          Offer Start Date
                        </label>
                        <input
                          className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerStartDate"
                          type="date"
                          name="offerstartdate"
                          value={formdata1.offerstartdate}
                          onChange={handalchange2}
                        />
                      </div>
                      <div className="mb-4 flex flex-col">
                        <label
                          className="block text-gray-700 font-semibold mb-1"
                          htmlFor="offerEndDate"
                        >
                          Offer End Date
                        </label>
                        <input
                          className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerEndDate"
                          type="date"
                          name="offerendate"
                          value={formdata1.offerendate}
                          onChange={handalchange2}
                        />
                      </div>
                    </div>
                  )}

                  <div className="mb-4 flex flex-col">
                    <label
                      className="block text-gray-700 font-semibold mb-1"
                      htmlFor="status"
                    >
                      Status
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="status"
                      name="status"
                      value={formdata1.status}
                      onChange={handalchange2}
                    >
                      <option value="">Select option</option>
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>

                  <div className="flex justify-end gap-x-3">
                    <button
                      className="bg-[#4CBBA1] text-white w-[90px] h-[36px] rounded focus:outline-none focus:shadow-outline"
                      type="reset"
                    >
                      Reset
                    </button>
                    <button
                      className="bg-[#1C1D3E] text-white w-[90px] h-[36px] rounded focus:outline-none focus:shadow-outline"
                      type="submit"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </EditDialogBox>
      )}
      <DeleteModal
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
        type={"Category"}
      />
    </>
  );
};

export default CategoryList;
