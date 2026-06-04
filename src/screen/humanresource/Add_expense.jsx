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
import { data } from "autoprefixer";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";
const headers = ["SL.", "Expense Item Name", , "Date", "Amount", "Action"];
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

const Add_expense = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [isOpen, setOpen] = useState(true);
  const [expense, setExpense] = useState([]);
  const [expenseItems, setExpenseItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(expense.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // to show all data in page
  const getExpense = () => {
    axios
      .get(`${API_BASE_URL}/expensepage`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setExpense(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  // to show expense item dropdown

  const getExpenseItem = () => {
    axios
      .get(`${API_BASE_URL}/expense`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setExpenseItems(response.data.data);
        console.log("data aaya", response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // search table
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getExpense();
      return;
    }

    axios
      .get(`${API_BASE_URL}/expensepage`, {
        params: { seachItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setExpense(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  //paynment
  // paynment method
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(1);
  const handleMethodChange = (event) => {
    setSelectedMethod(Number(event.target.value));
  };

  const allPaynmnetMethod = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/paynmenttype`, {
        headers: {
          Authorization: token,
        },
      });
      setPaymentMethod(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  const [formdata, setFormdata] = useState({
    type: "",
    paytype: selectedMethod,
    amount: "",
    VDate: "",
  });
  const hendelchange = (e) => {
    setFormdata({
      ...formdata,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // Destructure the formdata for easier access to individual fields
    const { type, paytype, amount, VDate } = formdata;

    // Check if any field is empty
    if (!type || !paytype || !amount || !VDate) {
      toast.error("Please fill in all required fields");
      return; // Stop form submission if any field is empty
    }

    // Proceed with form submission if all fields are filled
    axios
      .post(`${API_BASE_URL}/expensepage`, formdata, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        toast.success("Expense added successfully");
        getExpense(); // Refresh expense list
        setIsModalOpen(false); // Close the modal
        setFormdata({
          type: "",
          paytype: selectedMethod,
          amount: "",
          VDate: "",
        });
      })
      .catch((error) => {
        console.error(error);
        toast.error("Error in adding expense");
      });
  };

  const handleDeleteClick = (voucher_no) => {
    setDeleteModalId(voucher_no);
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
      .delete(`${API_BASE_URL}/expensepage/${deleteModalId}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("delete Expense sucessfully..");
        getExpense();
      })
      .catch((err) => {
        console.log(err);
        toast.error("Error in Delete Data");
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/expensepage`, {
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

      Expense_Item_Name: item.expense_item_name
        ? `${item.expense_item_name}`
        : "No add on Found",
      Price: item.amount,
      Date: new Date(item.date).toLocaleDateString(),
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
      { header: "Price", key: "price" },
      { header: "Date", key: "date" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        expense_item_name: item.expense_item_name
          ? `${item.expense_item_name}`
          : "No add on Found",
        price: item.amount,
        date: new Date(item.date).toLocaleDateString(),
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
      item.amount,
      new Date(item.date).toLocaleDateString(),
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Expense_Item_Name", "Price", "date"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getExpense();
    getExpenseItem();
    allPaynmnetMethod();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className="side_section flex">
          <div
            className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className=" font-semibold mb-3"> Expense List</h1>

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

              <HasPermission module="Add Expense" action="create">
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
                    {expense && expense.length > 0 ? (
                      expense
                        .slice(
                          (currentPage - 1) * itemsPerPage,
                          currentPage * itemsPerPage,
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
                              {row.date
                                ? new Date(row.date).toLocaleDateString()
                                : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.amount ? row.amount : "No  Info"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                {/* <Tooltip message="Edit" key={row.id}>
                                  <button
                                    className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    onClick={() => handleEditClick(row.id)}
                                  >
                                    <FaRegEdit />
                                  </button>
                                </Tooltip> */}

                                <HasPermission
                                  module="Add Expense"
                                  action="delete"
                                >
                                  <Tooltip message="Delete">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.voucher_no)
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
              {expense && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(expense.length / itemsPerPage))].map(
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
                      },
                    )}
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={
                        currentPage === Math.ceil(expense.length / itemsPerPage)
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
        title={"Add Expense"}
        onClose={() => setIsModalOpen(false)}
        isOpen={isModalOpen}
      >
        <div className="w-full max-w-2xl mx-auto mt-[6vh] bg-white rounded-xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* TOP GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Date */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Date *
                </label>
                <input
                  type="date"
                  name="VDate"
                  value={formdata.VDate}
                  onChange={hendelchange}
                  required
                  className="border border-[#4CBBA1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4CBBA1]"
                />
              </div>

              {/* Expense Item */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Expense Item *
                </label>
                <select
                  name="type"
                  value={formdata.type}
                  onChange={hendelchange}
                  required
                  className="border border-[#4CBBA1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4CBBA1]"
                >
                  <option value="">Select</option>
                  {expenseItems.map((val) => (
                    <option key={val.id} value={val.id}>
                      {val.expense_item_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Payment Method */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Payment Method *
                </label>
                <select
                  value={selectedMethod}
                  onChange={handleMethodChange}
                  required
                  className="border border-[#4CBBA1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4CBBA1]"
                >
                  {paymentMethod.map((method, index) => (
                    <option key={index} value={method.payment_method_id}>
                      {method.payment_method}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount */}
              <div className="flex flex-col">
                <label className="text-sm font-semibold text-gray-700 mb-1">
                  Amount *
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formdata.amount}
                  onChange={hendelchange}
                  required
                  className="border border-[#4CBBA1] rounded-lg px-3 py-2 focus:ring-2 focus:ring-[#4CBBA1]"
                />
              </div>
            </div>

            {/* CARD PAYMENT SECTION */}
            {(selectedMethod === 9 || selectedMethod === 1) && (
              <div className="border rounded-xl p-5 bg-gray-50">
                <h2 className="text-base font-semibold mb-4 text-gray-800">
                  Payment Information
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm">Card Number</label>
                    <input
                      placeholder="0000 0000 0000 0000"
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm">Card Holder</label>
                    <input
                      placeholder="Full Name"
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm">Expiry</label>
                    <input
                      placeholder="MM / YY"
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-sm">CVV</label>
                    <input
                      placeholder="000"
                      className="w-full border rounded-lg px-3 py-2"
                      required
                    />
                  </div>
                </div>
              </div>
            )}

            {/* FOOTER */}
            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="bg-[#1C1D3E] text-white px-6 py-2 rounded-lg hover:bg-[#11122b] transition"
              >
                Save Expense
              </button>
            </div>
          </form>
        </div>
      </CategoryDialogBox>

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />
    </>
  );
};

export default Add_expense;
