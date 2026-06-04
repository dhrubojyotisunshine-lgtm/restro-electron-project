import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
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
import DialogBoxSmall from "../../components/DialogBoxSmall";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { AuthContext } from "../../store/AuthContext";
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


const headers = ["SL.", "Position", "Details", "Action"];

const Designation = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [position, setPosition] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const token = localStorage.getItem("token");
  const [formData, setFormData] = useState([
    {
      position_name: "",
      position_details: "",
    },
  ]);
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(position.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);
  // get all designations
  const getPositions = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/designation`,{
        headers:{
          Authorization: token
        }
      });
      console.log(res.data);
      setPosition(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  // search
  const handleSearch = (e) => {
  const value = e.target.value;
  setSearchName(value);
  setCurrentPage(1);

  if (value.trim() === "") {
    getPositions();
    return;
  }

  axios
    .get(`${API_BASE_URL}/designation`, {
      params: { searchItem: value },
      headers: { Authorization: token }, // ✅ Correct place for token
    })
    .then((res) => {
      setPosition(res.data.data.length > 0 ? res.data.data : []);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      toast.error("Error fetching filtered data");
    });
};

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(formData); // Submit or process form data here
    axios
      .post(`${API_BASE_URL}/createdesignation`, formData,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        console.log(response.data);
        toast.success("Dsignatiom Added Sucessfully !");
        getPositions();
        setFormData({
           position_name: "",
      position_details: "",

        })
        setIsModalOpen(false);
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
    DeletePosition(deleteModalId);
    handleModalClose();
  };
  const DeletePosition = (id) => {
    axios
      .delete(`${API_BASE_URL}/designation/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete position sucessfully..");
        getPositions();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //edit

  const [formData2, setFormData2] = useState([
    {
      position_name: "",
      position_details: "",
      created_by:"",
    },
  ]);
  const [isModalOpen2, setIsModalOpen2] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen2(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/designation/${id}`).then((response) => {
      console.log("data recive", response.data);

      setFormData2({
        position_name: response.data.data.position_name,
        position_details: response.data.data.position_details,
        created_by:response.data.data.created_by,
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
  if (!formData2.position_name.trim()) {
    toast.error("Please enter Position Name.");
    return;
  }
  if (!formData2.position_details.trim()) {
    toast.error("Please enter Position Details.");
    return;
  }

  axios
    .put(`${API_BASE_URL}/designation/${editId}`, formData2, {
      headers: {
        Authorization: token
      }
    })
    .then(() => {
      toast.success("Updated Successfully!");
      getPositions();
      setIsModalOpen2(false); // Close the modal after submission
    })
    .catch((error) => {
      console.error("Error updating data:", error);
      toast.error("Something went wrong while updating designation.");
    });
};



  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/designation`,{
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

      Position_Name: item.position_name ? `${item.position_name}` : "No add on Found",
      Position_Details: item.position_details,
     
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
      { header: "Position Name", key: "position_name" },
      { header: "Description", key: "description" },
    
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        position_name: item.position_name ? `${item.position_name}` : "No add on Found",
        description: item.position_details,
        
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
      item.position_name ? `${item.position_name}` : "No add on Found",
      item.position_details,
     
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
   autoTable(doc,{
      head: [["Position", "Description"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getPositions();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={isOpen ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Employees Designation
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>
              <HasPermission module="Designation" action="create">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
             gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Position
                </button>
              </HasPermission>
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
                    {position && position.length > 0 ? (
                      position
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
                                : "No  Info"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.position_details
                                ? row.position_details
                                : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Department"
                                  action="edit"
                                >
                                  <Tooltip message="Edit" key={row.pos_id}>
                                    <button
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      onClick={() =>
                                        handleEditClick(row.pos_id)
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
                                          handleDeleteClick(row.pos_id)
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

            {/* Pagination */}

            <div className="flex justify-between mt-7">
              {position.length > 0 && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(position.length / itemsPerPage))].map(
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
                        currentPage ===
                        Math.ceil(position.length / itemsPerPage)
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
      <DialogBoxSmall
        title={"Create New Designation"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
        <div className="">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded px-8  pb-8 mb-4"
          >
            <div className="">
              <div className="mb-2 mt-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Position*
                </label>
                <input
                  type="text"
                  onChange={handleChange}
                  value={formData.position_name}
                  name="position_name" // Ensure name matches the key in formData
                  placeholder="Position"
                  className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                />
              </div>

              <div className="mb-2 mt-5">
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Details*
                </label>
                <textarea
                  onChange={handleChange}
                  value={formData.position_details}
                  name="position_details" // Ensure name matches the key in formData
                  className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                ></textarea>
              </div>

              <div className="flex mt-4 float-right gap-x-3">
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
          </form>
        </div>
      </DialogBoxSmall>

      {isModalOpen2 && (
       <>
       <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
         <div className="w-1/3 px-5">
           <div className="py-6 bg-white rounded-lg shadow-lg border border-gray-300">
             <div className="flex py-2 px-4 justify-between items-center border-b border-gray-300">
               <h2 className="text-2xl font-semibold text-gray-800">Edit Designation</h2>
               <button
                 onClick={() => setIsModalOpen2(false)}
                 className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded-sm transition duration-200"
               >
                 X
               </button>
             </div>
             <div className="p-4">
               <form onSubmit={handleSubmit2} className="space-y-4">
                 <div>
                   <label className="block mb-1 text-sm font-medium text-gray-700">
                     Position*
                   </label>
                   <input
                     type="text"
                     onChange={handleChange2}
                     value={formData2.position_name}
                     name="position_name"
                     placeholder="Position"
                     className="shadow-sm w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1] focus:border-transparent"
                   />
                 </div>
     
                 <div>
                   <label className="block mb-1 text-sm font-medium text-gray-700">
                     Details*
                   </label>
                   <textarea
                     onChange={handleChange2}
                     value={formData2.position_details}
                     name="position_details"
                     className="shadow-sm w-full border border-gray-300 rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1] focus:border-transparent"
                     rows="4"
                     placeholder="Enter details here..."
                   ></textarea>
                 </div>
     
                 <div className="flex justify-end">
                   <button
                     className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded-md hover:bg-[#1A1B2E] transition duration-200 focus:outline-none focus:shadow-outline"
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

export default Designation;
