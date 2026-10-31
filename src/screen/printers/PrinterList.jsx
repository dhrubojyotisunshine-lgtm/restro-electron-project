import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";
import Papa from "papaparse";
import ExcelJS from "exceljs";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const CONNECTION_TAG_STYLE = {
  Network: "bg-[#E4F5EE] text-[#1C7A54]",
  USB: "bg-[#E7EDF7] text-[#2C4F9C]",
  Bluetooth: "bg-[#F1E9FB] text-[#6A3FB0]",
  Shared: "bg-[#EAF3FB] text-[#1E6FA8]",
  "Local Port": "bg-[#FDF0E3] text-[#96601A]",
  Virtual: "bg-[#F1F2F3] text-[#5B6A72]",
  Saved: "bg-[#FFF4E0] text-[#8A5A00]",
  Other: "bg-[#F1F2F3] text-[#5B6A72]",
};

const PrinterList = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");
  const [isPrinterModal, setIsPrinterModal] = useState(false);
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [kitchenData, setKitchenData] = useState([]);
  const initialFormData = {
    printer_name: "",
    printer_type: "",
    printer_path: "",
    kitchen_id: "",
  };

  const [detectedPrinters, setDetectedPrinters] = useState([]);
  const [detectLoading, setDetectLoading] = useState(false);
  const [selectedDetectedIndex, setSelectedDetectedIndex] = useState(null);

  const [searchName, setSearchName] = useState("");
  const [formdata, setFormdata] = useState(initialFormData);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const handleChange = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formdata.printer_name)
      newErrors.printer_name = "Printer name is required";
    if (!formdata.printer_type)
      newErrors.printer_type = "Printer type is required";
    if (!formdata.printer_path)
      newErrors.printer_path = "Printer path is required";
    if (!formdata.kitchen_id) newErrors.kitchen_id = "Kitchen is required";

    // ✅ Type-specific validation
    if (formdata.printer_type === "network") {
      const ipRegex =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

      if (!ipRegex.test(formdata.printer_path)) {
        newErrors.printer_path = "Enter valid IP (e.g. 192.168.1.50)";
      }
    }

    if (formdata.printer_type === "windows") {
      if (formdata.printer_path.length < 3) {
        newErrors.printer_path =
          "Enter valid printer name (e.g. Gainscha GS-2406T)";
      }
    }

    setErrors(newErrors);

    // Stop submission if there are errors
    // Stop submission if there are validation errors
    if (Object.keys(newErrors).length > 0) return;

    // 🚨 NEW: Prevent duplicate printer per kitchen (frontend check)
    const alreadyAssigned = data.find(
      (p) => String(p.kitchen_id) === String(formdata.kitchen_id),
    );

    if (alreadyAssigned) {
      toast.error("This kitchen already has a printer assigned");
      return;
    }

    const payload = {
      printer_name: formdata.printer_name,
      printer_type: formdata.printer_type,
      printer_path: formdata.printer_path,
      kitchen_id: formdata.kitchen_id,
    };

    axios
      .post(`${API_BASE_URL}/addprinter`, payload, {
        headers: { Authorization: token },
      })
      .then((res) => {
        toast.success("Printer added successfully");
        setFormdata(initialFormData);
        setErrors({}); // clear errors
        setIsPrinterModal(false);
        getdata();
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const headers = [
    "SL.",
    "Printer Name",
    "Printer Type",
    "Printer path",
    "Kitchen Name",
    "Action",
  ];

  const getdata = () => {
    axios
      .get(`${API_BASE_URL}/getprinter`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        if (res.data) {
          setData(res.data.data);
        } else {
          console.error("API response is not an array:", res.data);
        }
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const getkitchenData = () => {
    axios
      .get(`${API_BASE_URL}/getkitchen`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setKitchenData(res.data);
      });
  };

  const handleDetectPrinters = async () => {
    try {
      setDetectLoading(true);
      setSelectedDetectedIndex(null);

      const res = await axios.get(`${API_BASE_URL}/detect-system-printers`, {
        headers: {
          Authorization: token,
        },
      });

      const windowsPrinters = res.data.success ? res.data.data || [] : [];

      // Network printers added by IP are never installed in Windows, so they
      // can't be detected — surface the ones already saved here so they can be
      // picked for another kitchen without retyping the IP.
      const savedPrinters = (data || []).map((p) => ({
        name: p.printer_name,
        connection_type: p.printer_type,
        detected_connection: "Saved",
        path: p.printer_path,
        port: null,
        assigned_kitchen: p.kitchen_name,
      }));

      const seen = new Set();
      const merged = [...savedPrinters, ...windowsPrinters].filter((p) => {
        const key = `${p.connection_type}|${p.path}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      setDetectedPrinters(merged);
    } catch (error) {
      console.log(error);
      alert("Failed to detect printers");
    } finally {
      setDetectLoading(false);
    }
  };

  const handleSelectDetectedPrinter = (selectedIndex) => {
    const printer = detectedPrinters[selectedIndex];
    if (!printer) return;

    setSelectedDetectedIndex(selectedIndex);

    setFormdata((prev) => ({
      ...prev,
      printer_name: printer.name,
      printer_type: printer.connection_type,
      printer_path: printer.path,
    }));
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);

    if (value.trim() === "") {
      getdata();
      return;
    }

    axios
      .get(`${API_BASE_URL}/getprinter`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("✅ API Response:", res.data);

        // Correctly extract and set data
        if (res.data.success && Array.isArray(res.data.data)) {
          setData(res.data.data);
        } else {
          setData([]); // fallback in case structure changes
        }
      })
      .catch((error) => {
        console.error("❌ Error fetching filtered data:", error);
        toast.error("Error fetching filtered data");
      });
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
      .delete(`${API_BASE_URL}/printer/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("delete printer sucessfully..");
        getdata();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // edit

  const [formData2, setFormData2] = useState({
    printer_name: "",
    printer_type: "",
    printer_path: "",
    kitchen_id: "",
    created_by: "",
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);
  const handleEditClick = (id) => {
    console.log(id);
    setEditId(id);
    setIsModalOpen(true);
    // Fetch data for the given ID
    axios.get(`${API_BASE_URL}/printer/${id}`).then((response) => {
      console.log("object", response);
      setFormData2({
        printer_name: response.data.printer.printer_name,
        printer_type: response.data.printer.printer_type,
        printer_path: response.data.printer.printer_path,
        kitchen_id: response.data.printer.kitchen_id,
        created_by: response.data.printer.created_by,
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

    let newErrors = {};

    if (!formData2.printer_name)
      newErrors.printer_name = "Printer name is required";
    if (!formData2.printer_type)
      newErrors.printer_type = "Printer type is required";
    if (!formData2.printer_path)
      newErrors.printer_path = "Printer path is required";
    if (!formData2.kitchen_id) newErrors.kitchen_id = "Kitchen is required";

    if (formData2.printer_type === "network") {
      const ipRegex =
        /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

      if (!ipRegex.test(formData2.printer_path)) {
        newErrors.printer_path = "Enter valid IP (e.g. 192.168.1.50)";
      }
    }

    if (formData2.printer_type === "windows") {
      if (formData2.printer_path.length < 3) {
        newErrors.printer_path =
          "Enter valid printer name (e.g. Gainscha GS-2406T)";
      }
    }

    setEditErrors(newErrors);

    const alreadyAssigned = data.find(
      (p) =>
        String(p.kitchen_id) === String(formData2.kitchen_id) &&
        p.id !== editId, // allow same record to update
    );

    if (alreadyAssigned) {
      toast.error("This kitchen already has a printer assigned");
      return;
    }

    axios
      .put(`${API_BASE_URL}/printer/${editId}`, formData2, {
        headers: { Authorization: token },
      })
      .then(() => {
        toast.success("Updated Successfully!");
        getdata();
        setIsModalOpen(false);
        setEditErrors({});
      })
      .catch((error) => {
        console.error("Error updating data:", error);
        toast.error("Failed to update printer");
      });
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getprinter`, {
        headers: {
          Authorization: token,
        },
      });
      return response.data; // Assuming the data you need is in `response.data.data`
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

      Printer_Name: item.name,
      Connection_Name: item.connection_type,
      Capability_Profile: item.capability_profile,
      Character_Per_Line: item.char_per_line,
      IP_Address: item.ip_address,
      Port: item.port,
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
      { header: "Printer Name", key: "printer_name" },
      { header: "Connection Name", key: "connection_name" },
      { header: "Capability Profile", key: "capability_profile" },
      { header: "IP_Address", key: "ip_address" },
      { header: "Port", key: "port" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        printer_name: item.name,
        connection_name: item.connection_type,
        capability_profile: item.capability_profile,
        character_per_line: item.char_per_line,
        iP_address: item.ip_address,
        port: item.port,
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
    console.log("data", data);
    const doc = new jsPDF();

    // Map the data to rows for the PDF
    const rows = data.map((item) => [
      item.name,
      item.connection_type,
      item.capability_profile,
      item.char_per_line,
      item.ip_address,
      item.port,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [
        [
          "Printer Name",
          "Connection Name",
          "Capability Profile",
          "Character Per Line",
          "IP Address",
          "Port",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getdata();
    getkitchenData();
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
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div
            className={
              isOpen === false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }
          >
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="content_div w-full ml-4 pr-7 mt-4">
            <div className="active_tab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Printer List
              </h1>

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

              <HasPermission module="Printers" action="create">
                <button
                  onClick={() => {
                    setIsPrinterModal(true);
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Printer
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

            <section className="table_data">
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
                      {data.length > 0 &&
                        data
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
                                {row.printer_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.printer_type}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.printer_path}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.kitchen_name}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">
                                  <HasPermission
                                    module="Printers"
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
                                    module="Printers"
                                    action="delete"
                                  >
                                    <Tooltip message="Delete Printer">
                                      <button
                                        onClick={() =>
                                          handleDeleteClick(row.id)
                                        }
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegTrashCan />
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
          </div>
        </section>
      </div>
      <DialogBoxSmall
        title={"Add New Printer"}
        isOpen={isPrinterModal}
        onClose={() => {
          setIsPrinterModal(false);
        }}
      >
        <form
          onSubmit={handleSubmit}
          className="p-8 bg-white shadow-md rounded-lg"
        >
          {/* Detect Printer Button */}
          <div className="mb-6 flex flex-col">
            <button
              type="button"
              onClick={handleDetectPrinters}
              disabled={detectLoading}
              className="bg-[#4CBBA1] hover:bg-[#3aa88e] text-white font-bold py-2 px-4 rounded disabled:opacity-60"
            >
              {detectLoading ? "Detecting..." : "Detect Printers"}
            </button>

            {detectedPrinters.length > 0 && (
              <div className="mt-3">
                <p className="mb-2 text-gray-700 font-semibold text-sm">
                  Select Detected Printer
                </p>

                <div className="border border-[#4CBBA1] rounded overflow-hidden">
                  {detectedPrinters.map((printer, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => handleSelectDetectedPrinter(index)}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-left text-sm border-b last:border-b-0 border-gray-200 ${
                        selectedDetectedIndex === index
                          ? "bg-[#E4F5EE]"
                          : "bg-white hover:bg-gray-50"
                      }`}
                    >
                      <span className="flex-1 text-gray-700 truncate">
                        {printer.name}
                        {printer.assigned_kitchen && (
                          <span className="text-gray-400 font-normal">
                            {" "}
                            · {printer.assigned_kitchen}
                          </span>
                        )}
                      </span>

                      <span
                        className={`shrink-0 text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${
                          CONNECTION_TAG_STYLE[printer.detected_connection] ||
                          CONNECTION_TAG_STYLE.Other
                        }`}
                      >
                        {printer.detected_connection || "Other"}
                      </span>

                      {printer.connection_type === "network" && (
                        <span className="shrink-0 text-[11px] text-gray-500 font-mono">
                          {printer.path}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <p className="mt-2 text-xs text-gray-500">
                  Printer Name, Type &amp; Path fill in automatically — then just
                  select the Kitchen.
                </p>
              </div>
            )}
          </div>
          {/* Printer Name */}
          <div className="mb-6 flex flex-col">
            <label
              className="mb-2 text-gray-700 font-semibold"
              htmlFor="printer_name"
            >
              Printer Name*
            </label>
            <input
              type="text"
              id="printer_name"
              name="printer_name"
              placeholder="Enter Printer Name"
              value={formdata.printer_name}
              onChange={handleChange}
              className={`shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline 
          ${errors.printer_name ? "border-red-500" : "border-[#4CBBA1]"}`}
            />
            {errors.printer_name && (
              <p className="text-red-500 text-sm mt-1">{errors.printer_name}</p>
            )}
          </div>

          {/* Printer Type */}
          <div className="mb-6 flex flex-col">
            <label
              className="mb-2 text-gray-700 font-semibold"
              htmlFor="printer_type"
            >
              Printer Type*
            </label>
            <select
              id="printer_type"
              name="printer_type"
              value={formdata.printer_type}
              onChange={handleChange}
              className={`shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
          ${errors.printer_type ? "border-red-500" : "border-[#4CBBA1]"}`}
            >
              <option value="">Select Printer Type</option>
              <option value="windows">Windows (USB / Installed Printer)</option>
              <option value="network">Network (IP Printer)</option>
            </select>
            {errors.printer_type && (
              <p className="text-red-500 text-sm mt-1">{errors.printer_type}</p>
            )}
          </div>

          {/* Printer Path */}
          <div className="mb-6 flex flex-col">
            <label
              className="mb-2 text-gray-700 font-semibold"
              htmlFor="printer_path"
            >
              Printer Path*
            </label>
            <input
              type="text"
              id="printer_path"
              name="printer_path"
              placeholder="Enter Printer Path"
              value={formdata.printer_path}
              onChange={handleChange}
              className={`shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
          ${errors.printer_path ? "border-red-500" : "border-[#4CBBA1]"}`}
            />
            {errors.printer_path && (
              <p className="text-red-500 text-sm mt-1">{errors.printer_path}</p>
            )}
          </div>

          {/* Kitchen Select */}
          <div className="mb-6 flex flex-col">
            <label
              className="mb-2 text-gray-700 font-semibold"
              htmlFor="kitchen_id"
            >
              Select Kitchen*
            </label>
            <select
              id="kitchen_id"
              name="kitchen_id"
              value={formdata.kitchen_id}
              onChange={handleChange}
              className={`shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
          ${errors.kitchen_id ? "border-red-500" : "border-[#4CBBA1]"}`}
            >
              <option value="">Select</option>
              {kitchenData.map((method, index) => (
                <option key={index} value={method.id}>
                  {method.kitchen_name}
                </option>
              ))}
            </select>
            {errors.kitchen_id && (
              <p className="text-red-500 text-sm mt-1">{errors.kitchen_id}</p>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end">
            <button
              type="submit"
              className="bg-[#4CBBA1] hover:bg-[#3aa88e] text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Add Printer
            </button>
          </div>
        </form>
      </DialogBoxSmall>
      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-full max-w-md px-6">
              <div className="bg-white rounded-md shadow-md border border-[#1C1D3E]">
                {/* Header */}
                <div className="flex py-2 px-4 justify-between items-center border-b border-black">
                  <h2 className="text-xl font-semibold">Edit Printer Data</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-3 py-1 rounded hover:scale-105 font-bold focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-red-500"
                    aria-label="Close modal"
                  >
                    X
                  </button>
                </div>

                {/* Form */}
                <div className="p-6">
                  <form onSubmit={handleSubmit2}>
                    <div className="grid grid-cols-1 gap-6">
                      {/* Printer Name */}
                      <div>
                        <label
                          className="block text-gray-700 font-semibold mb-2"
                          htmlFor="printer_name"
                        >
                          Printer Name*
                        </label>
                        <input
                          id="printer_name"
                          name="printer_name"
                          value={formData2.printer_name}
                          onChange={handleChange2}
                          placeholder="Printer Name"
                          className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                      ${
                        editErrors.printer_name
                          ? "border-red-500"
                          : "border-[#4CBBA1]"
                      }`}
                          type="text"
                        />
                        {editErrors.printer_name && (
                          <p className="text-red-500 text-sm mt-1">
                            {editErrors.printer_name}
                          </p>
                        )}
                      </div>

                      {/* Printer Type */}
                      <div>
                        <label
                          className="block text-gray-700 font-semibold mb-2"
                          htmlFor="printer_type"
                        >
                          Printer Type*
                        </label>
                        <select
                          id="printer_type"
                          name="printer_type"
                          value={formData2.printer_type}
                          onChange={handleChange2}
                          className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                      ${
                        editErrors.printer_type
                          ? "border-red-500"
                          : "border-[#4CBBA1]"
                      }`}
                        >
                          <option value="">Select Printer Type</option>
                          <option value="windows">
                            Windows (USB / Installed Printer)
                          </option>
                          <option value="network">Network (IP Printer)</option>
                        </select>
                        {editErrors.printer_type && (
                          <p className="text-red-500 text-sm mt-1">
                            {editErrors.printer_type}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          Type USB Port if you select USB, and if Network, then
                          enter the IP number of the printer.
                        </p>
                      </div>

                      {/* Printer Path */}
                      <div>
                        <label
                          className="block text-gray-700 font-semibold mb-2"
                          htmlFor="printer_path"
                        >
                          Printer Path*
                        </label>
                        <input
                          id="printer_path"
                          name="printer_path"
                          value={formData2.printer_path}
                          onChange={handleChange2}
                          placeholder="Printer Path"
                          className={`shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                      ${
                        editErrors.printer_path
                          ? "border-red-500"
                          : "border-[#4CBBA1]"
                      }`}
                          type="text"
                        />
                        {editErrors.printer_path && (
                          <p className="text-red-500 text-sm mt-1">
                            {editErrors.printer_path}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Kitchen Select */}
                    <div className="mb-6 flex flex-col">
                      <label
                        className="mb-2 text-gray-700 font-semibold"
                        htmlFor="kitchen_id"
                      >
                        Select Kitchen*
                      </label>
                      <select
                        id="kitchen_id"
                        name="kitchen_id"
                        value={formData2.kitchen_id}
                        onChange={handleChange2}
                        className={`shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline
                    ${
                      editErrors.kitchen_id
                        ? "border-red-500"
                        : "border-[#4CBBA1]"
                    }`}
                      >
                        <option value="">Select</option>
                        {kitchenData.map((method, index) => (
                          <option key={index} value={method.id}>
                            {method.kitchen_name}
                          </option>
                        ))}
                      </select>
                      {editErrors.kitchen_id && (
                        <p className="text-red-500 text-sm mt-1">
                          {editErrors.kitchen_id}
                        </p>
                      )}
                    </div>

                    {/* Submit */}
                    <div className="flex justify-end mt-6">
                      <button
                        type="submit"
                        className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md hover:bg-[#121330] focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500"
                      >
                        Update
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay */}
          <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
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

export default PrinterList;
