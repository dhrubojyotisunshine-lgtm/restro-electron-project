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
const headers = ["SL.", "Degination", "commission (%)", "Action"];
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

const ComissionSetup = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [commissionData, setCommissionData] = useState([]);
  const [position, setPosition] = useState([]);
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
      const response = await axios.get(`${API_BASE_URL}/getcomissiondata`, {
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
        Authorization: token,
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
    rate: "",
  });
  const handelchange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    axios
      .post(`${API_BASE_URL}/postcommission`, formdata, {
        headers: { Authorization: token },
      })
      .then((response) => {
        console.log(response.data);
        toast.success("Commission Added Sucessfully !");
        getCommissionData();
        setIsModalOpen(false);
        setFormdata({
          pos_id: "",
          rate: "",
          
        })
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
      .delete(`${API_BASE_URL}/deletecomission/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Commission Sucessfully..");
        getCommissionData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //edit
  const [formData2, setFormData2] = useState({
    pos_id: "",
    rate: "",
    created_by: "",
  });
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen2(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/comissionbyid/${id}`).then((response) => {
      setFormData2({
        pos_id: response.data.data.pos_id,
        rate: response.data.data.rate,
        created_by: response.data.data.created_by,
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
      .put(`${API_BASE_URL}/updatecomission/${editId}`, formData2)
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
      const response = await axios.get(`${API_BASE_URL}/getcomissiondata`, {
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
      { header: "Degination", key: "degination" },
      { header: "Commission(%)", key: "commission(%)" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        degination: item.position_name,
        commission_rate: item.rate,
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
              <h1 className=" font-semibold mb-3">
                Payroll Commission Setting
              </h1>

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
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
           gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Commission
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
                              {row.rate ? row.rate : "No Info"} %
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
        title={"Add New Commission Setting "}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
        <div className="">
          <form onSubmit={handleSubmit} className="bg-white rounded px-8 pt-6 ">
            <div className="flex justify-between gap-x-11">
              <div className="category">
                <div className="mb-4 flex gap-x-5 justify-center items-center">
                  <label className="block text-nowrap text-gray-700 font-semibold mb-2">
                    Designation*
                  </label>
                  <select
                    value={formdata.pos_id}
                    onChange={handelchange}
                    name="pos_id"
                    className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select</option>
                    {position.map((val) => (
                      <option key={val.parent_id} value={val.pos_id}>
                        {val.position_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4 flex gap-x-5 justify-center items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2"
                    htmlFor="categoryName"
                  >
                    Commission*
                  </label>
                  <input
                    className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    type="number"
                    name="rate"
                    max={100}
                    min={0}
                    placeholder="%"
                    value={formdata.rate}
                    onChange={handelchange}
                  />
                </div>

                <div className="flex mt-10 float-right gap-x-3">
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

      {isModalOpen2 && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
            <div className="  w-auto px-20 ">
              <div className=" py-1  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl  font-semibold flex flex-col">
                    <span>Edit Commission Setting</span> 
                    <span className=" text-sm">only % can be update</span>
                  </h2>
                  <button
                    onClick={() => setIsModalOpen2(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className="">
                  <form
                    onSubmit={handleSubmit2}
                    className="bg-white rounded px-8 pt-6 pb-8 mb-4"
                  >
                    <div className="flex justify-between gap-x-11">
                      <div className="category">
                        <div className="mb-4 flex gap-x-5 justify-center items-center">
                          <label className="block text-nowrap text-gray-700 font-semibold mb-2">
                            Designation*
                          </label>
                   <div className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 bg-gray-100">
  {
    position.find((val) => val.pos_id === formData2.pos_id)?.position_name || "N/A"
  }
</div>
                        </div>

                        <div className="mb-4 flex gap-x-5 justify-center items-center">
                          <label
                            className="block text-nowrap text-gray-700 font-semibold mb-2"
                            htmlFor="categoryName"
                          >
                            Commission*
                          </label>
                          <input
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                            name="rate"
                            min={0}
                            max={100}
                            placeholder="%"
                            value={formData2.rate}
                            onChange={handleChange2}
                          />
                        </div>

                        <div className="flex mt-5 float-right gap-x-3">
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
              </div>
            </div>
          </div>
          <div className=" opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
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

export default ComissionSetup;
