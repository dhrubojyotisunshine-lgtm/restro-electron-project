import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import DialogBox from "../../components/DialogBox";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { AuthContext } from "../../store/AuthContext";
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

const MenuType = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const token = localStorage.getItem("token");
  const [data, setData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [menuModal, setMenuModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [file, setFile] = useState(null);
  const [selectedmenutype, setSelectedmenutype] = useState(null);
  const [searchName, setSearchName] = useState("");
  const [menuData, setMenuData] = useState({
    menutype: "",
    status: 1,
  });
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [errors, setErrors] = useState({
  menutype: ""
});

const [editErrors, setEditErrors] = useState({
  menutype: ""
});
  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsModalOpen(false);

        setMenuModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

 
  const headers = ["SL.", "Menu Type", "Action"];

  const handleChange = (e) => {
    setMenuData({ ...menuData, [e.target.name]: e.target.value });
  };

  

 
  // edit
  const [formData2, setFormData2] = useState({
    menutype: "",
  
    status: 1,
    created_by:""
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const [selectedFile2, setSelectedFile2] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/menutype/${id}`).then((response) => {
      setFormData2({
        menutype: response.data.data.menutype,
      
        status: response.data.data.status,
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


 const newErrors = {};
  if (!formData2.menutype.trim()) {
    newErrors.menutype = "Menu Type is required";
  }
  
  setEditErrors(newErrors);
  
  // If there are errors, don't submit
  if (Object.keys(newErrors).length > 0) {
    return;
  }
  // Create FormData instance to handle both text and file data
  const updatedData = new FormData();
  updatedData.append("menutype", formData2.menutype);
  updatedData.append("status", formData2.status);
  updatedData.append("created_by", formData2.created_by);

  axios
    .put(`${API_BASE_URL}/menutype/${editId}`, updatedData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then(() => {
      toast.success("Menu updated successfully!");
      getMenuData();
      setIsModalOpen(false); // Close the modal after submission
    })
    .catch((error) => {
      console.error("Error updating data:", error);
      toast.error("Something went wrong while updating menu.");
    });
};


  const handleDeleteClick = (menutypeid) => {
    setSelectedmenutype(menutypeid);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedmenutype(null);
  };
  const handleModalDelete = () => {
    deleteMenuType(selectedmenutype);
    handleModalClose();
  };
  const deleteMenuType = (id) => {
    axios
      .delete(`${API_BASE_URL}/menutype/${id}`)
      .then((res) => {
        console.log(res.data);
        toast.success(res.data.message);
        getMenuData();
      })
      .catch((err) => {
        console.error("Error deleting menuType:", err);
      });
  };

  const getMenuData = () => {
    axios
      .get(`${API_BASE_URL}/menutype`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        setData(response.data.data);
      })
      .catch((err) => console.log(err));
  };

  // filter data
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getMenuData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/menutype`, {
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

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/menutype`,{
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

      Menu_Type: item.menutype ? `${item.menutype}` : "No menutype Found",
     
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
      { header: "Menu Type", key: "menu_type" },
   
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        menu_type: item.menutype ? `${item.menutype}` : "No menutype Found",
     
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
      item.menutype ? `${item.menutype}` : "No menutype Found",
  
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc,{
      head: [["Menu Type"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getMenuData();
  }, []);

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  const handleSubmit = (e) => {
    e.preventDefault();
      const newErrors = {};
  if (!menuData.menutype.trim()) {
    newErrors.menutype = "Menu Type is required";
  }
  
  setErrors(newErrors);
  
  // If there are errors, don't submit
  if (Object.keys(newErrors).length > 0) {
    return;
  }
    const formData = new FormData();
    formData.append("menutype", menuData.menutype);
 
    formData.append("status", menuData.status);

    axios
      .post(`${API_BASE_URL}/menutype`, formData,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        toast.success("Menu Type added successfully");
        getMenuData();
        setMenuData({
          menutype: "",
       
          status: "",
        });
      
        setMenuModal(false);
      })
      .catch((err) => console.log(err));
  };

  useEffect(() => {
    getMenuData();
  }, []);

  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div className={`${!isOpen ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="content_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Menu Type
              </h1>
              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className="flex justify-between mt-11">
              <span></span>

              <HasPermission module="Menu Type" action="create">
                <button
                  onClick={() => setMenuModal(true)}
                  className="bg-[#4CBBA1] h-[46px] text-nowrap w-[200px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className="font-semibold text-lg" />
                  Add Menu Type
                </button>
              </HasPermission>
            </div>
            {/* Search Bar */}
            <div className="mt-11 w-full">
              <section className="tablebutton">
                <div className="orderButton flex flex-wrap justify-center sm:justify-evenly gap-y-4 gap-x-5">
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

                  <div className="flex m-auto px-4 rounded-md border-[1px] border-gray-900">
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search menu..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
                    <button
                      onClick={handleSearch}
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
                                {row.menutype}
                              </td>
                             
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">
                                  <HasPermission
                                    module="Menu Type"
                                    action="edit"
                                  >
                                    <Tooltip message="Edit">
                                      <button
                                        onClick={() =>
                                          handleEditClick(row.menutypeid)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegEdit />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>

                                  <HasPermission
                                    module="Menu Type"
                                    action="delete"
                                  >
                                    <Tooltip message="Delete MenuType">
                                      <div>
                                        <button
                                          className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                          onClick={() =>
                                            handleDeleteClick(row.menutypeid)
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
                          <td colSpan="4" className="py-2 px-4 text-center">
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
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(data.length / 5))].map((_, index) => {
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
                      disabled={currentPage === Math.ceil(data.length / 5)}
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
    <DeleteModal
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
        type={"Menu type"}
      />
      <DialogBox
        title={"Add Menu Type"}
        onClose={() => setMenuModal(false)}
        isOpen={menuModal}
      >
        <div className="p-14">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700">Menu Type*</label>
              <input
                type="text"
                placeholder="Menu Type"
                name="menutype"
                value={menuData.menutype}
                onChange={handleChange}
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              />
                {errors.menutype && <p className="text-red-500 text-sm mt-1">{errors.menutype}</p>}
            </div>
           
            <div className="mb-4">
              <label className="block text-gray-700">Status</label>
              <select
                name="status"
                value={menuData.status}
                onChange={handleChange}
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                required
              >
                <option value="1">Active</option>
                <option value="0">Inactive</option>
              </select>
            </div>
            <div className="flex float-right gap-x-3">
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
          </form>
        </div>
      </DialogBox>

      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-1/3 px-20">
              <div className="py-4 bg-white rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex py-5 px-4 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl font-semibold">Edit Menu Type</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className="p-4">
                  <form className="py-5" onSubmit={handleSubmit2}>
                    <div className="mb-4">
                      <label className="block text-gray-700">Menu Type*</label>
                      <input
                        type="text"
                        placeholder="Menu Type"
                        name="menutype"
                        value={formData2.menutype}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                        {editErrors.menutype && <p className="text-red-500 text-sm mt-1">{editErrors.menutype}</p>}
                    </div>
                    
                    <div className="mb-4">
                      <label className="block text-gray-700">Status</label>
                      <select
                        name="status"
                        value={formData2.status}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                    <div className="flex float-right gap-x-3">
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
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
        </>
      )}
    </>
  );
};
export default MenuType;
