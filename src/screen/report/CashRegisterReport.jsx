import React, { useState, useEffect, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import HasPermission from "../../store/HasPermission";
import { FaRegEye } from "react-icons/fa";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import { AuthContext } from "../../store/AuthContext";
import autoTable from "jspdf-autotable";
const headers = [
  "SL.",
  "User Name",
  " Open Date",
  "Opening Balance",
  "Closing Balance",

];
import useFullScreen from "../../components/useFullScreen";
import axios from "axios";

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
const CashRegisterReport = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const token = localStorage.getItem("token");
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [serviceData, setServiceData] = useState([]);
  const [searchName, setSearchName] = useState("");
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(serviceData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };


  const handleReset = () => {
    setFromDate("");
    setToDate("");
    getServiceSaledata();
  };


  
  const getServiceSaledata = () => {
    axios
      .get(`${API_BASE_URL}/registerreport`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        console.log("datta", response);
        setServiceData(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // search form date
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates or serach");
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/registerreport`, {
        params: {
          start_date: fromDate,
          end_date: toDate,
        },
        headers: {
          Authorization: token,
          },
      });
      setServiceData(response.data.data); // Update the displayed data
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
    if (value.trim() === "") {
      getServiceSaledata();
      return;
    }

    axios
      .get(`${API_BASE_URL}/registerreport`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
          },
      })
      .then((res) => {
        setServiceData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };




  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/registerreport`,{
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
 
      User_Name:
    item.username
      ? `${item.username}`
      : "No user",  
      Opening_Balance:
    item.opening_balance
      ? `${item.opening_balance}`
      : "No VariantName Found",
      Closing_Balance:item.closing_balance,
      Open_Date: new Date( item.opendate).toLocaleDateString(),
      Opening_Note: item.openingnote,
     
   
     
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
   
      { header: "User_Name", key: "User_Name" },
      { header: "Opening_Balance", key: "Opening_Balance" },
      { header: "Closing_Balance", key: "Closing_Balance" },
      { header: "Open_Date", key: "Open_Date" },
      { header: "Opening_Note", key: "Opening_Note" },
    ];
  
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
       
        User_Name:
        item.username
          ? `${item.username}`
          : "No user",  
          Opening_Balance:
        item.opening_balance
          ? `${item.opening_balance}`
          : "No VariantName Found",
          Closing_Balance:item.closing_balance,
          Open_Date: new Date( item.opendate).toLocaleDateString(),
          Opening_Note: item.openingnote,
         
         
      
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
 
   

      item.username
        ? `${item.username}`
        : "No user",  
    
      item.opening_balance
        ? `${item.opening_balance}`
        : "No VariantName Found",
      item.closing_balance,
      new Date( item.opendate).toLocaleDateString(),
       item.openingnote,
     
     
    ]);
  
    // Add a title
    doc.text("Data Export", 20, 10);
  
    // Add a table
    autoTable(doc,{
      head: [
        [
    
          "User Name",
          "Opening Balance",
          "Closing Balance",
          "Price",
          "Open Date",
          "Opening Note"
          
        ],
      ],
      body: rows,
      startY: 20,
    });
  
    doc.save("data.pdf"); // PDF file name
  };
  
  
  const[user,setUser]=useState([])


  const getregisteruser=()=>{
    axios.get(`${API_BASE_URL}/registeruser`,{
        headers:{
          Authorization: token
        }
      })
    .then((res)=>{
      setUser(res.data.data)
      console.log("data fetched")
    })
    .catch((error)=>{
      console.log("error",error)
    })
  }
  
const[userid,setUserId]=useState()
  const handleSearch3 = (e) => {
    const value = e.target.value;
    console.log("user value",value)
    setUserId(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getServiceSaledata();
      return;
    }

    axios
      .get(`${API_BASE_URL}/registerreport`, {
        params: { user_id: value },
        headers: {
          Authorization: token
          }
      })
      .then((res) => {
        setServiceData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };








  useEffect(() => {
    getServiceSaledata();
    getregisteruser()
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
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Cash Register Report
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            {/* Search Bar */}

            <div className="mt-11 w-full ">
              <section className="tablebutton">
                <div className="orderButton flex  flex-wrap  gap-x-2  px-6">
                  <div className="flex items-center gap-x-2">
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


 <div className=" flex  justify-between  gap-x-3 ">



                  <div className=" sm:w-auto justify-evenly flex gap-x-4 ">
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

                   <div className=" flex items-center justify-center  px-4 rounded-md  border-[0.5px] border-gray-900">
                  <button className="px-4 text-[#0f044a] text-sm">
                    <FaMagnifyingGlass />
                  </button>
                  <input
                    value={searchName}
                    onChange={handleSearch2}
                    placeholder="Search..."
                    type="search"
                    className="w-full sm:w-[450px] px-4 py-2 text-gray-700 leading-tight focus:outline-none"
                  />
                   </div>

 </div>



                 


                </div>
              </section>
            </div>








            <div className="w-full mt-11 p-3 rounded-md border-[1px] border-[#4CBBA1]">
              <div className="flex  justify-evenly items-center">


              <div className=" w-full">
                          {/* <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Country*
                          </label> */}
                          <select
                            className="shadow   border border-[#4CBBA1] rounded w-[300px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            name="user"
                            value={userid}
                            onChange={handleSearch3}
                            // onChange={handleChange}
                          >
                            <option value="">All User</option>
                            {user.map((user) => (
                              <option key={user.id} value={user.userid}>
                                {user.username}
                              </option>
                            ))}
                          </select>
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
                      {serviceData.length > 0 ? (
                        serviceData
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
                                {row.username
                                  ? row.username
                                  : "Walkin"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.opendate
                                  ? new Date(
                                      row.opendate
                                    ).toLocaleDateString()
                                  : "No date"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.opening_balance ? row.opening_balance : "no data"}
                              </td>
                             
                             
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.closing_balance ? row.closing_balance : "No Found"}
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
                  <h1 className="  font-bold mt-5 mb-4 pr-3 text-right w-full">
                    {/* Today Sale :- ₹{totalAmount.toFixed(2)} */}
                  </h1>
                </div>
              </div>

              {/* pagination */}
              <div className="flex justify-between mt-7">
                {serviceData.length > 0 && (
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
                        ...Array(Math.ceil(serviceData.length / itemsPerPage)),
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
                          Math.ceil(serviceData.length / itemsPerPage)
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
    </>
  );
};

export default CashRegisterReport;
