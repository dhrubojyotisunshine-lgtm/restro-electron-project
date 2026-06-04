import React, { useState, useEffect, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import axios from "axios";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import useFullScreen from "../../components/useFullScreen";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";

const headers = [
  "SL.",
  "Shipping Type",
  "Total Amount",
 
];

const DeleverySaleReport = () => {

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [saleData, setSaleData] = useState([]);
  const [selectedFood, setSelectedFood] = useState(""); // Selected Food name
  const [foodData, setFoodData] = useState([]); // all food
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const token = localStorage.getItem("token");
  const getSaledata = () => {
    axios
      .get(`${API_BASE_URL}/deliveryreport`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        console.log("datta", response);
        setSaleData(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };
 
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSearchName("");
    getSaledata();
  };

  // search form date
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates or serach");
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/foodstockkitchen`, {
        params: {
          start_date: fromDate,
          end_date: toDate,
        },
        headers: {
          Authorization: token,
          },
      });
      setSaleData(response.data.data); // Update the displayed data
      console.log("Filtered Data:", response.data.data);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      toast.error("Error fetching filtered data");
    }
  };

  const handleSearch2 = (e) => {
    setCurrentPage(1);
    axios
      .get(`${API_BASE_URL}/foodstockkitchen`, {
        params: { itemid: selectedFood },
        headers: {
          Authorization: token,
          },
      })
      .then((res) => {
        setSaleData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };






  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(saleData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  useState(() => {
    getSaledata();
    
  }, []);
 


  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/deliveryreport`,{
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
      shipping_Type: item.shipping_type === 1
      ? "Walk In Customer"
      : item.shipping_type === 2
      ? "Online Customer"
      : item.shipping_type === 3
      ? "Third Party"
      : item.shipping_type === 4
      ? "Take Away"
      : item.shipping_type === 99
      ? "Qr Customer"
      : "No Data Found",
      total_amount: item.totalamount?item.totalamount:"not found",
     
   
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
      { header: "Shipping Type", key: "shipping_Type" },
      { header: "Total Amount", key: "total_amount" },
    
    
    ];
   
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        shipping_Type: item.shipping_type === 1
        ? "Walk In Customer"
        : item.shipping_type === 2
        ? "Online Customer"
        : item.shipping_type === 3
        ? "Third Party"
        : item.shipping_type === 4
        ? "Take Away"
        : item.shipping_type === 99
        ? "Qr Customer"
        : "No Data Found",
        total_amount: item.totalamount?item.totalamount:"not data found",
      
       
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
      // Determine customer type based on shipping_type
      item.shipping_type === 1
        ? "Walk In Customer"
        : item.shipping_type === 2
        ? "Online Customer"
        : item.shipping_type === 3
        ? "Third Party"
        : item.shipping_type === 4
        ? "Take Away"
        : item.shipping_type === 99
        ? "Qr Customer"
        : "No Data Found",
    
      // Use totalamount if available, otherwise fallback
      item.totalamount || "No Data Found",
    ]);
    


   
     

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
autoTable(doc,{
      head: [
        [
          "Shipping Type",
          "Total Amount",
  
       
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };
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
              Delevery Type Report
            </h1>

            <div className="notification flex gap-x-5 ">
              <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              <IoSettings className="   bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              <LiaLanguageSolid className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />     
            </div>
          </div>

          {/* Search Bar */}
          <div className="mt-11 w-full">
            <section className="tablebutton">
              <div className="orderButton flex  flex-wrap gap-y-5 gap-x-10 px-6">
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
              </div>
            </section>
          </div>

          <div className="w-full mt-11 p-3 rounded-md border-[1px] border-[#4CBBA1]">
            <div className="flex  justify-evenly items-center">
            
            
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
                    {saleData.length > 0 ? (
                      saleData
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
                              {  row.shipping_type === 1
        ? "Walk In Customer"
        : row.shipping_type === 2
        ? "Online Customer"
        : row.shipping_type === 3
        ? "Third Party"
        : row.shipping_type === 4
        ? "Take Away"
        : row.shipping_type === 99
        ? "Qr Customer"
        : "No Data Found"}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {row.totalamount
                                ? (row.totalamount)
                                : "Not Data Found"}
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
              {saleData.length > 0 && (
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
                      ...Array(Math.ceil(saleData.length / itemsPerPage)),
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
                        Math.ceil(saleData.length / itemsPerPage)
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
  </>
  )
}

export default DeleverySaleReport
