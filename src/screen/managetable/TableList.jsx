import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import TableModal from "./TableModal";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import FloorDialogBox from "../../components/FloorDialogBox";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import HasPermission from "../../store/HasPermission";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";
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

const headers = ["SL.", "Table Name", "Capacity", "Action"];

const TableList = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isTableModal, setIsTableModal] = useState(false);
  const [isFloorModal, setIsFloorModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId2, setDeleteModalId2] = useState(null);
  const [showModal2, setShowModal2] = useState(false);
  const [tables, setTables] = useState([]);
  const [floors, setFloors] = useState([]);
  const [searchName, setSearchName] = useState("");
  const token = localStorage.getItem("token");
  const [tableData, setTableData] = useState({
    tablename: "",
    person_capicity: "",
    floorName: "",
  });
  const { isFullScreen, toggleFullScreen } = useFullScreen();

  const totalPages = Math.ceil(floors.length / itemsPerPage);

  const selectPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const [floorData, setFloorData] = useState({
    floorName: "", // Define in state object
  });

  const handleInputChange = (e) => {
    setFloorData({
      ...floorData,
      floorName: e.target.value, // Update floorName in state
    });
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    if (floorData.floorName.trim() === "") {
      toast.error("Please enter floor name");
    } else {
      axios
        .post(`${API_BASE_URL}/addfloor`, { floorName: floorData.floorName },{
        headers:{
          Authorization: token
        }
      })
        .then((res) => {
          toast.success("Floor added successfully");
          setFloors((prevFloors) => [...prevFloors, res.data]); // Append new floor data
          GetFloorData(); // Fetch updated floor data
        })
        .catch((err) => {
          alert("Error adding floor");
        });
    }

    // Reset form
    setFloorData({
      floorName: "",
    });
  };

  // const [tableFile, setTableFile] = useState(null);

  // const handleImageChange = (e) => {
  //   setTableFile(e.target.files[0]);
  // };

  const closeTableModal = () => {
    setIsTableModal(false);
  };

  const closeFloorModal = () => {
    setIsFloorModal(false);
  };

  const handleChange = (e) => {
    setTableData({ ...tableData, [e.target.name]: e.target.value });
  };

  const GetFloorData = () => {
    axios
      .get(`${API_BASE_URL}/getfloor`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        setFloors(res.data.data);
      })
      .catch((err) => {
        toast.error("Error getting floors");
      });
  };

  const GetTableData = () => {
    axios
      .get(`${API_BASE_URL}/table`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        setTables(res.data.data);
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error getting tables");
      });
  };

  //post
const submitTableData = (e) => {
  e.preventDefault();

  // Validation check
  if (!tableData.floorName || tableData.floorName.trim() === "") {
    toast.error("Please select a floor before adding the table.");
    return;
  }

  const formData = new FormData();
  formData.append("tablename", tableData.tablename);
  formData.append("person_capicity", tableData.person_capicity);
  formData.append("floorName", tableData.floorName);

  axios
    .post(`${API_BASE_URL}/table`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
        Authorization: token,
      },
    })
    .then((res) => {
      toast.success("Table added successfully!");
      setTableData({ tablename: "", person_capicity: "", floorName: "" });
      closeTableModal();
      GetTableData();
    })
    .catch((err) => {
      toast.error("Error adding table");
    });
};

  // edit table

  const [formData2, setFormData2] = useState({
    tablename: "",
    person_capicity: "",
    floorName: "",
    created_by:""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/table/${id}`).then((response) => {
      setFormData2({
        tablename: response.data.data.tablename,
        person_capicity: response.data.data.person_capicity,
        floorName: response.data.data.floor,
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

  // Validation
  if (!formData2.tablename || formData2.tablename.trim() === "") {
    toast.error("Please enter a Table Name.");
    return;
  }
  if (!formData2.person_capicity || formData2.person_capicity <= 0) {
    toast.error("Please enter a valid table capacity.");
    return;
  }
  if (!formData2.floorName || formData2.floorName.trim() === "") {
    toast.error("Please select a floor.");
    return;
  }

  axios
    .put(`${API_BASE_URL}/updatetable/${editId}`, formData2)
    .then(() => {
      toast.success("Table updated successfully!");
      GetTableData();
      setIsModalOpen(false);
    })
    .catch((error) => {
      console.error("Error updating data:", error);
      toast.error("Something went wrong while updating the table.");
    });
};


  // edit floor

  const [formData3, setFormData3] = useState({
    floorName: "",
    created_by:"",
  });

  const [isModalOpen3, setIsModalOpen3] = useState(false);
  const [editId3, setEditId3] = useState(null);
  const handleEditClick3 = (id) => {
    setEditId3(id);
    setIsModalOpen3(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/floors/${id}`).then((response) => {
      setFormData3({
        floorName: response.data.data.floorName,
        created_by:response.data.data.created_by
      });
    });
  };
  const handleChange3 = (e) => {
    setFormData3({
      ...formData3,
      [e.target.name]: e.target.value,
    });
  };

const handleSubmit3 = (e) => {
  e.preventDefault();

  if (!formData3.floorName.trim()) {
    toast.error("Floor Name is required!");
    return;
  }

  axios
    .put(`${API_BASE_URL}/floors/${editId3}`, formData3)
    .then(() => {
      toast.success("Floor updated successfully!");
      GetFloorData();
      setIsModalOpen3(false); // Close the modal after submission
    })
    .catch((error) => {
      console.error("Error updating data:", error);
    });
};
  // search table
const handleSearch = (e) => {
  const value = e.target.value.trimStart(); // prevent accidental leading spaces
  setSearchName(value);
  setCurrentPage(1);

  if (value === "") {
    GetTableData();
    return;
  }

  axios.get(`${API_BASE_URL}/table`, {
    params: { searchItem: value },
    headers: { Authorization: token }
  })
  .then(res => {
    setTables(res.data.data.length > 0 ? res.data.data : []);
  })
  .catch(error => {
    console.error("Error fetching data:", error);
    toast.error("Error fetching filtered data");
  });
};
  // delete Table

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
      .delete(`${API_BASE_URL}/deletetable/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete table sucessfully..");
        GetFloorData();
        GetTableData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // delete Floore
  const handleDeleteClick2 = (id) => {
    setDeleteModalId2(id);
    setShowModal2(true);
  };

  const handleModalClose2 = () => {
    setShowModal2(false);
    setDeleteModalId2(null);
  };

  const handleModalDelete2 = () => {
    DeleteUnit2(deleteModalId2);
    handleModalClose2();
  };
  const DeleteUnit2 = (id) => {
    axios
      .delete(`${API_BASE_URL}/deletefloors/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Floor sucessfully..");
        GetTableData();
        GetFloorData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/table`,{
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
      Table_Name: item.tablename,
      Capacity: item.person_capicity,
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
      { header: "Table_Name", key: "table_name" },
      { header: "Capacity", key: "capacity" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        table_name: item.tablename,
        capacity: item.person_capicity,
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
    const rows = data.map((item) => [item.tablename, item.person_capicity]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Table Name", "Capacity"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    GetFloorData();
    GetTableData();
  }, []);
  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div className={`${isOpen === false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Table List & Floor List
              </h1>
              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            <div className="ml-auto flex gap-x-11 mt-11">
              <HasPermission module="Table & Floor Manage" action="create">
                <button
                  className="bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                  onClick={() => setIsTableModal(true)}
                >
                  <IoIosAddCircleOutline className="font-semibold text-lg" />
                  Add Table
                </button>
              </HasPermission>

              <HasPermission module="Table & Floor Manage" action="create">
                <button
                  className="bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                  onClick={() => setIsFloorModal(true)}
                >
                  <IoIosAddCircleOutline className="font-semibold text-lg" />
                  Add Floor
                </button>
              </HasPermission>
            </div>

            <div className="h-[65vh] flex flex-col mt-6">
              {/* Search Bar */}
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
                        {tables.length > 0 ? (
                          tables
                            .slice(
                              (currentPage - 1) * itemsPerPage,
                              currentPage * itemsPerPage
                            )

                            .map((row, index) => (
                              <tr key={index}>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  {index + 1}
                                </td>
                                <td className=" px-4  border border-[#4CBBA1] py-2">
                                  {row.tablename}
                                </td>
                                <td className=" px-4  border border-[#4CBBA1] py-2">
                                  {row.person_capicity}
                                </td>
                                {/* <td className="py-2 px-4 border border-[#4CBBA1]">
                            <img
                              src={`${APP_URL}` + row.table_icon}
                              alt={row.tablename}
                              className="w-[80px] h-[60px] mx-auto"
                            />
                          </td> */}
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <div className="flex justify-center gap-x-2 font-bold">
                                    <HasPermission
                                      module="Table & Floor Manage"
                                      action="edit"
                                    >
                                      <Tooltip message="Edit">
                                        <button
                                          onClick={() =>
                                            handleEditClick(row.tableid)
                                          }
                                          className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                        >
                                          <FaRegEdit />
                                        </button>
                                      </Tooltip>
                                    </HasPermission>

                                    <HasPermission
                                      module="Table & Floor Manage"
                                      action="delete"
                                    >
                                      <Tooltip message="Cancel Order">
                                        <button
                                          onClick={() =>
                                            handleDeleteClick(row.tableid)
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
                            <td colSpan="9" className="py-2 px-4 text-center">
                              No results found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="flex justify-between mt-7">
                  {tables.length > 0 && (
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
              </section>
            </div>
          </div>
        </section>
      </div>

      <FloorDialogBox
        title={"Add Floor"}
        isOpen={isFloorModal}
        onClose={closeFloorModal}
      >
        <div className="main_div">
  <section className="side_section flex">
    <div className="contant_div w-full ml-4 pr-7 mt-4">
      <div className="mt-12">
        <form
          onSubmit={handleFormSubmit}
          className="flex flex-wrap justify-end gap-x-6 gap-y-4 mb-6"
        >
          <div className="flex items-center gap-x-3">
            <label
              className="block text-nowrap text-gray-700 font-semibold"
              htmlFor="floorName"
            >
              Floor Name*
            </label>
            <input
              placeholder="Enter Floor Name"
              className="shadow w-[220px] border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
              id="floorName"
              type="text"
              value={floorData.floorName}
              onChange={handleInputChange}
            />
          </div>
          <button
            type="submit"
            className="bg-[#1C1D3E] h-[40px] w-[100px] rounded text-white font-semibold hover:opacity-90"
          >
            Add
          </button>
        </form>

        {floors.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-center border border-gray-200">
              <thead>
                <tr>
                  <th className="py-3 px-4 bg-[#4CBBA1] text-white text-sm uppercase">
                    SL.
                  </th>
                  <th className="py-3 px-4 bg-[#4CBBA1] text-white text-sm uppercase">
                    Floor Name
                  </th>
                  <th className="py-3 px-4 bg-[#4CBBA1] text-white text-sm uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {floors.map((floor, index) => (
                  <tr key={index}>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      {index + 1}
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      {floor.floorName}
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <div className="flex justify-center gap-x-2 font-bold">
                        <HasPermission
                          module="Table & Floor Manage"
                          action="edit"
                        >
                          <Tooltip message="Edit">
                            <button
                              onClick={() =>
                                handleEditClick3(floor.tbfloorid)
                              }
                              className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                            >
                              <FaRegEdit />
                            </button>
                          </Tooltip>
                        </HasPermission>

                        <HasPermission
                          module="Table & Floor Manage"
                          action="edit"
                        >
                          <Tooltip message="Delete">
                            <button
                              onClick={() =>
                                handleDeleteClick2(floor.tbfloorid)
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </section>
</div>

      </FloorDialogBox>

      {/* edit tabel start */}

      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none  ">
            <div className=" w-auto px-20">
              <div className="py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl  font-semibold">Edit Table Data</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className=" p-4">
                  <form onSubmit={handleSubmit2}>
                    <div className="mb-4">
                      <label className="block text-gray-700">Table Name*</label>
                      <input
                        type="text"
                        name="tablename"
                        value={formData2.tablename}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700">Capacity*</label>
                      <input
                        type="number"
                        name="person_capicity"
                        value={formData2.person_capicity}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700">
                        Floor Select
                      </label>

                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="parentCategory"
                        name="floorName"
                        value={formData2.floorName}
                        onChange={handleChange2}
                      >
                        <option value="">Select option*</option>
                        {floors.map((floor, index) => {
                          return (
                            <option key={index} value={floor.tbfloorid}>
                              {floor.floorName}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white px-4 py-2 rounded"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className=" opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
        </>
      )}

      {/* edit table end */}

      {isModalOpen3 && (
       <>
  <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
    <div className="w-1/3 px-4">
      <div className="bg-white rounded-md shadow-md border border-[#1C1D3E]">
        {/* Header */}
        <div className="flex justify-between items-center px-4 py-3 border-b border-black">
          <h2 className="text-xl font-semibold">Edit Floor Data</h2>
          <button
            onClick={() => setIsModalOpen3(false)}
            className="text-white bg-[#FB3F3F] px-3 py-1 rounded hover:scale-105 font-bold"
          >
            X
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-4">
          <form
            onSubmit={handleSubmit3}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col">
              <label
                htmlFor="floorName"
                className="text-gray-700 font-semibold mb-1"
              >
                Floor Name*
              </label>
              <input
                id="floorName"
                name="floorName"
                type="text"
                placeholder="Enter Floor Name"
                value={formData3.floorName}
                onChange={handleChange3}
                className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#1C1D3E] h-[40px] w-[100px] rounded text-white font-semibold hover:opacity-90"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>

  {/* Overlay */}
  <div className="fixed inset-0 z-40 bg-slate-800 opacity-55"></div>
</>

      )}

      <TableModal
        title="Add New Table"
        isOpen={isTableModal}
        onClose={closeTableModal}
      >
        <form onSubmit={submitTableData} className="space-y-5">
          {/* Table Name */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Table Name *
            </label>
            <input
              type="text"
              name="tablename"
              value={tableData.tablename}
              onChange={handleChange}
              className="w-full border border-[#4CBBA1] rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
              required
            />
          </div>

          {/* Capacity */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Capacity *
            </label>
            <input
              type="number"
              name="person_capicity"
              value={tableData.person_capicity}
              onChange={handleChange}
              className="w-full border border-[#4CBBA1] rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
              required
            />
          </div>

          {/* Floor Select */}
          <div>
            <label className="block text-gray-700 font-medium mb-1">
              Floor Select *
            </label>
            <select
              name="floorName"
              value={tableData.floorName}
              onChange={handleChange}
              className="w-full border border-[#4CBBA1] rounded-lg py-2 px-3 text-gray-700 shadow-sm focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
            >
              <option value="">Select an option</option>
              {floors.map((floor) => (
                <option key={floor.tbfloorid} value={floor.tbfloorid}>
                  {floor.floorName}
                </option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-[#4CBBA1] text-white px-6 py-2 rounded-lg font-semibold transition-all duration-200 hover:bg-[#3a9b85] focus:ring-2 focus:ring-[#4CBBA1] focus:ring-offset-1"
            >
              Add Table
            </button>
          </div>
        </form>
      </TableModal>

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />

      <DeleteDialogBox
        show={showModal2}
        onClose={handleModalClose2}
        onDelete={handleModalDelete2}
      />
    </>
  );
};

export default TableList;
