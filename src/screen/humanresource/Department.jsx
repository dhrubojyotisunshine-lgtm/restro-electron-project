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
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";

const headers = ["SL.", "Department Name", "Action"];
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

const Department = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [departmentList, setDepartmentList] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  //post
  const [department_name, setDepartment_name] = useState("");
  const [deleteModalId, setDeleteModalId] = useState(null);
const token = localStorage.getItem("token");
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(departmentList.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

 const handleSubmit = (e) => {
  e.preventDefault();

  if (!department_name) {
    toast.error("Department Name is required");
    return;
  }

  axios
    .post(
      `${API_BASE_URL}/adddepartment`,
      { department_name }, // correct data payload
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then((res) => {
      console.log(res);
      setDepartment_name(null);
      toast.success("Department added successfully!");
      getDepartment();
      setIsModalOpen(false);
    })
    .catch((error) => {
      console.log(error);
      toast.error("Error in adding department.");
    });
};

  const getDepartment = () => {
    axios
      .get(`${API_BASE_URL}/department`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        setDepartmentList(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getDepartment();
      return;
    }

    axios
      .get(`${API_BASE_URL}/department`, {
        params: { searchItem: value },
        
        headers:{
          Authorization: token
        }
      
      })
      .then((res) => {
        setDepartmentList(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };
  //edit

  const [isModalOpen2, setIsModalOpen2] = useState(false);
const[createdby,setCreatedby]=useState("")
  const [editName, setEditName] = useState("");
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen2(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/department/${id}`).then((response) => {
      console.log("data recive", response.data);

      setEditName(response.data.data.department_name);
      setCreatedby(response.data.data.created_by)
    });
  };

  const handleSubmit2 = async (e) => {
    e.preventDefault();

    if (!editName || !editId) {
      toast.error("Department name  required.");
      return;
    }

    const department_name = editName;
    const created_by = createdby;

    try {
      await axios.put(`${API_BASE_URL}/department/${editId}`, {
        created_by,
        department_name,
      });
      toast.success("Updated Successfully!");
      getDepartment();
      setIsModalOpen2(false); // Close the modal after submission
    } catch (error) {
      toast.error("Error updating data. Please try again.");
      console.error("Error updating data:", error);
    } finally {
      setLoading(false); // End loading state
    }
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
    DeleteDepartment(deleteModalId);
    handleModalClose();
  };
  const DeleteDepartment = (id) => {
    axios
      .delete(`${API_BASE_URL}/deletedepartment/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Department sucessfully..");
        getDepartment();
      })
      .catch((err) => {
        console.log(err);
      });
  };




  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/department`);
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
    
      Department_Name: item.department_name,
     
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
      { header: "Department Name", key: "department_name" },
      
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        department_name: item.department_name,
       
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
      item.department_name,
      
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
 autoTable(doc,{
      head: [["Department Name "]],
      body: rows,
      
  startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };



  useEffect(() => {
    getDepartment();
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
              <h1 className=" font-semibold mb-3">All Department List</h1>

              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>
              <HasPermission module="Department" action="create">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Department
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
                      placeholder="Search user..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
                    <button
                      //   onClick={handleSearch}
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
                    {departmentList && departmentList.length > 0 ? (
                      departmentList
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
                              {row.department_name
                                ? row.department_name
                                : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Department"
                                  action="edit"
                                >
                                  <Tooltip message="Edit" key={row.dept_id}>
                                    <button
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      onClick={() =>
                                        handleEditClick(row.dept_id)
                                      }
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission
                                  module="Department"
                                  action="delete"
                                >
                                  <Tooltip message="Delete">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.dept_id)
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
              {departmentList.length > 0 && (
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
                      ...Array(Math.ceil(departmentList.length / itemsPerPage)),
                    ].map((_, index) => {
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
                    })}
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(departmentList.length / itemsPerPage)
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
        title={"Add New Department"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
       <div className="max-w-sm mx-auto p-4 bg-white rounded-lg shadow-md">
  <form onSubmit={handleSubmit} className="space-y-4 p-2">
    <div className="flex flex-col px-3">
      <label
        className="block text-gray-700 font-semibold mb-1"
        htmlFor="department_name"
      >
        Department Name *
      </label>
      <input
        className="shadow border border-[#4CBBA1] rounded-md py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
        type="text"
        name="department_name"
        placeholder="Enter Department Name"
        value={department_name}
        onChange={(e) => {
          setDepartment_name(e.target.value);
        }}
      />
    </div>

    <div className="flex justify-end gap-x-3">
      <button
        className="bg-[#4CBBA1] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#90d8c7] transition duration-200"
        type="reset"
      >
        Reset
      </button>
      <button
        className="bg-[#1C1D3E] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#1A1B2E] transition duration-200"
        type="submit"
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
         <div className="w-full max-w-sm px-4"> {/* Reduced max width */}
           <div className="py-6 bg-white rounded-lg shadow-lg border border-gray-300">
             <div className="flex py-4 px-4 justify-between items-center border-b border-gray-300">
               <h2 className="text-xl font-semibold">Edit Department</h2>
               <button
                 onClick={() => setIsModalOpen2(false)}
                 className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-sm transition duration-200"
               >
                 X
               </button>
             </div>
             <div className="p-4">
               <form onSubmit={handleSubmit2} className="space-y-4">
                 <div className="flex flex-col">
                   <label
                     className="block text-gray-700 font-semibold mb-1"
                     htmlFor="department_name"
                   >
                     Department Name *
                   </label>
                   <input
                     className="shadow border border-[#4CBBA1] rounded-md py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
                     type="text"
                     name="department_name"
                     placeholder="Enter Department Name"
                     value={editName}
                     onChange={(e) => {
                       setEditName(e.target.value);
                     }}
                   />
                 </div>
     
                 <div className="flex justify-end gap-x-3">
                   <button
                     className="bg-[#4CBBA1] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#90d8c7] transition duration-200"
                     type="reset"
                   >
                     Reset
                   </button>
                   <button
                     className="bg-[#1C1D3E] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#1A1B2E] transition duration-200"
                     type="submit"
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

export default Department;
