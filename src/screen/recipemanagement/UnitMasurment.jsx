import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { AuthContext } from "../../store/AuthContext";
import { FaRegEdit } from "react-icons/fa";
import useFullScreen from "../../components/useFullScreen";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import DialogBox from "../../components/DialogBox";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";

import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
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

const UnitMasurment = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [unitModal, setUnitModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [formdata, setFormdata] = useState({
    uom_name: "",
    uom_short_code: "",
    is_active: 1,
  });
const token = localStorage.getItem("token");
  const ActionButtons = [{ btn: "CSV" }, { btn: "Excel" }, { btn: "PDF" }];

  const headers = ["SL.", "Unit Name", "Short Name", "Action"];

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

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
  const totalPages = Math.ceil(data.length / itemsPerPage);

  const selectPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const SubmitUnitForm = (e) => {
    e.preventDefault();
    axios
      .post(`${API_BASE_URL}/addmasurmentunit`, formdata,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        console.log(res.data);
        toast.success("Unit added sucessfully!");
        GetUnitData();
        setUnitModal(false); // Close modal after submission
        setFormdata({ uom_name: "", uom_short_code: "", is_active: 1 }); // Reset form
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const DeleteUnit = (id) => {
    axios
      .delete(`${API_BASE_URL}/deletemasurmentunit/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Unit delete sucessfully..");
        GetUnitData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // get all data
  const GetUnitData = () => {
    axios
      .get(`${API_BASE_URL}/getmasurmentunit`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        setData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      GetUnitData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/getmasurmentunit`, {
        params: { searchItem: value },
        headers:{
          Authorization: token
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
  // edit

  const [formData2, setFormData2] = useState({
    uom_name: "",
    uom_short_code: "",
    is_active: 1,
    created_by:""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/units/${id}`).then((response) => {
      setFormData2({
        uom_name: response.data.data.uom_name,
        uom_short_code: response.data.data.uom_short_code,
        is_active: response.data.data.is_active, 
        created_by: response.data.data.created_by
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
    axios
      .put(`${API_BASE_URL}/updatemasurmentunit/${editId}`, formData2,{
        headers:{
          Authorization: token
        }
      })
      .then(() => {
        toast.success("Unit updated sucessfullu!");
        GetUnitData();
        setIsModalOpen(false); // Close the modal after submission
      })
      .catch((error) => {
        console.error("Error updating data:", error);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getmasurmentunit`);
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

      Unit_Name: item.uom_name,
      Short_Name: item.uom_short_code,
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
      { header: "Unit_Name", key: "unit_name" },
      { header: "Short_Name", key: "short_name" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        unit_name: item.uom_name,
        short_name: item.uom_short_code,
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
    const rows = data.map((item) => [item.uom_name, item.uom_short_code]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Unit_Name", "Short_Name"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    GetUnitData();
  }, []);

  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div
            className={`${
              !isOpen
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="content_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Unit Measurement List
              </h1>
              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            <div className="flex justify-between mt-11">
              <span></span>
              <HasPermission module="Unit Measurement" action="create">
                <button
                  onClick={() => setUnitModal(true)}
                  className="bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className="font-semibold text-lg" />
                  Add Unit
                </button>
              </HasPermission>
            </div>
            <div className="mt-11 w-full">
              <section className="table_button">
                <div className="order_button flex justify-evenly flex-wrap gap-x-5 gap-y-5">
                  <div className="flex items-center space-x-2">
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
                    <h1 className="">Records per page</h1>
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

                  <div className="flex m-auto px-4  rounded-md border-[1px]   border-gray-900">
                    <button className="px-4 text-[#0f044a] text-sm">
                      <FaMagnifyingGlass />
                    </button>
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search ..."
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
                    {data.length > 0 ? (
                      data
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage
                        )
                        .map((row, index) => (
                          <tr key={row.id}>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {index + 1 + (currentPage - 1) * itemsPerPage}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.uom_name}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.uom_short_code}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Unit Measurement"
                                  action="edit"
                                >
                                  <Tooltip message="Edit">
                                    <button
                                      onClick={() => handleEditClick(row.id)}
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission
                                  module="Unit Measurement"
                                  action="delete"
                                >
                                  <Tooltip message="Cancel Order">
                                    <button
                                      onClick={() => handleDeleteClick(row.id)}
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
                        <td colSpan={4} className="text-center py-4">
                          No data found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
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
                    {[...Array(totalPages)].map((_, index) => (
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
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
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

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />

      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-96 p-6">
              {" "}
              {/* Reduced width to 24rem (96) */}
              <div className="py-4 bg-white rounded-md shadow-md border border-[#1C1D3E]">
                <div className="flex py-3 px-4 justify-between items-center border-b border-gray-300">
                  <h2 className="text-lg font-semibold">Edit Unit Data</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold rounded"
                  >
                    X
                  </button>
                </div>
                <div className="p-4">
                  <form onSubmit={handleSubmit2}>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Unit Name*
                      </label>
                      <input
                        type="text"
                        name="uom_name"
                        value={formData2.uom_name}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Short Name*
                      </label>
                      <input
                        type="text"
                        name="uom_short_code"
                        value={formData2.uom_short_code}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700 font-semibold mb-1">
                        Status
                      </label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="is_active"
                        value={formData2.is_active}
                        onChange={handleChange2}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-[#1C1D3E] text-white px-4 py-2 rounded-md hover:bg-blue-600 transition duration-200"
                      >
                        Save
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

      <DialogBox
        title={"Add Unit"}
        onClose={() => setUnitModal(false)}
        isOpen={unitModal}
      >
      <div className="max-w-sm mx-auto">
  <form onSubmit={SubmitUnitForm} className="bg-white  rounded ">
    <div className="mb-4">
      <label className="block text-gray-700 font-semibold mb-1">
        Unit Name*
      </label>
      <input
        type="text"
        name="uom_name"
        value={formdata.uom_name}
        onChange={handleChange}
        className="w-full border border-[#4CBBA1] rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
        required
      />
    </div>

    <div className="mb-4">
      <label className="block text-gray-700 font-semibold mb-1">
        Short Name*
      </label>
      <input
        type="text"
        name="uom_short_code"
        value={formdata.uom_short_code}
        onChange={handleChange}
        className="w-full border border-[#4CBBA1] rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
        required
      />
    </div>

    <div className="mb-4">
      <label className="block text-gray-700 font-semibold mb-1">
        Status
      </label>
      <select
        name="is_active"
        value={formdata.is_active}
        onChange={handleChange}
        className="w-full border border-[#4CBBA1] rounded px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
      >
        <option value="1">Active</option>
        <option value="0">Inactive</option>
      </select>
    </div>

    <div className="flex justify-end gap-x-3 mt-6">
      <button
        type="reset"
        onClick={() =>
          setFormdata({
            uom_name: "",
            uom_short_code: "",
            is_active: 1,
          })
        }
        className="bg-[#4CBBA1] text-white px-4 py-2 rounded hover:opacity-90 transition"
      >
        Reset
      </button>
      <button
        type="submit"
        className="bg-[#1C1D3E] text-white px-4 py-2 rounded hover:opacity-90 transition"
      >
        Save
      </button>
    </div>
  </form>
</div>


      </DialogBox>
    </>
  );
};

export default UnitMasurment;
