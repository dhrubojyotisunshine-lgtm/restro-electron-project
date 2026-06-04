import React, { useState, useEffect, useContext } from "react";
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
import HasPermission from "../../store/HasPermission";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import { AuthContext } from "../../store/AuthContext";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";
const headers = ["SL.", "Position", "User Name", "Action"];
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
const Commission_Position = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [commissionData, setCommissionData] = useState([]);
  const [position, setPosition] = useState([]);
  const [userdata, setUserData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const token = localStorage.getItem("token");
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(division.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const getCommissionData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/userposition`, {
        headers: {
          Authorization: token,
        },
      });
      setCommissionData(response.data.data);
      console.log("resp", response);
    } catch (error) {
      console.log("Error fetching commission data:", error);
    }
  };

  // search
  const handleSearch = (e) => {
  const value = e.target.value;
  setSearchName(value);
  setCurrentPage(1);

  if (value.trim() === "") {
    getCommissionData();
    return;
  }

  axios
    .get(`${API_BASE_URL}/getcomissiondata`, {
      params: { searchItem: value },
      headers: { Authorization: token }, // ✅ Correct place for token
    })
    .then((res) => {
      setCommissionData(res.data.data.length > 0 ? res.data.data : []);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      toast.error("Error fetching filtered data");
    });
};


  // designations

  const fetchUserData = () => {
    axios
      .get(`${API_BASE_URL}/all`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setUserData(res.data.data);
        console.log("data", res.data);
      })
      .catch((error) => console.error(error));
  };

  const getPositions = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/designation`, {
        headers: {
          Authorization: token,
        },
      });
      console.log(res.data);
      setPosition(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const [formdata, setFormdata] = useState({
    pos_id: "",
    user_id: "",
  });
  const handelchange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(`${API_BASE_URL}/userposition`, formdata, {
        headers: { Authorization: token },
      })
      .then((response) => {
        console.log(response.data);
        toast.success("User Position Added Sucessfully !");
        getCommissionData();
        setIsModalOpen(false);
        setFormdata({
          pos_id: "",
          rate: "",
        });
      })
      .catch((error) => {
        console.log(error);
        toast.error("Somethig went wrong...");
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
    DeleteCommission(deleteModalId);
    handleModalClose();
  };
  const DeleteCommission = (id) => {
    axios
      .delete(`${API_BASE_URL}/deleteuserposition/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Commission position Sucessfully..");
        getCommissionData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //edit
  const [formData2, setFormData2] = useState({
    pos_id: "",
    user_id: "",
    created_by: "",
  });
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [editId, setEditId] = useState(null);
 const handleEditClick = (id) => {
  setEditId(id)
  setIsModalOpen2(true); // open modal first
  axios
    .get(`${API_BASE_URL}/userposition/${id}`)
    .then((response) => {
      const data = response.data.data;
      setFormData2({
        pos_id: data.pos_id,
        user_id: data.user_id,
        created_by: data.created_by,
      });
    })
    .catch((err) => {
      console.error("Error fetching data:", err);
    });
};
 const handleChange2 = (e) => {
  const { name, value } = e.target;
  setFormData2((prev) => ({ ...prev, [name]: value }));
};

  const handleSubmit2 = (e) => {
    e.preventDefault();
    axios
      .put(`${API_BASE_URL}/updatepositioncommision/${editId}`, formData2)
      .then(() => {
        toast.success("Updated Sucessfully!");
        getCommissionData();
        setIsModalOpen2(false); // Close the modal after submission
      })
      .catch((error) => {
        console.error("Error updating data:", error);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/userposition`, {
        headers: {
          Authorization: token,
        },
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

      Degination: item.position_name,
      Commission_Rate: item.rate,
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
      { header: "Position", key: "position" },
      { header: "User Name", key: "username" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        position: item.position_name,
        username: item.username,
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
    const rows = data.map((item) => [item.position_name, item.rate]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Degination", "commission (%)"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getCommissionData();
    getPositions();
    fetchUserData();
  }, []);
  return (
    <>
      <div className="main_div ">
        <section className="side_section flex">
          <div
            className={`${
              isOpen == false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className=" font-semibold mb-3">Commission Positions</h1>

              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>

              <HasPermission module="Commission Setup" action="create">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className=" bg-[#4CBBA1] p-3 mt-10 rounded-sm  flex justify-center items-center
           gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Commission Position
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
                    {commissionData && commissionData.length > 0 ? (
                      commissionData
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
                              {row.position_name
                                ? row.position_name
                                : "No Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.full_name ? row.full_name : "No Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Commission Setup"
                                  action="edit"
                                >
                                  <Tooltip message="Edit" key={row.id}>
                                    <button
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      onClick={() => handleEditClick(row.id)}
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission
                                  module="Commission Setup"
                                  action="delete"
                                >
                                  <Tooltip message="Delete">
                                    <button
                                      className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                      onClick={() => handleDeleteClick(row.id)}
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
              {commissionData && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[
                      ...Array(Math.ceil(commissionData.length / itemsPerPage)),
                    ].map((_, index) => (
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
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(commissionData.length / itemsPerPage)
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
        title={"Add Commission Position "}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
        <div className="">
          <form
            onSubmit={handleSubmit}
            className="max-w-md mx-auto p-4 bg-white shadow rounded space-y-4"
          >
            <div>
              <label className="block mb-1 font-medium">Position Name</label>
              <select
                name="pos_id"
                value={formdata.pos_id}
                onChange={handelchange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a position</option>
                {position.map((pos) => (
                  <option key={pos.pos_id} value={pos.pos_id}>
                    {pos.position_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block mb-1 font-medium">User List</label>
              <select
                name="user_id"
                value={formdata.user_id}
                onChange={handelchange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a user</option>
                {userdata.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstname}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
            >
              Save
            </button>
          </form>
        </div>
      </CategoryDialogBox>

    {isModalOpen2 && (
  <>
    <div className="fixed inset-0 z-50 flex justify-center items-center">
      <div className="w-full max-w-xl mx-auto px-6">
        <div className="bg-white rounded-lg shadow-lg border border-[#1C1D3E]">
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-black">
            <div>
              <h2 className="text-xl font-semibold">Edit Commission Position</h2>
              <p className="text-sm text-gray-600">Only % can be updated</p>
            </div>
            <button
              onClick={() => setIsModalOpen2(false)}
              className="text-white bg-[#FB3F3F] px-3 py-1 rounded hover:scale-105 transition"
            >
              X
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit2} className="px-6 py-5 space-y-5">
            {/* Position Dropdown */}
            <div>
              <label className="block mb-1 font-medium">Position Name</label>
              <select
                name="pos_id"
                value={formData2.pos_id}
                onChange={handleChange2}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a position</option>
                {position.map((pos) => (
                  <option key={pos.pos_id} value={pos.pos_id}>
                    {pos.position_name.trim()}
                  </option>
                ))}
              </select>
            </div>

            {/* User Dropdown */}
            <div>
              <label className="block mb-1 font-medium">User List</label>
              <select
                name="user_id"
                value={formData2.user_id}
                onChange={handleChange2}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a user</option>
                {userdata.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.firstname}
                  </option>
                ))}
              </select>
            </div>

            {/* Buttons */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded hover:bg-[#2a2b4f] transition"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {/* Overlay */}
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

export default Commission_Position;
