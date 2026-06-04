import React, { useEffect, useState, useRef, useContext } from "react";
import Nav from "../../components/Nav";
import { useReactToPrint } from "react-to-print";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import InvoiceDialogBox from "../../components/InvoiceDialogBox";
import { InvoiceDialogBox2 } from "../../components/InvoiceDialogeBox2";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import logo from "../../assets/images/restrologo.png";
import useFullScreen from "../../components/useFullScreen"
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
const CancleOrder = () => {
  const APP_URL = import.meta.env.VITE_APP_URL;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [canceldata, setCancelData] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [billData, setBillData] = useState([]);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const [searchName, setSearchName] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [pageLimit] = useState(10);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
 const token = localStorage.getItem("token");
  const headers = [
    "SL.",
    "Order ID",
    "Customer Name ",
    "Customer Type ",
    "Waiter",
    "Table No.",
    " Order Date",
    "Amount",
    "Action",
  ];
  //invoice data
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

  // print bill process
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

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(canceldata.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
  };

  const getallCanceldata = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cancelorderdata`,{
        headers:{
          Authorization: token
        }
      });
      setCancelData(response.data.data);
      console.log(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getallCanceldata();
      return;
    }

    axios
      .get(`${API_BASE_URL}/cancelorderdata`, {
        params: { searchItem: value },
        headers:{
          Authorization: token
          }
      })
      .then((res) => {
        setCancelData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

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




  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/cancelorderdata`,{
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
        Table_Name: item.tablename ?`${item.tablename}`:"No data",
        Customer_Type: item.customer_type_name,
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
      { header: "Table Name", key: "table_name" },
      { header: " Customer Type", key: " customer_type" },
      { header: "Order date", key: "order_date" },
      { header: "Amount", key: "amount" },
    ];
  
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        customer_name: item.customer_name,
        waiter:  item.waiter_first_name && item.waiter_last_name
                ? `${item.waiter_first_name} ${item.waiter_last_name}`
                 : "No Waiter Found",
                 table_name:item.tablename ?`${item.tablename}`:"No data",
                 customer_type:  item.customer_type_name,
        order_date:  new Date(item.order_date).toLocaleDateString(), // Fix date formatting
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
             item.tablename ?`${item.tablename}`:"No data",
             item.customer_type_name,
             new Date(item.order_date).toLocaleDateString(),
             item.totalamount,
    ]);
    
    // Add a title
    doc.text("Data Export", 20, 10);
  
    // Add a table
    autoTable(doc,{
      head: [
        [
          "Customer Name",
          "Waiter",
          "Table Name",
          "Coustomer Type",
          "Order Date",
          "Amount"
        ],
      ],
      body: rows,
      startY: 20,
    });
  
    doc.save("data.pdf"); // PDF file name
  };
  


  useEffect(() => {
    getallCanceldata();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Cancel Order
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
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
                      {canceldata.length > 0 &&
                        canceldata
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
                                {row.order_id}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.customer_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.customer_type_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.waiter_first_name && row.waiter_last_name
                                  ? `${row.waiter_first_name} ${row.waiter_last_name}`
                                  : "No waiter"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.tablename ? row.tablename : "No Table"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
  {row.order_date
    ? new Date(row.order_date).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "2-digit",
      })
    : "No date"}
</td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.totalamount}$
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className=" flex gap-x-2  font-bold ">
                                  <HasPermission
                                    module="Cancel Order"
                                    action="access"
                                  >
                                    {" "}
                                    <Tooltip message="Invoice">
                                      {" "}
                                      <button
                                        onClick={() => {
                                          showInvoiceData(row.order_id);
                                        }}
                                        className=" bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <IoDocumentTextOutline />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>

                                  <HasPermission
                                    module="Cancel Order"
                                    action="access"
                                  >
                                    {" "}
                                    <Tooltip message="Check Status">
                                      {" "}
                                      <button
                                        onClick={() =>
                                          showBillDetails(row.order_id)
                                        }
                                        className=" bg-[#1C1D3E] p-1 rounded-sm  text-white hover:scale-105"
                                      >
                                        <FaRegEye />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="flex justify-between mt-7">
              {canceldata.length > 0 && (
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
                      ...Array(Math.ceil(canceldata.length / itemsPerPage)),
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
                        Math.ceil(canceldata.length / itemsPerPage)
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
      <div className=" hidden">
        <InvoiceDialogBox2 billData={billData} ref={componentRef} />
      </div>
    </>
  );
};

export default CancleOrder;
