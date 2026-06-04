import React, { useEffect, useState, useRef } from "react";
import Nav from "../../components/Nav";
import { useReactToPrint } from "react-to-print";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { InvoiceDialogBox2 } from "../../components/InvoiceDialogeBox2";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import PaynmentDialogBox from "../../components/PaynmentDialogBox";
import InvoiceDialogBox from "../../components/InvoiceDialogBox";
import logo from "../../assets/images/restrologo.png";
import axios from "axios";
import HasPermission from "../../store/HasPermission";
import { toast } from "react-toastify";
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
const PendingOrder = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [pendingData, setPendingData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchName, setSearchName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState();
  const [paynmentModal, setPaynmentModal] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const token = localStorage.getItem("token");
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [billData, setBillData] = useState([]);
  const [isDeletOpen, setIsDeletOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

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

  const deleteOrder = (order_id) => {
    setSelectedOrderId(order_id);
    setIsDeletOpen(true);
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(pendingData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  // all order
  const getAllPendingOrder = () => {
    axios
      .get(`${API_BASE_URL}/pendingorder`, {
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setPendingData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const handleSearch = (e) => {
    const value = e.target.value.trim(); // Trim once here
    setSearchName(value);
    setCurrentPage(1);

    if (!value) {
      getAllPendingOrder(); // Fetch all orders if the search is cleared
      return;
    }

    axios
      .get(`${API_BASE_URL}/pendingorder`, {
        params: { searchItem: value },
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
      })
      .then((res) => {
        const data = res.data?.data || [];
        if (data.length > 0) {
          setPendingData(data);
        } else {
          setPendingData([]);
          toast.info("No pending orders found");
        }
      })
      .catch((error) => {
        console.error("Error fetching pending orders:", error);
        toast.error("Error fetching filtered data");
      });
  };

  // payment
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

  const allPaynmnetMethod = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/paynmenttype`);
      setPaymentMethod(response.data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (paymentData) {
      console.log("paydata", paymentData);
    }
  }, [paymentData]);

  // Callback to refresh the order list after payment
  const refreshOrderList = () => {
    getAllPendingOrder();
  };

  // invoice

  const showInvoiceData = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getOrderById/${order_id}`
      );
      setInvoiceData([response.data]);
      console.log("Invoice Data: ", invoiceData);
      setInvoiceDataModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  // print data
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const showBillDetails = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getOrderById/${order_id}`
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

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/pendingorder`);
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

    // Add a table
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

  useEffect(() => {
    getAllPendingOrder();
    allPaynmnetMethod();
  }, []);

  const DeletModal = ({ isOpen, onClose, order_id }) => {
    if (!isOpen) return null;
    const [anyreason, setAnyreason] = useState(""); // renamed to match backend

    const cancelOrder = (order_id) => {
      axios
        .post(
          `${API_BASE_URL}/cancelOrder/${order_id}`,
          { anyreason },
          { headers: { "Content-Type": "application/json" } }
        )
        .then((response) => {
          console.log(response.data);
          getAllPendingOrder(); // Assuming this fetches updated order data
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

  return (
    <>
      <div className="main_div ">
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
                Pending Order
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />{" "}
              </div>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5 gap-y-5  ">
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

            {/* Table data */}
            <section className=" tabledata">
              <div className=" w-full mt-10 drop-shadow-[#4CBBA1]">
                <div className="">
                  <table className="min-w-full bg-white ">
                    <thead className="">
                      <tr>
                        {headers.map((header, index) => (
                          <th
                            key={index}
                            className="py-4 px-4 bg-[#4CBBA1] text-gray-50 tex uppercase text-sm"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {pendingData.length > 0 ? (
                        pendingData
                          .slice(
                            (currentPage - 1) * itemsPerPage,
                            currentPage * itemsPerPage
                          )

                          .map((row, index) => (
                            <tr key={index} className="border-b text-center ">
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
                                  ? `${row.waiter_first_name}${row.waiter_last_name}`
                                  : "No Waiter"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.tablename ? row.tablename : "No table"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.bill_status === 1 ? "Paid" : "Due"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.order_date
                                  ? new Date(row.order_date).toLocaleDateString(
                                      "en-GB",
                                      {
                                        day: "2-digit",
                                        month: "2-digit",
                                        year: "2-digit",
                                      }
                                    )
                                  : "No date"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.totalamount}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex gap-x-2 font-bold">
                                  <HasPermission
                                    module="Pending Order"
                                    action="access"
                                  >
                                    <Tooltip message="print">
                                      <button
                                        onClick={() =>
                                          showBillDetails(row.order_id)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <IoDocumentTextOutline />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                  {/* <HasPermission
                                    module="Pending Order"
                                    action="access"
                                  >
                                    {row.bill_status !== 1 && (
                                      <Tooltip message="Payment">
                                        <button
                                          disabled
                                          onClick={() =>
                                            showPaynment(row.order_id)
                                          }
                                          className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                        >
                                          <IoWalletOutline />
                                        </button>
                                      </Tooltip>
                                    )}
                                  </HasPermission> */}
                                  <HasPermission
                                    module="Pending Order"
                                    action="access"
                                  >
                                    {/* <Tooltip message="invoice">
                                      <button
                                        disabled
                                        onClick={() =>
                                          showInvoiceData(row.order_id)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegEye />
                                      </button>
                                    </Tooltip> */}
                                  </HasPermission>

                                  <HasPermission
                                    module="Pending Order"
                                    action="delete"
                                  >
                                    {row.bill_status !== 1 && (
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
                          <td colSpan="9" className="py-2 px-4 text-center">
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
              {pendingData.length > 0 && (
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
                      ...Array(Math.ceil(pendingData.length / itemsPerPage)),
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
                        Math.ceil(pendingData.length / itemsPerPage)
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
        img={logo}
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

export default PendingOrder;
