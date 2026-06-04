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
import { AuthContext } from "../../store/AuthContext";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";
const ActionButtion = [
  { btn: "Copy" },
  { btn: "CSV" },
  { btn: "Excel" },
  { btn: "PDF" },
  { btn: "Column Visiblity" },
];
const headers = ["SL.", "Expense Item Name", "Action"];
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

const Addexpense_item = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [searchName, setSearchName] = useState("");
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expenseItems, setExpenseItems] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [expense_item_name, setExpense_item_name] = useState();
const token = localStorage.getItem("token");
  // get all list

  const getExpenseItem = () => {
    axios
      .get(`${API_BASE_URL}/expense`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        setExpenseItems(response.data.data);
        console.log("data aaya", response.data);
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
    // Reset to the first page when searching
    setCurrentPage(1);
    if (value.trim() === "") {
      getExpenseItem();
      return;
    }

    axios
      .get(`${API_BASE_URL}/expense`, {
        params: { searchItem: value },
        headers:{
            Authorization:token}
      })
      .then((res) => {
        setExpenseItems(res.data.data.length > 0 ? res.data.data : []);
      
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  //post data
 const handleSubmit = (e) => {
  e.preventDefault();

  if (!expense_item_name) {
    toast.error("Expense item name cannot be empty.");
    return;
  }

  axios
    .post(
      `${API_BASE_URL}/expense`,
      { expense_item_name }, // <- data (body)
      {
        headers: {
          Authorization: token,
        },
      }
    )
    .then(() => {
      console.log(expense_item_name);
      toast.success("Item Expense added successfully.");
      setIsModalOpen(false);
      setExpense_item_name("");
      getExpenseItem(); // Refresh the expense items list
    })
    .catch((error) => {
      console.error(error);
      toast.error("Error in adding expense.");
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
    DeleteExpense(deleteModalId);
    handleModalClose();
  };
  const DeleteExpense = (id) => {
    axios
      .delete(`${API_BASE_URL}/expense/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete  sucessfully..");
        getExpenseItem();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  //edit

  const [isModalOpen2, setIsModalOpen2] = useState(false);

  const [editExpense, setEditExpense] = useState("");
  const [editId, setEditId] = useState(null);
const [createdby,setCreatedby]=useState("")
  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen2(true);

    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/expense/${id}`).then((response) => {
      console.log("data received", response.data);

      // Assuming your response structure is correct as per your data example
      const data = response.data.data; // Access the first element of the array
      setEditExpense(data.expense_item_name);
      setCreatedby(data.created_by)
    });
  };

  const handleSubmit2 = async (e) => {
    e.preventDefault();

    const expense_item_name = editExpense;
    const created_by = createdby;

    try {
      await axios.put(`${API_BASE_URL}/expense/${editId}`, {
        expense_item_name,
        created_by
      });
      toast.success("Updated Successfully!");
      getExpenseItem();
      setIsModalOpen2(false); // Close the modal after submission
    } catch (error) {
      toast.error("Error updating data. Please try again.");
      console.error("Error updating data:", error);
    }
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(expenseItems.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };



  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expense`);
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

      Expense_Item_Name: item.expense_item_name ? `${item.expense_item_name}` : "No add on Found",
      
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
      { header: "Expense Item Name", key: "expense_item_name" },
     
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        expense_item_name: item.expense_item_name,
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
      item.expense_item_name,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
  autoTable(doc,{
      head: [["Expense_Item_Name"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };









  useEffect(() => {
    getExpenseItem();
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
              <h1 className=" font-semibold mb-3">Manage Expense List</h1>

              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>
              <HasPermission module="Addexpense Item" action="create">
                <button
                  onClick={() => {
                    setIsModalOpen(true);
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
             gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Expense Item
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
                    {expenseItems && expenseItems.length > 0 ? (
                      expenseItems
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
                              {row.expense_item_name
                                ? row.expense_item_name
                                : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Addexpense Item"
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
                                  module="Addexpense Item"
                                  action="delete"
                                >
                                  <Tooltip message="Delete">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.id)
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
              {expenseItems && (
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
                      ...Array(Math.ceil(expenseItems.length / itemsPerPage)),
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
                        Math.ceil(expenseItems.length / itemsPerPage)
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
        title={"Add Expense Item"}
        onClose={() => {
          setIsModalOpen(false);
        }}
        isOpen={isModalOpen}
      >
        <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-lg">
  <form onSubmit={handleSubmit} className="space-y-6">
    <div className="flex flex-col">
      <div className="mb-4">
        <label
          className="block text-gray-700 font-semibold mb-2"
          htmlFor="expense_item_name"
        >
          Expense Item Name *
        </label>
        <input
          className="shadow border border-[#4CBBA1] rounded-md py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1]"
          type="text"
          name="expense_item_name"
          placeholder="Item Name"
          value={expense_item_name}
          onChange={(e) => {
            setExpense_item_name(e.target.value);
          }}
        />
      </div>

      <div className="flex justify-end gap-x-3">
        <button
          className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#90d8c7] transition duration-200"
          type="reset"
        >
          Reset
        </button>
        <button
          className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#1A1B2E] transition duration-200"
          type="submit"
        >
          Save
        </button>
      </div>
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
              <h2 className="text-xl font-semibold">Edit Expense</h2>
              <button
                onClick={() => setIsModalOpen2(false)}
                className="text-white bg-red-500 hover:bg-red-600 px-3 py-1 rounded transition duration-200"
              >
                X
              </button>
            </div>
            <div className="p-4">
              <form onSubmit={handleSubmit2} className="space-y-4">
                <div className="flex flex-col">
                  <label
                    className="block text-gray-700 font-semibold mb-2"
                    htmlFor="expense_item_name"
                  >
                    Expense Item Name *
                  </label>
                  <input
                    className="shadow border border-[#4CBBA1] rounded-md py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-[#4CBBA1] w-full" // Adjusted width
                    type="text"
                    name="expense_item_name"
                    placeholder="Item Name"
                    value={editExpense}
                    onChange={(e) => {
                      setEditExpense(e.target.value);
                    }}
                  />
                </div>
    
                <div className="flex justify-end gap-x-3">
                  <button
                    className="bg-[#4CBBA1] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#90d8c7] transition duration-200" // Adjusted button size
                    type="reset"
                  >
                    Reset
                  </button>
                  <button
                    className="bg-[#1C1D3E] text-white w-[90px] h-[36px] rounded-md focus:outline-none focus:shadow-outline hover:bg-[#1A1B2E] transition duration-200" // Adjusted button size
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

export default Addexpense_item;
