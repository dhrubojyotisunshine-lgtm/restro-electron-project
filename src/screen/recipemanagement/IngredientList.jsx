import React, { useState, useEffect, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import DialogBox from "../../components/DialogBox";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { AuthContext } from "../../store/AuthContext";
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

const IngredientList = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const headers = ["SL.", "Ingredient Name", "Unit Name", "Action"];
 const token = localStorage.getItem("token");
  const [ingredientModal, setIngredientModal] = useState(false);
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [IngredientData, setIngredientData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageLimit] = useState(10);
  const [searchName, setSearchName] = useState("");

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const totalPages = Math.ceil(IngredientData.length / itemsPerPage);

  const selectPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  const startPage = Math.floor((currentPage - 1) / pageLimit) * pageLimit + 1;
  const endPage = Math.min(startPage + pageLimit - 1, totalPages);

  const [formdata, setFormdata] = useState({
    uom_short_code: "",
    ingredient_name: "",
    min_stock: 0,
    status: "1", // Default status to 1
  });

  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  // delete
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
      .delete(`${API_BASE_URL}/ingredients/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("delete customer sucessfully..");
        Ingredient();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const SubmitIngrident = (e) => {
    e.preventDefault();

    if (!formdata.ingredient_name) {
      toast.error("Ingredient name  is required");
      return;
    }

    if (!formdata.uom_short_code) {
      toast.error("Unit Name is required");
      return;
    }

    axios
      .post(`${API_BASE_URL}/ingredients`, formdata,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        console.log(res.data);
        setIngredientModal(false); // Close the modal after successful submission
        setFormdata({
          // Reset form data to initial state
          uom_short_code: "",
          ingredient_name: "",
          min_stock: 0,
          status: "1",
        });
        toast.success("Ingredient add sucessfully.");
        Ingredient(); // Refresh the ingredient data
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const Ingredient = () => {
    axios
      .get(`${API_BASE_URL}/ingredients`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        setIngredientData(res.data.data);
        console.log(res.data.data);
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
      Ingredient();
      return;
    }

    axios
      .get(`${API_BASE_URL}/ingredients`, {
        params: { searchItem: value }
        ,
        headers:{
          authorization: token
          }
      })
      .then((res) => {
        setIngredientData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // toast.error("Error fetching filtered data");
      });
  };

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

  // edit

  const [formData2, setFormData2] = useState({
    ingredient_name: "",
    Unit_Name: "",
    is_active: 1,
    min_stock: "",
    created_by:"",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/ingredients/${id}`).then((response) => {
      setFormData2({
        ingredient_name: response.data.data.ingredient_name,
        Unit_Name: response.data.data.Unit_Name,
        is_active: response.data.data.is_active,
        min_stock: response.data.data.min_stock,
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
    axios
      .put(`${API_BASE_URL}/ingredients/${editId}`, formData2)
      .then(() => {
        toast.success("Unit updated sucessfullu!");
        Ingredient();
        setIsModalOpen(false); // Close the modal after submission
      })
      .catch((error) => {
        console.error("Error updating data:", error);
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/ingredients`,{
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
      Ingredient_Name: item.ingredient_name,
      Unit_Name: item.Unit_Name,
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
      { header: "Ingredient_Name", key: "ingredient_name" },
      { header: "Unit_Name", key: "unit_name" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        ingredient_name: item.ingredient_name,
        unit_name: item.Unit_Name,
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
    const rows = data.map((item) => [item.ingredient_name, item.Unit_Name]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Ingredient_Name", "Unit_Name"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    GetUnitData();
    Ingredient();
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
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Ingredient List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            <div className="flex justify-between mt-11">
              <span></span>
              <HasPermission module="Ingredients" action="create">
                <button
                  onClick={() => setIngredientModal(true)}
                  className="bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className="font-semibold text-lg" />
                  Add Ingredient
                </button>
              </HasPermission>
            </div>
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
                      {IngredientData.length > 0 ? (
                        IngredientData.slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage
                        ).map((row, index) => (
                          <tr key={index}>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {index + 1}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.ingredient_name}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.Unit_Name}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                {/* Tooltip for Edit Button */}
                                <HasPermission
                                  module="Ingredients"
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
                                  module="Ingredients"
                                  action="delete"
                                >
                                  <Tooltip message="Delete">
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
                          <td
                            colSpan={4} // Adjust column span based on your table headers
                            className="text-center py-4"
                          >
                            No data found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <div className="flex justify-between mt-7">
              {IngredientData.length > 0 && (
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
                      ...Array(Math.ceil(IngredientData.length / itemsPerPage)),
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
                        Math.ceil(IngredientData.length / itemsPerPage)
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
        title={"Add Ingredient"}
        onClose={() => setIngredientModal(false)}
        isOpen={ingredientModal}
      >
          <div className="">
            <form onSubmit={SubmitIngrident}>
              <div className="mb-4">
                <label className="block text-gray-700" htmlFor="">
                  Unit Name*
                </label>
                <select
                  className="shadow border w-full border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  id=""
                  name="uom_short_code"
                  value={formdata.id}
                  onChange={handleChange}
                >
                  <option value="">Select option</option>
                  {data.map((val, index) => (
                    <option key={index} value={val.id}>
                      {val.uom_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Ingredient Name*</label>
                <input
                  type="text"
                  placeholder="Ingredient Name"
                  name="ingredient_name"
                  value={formdata.ingredient_name}
                  onChange={handleChange}
                  className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Re-Stock Level</label>
                <input
                  type="number"
                  placeholder="0"
                  min={0}
                  name="min_stock"
                  value={formdata.min_stock}
                  onChange={handleChange}
                  className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">Status</label>
                <select
                  className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  name="status"
                  value={formdata.status}
                  onChange={handleChange}
                >
                  <option value="1">Active</option>
                  <option value="0">Inactive</option>
                </select>
              </div>
              <div className="flex float-right gap-x-3">
                <button
                  className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                  type="reset"
                  onClick={() =>
                    setFormdata({
                      // Reset form data to initial state
                      uom_short_code: "",
                      ingredient_name: "",
                      min_stock: "",
                      status: "1",
                    })
                  }
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
      </DialogBoxSmall>

      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none  ">
            <div className=" w-auto">
              <div className="py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex  py-2 px-2 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl  font-semibold">Edit Ingredient</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className=" p-3">
                  <form className=" p-5" onSubmit={handleSubmit2}>
                    <div className="mb-4">
                      <label className="block text-gray-700" htmlFor="">
                        Unit Name
                      </label>
                      <select
                        className="shadow border w-full border-[#4CBBA1] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id=""
                        name="Unit_Name"
                        value={formData2.Unit_Name || ""}
                        onChange={handleChange2}
                      >
                        <option value="">Select option</option>
                        {data.map((val, index) => (
                          <option key={index} value={val.uom_short_code}>
                            {val.uom_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700">
                        Ingredient Name
                      </label>
                      <input
                        type="text"
                        placeholder=" Ingredient Name"
                        name="ingredient_name"
                        value={formData2.ingredient_name || ""}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>

                    <div className="mb-4">
                      <label className="block text-gray-700">
                        Re-Stock Level
                      </label>
                      <input
                        type="number"
                        placeholder="Re-Stock Level"
                        name="min_stock"
                        value={formData2.min_stock || ""}
                        onChange={handleChange2}
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-gray-700">Status</label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        name="status"
                        value={formData2.is_active || ""}
                        onChange={handleChange2}
                      >
                        <option value="">Select option</option>
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>
                    <div className="flex float-right gap-x-3">
                     
                      <button
                        className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                      >
                        Update
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

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </>
  );
};

export default IngredientList;
