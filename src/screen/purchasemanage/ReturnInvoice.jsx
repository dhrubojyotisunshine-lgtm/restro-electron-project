import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import ReturnReturn from "../../components/ReturnReturn";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";
const headers = [
  "SL.",
  "Invoice No.",

  "Supplier Name",
  "Date",
  "Price",

  "Action",
];
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

const ReturnInvoice = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [returnData, setReturnData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const [viewReturn, setViewReturn] = useState([]);
  const [viewDataModal, setvieweDataModal] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const { isFullScreen, toggleFullScreen } = useFullScreen();

  const getReturnData = () => {
    axios
      .get(`${API_BASE_URL}/purchasereturns`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setReturnData(response.data.data); // assuming response.data.data contains your purchase data
      })
      .catch((err) => {
        console.error(err);
      });
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);

    if (value.trim() === "") {
      getReturnData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/purchasereturns`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setReturnData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  };

  const returnview = (id) => {
    axios
      .get(`${API_BASE_URL}/purchasereturns/${id}`, { headers: { Authorization: token } })
      .then((response) => {
        setViewReturn([response.data]);
        setvieweDataModal(true);
      })
      .catch((error) => {
        console.log("Error fetching data", error);
      });
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(returnData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // downoload

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchasereturns`, {
        headers: {
          Authorization: token,
        },
      });
      return response.data.data;
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
      Invoice_Number: item.po_no,
      Supplier_Name: item.supName,
      Return_Date: new Date(item.return_date).toLocaleDateString(),
      Total_price: item.totalamount,
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
      { header: "Invoice_Number", key: "invoice_number" },
      { header: "Supplier_Name", key: "supplier_name" },
      { header: "Return_Date", key: "Return_date" },
      { header: "Total_price", key: "total_price" },
    ];
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        invoice_number: item.po_no,
        supplier_name: item.supName,
        return_date: new Date(item.return_date).toLocaleDateString(),
        total_price: item.totalamount,
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
      item.po_no,
      item.supName,
      new Date(item.return_date).toLocaleDateString(),
      item.totalamount,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [
        [
          "Invoice Number",
          "Supplier Name",
          "Return Date",
          "Total Price",
          "Total price",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getReturnData();
  }, []);

  console.log("returnData", returnData);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div
            className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Return Invoice Data
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            <div className=" flex justify-between mt-11">
              <span></span>
              <HasPermission module="Return Invoice" action="create">
                <button
                  onClick={() => {
                    navigate("/purchase-return");
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[230px] rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Purchase Return
                </button>
              </HasPermission>
            </div>
            {/* Search Bar */}
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
                  <div className="flex m-auto px-4 rounded-md border-[1px]  border-gray-900">
                    <input
                      value={searchName}
                      onChange={handleSearch}
                      placeholder="Search menu..."
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
                      {returnData.length > 0 ? (
                        returnData
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
                                {row.po_no}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.supName}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.return_date
                                  ? new Date(
                                      row.return_date,
                                    ).toLocaleDateString()
                                  : "No return date"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.totalamount}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center font-bold">
                                  <HasPermission
                                    module="Return Invoice"
                                    action="access"
                                  >
                                    <Tooltip message="check">
                                      <button
                                        onClick={() =>
                                          returnview(row.preturn_id)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegEye />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-2 px-4 text-center">
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
              {returnData.length > 0 && (
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
                      ...Array(Math.ceil(returnData.length / itemsPerPage)),
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
                        Math.ceil(returnData.length / itemsPerPage)
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

      <ReturnReturn
        isOpen={viewDataModal}
        onClose={() => setvieweDataModal(false)}
        invoiceDatas={viewReturn}
      ></ReturnReturn>
    </>
  );
};

export default ReturnInvoice;
