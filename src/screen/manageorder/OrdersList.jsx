import React, { useEffect, useState, useRef, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { useReactToPrint } from "react-to-print";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import InvoiceDialogBox from "../../components/InvoiceDialogBox";
import PaynmentDialogBox from "../../components/PaynmentDialogBox";
import { InvoiceDialogBox2 } from "../../components/InvoiceDialogeBox2";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { writeCSV } from "papaparse";
import Papa from "papaparse";
import ExcelJS from "exceljs";
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

const OrdersList = () => {
  const navigate = useNavigate();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [orderListData, setOrderListData] = useState([]);
  const [isDeletOpen, setIsDeletOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [invoiceData, setInvoiceData] = useState([]);
  const [billData, setBillData] = useState([]);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState();
  const [paynmentModal, setPaynmentModal] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageLimit] = useState(10);
  //filter data
  const token = localStorage.getItem("token");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const ActionButtion = [{ btn: "CSV" }, { btn: "Excel" }, { btn: "PDF" }];
  const headers = [
    "SL.",
    "Invoice",
    "Customer Name ",
    "Waiter",
    "Table No.",
    "Paynment Status",
    " Order Date",
    "Amount",
    "Action",
  ];
  //delete id

  const closeModaldelete = () => setIsDeletOpen(false);

  // Number of pages to show at once

  const getDisplayedPages = () => {
    const totalPages = Math.ceil(orderListData.length / itemsPerPage);
    const maxPageButtons = 10; // Maximum number of buttons to show
    const pages = [];

    // Calculate start and end of visible page range
    let start = Math.max(currentPage - Math.floor(maxPageButtons / 2), 1);
    let end = Math.min(start + maxPageButtons - 1, totalPages);

    // Adjust the start if end exceeds totalPages
    if (end - start < maxPageButtons - 1) {
      start = Math.max(end - maxPageButtons + 1, 1);
    }

    // Add the visible pages to the array
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis if there are more pages beyond the visible range
    if (start > 1) pages.unshift("...");
    if (end < totalPages) pages.push("...");

    return pages;
  };
  const selectPage = (page) => {
    if (page === "...") return; // Ignore clicks on ellipsis
    if (page > 0 && page <= Math.ceil(orderListData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // get all data

  const fetchAllOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filterdata`, {
        headers: {
          Authorization: token,
        },
      });
      setOrderListData(response.data.data);
      console.log("All Orders:", response.data.data);
    } catch (error) {
      console.error("Error fetching all orders:", error);
      toast.error("Error fetching all orders");
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates or serach");
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/filterdata`, {
        params: {
          from: fromDate,
          to: toDate,
        },
        headers: {
          Authorization: token,
        },
      });
      setOrderListData(response.data.data); // Update the displayed data
      console.log("Filtered Data:", response.data.data);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      toast.error("Error fetching filtered data");
    }
  };

  const handleSearch2 = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    axios
      .get(`${API_BASE_URL}/filterdata`, {
        params: { searchName: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setOrderListData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  const handleReset = () => {
    setFromDate("");
    setToDate("");
    fetchAllOrders("");
  };

  // print data
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const showBillDetails = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getOrderById/${order_id}`,
      );
      setBillData([response.data]); // Set the data first
      console.log("Bill me daal na h ye data ", response.data);
      // Delay the print action until after the state has been updated
      setTimeout(() => {
        handlePrint(); // Trigger the print
      }, 100); // A small timeout to ensure state update
    } catch (error) {
      console.error(error);
    }
  };

  const showInvoiceData = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getOrderById/${order_id}`,
      );
      setInvoiceData([response.data]);
      setInvoiceDataModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const showPaynment = (order_id) => {
    axios
      .get(`${API_BASE_URL}/getOrderById/${order_id}`)
      .then((response) => {
        setPaymentData(response.data);
        setPaynmentModal(true);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  useEffect(() => {
    if (paymentData) {
      console.log("paydata", paymentData);
    }
  }, [paymentData]);

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

  const deleteOrder = (order_id) => {
    setSelectedOrderId(order_id);
    setIsDeletOpen(true);
  };

  const DeletModal = ({ isOpen, onClose, order_id }) => {
    if (!isOpen) return null;
    const [anyreason, setAnyreason] = useState(""); // renamed to match backend

    const cancelOrder = (order_id) => {
      axios
        .post(
          `${API_BASE_URL}/cancelOrder/${order_id}`,
          { anyreason },
          { headers: { "Content-Type": "application/json" } },
        )
        .then((response) => {
          console.log(response.data);
          fetchAllOrders(); // Assuming this fetches updated order data
          onClose(); // Close modal after successful cancellation
          toast.success("Order cancel sucessfully.");
        })
        .catch((error) => {
          console.error(error);
        });
    };
    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          {/* Background Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-55"></div>

          {/* Modal Container */}
          <div className="relative bg-white rounded-lg shadow-lg w-1/4 p-5 border border-gray-300">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-3">
              <h2 className="text-lg font-semibold">Cancel Order</h2>
              <button
                onClick={onClose}
                className="text-white bg-red-500 px-3 py-1 rounded-md hover:bg-red-600"
              >
                X
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <h1 className="font-medium">Order ID:</h1>
                <span className="text-gray-700">{order_id}</span>
              </div>

              <div>
                <label className="font-medium">Cancel Reason:</label>
                <textarea
                  rows={3}
                  id="message"
                  name="message"
                  required
                  placeholder="Enter reason..."
                  className="w-full p-2 text-sm border rounded border-gray-300 focus:ring-2 focus:ring-teal-400"
                  value={anyreason}
                  onChange={(e) => setAnyreason(e.target.value)}
                ></textarea>
              </div>

              <button
                onClick={() => cancelOrder(order_id)}
                className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  // Callback to refresh the order list after payment
  const refreshOrderList = () => {
    handleSearch();
    fetchAllOrders();
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/filterdata`, {
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
    try {
      const data = await fetchData(); // Fetch data

      const csvData = data.map((item) => ({
        // Map your data structure as needed
        Invoice: item.saleinvoice,
        Customer_Name: item.customer_name,
        Waiter:
          item.waiter_first_name && item.waiter_last_name
            ? `${item.waiter_first_name} ${item.waiter_last_name}`
            : "No Waiter Found",
        Table_No: item.table_no,
        Payment_Status: item.bill_status == 0 ? "Due" : "Paid",
        Order_Date: new Date(item.order_date).toLocaleDateString(), // Fix date formatting
        Amount: item.totalamount,
      }));

      const csvString = Papa.unparse(csvData); // Convert data to CSV format
      const blob = new Blob([csvString], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);

      // Trigger download
      const a = document.createElement("a");
      a.href = url;
      a.download = "sales_report.csv"; // CSV file name
      a.click();
      window.URL.revokeObjectURL(url); // Clean up the object URL
    } catch (error) {
      console.error("Error downloading CSV:", error);
    }
  };

  // download for EXCEL
  const downloadExcel = async () => {
    const data = await fetchData(); // Fetch your data

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Data");

    // Define the columns and map headers
    worksheet.columns = [
      { header: "Customer Name", key: "customer_name" },
      { header: "Waiter", key: "waiter" },
      { header: "Table Number", key: "table_number" },
      { header: "Payment Status", key: "payment_status" },
      { header: "Order date", key: "order_date" },
      { header: "Amount", key: "amount" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        customer_name: item.customer_name,
        waiter:
          item.waiter_first_name && item.waiter_last_name
            ? `${item.waiter_first_name} ${item.waiter_last_name}`
            : "No Waiter Found",
        table_number: item.table_no,
        payment_status: item.bill_status == 0 ? "Due" : "Paid",
        order_date: new Date(item.order_date).toLocaleDateString(), // Fix date formatting
        amount: item.totalamount,
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
      item.customer_name,
      item.waiter_first_name && item.waiter_last_name
        ? `${item.waiter_first_name} ${item.waiter_last_name}`
        : "No Waiter Found",
      item.table_no,
      item.bill_status == 0 ? "Due" : "Paid",
      new Date(item.order_date).toLocaleDateString(),
      item.totalamount,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Ensure autoTable is properly attached
    autoTable(doc, {
      head: [
        [
          "Customer Name",
          "Waiter",
          "Table Number",
          "Order Status",
          "Order Date",
          "Amount",
        ],
      ],
      body: rows,
      startY: 20, // Set table position
    });

    doc.save("data.pdf"); // PDF file name
  };

  const handleEditClick = (id) => {
    // Fetch data for the given ID
    navigate(`/edit-order/${id}`); // Navigate to the edit page with the role ID
  };

  // Fetch data on component mount
  useEffect(() => {
    handleSearch();
    allPaynmnetMethod();
    fetchAllOrders();
  }, []);

  return (
    <>
      <div className="main_div  ">
        <section className=" side_section flex">
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
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Order List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>
            {/* Search Bar */}
            <div className="mt-11 w-full">
              <section className="table_button">
                <div className="order_button flex flex-wrap gap-x-5 gap-y-5">
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
                </div>
              </section>
            </div>
            {/* Reset Button */}
            <div className="w-full mt-11 p-3 rounded-md border-[1px] border-[#4CBBA1]">
              <div className="flex  justify-evenly items-center">
                <div className="w-full sm:w-auto flex items-center justify-center m-auto px-4 rounded-md  border-[0.5px] border-gray-900">
                  <button className="px-4 text-[#0f044a] text-sm">
                    <FaMagnifyingGlass />
                  </button>
                  <input
                    value={searchName}
                    onChange={handleSearch2}
                    placeholder="Search order by details..."
                    type="search"
                    className="w-full sm:w-[450px] px-4 py-2 text-gray-700 leading-tight focus:outline-none"
                  />
                </div>
                <div className="search">
                  <form className="flex justify-center items-center gap-x-5">
                    <label htmlFor="from" className="font-semibold">
                      From
                    </label>
                    <input
                      type="date"
                      id="from"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      placeholder="From"
                      className="border rounded border-[#4CBBA1] p-2"
                    />

                    <label htmlFor="to" className="font-semibold">
                      To
                    </label>
                    <input
                      type="date"
                      id="to"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      placeholder="To"
                      className="border rounded border-[#4CBBA1] p-2"
                    />
                    <button
                      onClick={handleSearch}
                      type="button"
                      className="w-[85px] h-[32px] bg-[#4CBBA1] text-white rounded-sm"
                    >
                      Search
                    </button>
                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-[85px] h-[32px] bg-[#1C1D3E] text-white rounded-sm"
                    >
                      Reset
                    </button>
                  </form>
                </div>
              </div>
            </div>

            {/* Table data */}
            <section className=" tabledata">
              <div className=" w-full mt-10 drop-shadow-[#4CBBA1]">
                <div className="">
                  <table className="min-w-full bg-white">
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
                      {orderListData.length > 0 ? (
                        orderListData
                          .slice(
                            (currentPage - 1) * itemsPerPage,
                            currentPage * itemsPerPage,
                          )
                          .map((row, index) => (
                            <tr key={index} className="border-b text-center">
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {index + 1}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.saleinvoice}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.customer_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.waiter_first_name && row.waiter_last_name
                                  ? `${row.waiter_first_name} ${row.waiter_last_name}`
                                  : "No Waiter Found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.tablename ? row.tablename : "No Table"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.bill_status == 0 ? "Due" : "Paid"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {(() => {
                                  if (!row.bill_date) return "Not found";

                                  try {
                                    // Create date from bill_date only (assuming it's in YYYY-MM-DD format)
                                    const [year, month, day] =
                                      row.bill_date.split("-");

                                    // If we have order_time, use it too
                                    let date;
                                    if (row.order_time) {
                                      const [hours, minutes, seconds] =
                                        row.order_time.split(":");
                                      date = new Date(
                                        parseInt(year),
                                        parseInt(month) - 1, // months are 0-indexed
                                        parseInt(day),
                                        parseInt(hours),
                                        parseInt(minutes),
                                        parseInt(seconds),
                                      );
                                    } else {
                                      date = new Date(
                                        parseInt(year),
                                        parseInt(month) - 1,
                                        parseInt(day),
                                      );
                                    }

                                    // Check if date is valid
                                    if (isNaN(date.getTime()))
                                      return "Invalid Date";

                                    const formattedDate =
                                      date.toLocaleDateString("en-GB", {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      });

                                    const formattedTime =
                                      date.toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      });

                                    return `${formattedDate} ${formattedTime}`;
                                  } catch (error) {
                                    console.error(
                                      "Date formatting error:",
                                      error,
                                    );
                                    return "Date Error";
                                  }
                                })()}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.bill_amount}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex gap-x-2 font-bold">
                                  {row.bill_status !== 1 &&
                                    row.order_status !== 5 && (
                                      <Tooltip message="Edit">
                                        <button
                                          onClick={() =>
                                            handleEditClick(row.order_id)
                                          }
                                          className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                        >
                                          <FaRegEdit />
                                        </button>
                                      </Tooltip>
                                    )}
                                  <HasPermission
                                    module="Order List"
                                    action="access"
                                  >
                                    <Tooltip message="print">
                                      <button
                                        onClick={() => {
                                          showBillDetails(row.order_id);
                                        }}
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <IoDocumentTextOutline />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                  <HasPermission
                                    module="Order List"
                                    action="access"
                                  >
                                    {row.bill_status === 0 &&
                                      row.status === "completed" && (
                                        <Tooltip message="Payment">
                                          <button
                                            onClick={() =>
                                              showPaynment(row.order_id)
                                            }
                                            className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                          >
                                            <IoWalletOutline />
                                          </button>
                                        </Tooltip>
                                      )}
                                  </HasPermission>
                                  <HasPermission
                                    module="Order List"
                                    action="access"
                                  >
                                    <Tooltip
                                      message={
                                        row.status === "completed"
                                          ? "View Invoice"
                                          : "Invoice available after order complete"
                                      }
                                    >
                                      <button
                                        disabled={
                                          row.order_status === "completed"
                                        }
                                        onClick={() =>
                                          row.status === "completed" &&
                                          showInvoiceData(row.order_id)
                                        }
                                        className={`p-1 rounded-sm text-white hover:scale-105 ${
                                          row.status === "completed"
                                            ? "bg-[#1C1D3E] cursor-pointer"
                                            : "bg-gray-400 cursor-not-allowed"
                                        }`}
                                      >
                                        <FaRegEye />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>

                                  <HasPermission
                                    module="Order List"
                                    action="delete"
                                  >
                                    {row.bill_status !== 1 &&
                                      row.order_status !== 5 && (
                                        <Tooltip message="Cancel Order">
                                          <button
                                            onClick={() => {
                                              deleteOrder(row.order_id);
                                            }}
                                            className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                          >
                                            <FaRegTrashCan />
                                          </button>
                                        </Tooltip>
                                      )}
                                  </HasPermission>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={headers.length}
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

            {/* Pagination */}
            <div className="flex justify-between mt-7">
              {orderListData.length > 0 && (
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

                    {/* Page Numbers */}
                    {getDisplayedPages().map((page, index) => (
                      <button
                        onClick={() => selectPage(page)}
                        key={index}
                        className={`h-[46px] w-[50px] cursor-pointer border-[1px] border-[#1C1D3E] ${
                          currentPage === page ? "bg-[#1C1D3E] text-white" : ""
                        }`}
                      >
                        {page}
                      </button>
                    ))}

                    {/* Next Button */}
                    <button
                      onClick={() => selectPage(currentPage + 1)}
                      disabled={
                        currentPage ===
                        Math.ceil(orderListData.length / itemsPerPage)
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

      <InvoiceDialogBox
        isOpen={invoiceDataModal}
        onClose={() => setInvoiceDataModal(false)}
        invoiceDatas={invoiceData}
      ></InvoiceDialogBox>

      <PaynmentDialogBox
        refreshOrderList={refreshOrderList}
        isOpen={paynmentModal}
        onClose={() => setPaynmentModal(false)}
        paymentData={[paymentData]}
        paymentMethod={paymentMethod}
      ></PaynmentDialogBox>
      <DeletModal
        isOpen={isDeletOpen}
        order_id={selectedOrderId}
        onClose={closeModaldelete}
      />

      <div className=" hidden">
        <InvoiceDialogBox2 billData={billData} ref={componentRef} />
      </div>
    </>
  );
};

export default OrdersList;
