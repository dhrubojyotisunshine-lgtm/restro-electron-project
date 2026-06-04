import React, { useEffect, useState, useRef, useContext } from "react";
import Hamburger from "hamburger-react";
import { useReactToPrint } from "react-to-print";
import { IoMdNotifications } from "react-icons/io";
import { MdOutlineZoomOutMap } from "react-icons/md";
import useFullScreen from "../../components/useFullScreen";
import { NavLink } from "react-router-dom";
import { AuthContext } from "../../store/AuthContext";
import {
  FaUserPlus,
  FaHandHoldingUsd,
  FaCalculator,
  FaMoneyCheck,
  FaNetworkWired,
} from "react-icons/fa";
import { InvoiceDialogBox2 } from "../../components/InvoiceDialogeBox2";

import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import PaynmentDialogBox from "../../components/PaynmentDialogBox";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import { MdCropRotate, MdOutlineZoomInMap, MdTableBar } from "react-icons/md";
import { CiSaveDown2 } from "react-icons/ci";
import { FaKitchenSet, FaKeyboard, FaMagnifyingGlass } from "react-icons/fa6";
import { IoQrCodeOutline } from "react-icons/io5";
import { IoMdCart, IoIosMan } from "react-icons/io";
import { RiTodoLine } from "react-icons/ri";
import InvoiceDialogBox from "../../components/InvoiceDialogBox";
import logo from "../../assets/images/restrologo.png";
import Nav from "../../components/Nav";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import "jspdf-autotable";

const OrderButtons = [
  { id: 1, title: "New Order", icon: <MdCropRotate />, link: "/order-list" },
  {
    id: 2,
    title: "On Going Order",
    icon: <CiSaveDown2 />,
    link: "/ongoing-order",
  },

  { id: 4, title: "QR Order", icon: <IoQrCodeOutline />, link: "/qr-order" },
  { id: 5, title: "Online Order", icon: <IoMdCart />, link: "/online-order" },
  { id: 6, title: "Today Order", icon: <RiTodoLine />, link: "/today-order" },
  {
    id: 3,
    title: "Kitchen Status",
    icon: <FaKitchenSet />,
    link: "/kitchen-status",
  },
];

const ActionButtion = [{ btn: "CSV" }, { btn: "Excel" }, { btn: "PDF" }];

const headers = [
  "SL.",
  "Invoice",
  "Customer Name",
  "Shipping Method name",
  "Shipping Date & Time",
  "Waiter",
  "Table No.",
  "Paynment Status",
  " Order Date",
  "Amount",
  "Action",
];
const QrOrder = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchName, setSearchName] = useState("");
  const [invoiceData, setInvoiceData] = useState([]);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState();
  const [paynmentModal, setPaynmentModal] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [billData, setBillData] = useState([]);
  const [isDeletOpen, setIsDeletOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  // escap key for close modal
  const token = localStorage.getItem("token");

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setPaynmentModal(false);
        setIsDeletOpen(false);
        setInvoiceDataModal(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  //delete id

  const closeModaldelete = () => setIsDeletOpen(false);

  const deleteOrder = (order_id) => {
    setSelectedOrderId(order_id);
    setIsDeletOpen(true);
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };

  const getQrData = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/qrorders`, {
        headers: {
          Authorization: token,
        },
      });
      console.log(res.data.data);
      setData(res.data.data);
    } catch (error) {
      console.error("Error fetching QR data:", error);
    }
  };

  //search

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getQrData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/qrorders`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  const showInvoiceData = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getOrderById/${order_id}`,
      );
      setInvoiceData([response.data]);
      console.log("Invoice Data: ", invoiceData);
      setInvoiceDataModal(true);
    } catch (error) {
      console.error(error);
    }
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
    getQrData();
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

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/qrorders`);
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

      Invoice: item.saleinvoice,
      Customer_Name: item.customer_name
        ? `${item.customer_name}`
        : "No Customer Found",
      Shipping_Method_Name: item.shipping_method_name
        ? item.shipping_method_name
        : "No shipping method found",
      Shipping_Date_Time: new Date(item.shipping_date).toLocaleString(),
      Waiter: `${item.waiter_first_name} ${item.waiter_last_name}`
        ? `${item.waiter_first_name} ${item.waiter_last_name}`
        : "No waiter found",
      Table_No: item.tablename ? item.tablename : "No table found",
      Paynment_Status: item.bill_status === 1 ? "Paid" : "Due",
      Order_Date: new Date(item.order_date).toLocaleString(),

      Amount: item.bill_amount,
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
      { header: "Invoice", key: "invoice" },
      { header: "Customer Name", key: "customer_name" },
      { header: "Shipping Method Name", key: "shipping_method_name" },
      { header: "Shipping Date Time", key: "shipping_date_time" },
      { header: "Waiter", key: "waiter" },
      { header: "Table No", key: "table_no" },
      { header: "Paynment Status", key: "paynment_status" },
      { header: "Order Date", key: "order_date" },
      { header: "Amount", key: "amount" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        invoice: item.saleinvoice,
        customer_name: item.customer_name
          ? `${item.customer_name}`
          : "No Customer Found",
        shipping_method_name: item.shipping_method_name
          ? item.shipping_method_name
          : "No shipping method found",
        shipping_date_time: new Date(item.shipping_date).toLocaleString(),
        waiter: `${item.waiter_first_name} ${item.waiter_last_name}`
          ? `${item.waiter_first_name} ${item.waiter_last_name}`
          : "No waiter found",
        table_no: item.tablename ? item.tablename : "No table found",
        paynment_status: item.bill_status === 1 ? "Paid" : "Due",
        order_date: new Date(item.order_date).toLocaleString(),

        amount: item.bill_amount,
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
      item.saleinvoice,
      item.customer_name ? `${item.customer_name}` : "No Customer Found",
      item.shipping_method_name
        ? item.shipping_method_name
        : "No shipping method found",
      new Date(item.shipping_date).toLocaleString(),
      `${item.waiter_first_name} ${item.waiter_last_name}`
        ? `${item.waiter_first_name} ${item.waiter_last_name}`
        : "No waiter found",
      item.tablename ? item.tablename : "No table found",
      item.bill_status === 1 ? "Paid" : "Due",
      new Date(item.order_date).toLocaleString(),

      item.bill_amount,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    doc.autoTable({
      head: [
        [
          "Invoice",
          "Customer Name",
          "Shipping Method name",
          "Shipping Date & Time",
          "Waiter",
          "Table No.",
          "Paynment Status",
          "Order Date",
          "Amount",
        ],
      ],
      body: rows,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getQrData();
    allPaynmnetMethod();
  }, []);

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
          getQrData(); // Assuming this fetches updated order data
          onClose(); // Close modal after successful cancellation
          toast.success("Order cancel sucessfully.");
        })
        .catch((error) => {
          console.error(error);
        });
    };

    return (
      <>
        <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
          <div className=" w-1/2 px-20 ">
            <div className=" py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
              <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
                <h2 className="text-xl  font-semibold">Cancle Order</h2>
                <button
                  onClick={onClose}
                  className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                >
                  X
                </button>
              </div>

              <div className=" flex  justify-around mt-11 mb-6">
                <div className="">
                  <div className=" flex  gap-x-24">
                    <h1 className=" font-bold">Order Id :</h1>

                    <span className=" float-right">{order_id}</span>
                  </div>
                  <div className=" flex gap-x-5">
                    <h1 className=" font-bold">Cancle Reasion :-</h1>

                    <textarea
                      rows={7}
                      cols={20}
                      id="message"
                      name="message"
                      required
                      placeholder="Note..."
                      className=" ring-1 ring-[#4CBBA1] rounded-md px-4 outline-none focus:ring-2  text-black py-1 mt-2"
                      value={anyreason}
                      onChange={(e) => setAnyreason(e.target.value)} // Update reason state on change
                    ></textarea>
                  </div>
                  <div className=" mt-5">
                    <button
                      onClick={() => {
                        cancelOrder(order_id);
                      }}
                      className="  float-end bg-[#4CBBA1] text-white px-10 py-2 font-semibold rounded"
                    >
                      Confirm Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className=" opacity-5 fixed inset-0 z-40 bg-slate-800"></div>
      </>
    );
  };
  return (
    <>
      <div className="main_div">
        <section className=" side_section flex">
          <div
            className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>

          <div>
            <section className="section1 flex  justify-between gap-x-3 pt-2 ">
              <div className=" flex gap-x-6">
                <div className="orderButton gap-x-2 flex ">
                  {OrderButtons.map((val, index) => (
                    <div
                      className={` ${index === 7 ? "pointer-events-none" : ""}`}
                      key={index}
                    >
                      <NavLink
                        to={val.link}
                        className={({ isActive }) =>
                          `h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer flex justify-center items-center gap-3 ${
                            isActive
                              ? "bg-[#4CBBA1] text-white border-[#4CBBA1]"
                              : "bg-[#1C1D3E] text-[#fff] border-zinc-300 hover:bg-[#4CBBA1]"
                          }`
                        }
                      >
                        <span className="text-emerald-50 text-xl">
                          {val.icon}
                        </span>
                        {val.title}
                      </NavLink>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer" />

                <MdOutlineZoomOutMap
                  //  onClick={toggleFullScreen}
                  className="  bg-[#1C1D3E] text-white h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer"
                />
              </div>
            </section>

            <div className="mt-11 w-full">
              <section className="tablebutton">
                <div className="orderButton flex  flex-wrap gap-y-5  px-6">
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

                  <div className=" flex items-center justify-center m-auto px-4 rounded-sm border-[1px] border-gray-900">
                    <button className="px-4 text-[#0f044a] text-sm">
                      <FaMagnifyingGlass />
                    </button>
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search Product..."
                      type="search"
                      className="w-full sm:w-[450px] px-4 py-2 text-gray-700 leading-tight focus:outline-none"
                    />
                  </div>
                </div>
              </section>
            </div>

            <section className=" tabledata pr-4 pl-4 ">
              <div className=" w-full mt-10 border-[1px] border-[#4CBBA1] drop-shadow-[#4CBBA1]">
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
                      {data.length > 0 &&
                        data
                          .slice(
                            (currentPage - 1) * itemsPerPage,
                            currentPage * itemsPerPage,
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
                                {row.shipping_method_name
                                  ? row.shipping_method_name
                                  : "Not"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {new Date(row.shipping_date).toLocaleString()}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1] ">
                                {`${row.waiter_first_name} `}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {`${row.tablename}`}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.bill_status == 0 ? "Due" : "Paid"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.order_date}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.totalamount}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className=" flex gap-x-2 font-bold ">
                                  {row.bill_status !== 1 &&
                                    row.order_status !== 5 && (
                                      <Tooltip message="Edit">
                                        <button className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105">
                                          <FaRegEdit />
                                        </button>
                                      </Tooltip>
                                    )}

                                  <Tooltip message="Invoice">
                                    {" "}
                                    <button
                                      onClick={() =>
                                        showBillDetails(row.order_id)
                                      }
                                      className=" bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <IoDocumentTextOutline />
                                    </button>
                                  </Tooltip>

                                  {/* {row.bill_status !== 1 &&
                                    row.order_status !== 5 && (
                                      <Tooltip message="Paynment">
                                        <button
                                          onClick={() =>
                                            showPaynment(row.order_id)
                                          }
                                          className=" bg-[#1C1D3E] p-1 rounded-sm  text-white hover:scale-105"
                                        >
                                          <IoWalletOutline />{" "}
                                        </button>
                                      </Tooltip>
                                    )} */}

                                  {/* <Tooltip message="Check Status">
                                    {" "}
                                    <button
                                      onClick={() =>
                                        showInvoiceData(row.order_id)
                                      }
                                      className=" bg-[#1C1D3E] p-1 rounded-sm  text-white hover:scale-105"
                                    >
                                      <FaRegEye />
                                    </button>
                                  </Tooltip> */}
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
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
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
                      {[...Array(Math.ceil(data.length / itemsPerPage))].map(
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
                          currentPage === Math.ceil(data.length / itemsPerPage)
                        }
                        className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </section>
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

export default QrOrder;
