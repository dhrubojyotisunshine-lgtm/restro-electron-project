import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { toast } from "react-toastify";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoIosAddCircleOutline } from "react-icons/io";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import axios from "axios";
import defaultimage from "../../assets/images/Account.png";
import { useNavigate } from "react-router-dom";
import HasPermission from "../../store/HasPermission";
import EmployeePreview from "../../components/EmployeePreview";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";
const headers = [
  "SL.",
  "Image",
  "Employee Name ",
  "Designation ",
  "Phone",
  "Email",
  "Division ",
  "Duty Type",
  "Hire Date",
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

const ManageEmploye = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL= import.meta.env.VITE_IMG_URL
  const [isOpen, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const defaultImage = defaultimage;
  const [employeData, setEmployeData] = useState([]);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [searchName, setSearchName] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const [countries, setCountries] = useState([]);
  const [invoiceData, setInvoiceData] = useState([]);
  const [division, setDivision] = useState([]);
  const [dutyType, setDutyType] = useState([]);
  const [position, setPosition] = useState([]);
  const [payfrequency, setPayfrequency] = useState([]);
  const [rateType, setRateType] = useState([]);
  const [mstatus, setMstatus] = useState([]);
  const [gendar, setGendar] = useState([]);
  const nextStep = () => {
    setStep(step + 1);
  };
  const token = localStorage.getItem("token");
  const prevStep = () => {
    setStep(step - 1);
  };
  const navigate = useNavigate();
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(employeData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };

  // full screen

 
  // get all data
  const getEmployeeData = () => {
    axios
      .get(`${API_BASE_URL}/employedata`,{
        headers:{
          Authorization: token
        }
      })
      .then((res) => {
        // Update the employee data state
        setEmployeData(res.data.data);

        // Log the received data after it has been set
        console.log("Data received: ", res.data.data);
        console.log("hey");
      })
      .catch((error) => {
        // Log the error to the console
        console.error("Error fetching employee data: ", error);
        console.log("hey");
        // Display an error toast notification
        toast.error(`Error fetching employee data: ${error.message}`);
      });
  };
  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getEmployeeData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/employedata`, {
        params: { searchItem: value },
        
        headers:{
          Authorization: token
        }
      
      })
      .then((res) => {
        setEmployeData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  //edit

  // get division
  const getallDivision = async () => {
    await axios
      .get(`${API_BASE_URL}/division`,{
        headers:{
          Authorization: token
          }
      })
      .then((res) => {
        setDivision(res.data.data);
        console.log("data recive hua", division);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // duty type
  const getDutyType = async () => {
    await axios
      .get(`${API_BASE_URL}/dutytype`)
      .then((res) => {
        setDutyType(res.data.data);
        console.log("data recive  duty ak", dutyType);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // get all designations
  const getPositions = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/designation`,{
        headers:{
          Authorization: token
          }
      });
      console.log(res.data);
      setPosition(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  // get Pay frequency
  const getPayFrequency = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/frequencytype`,{
        headers:{
          Authorization: token
          }
      });
      console.log(res.data);
      setPayfrequency(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  // get rate type

  const getrateType = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/ratetype`);
      console.log(res.data);
      setRateType(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  // mstatus
  const getMstatus = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/mstatus`);
      console.log(res.data);
      setMstatus(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  //country
  const getCountry = () => {
    axios
      .get(`${API_BASE_URL}/countries`)
      .then((res) => {
        setCountries(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  const getGender = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/gender`);
      console.log(res.data);
      setGendar(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    zip: "",
    state: "",
    country: "",
    city: "",
    gender: "",
    dob: "",
    marital_status: "",
    picture: null,
    division_id: "",
    pos_id: "", // designation id
    duty_type: "",
    voluntary_termination: "",
    home_email: "",
    home_phone: "",
    emerg_contct: "",
    emrg_w_phone: "",
    termination_reason: "",
    hire_date: "",
    original_hire_date: "",
    termination_date: "",
    rehire_date: "",
    rate_type: "",
    rate: "",
    pay_frequency: "",
    pay_frequency_txt: "",
  });
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };
  // Handle image file input
  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      picture: e.target.files[0], // Set the image file in formData
    });
  };
  const [editID, setEditId] = useState("");
  const handleEditClick = (id) => {
    setIsModalOpen(true);
    // Fetch data for the given ID

    setEditId(id);

    axios.get(`${API_BASE_URL}/getemployeebyid/${id}`).then((response) => {
      if (response.data.success && response.data.data.length > 0) {
        const employeeData = response.data.data[0];
        setFormData({
          first_name: employeeData.first_name || "",
          last_name: employeeData.last_name || "",
          email: employeeData.email || "",
          phone: employeeData.phone || "",
          zip: employeeData.zip || "",
          city: employeeData.city || "",
          country: employeeData.country || "",
          state: employeeData.state || "",
          gender: employeeData.gender || "", // Update according to actual data field
          dob: employeeData.dob
            ? new Date(employeeData.dob).toISOString().split("T")[0]
            : "",
          marital_status: employeeData.marital_status || "",
          picture: employeeData.picture || null,
          division_id: employeeData.division_id || "", // Update according to actual data field
          pos_id: employeeData.pos_id || "",
          duty_type: employeeData.duty_type || "",
          voluntary_termination: employeeData.voluntary_termination || "",
          home_email: employeeData.home_email || "",
          home_phone: employeeData.home_phone || "",
          emerg_contct: employeeData.emerg_contct || "",
          emrg_w_phone: employeeData.emrg_w_phone || "",
          termination_reason: employeeData.termination_reason || "",
          hire_date: employeeData.hire_date
            ? new Date(employeeData.hire_date).toISOString().split("T")[0]
            : "",
          original_hire_date: employeeData.original_hire_date
            ? new Date(employeeData.original_hire_date)
                .toISOString()
                .split("T")[0]
            : "",
          termination_date: employeeData.termination_date
            ? new Date(employeeData.termination_date)
                .toISOString()
                .split("T")[0]
            : "",
          rehire_date: employeeData.rehire_date
            ? new Date(employeeData.rehire_date).toISOString().split("T")[0]
            : "",
          rate_type: employeeData.rate_type || "",
          rate: employeeData.rate || "",
          pay_frequency: employeeData.frequency_name || "",
          pay_frequency_txt: employeeData.pay_frequency_txt || "",
        });
      }
      console.log("API response received:", response);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios
      .put(`${API_BASE_URL}/updateemployee/${editID}`, formData)
      .then((response) => {
        console.log("Employee data updated successfully:", response.data);
        toast.success("Employee data updated successfully");
        setIsModalOpen(false);
        getEmployeeData();
        // Add any further actions like showing a success message or redirecting
      })
      .catch((error) => {
       
        console.error("Error updating employee data:", error);
          const errorMessage =
                    error.response && error.response.data && error.response.data.message
                      ? error.response.data.message
                      : "Error in updating data";
                      
                  toast.error(errorMessage);
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
      .delete(`${API_BASE_URL}/deleteemployee/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("Delete Employee Sucessfully..");
        getEmployeeData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  // view employee data

  useEffect(() => {
    console.log("Updated Invoice Data: ", invoiceData);
  }, [invoiceData]);

  const showEmployeeData = async (order_id) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/getemployeebyid/${order_id}`
      );
      setInvoiceData([response.data]);
      console.log("Invoice Data aaya: ", invoiceData);
      setInvoiceDataModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  // download

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/employedata`,{
        headers: {
       
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

      Employee_Name: `${item.FirstName}${item.LastName}`,
      Designation: item.Designation,
      Phone: item.Phone,
      Email_Address: item.Email_Address,
      Division: item.Division,
      Duty_type: item.Duty_type,
      Hire_Date: new Date(item.Hire_Date).toLocaleDateString(),
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
      { header: "Employee_Name", key: "employee_name" },
      { header: "Designation", key: "designation" },
      { header: "Phone", key: "Phone" },
      { header: "Email_Address", key: "email_address" },
      { header: "Division", key: "division" },
      { header: "Duty_type", key: "duty_type" },
      { header: "Hire_Date", key: "hire_date" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        employee_name: `${item.FirstName}${item.LastName}`
          ? `${item.FirstName}${item.LastName}`
          : "No add on Found",
        designation: item.Designation,
        Phone: item.Phone,
        email_address: item.Email_Address,
        division: item.Division,
        duty_type: item.Duty_type,
        hire_date: new Date(item.Hire_Date).toLocaleDateString(),
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
      `${item.FirstName}${item.LastName}`,
      item.Designation,
      item.Phone,
      item.Email_Address,
      item.Division,
      item.Duty_type,
      new Date(item.Hire_Date).toLocaleDateString(),
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
autoTable(doc,{
      head: [
        [
          "Employee_Name",
          "Designation",
          "Phone",
          "Email_Address",
          "Division",
          "Duty_type",
          "Hire_Date",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getallDivision();
    getDutyType();
    getPositions();
    getPayFrequency();
    getrateType();
    getMstatus();
    getGender();
    getEmployeeData();
    getCountry();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={isOpen ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Manage Employee
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              

                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className=" flex justify-between">
              <span></span>
              <HasPermission module="Manage Employee" action="create">
                <button
                  onClick={() => {
                    navigate("/add-employee");
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px]  mt-10 rounded-sm  flex justify-center items-center
             gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Employee
                </button>
              </HasPermission>
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
                      // onClick={handleSearch}
                      className="px-4 text-[#0f044a] text-sm"
                    >
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
                    {employeData.length > 0 ? (
                      employeData
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
                              <img
                                src={`${VITE_IMG_URL}` + row.photograph}
                                alt={row.Name}
                                onError={handleImageError}
                                className="w-[80px] h-[60px] mx-auto  text-wrap text-sm"
                              />
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {`${row.FirstName} ${row.LastName}`}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Designation}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Phone}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Email_Address}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Division ? row.Division : "not found"}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Duty_type}
                            </td>
                            <td className="py-2 px-4 border border-[#9becd9]">
                              {row.Original_Hire_Date
                                ? new Date(
                                    row.Original_Hire_Date
                                  ).toLocaleDateString()
                                : "No date"}
                            </td>

                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                                <HasPermission
                                  module="Manage Employee"
                                  action="edit"
                                >
                                  <Tooltip message="Edit ">
                                    <button
                                      onClick={() =>
                                        handleEditClick(row.emp_his_id)
                                      }
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                </HasPermission>
                                <HasPermission
                                  module="Manage Employee"
                                  action="delete"
                                >
                                  <Tooltip message="Delete ">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleDeleteClick(row.emp_his_id)
                                        }
                                      >
                                        <FaRegTrashCan />
                                      </button>
                                    </div>
                                  </Tooltip>
                                </HasPermission>

                                <HasPermission
                                  module="Manage Employee"
                                  action="access"
                                >
                                  <Tooltip message="Check Details">
                                    <button
                                      onClick={() =>
                                        showEmployeeData(row.emp_his_id)
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
                        <td colSpan="9" className="py-2 px-4 text-center">
                          No results found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Pagination */}
            <div className="flex justify-between mt-7">
              {employeData.length > 0 && (
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
                      ...Array(Math.ceil(employeData.length / itemsPerPage)),
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
                        Math.ceil(employeData.length / itemsPerPage)
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

      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none  ">
            <div className=" w-full py-3 h-screen px-20">
              <div className="py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl  font-semibold">
                    Edit Employe Details
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className=" p-4">
                  <div className="  w-full border-[#4CBBA1] border-[1px] p-2 mt-11">
                    {step === 1 && (
                      <div>
                        <h2 className="text-xl font-bold mb-4">
                          Employee Information - Step 1
                        </h2>
                        <form>
                          {/* Persional information */}
                          <div className="info1 flex items-center justify-between mt-9">
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                First Name
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.first_name}
                                name="first_name"
                                type="text"
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Last Name
                              </label>
                              <input
                                name="last_name"
                                onChange={handleChange}
                                value={formData.last_name}
                                type="text"
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Email
                              </label>
                              <input
                                name="email"
                                onChange={handleChange}
                                  required
                          pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                value={formData.email}
                                type="email"
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Phone
                              </label>
                              <input
                                name="phone"
                                onChange={handleChange}
                                value={formData.phone}
                                type="tel"
                  pattern="[0-9]{10,15}"
                  maxLength={10}
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                          </div>

                          {/* Country */}
                          <div className="country flex justify-between items-center mt-8">
                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Country*
                              </label>

                              <input
                                name="state"
                                onChange={handleChange}
                                value={formData.country}
                                placeholder="state"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                             
                            </div>
                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                State*
                              </label>
                              <input
                                name="state"
                                onChange={handleChange}
                                value={formData.state}
                                placeholder="state"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>

                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                City*
                              </label>
                              <input
                                name="city"
                                onChange={handleChange}
                                value={formData.city}
                                placeholder="city"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>

                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Zip Code*
                              </label>
                              <input
                                name="zip"
                                onChange={handleChange}
                                value={formData.zip}
                                placeholder="Zip Code"
                                type="number"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                          </div>
                          {/* Division 1*/}

                          <div className="country flex justify-between items-center mt-9">
                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Division*
                              </label>
                              <select
                                value={formData.division_id}
                                onChange={handleChange}
                                name="division_id"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {division.map((val) => (
                                  <option
                                    key={val.dept_id}
                                    value={val.division_id}
                                  >
                                    {val.division_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Designation*
                              </label>
                              <select
                                value={formData.pos_id}
                                onChange={handleChange}
                                name="pos_id"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {position.map((val) => (
                                  <option key={val.pos_id} value={val.pos_id}>
                                    {val.position_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Duty Type
                              </label>
                              <select
                                onChange={handleChange}
                                name="duty_type"
                                value={formData.duty_type}
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {dutyType.map((val) => (
                                  <option key={val.id} value={val.id}>
                                    {val.type_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block mb-2 text-sm font-medium text-gray-700">
                                Voluntary Termination
                              </label>
                              <select
                                value={
                                  formData.voluntary_termination === 0
                                    ? "No"
                                    : formData.voluntary_termination === 1
                                    ? "Yes"
                                    : ""
                                }
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    voluntary_termination:
                                      e.target.value === "No" ? 0 : 1,
                                  })
                                }
                                name="voluntary_termination"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                <option value={1}>Yes</option>
                                <option value={0}>No</option>
                              </select>
                            </div>
                          </div>

                          {/* Persional information */}
                          <div className="info1 flex items-center justify-between mt-9">
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                DOB
                              </label>
                              <input
                                name="dob"
                                value={formData.dob}
                                onChange={handleChange}
                                type="date"
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Gender
                              </label>
                              <select
                                onChange={handleChange}
                                name="gender"
                                value={formData.gender}
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {gendar.map((val) => (
                                  <option key={val.id} value={val.id}>
                                    {val.gender_name}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Marital Status
                              </label>
                              <select
                                onChange={handleChange}
                                name="marital_status"
                                value={formData.marital_status}
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {mstatus.map((val) => (
                                  <option key={val.id} value={val.id}>
                                    {val.marital_sta}
                                  </option>
                                ))}
                              </select>
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Photo
                              </label>
                              <input
                                name="picture"
                                type="file"
                                 accept="image/*"
                                 
                                onChange={handleImageChange}
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                          </div>

                          {/* Persional information 2 */}
                          <div className="info1 flex items-center justify-between mt-9">
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Home Email
                              </label>
                              <input
                                onChange={handleChange}
                                name="home_email"
                                value={formData.home_email}
                                type="email"
                                 required
                  pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Home Phone
                              </label>
                              <input
                                value={formData.home_phone}
                                onChange={handleChange}
                                name="home_phone"
                                type="tel"
                  pattern="[0-9]{10,15}"
                  maxLength={10}
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Emergency Contact
                              </label>
                              <input
                                value={formData.emerg_contct}
                                onChange={handleChange}
                                name="emerg_contct"
                                type="tel"
                  pattern="[0-9]{10,15}"
                  maxLength={10}
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                            <div className="mb-4">
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Emergency Work Phone *
                              </label>
                              <input
                                onChange={handleChange}
                                name="emrg_w_phone"
                                value={formData.emrg_w_phone}
                               type="tel"
                  pattern="[0-9]{10,15}"
                  maxLength={10}
                                className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              />
                            </div>
                          </div>

                          <div className=" mt-5">
                            <label className="block mb-2  font-semibold text-xl text-gray-700">
                              Termination Reason
                            </label>
                            <textarea
                              className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              name="termination_reason"
                              value={formData.termination_reason}
                              onChange={handleChange}
                              id=""
                              rows={5}
                              cols={10}
                            ></textarea>
                          </div>
                          <div className=" flex justify-between">
                            <span></span>
                            <button
                              type="button"
                              onClick={nextStep}
                              className="bg-blue-500 text-white mt-11  mb-3 px-4 py-2 rounded hover:bg-blue-600"
                            >
                              Next
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {step === 2 && (
                      <div>
                        <h2 className="text-xl font-bold mb-4">
                          Employe Information - Step 2
                        </h2>
                        <form>
                          {/*  division 2*/}

                          <div className="country flex justify-between items-center mt-9">
                            <div>
                              <label
                                className=" block mb-2  text-sm font-medium text-gray-700"
                                htmlFor="categoryName"
                              >
                                Hire Date *
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.hire_date}
                                name="hire_date"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="date"
                              />
                            </div>

                            <div>
                              <label
                                className=" block mb-2  text-sm font-medium text-gray-700"
                                htmlFor="categoryName"
                              >
                                Original Hire Date *
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.original_hire_date}
                                name="original_hire_date"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="date"
                              />
                            </div>

                            <div>
                              <label
                                className=" block mb-2  text-sm font-medium text-gray-700"
                                htmlFor="categoryName"
                              >
                                Termination Date*
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.termination_date}
                                name="termination_date"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="date"
                              />
                            </div>

                            <div>
                              <label
                                className=" block mb-2  text-sm font-medium text-gray-700"
                                htmlFor="categoryName"
                              >
                                Re Hire Date*
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.rehire_date}
                                name="rehire_date"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="date"
                              />
                            </div>
                          </div>

                          {/* division 3 */}

                          <div className="country flex justify-between items-center mt-9">
                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Rate Type*
                              </label>
                              <select
                                onChange={handleChange}
                                value={formData.rate_type}
                                name="rate_type"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {rateType.map((val) => (
                                  <option key={val.id} value={val.id}>
                                    {val.r_type_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Rate*
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.rate}
                                name="rate"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="number"
                              />
                            </div>

                            <div>
                              <label className="block mb-2  text-sm font-medium text-gray-700">
                                Pay Frequency *
                              </label>

                              <select
                                onChange={handleChange}
                                value={formData.pay_frequency}
                                name="pay_frequency"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                              >
                                <option value="">Select</option>
                                {payfrequency.map((val, index) => (
                                  <option key={val.id} value={val.id}>
                                    {val.frequency_name}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <div>
                              <label className=" block mb-2  text-sm font-medium text-gray-700">
                                Pay Frequency Text*
                              </label>
                              <input
                                onChange={handleChange}
                                value={formData.pay_frequency_txt}
                                name="pay_frequency_txt"
                                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                type="text"
                              />
                            </div>
                          </div>

                          {/* divsion 4 */}

                          <div className=" w-full mt-11">
                            <button
                              type="button"
                              onClick={prevStep}
                              className="bg-gray-500 mb-10 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                            >
                              Previous
                            </button>
                            <button
                              type="submit"
                              onClick={handleSubmit}
                              className="bg-green-500 mb-10 text-white px-4 py-2 rounded hover:bg-green-600"
                            >
                              Submit
                            </button>
                          </div>
                        </form>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="  opacity-45 fixed inset-0 z-40 bg-slate-800"></div>
        </>
      )}

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />

      <EmployeePreview
        isOpen={invoiceDataModal}
        onClose={() => setInvoiceDataModal(false)}
        invoiceDatas={invoiceData}
      ></EmployeePreview>
    </>
  );
};

export default ManageEmploye;
