import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { useNavigate } from "react-router-dom";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { AuthContext } from "../../store/AuthContext";
import { FaRegEdit, FaHistory } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import useFullScreen from "../../components/useFullScreen";

const headers = [
  "SL.",
  "Invoice No.",

  "Supplier Name",
  "Date",
  "Total Price",

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
const PurchaseItem = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  //get supplier

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(true);
  const [purchaseData, setPurchaseData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const token = localStorage.getItem("token");
  const [grandTotal, setGrandTotal] = useState(0);
  const [apiItems, setApiItems] = useState([]);
  const [suppler, setSuppler] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [extraPayment, setExtraPayment] = useState("");
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const handleViewHistory = (purID) => {
    setHistoryLoading(true);
    setShowHistoryModal(true);
    axios
      .get(`${API_BASE_URL}/purchase/${purID}/history`, {
        headers: { Authorization: token },
      })
      .then((res) => {
        setHistoryData(res.data.data || []);
      })
      .catch((error) => {
        console.error("Error fetching purchase history:", error);
        toast.error("Failed to load history");
        setHistoryData([]);
      })
      .finally(() => {
        setHistoryLoading(false);
      });
  };

  const navigate = useNavigate();

  const [editId, setEditId] = useState(null);

  const getPurchaseData = () => {
    axios
      .get(`${API_BASE_URL}/purchaseitem`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setPurchaseData(response.data.data);
        console.log(response);
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(purchaseData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getPurchaseData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/purchaseitem`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setPurchaseData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // toast.error("Error fetching filtered data");
      });
  };
  //edit

  const [purchaseDetails, setPurchaseDetails] = useState({
    suplierID: "",
    invoiceid: "",
    details: "",
    purchasedate: "",
    purchaseexpiredate: "",
    paid_amount: "",
    savedby: "",
  });

  const remainingAmount =
    grandTotal - (parseFloat(purchaseDetails.paid_amount) || 0);

  const [items, setItems] = useState([
    {
      item: "",
      stock_qty: 0,
      quantity: 0,
      rate: 0,
      total: 0,
    },
  ]);

  const getSuppliers = () => {
    axios
      .get(`${API_BASE_URL}/suppliers`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setSuppler(response.data.data);
      });
  };

  const getPaymentMethods = () => {
    axios
      .get(`${API_BASE_URL}/paynmenttype`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setPaymentMethod(response.data);
      });
  };

  const IngredientsQuantity = () => {
    axios
      .get(`${API_BASE_URL}/getIngredient`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setApiItems(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // Handling form input changes for purchase details
  const handlePurchaseDetailChange = (e) => {
    const { name, value } = e.target;
    setPurchaseDetails((prevDetails) => ({
      ...prevDetails,
      [name]: value,
    }));
  };
  const [itemErrors, setItemErrors] = useState([]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    const newItemErrors = [];
    if (!purchaseDetails.suplierID)
      newErrors.suplierID = "Supplier is required";
    if (!purchaseDetails.invoiceid)
      newErrors.invoiceid = "Invoice ID is required";
    if (!purchaseDetails.purchasedate)
      newErrors.purchasedate = "Purchase Date is required";
    if (!purchaseDetails.purchaseexpiredate)
      newErrors.purchaseexpiredate = "Expire Date is required";
    if (!purchaseDetails.paid_amount)
      newErrors.paid_amount = "Paid Amount is required";
    items.forEach((item, index) => {
      const rowErrors = {};
      if (!item.item) rowErrors.item = "Item is required";
      if (!item.quantity || item.quantity <= 0)
        rowErrors.quantity = "Quantity required";
      if (!item.rate || item.rate <= 0) rowErrors.rate = "Rate required";
      newItemErrors[index] = rowErrors;
    });

    // Global item error (if all empty)
    if (items.length === 0) {
      newErrors.items = "At least one item is required";
    }

    if (
      Object.keys(newErrors).length > 0 ||
      newItemErrors.some((e) => Object.keys(e || {}).length > 0)
    ) {
      setErrors(newErrors);
      setItemErrors(newItemErrors);
      return;
    }

    // Clear errors if valid
    setErrors({});
    setItemErrors([]);

    const requestData = {
      purchasedetail: [
        {
          ...purchaseDetails,
          total_price: grandTotal,
          // paid_amount:
        },
      ],
      itemdetails: items.map((item) => ({
        indredientid: item.item,
        quantity: item.quantity,
        price: item.rate,
      })),
    };
    console.log("Success:", requestData);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/updatedata/${editId}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      console.log("Success:", response.data);

      // Show success toast
      toast.success("Purchase updated successfully!");

      // Reset form fields and state variables
      setPurchaseDetails({
        invoiceid: "",
        suplierID: "",
        details: "",
        purchasedate: "",
        purchaseexpiredate: "",
        paid_amount: "",
      });

      setItems([{ item: "", stock_qty: 0, quantity: 0, rate: 0, total: 0 }]);
      setGrandTotal(0);

      setSelectedMethod(1); // Reset payment method to default or the first option
      setIsModalOpen(false);
      getPurchaseData();
    } catch (error) {
      console.error("Error:", error);
      // Show error toast
      console.log("edit id ", editId);
      toast.error("Something went wrong.");
    }
  };

  //handlepayRemaining
  const handlePayRemaining = async () => {
    if (!extraPayment || parseFloat(extraPayment) <= 0) {
      toast.error("Enter valid amount");
      return;
    }
    if (parseFloat(extraPayment) > remainingAmount) {
      toast.error("Cannot pay more than remaining!");
      return;
    }

    try {
      const newPaidAmount =
        parseFloat(purchaseDetails.paid_amount || 0) + parseFloat(extraPayment);

      const requestData = {
        purchasedetail: [
          {
            ...purchaseDetails,
            total_price: grandTotal,
            paid_amount: newPaidAmount, // ✅ updated amount send kar rahe
          },
        ],
        itemdetails: items.map((item) => ({
          indredientid: item.item,
          quantity: item.quantity,
          price: item.rate,
        })),
      };

      await axios.put(`${API_BASE_URL}/updatedata/${editId}`, requestData, {
        headers: { "Content-Type": "application/json" },
      });

      toast.success("Payment updated successfully!");

      // ✅ Yahin par local state update karo
      setPurchaseDetails((prev) => ({
        ...prev,
        paid_amount: newPaidAmount,
      }));

      getPurchaseData(); // backend se fresh data bhi aa jaayega
      setShowPaymentModal(false);
      setExtraPayment("");
    } catch (error) {
      toast.error("Payment failed");
      console.error(error);
    }
  };

  // Handle changes in item rows
  const handleItemChange = (index, event) => {
    const { name, value } = event.target;
    const updatedItems = [...items];

    if (name === "item") {
      const selectedItem = apiItems.find((item) => item.id === parseInt(value));
      if (selectedItem) {
        updatedItems[index] = {
          ...updatedItems[index],
          item: selectedItem.id,
          stock_qty: selectedItem.stock_qty,
          quantity: 1,
          rate: selectedItem.rate || 0, // If you want to prefill rate from API
          total: 1 * (selectedItem.rate || 0),
        };
      }
    } else {
      updatedItems[index] = {
        ...updatedItems[index],
        [name]: value,
      };

      // Calculate total correctly with number conversion
      if (name === "quantity" || name === "rate") {
        const quantity = parseFloat(updatedItems[index].quantity) || 0;
        const rate = parseFloat(updatedItems[index].rate) || 0;
        updatedItems[index].total = parseFloat((quantity * rate).toFixed(2));
      }
    }

    setItems(updatedItems);
    calculateGrandTotal(updatedItems);
  };

  // Fetch existing purchase data for editing
  const handleEditClick = (reserveid) => {
    setEditId(reserveid);

    axios.get(`${API_BASE_URL}/getupdate/${reserveid}`).then((response) => {
      console.log("data", response);
      const data = response.data.data;
      console.log("Fetched data from API:", data);
      // Set purchase details in state
      setPurchaseDetails({
        savedby: data.purchaseitem[0].savedby,
        suplierID: data.purchaseitem[0].suplierID,
        invoiceid: data.purchaseitem[0].invoiceid,
        details: data.purchaseitem[0].details,
        purchasedate: new Date(data.purchaseitem[0].purchasedate)
          .toISOString()
          .substring(0, 10),
        purchaseexpiredate: new Date(data.purchaseitem[0].purchaseexpiredate)
          .toISOString()
          .substring(0, 10),
        paid_amount: data.purchaseitem[0].paid_amount,
      });

      // Logging the updated purchase details after setting state might still show old values
      console.log("Updated purchase details being set:", {
        suplierID: data.purchaseitem[0].suplierID,
        invoiceid: data.purchaseitem[0].invoiceid,
        details: data.purchaseitem[0].details,
        purchasedate: new Date(data.purchaseitem[0].purchasedate)
          .toISOString()
          .substring(0, 10),
        purchaseexpiredate: new Date(data.purchaseitem[0].purchaseexpiredate)
          .toISOString()
          .substring(0, 10),
        paid_amount: data.purchaseitem[0].paid_amount,
      });

      // Set items in state
      const mappedItems = data.itemdetails.map((item) => ({
        item: item.ingredientids,
        quantity: item.quantity,
        rate: item.totalprice,
        stock_qty: item.stocky_quantity,
        total: item.totalprice,
      }));

      setItems(mappedItems);

      const totalAmount = mappedItems.reduce((sum, item) => {
        return sum + Number(item.rate) * Number(item.quantity);
      }, 0);

      setGrandTotal(totalAmount.toFixed(2));

      // Open the modal
      setIsModalOpen(true);
    });
  };
  // Adding new rows
  const addRow = () => {
    setItems([
      ...items,
      { item: "", stock_qty: 0, quantity: 0, rate: 0, total: 0 },
    ]);
  };

  // Removing rows
  const removeRow = (index) => {
    const updatedItems = items.filter((_, i) => i !== index);
    setItems(updatedItems);
    calculateGrandTotal(updatedItems);
  };

  // Calculate grand total
  const calculateGrandTotal = (items) => {
    const total = items.reduce((sum, item) => {
      const quantity = parseFloat(item.quantity) || 0;
      const rate = parseFloat(item.rate) || 0;
      return sum + quantity * rate;
    }, 0);

    setGrandTotal(total.toFixed(2)); // 2 decimal places
  };
  useEffect(() => {
    calculateGrandTotal(items);
  }, [items]);

  // Payment method change handler
  const handleMethodChange = (e) => {
    setSelectedMethod(e.target.value);
  };

  // downoload

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchaseitem`, {
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
      Invoice_Number: item.invoiceid,
      Supplier_Name: item.suppliername,
      Purchase_Date: new Date(item.purchasedate).toLocaleDateString(),
      Total_price: item.total_price,
      Paid_Ammount: item.paid_amount,
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
      { header: "Purchase_Date", key: "purchase_date" },
      { header: "Total_price", key: "total_price" },
      { header: "Paid_Ammount", key: "paid_ammount" },
    ];
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        invoice_number: item.invoiceid,
        supplier_name: item.suppliername,
        purchase_date: new Date(item.purchasedate).toLocaleDateString(),
        total_price: item.total_price,
        paid_ammount: item.paid_amount,
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
      item.invoiceid,
      item.suppliername,
      new Date(item.purchasedate).toLocaleDateString(),
      item.total_price,
      item.paid_amount,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [
        [
          "Invoice Number",
          "Supplier Name",
          "Purchase Date",
          "Total Price",
          "Paid Amount",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getPurchaseData();
    IngredientsQuantity();
    getSuppliers();
    getPaymentMethods();
  }, []);

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
                Purchase Item
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              </div>
            </div>

            <div className=" flex justify-between mt-11">
              <span></span>
              <HasPermission module="Purchase Item" action="create">
                <button
                  onClick={() => {
                    navigate("/add-purchase");
                  }}
                  className=" bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Add Purchase
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
                      {purchaseData.length > 0 ? (
                        purchaseData
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
                                {row.invoiceid}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.suppliername}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.purchasedate
                                  ? new Date(
                                      row.purchasedate
                                    ).toLocaleDateString("en-GB") // DD/MM/YYYY format
                                  : "No date"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.total_price}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center font-bold">
                                  <HasPermission
                                    module="Purchase Item"
                                    action="edit"
                                  >
                                    <Tooltip message="Edit">
                                      <button
                                        onClick={() =>
                                          handleEditClick(row.purID)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegEdit />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                  <Tooltip message="History">
                                    <button
                                      onClick={() =>
                                        handleViewHistory(row.purID)
                                      }
                                      className="bg-[#4CBBA1] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaHistory />
                                    </button>
                                  </Tooltip>
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
            {/* pagination  */}
            <div className="flex justify-between mt-7">
              {purchaseData.length > 0 && (
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
                      ...Array(Math.ceil(purchaseData.length / itemsPerPage)),
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
                        Math.ceil(purchaseData.length / itemsPerPage)
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
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-full px-20">
              <div className="py-4 bg-white rounded-md shadow-md border-[1px] border-[#1C1D3E]">
                <div className="flex py-5 px-4 justify-between items-center border-b-[1px] border-black">
                  <h2 className="text-xl font-semibold">Edit Purchase Item</h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
                  >
                    X
                  </button>
                </div>
                <div className="p-5">
                  <form className="" onSubmit={handleSubmit}>
                    <div className="border-[1px] border-[#4CBBA1] rounded-md p-10 mb-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Left Column */}
                        <div className="space-y-3">
                          {/* Supplier Name */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Supplier Name*
                            </label>
                            <select
                              value={purchaseDetails.suplierID}
                              onChange={handlePurchaseDetailChange}
                              // className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              // name="suplierID"
                              className={`w-full p-2 border rounded-md text-sm ${
                                errors.suplierID
                                  ? "border-red-500"
                                  : "border-gray-300"
                              }`}
                              name="suplierID"
                            >
                              <option value="">Select supplier</option>
                              {suppler.map((val) => (
                                <option key={val.supid} value={val.supid}>
                                  {val.supName}
                                </option>
                              ))}
                            </select>
                            {errors.suplierID && (
                              <p className="text-red-500 text-xs">
                                {errors.suplierID}
                              </p>
                            )}
                          </div>

                          {/* Payment Method */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Payment Method*
                            </label>
                            <select
                              value={selectedMethod}
                              onChange={handleMethodChange}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              name="paymenttype"
                            >
                              {paymentMethod.map((method) => (
                                <option
                                  key={method.payment_method_id}
                                  value={method.payment_method_id}
                                >
                                  {method.payment_method}
                                </option>
                              ))}
                            </select>

                            {/* Card Payment Details (conditionally shown) */}
                            {(selectedMethod === 9 || selectedMethod === 4) && (
                              <div className="mt-3 p-3 bg-gray-50 rounded-md border border-gray-200">
                                <h3 className="text-sm font-medium mb-2">
                                  Payment Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="col-span-2">
                                    <label className="text-xs text-gray-600">
                                      Card Number
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="0000 0000 0000 0000"
                                      className="w-full p-2 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">
                                      Expiration
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="MM/YY"
                                      className="w-full p-2 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-xs text-gray-600">
                                      CVV
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="000"
                                      className="w-full p-2 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                  <div className="col-span-2">
                                    <label className="text-xs text-gray-600">
                                      Card Holder
                                    </label>
                                    <input
                                      type="text"
                                      placeholder="Full Name"
                                      className="w-full p-2 border border-gray-300 rounded text-xs"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-3">
                          {/* Invoice ID */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Invoice ID*
                            </label>
                            <input
                              type="text"
                              name="invoiceid"
                              value={purchaseDetails.invoiceid}
                              onChange={handlePurchaseDetailChange}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Invoice ID"
                            />
                            {errors.invoiceid && (
                              <p className="text-red-500 text-xs">
                                {errors.invoiceid}
                              </p>
                            )}
                          </div>

                          {/* Details */}
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Details*
                            </label>
                            <input
                              type="text"
                              name="details"
                              value={purchaseDetails.details}
                              onChange={handlePurchaseDetailChange}
                              className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              placeholder="Details"
                            />
                          </div>

                          {/* Date Fields */}
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Purchase Date*
                              </label>
                              <input
                                type="date"
                                name="purchasedate"
                                value={purchaseDetails.purchasedate}
                                onChange={handlePurchaseDetailChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              />
                              {errors.purchasedate && (
                                <p className="text-red-500 text-xs">
                                  {errors.purchasedate}
                                </p>
                              )}
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Expire Date*
                              </label>
                              <input
                                type="date"
                                name="purchaseexpiredate"
                                value={purchaseDetails.purchaseexpiredate}
                                onChange={handlePurchaseDetailChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm"
                              />
                              {errors.purchaseexpiredate && (
                                <p className="text-red-500 text-xs">
                                  {errors.purchaseexpiredate}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      <h1 className="font-semibold text-gray-600 text-lg mb-6">
                        Items Information
                      </h1>
                      <div className="space-y-4">
                        {/* Items Table */}
                        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                          <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-[#4CBBA1]">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Item
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Stock
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Qty
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Rate
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Total
                                </th>
                                <th className="px-3 py-2 text-left text-xs font-medium text-white uppercase tracking-wider">
                                  Action
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {items.map((item, index) => (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition-colors"
                                >
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <select
                                      value={item.item}
                                      onChange={(e) =>
                                        handleItemChange(index, e)
                                      }
                                      // className="block w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
                                      className={`block w-full p-1.5 text-sm border rounded-md ${
                                        itemErrors[index]?.item
                                          ? "border-red-500"
                                          : "border-gray-300"
                                      }`}
                                      name="item"
                                    >
                                      <option value="">Select Item</option>
                                      {apiItems.map((apiItem) => (
                                        <option
                                          key={apiItem.id}
                                          value={apiItem.id}
                                        >
                                          {apiItem.ingredient_name}
                                        </option>
                                      ))}
                                    </select>
                                    {itemErrors[index]?.item && (
                                      <p className="text-red-500 text-xs">
                                        {itemErrors[index].item}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center">
                                    {item.stock_qty}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <input
                                      type="number"
                                      name="quantity"
                                      value={item.quantity}
                                      onChange={(e) =>
                                        handleItemChange(index, e)
                                      }
                                      // className="block w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
                                      className={`block w-full p-1.5 text-sm border rounded-md ${
                                        itemErrors[index]?.quantity
                                          ? "border-red-500"
                                          : "border-gray-300"
                                      }`}
                                    />
                                    {itemErrors[index]?.quantity && (
                                      <p className="text-red-500 text-xs">
                                        {itemErrors[index].quantity}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap">
                                    <input
                                      type="number"
                                      name="rate"
                                      value={item.rate}
                                      onChange={(e) =>
                                        handleItemChange(index, e)
                                      }
                                      // className="block w-full p-1.5 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
                                      className={`block w-full p-1.5 text-sm border rounded-md ${
                                        itemErrors[index]?.rate
                                          ? "border-red-500"
                                          : "border-gray-300"
                                      }`}
                                    />
                                    {itemErrors[index]?.rate && (
                                      <p className="text-red-500 text-xs">
                                        {itemErrors[index].rate}
                                      </p>
                                    )}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-sm text-center font-medium">
                                    {(
                                      Number(item.rate) * Number(item.quantity)
                                    ).toFixed(2)}
                                  </td>
                                  <td className="px-3 py-2 whitespace-nowrap text-center">
                                    <button
                                      onClick={() => removeRow(index)}
                                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                                      title="Remove item"
                                    >
                                      <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="h-5 w-5"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                      >
                                        <path
                                          strokeLinecap="round"
                                          strokeLinejoin="round"
                                          strokeWidth={2}
                                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                        />
                                      </svg>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Add Item Button */}
                        <button
                          type="button"
                          onClick={addRow}
                          className="flex items-center gap-1 text-sm bg-[#4CBBA1] hover:bg-[#3CAE95] text-white px-3 py-2 rounded-md transition-colors"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                            />
                          </svg>
                          Add Item
                        </button>

                        {/* Totals Section */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Grand Total:
                              </span>
                              <span className="text-lg font-semibold text-gray-900">
                                {grandTotal}
                              </span>
                            </div>

                            <div className="space-y-2">
                              <label className="block text-sm font-medium text-gray-700">
                                Paid Amount*
                              </label>
                              <input
                                type="number"
                                name="paid_amount"
                                value={purchaseDetails.paid_amount}
                                onChange={handlePurchaseDetailChange}
                                className="block w-full p-2 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-[#4CBBA1] focus:border-[#4CBBA1]"
                              />
                              {errors.paid_amount && (
                                <p className="text-red-500 text-xs">
                                  {errors.paid_amount}
                                </p>
                              )}
                            </div>

                            <div className="flex justify-between items-center mb-3">
                              <span className="text-sm font-medium text-gray-700">
                                Remaining Amount:
                              </span>
                              <span className="text-lg font-semibold text-red-600">
                                {remainingAmount > 0
                                  ? remainingAmount.toFixed(2)
                                  : "0.00"}
                              </span>
                            </div>

                            {remainingAmount > 0 && (
                              <button
                                type="button"
                                onClick={() => setShowPaymentModal(true)}
                                className="mt-2 px-4 py-2 bg-[#4CBBA1] text-white rounded-lg"
                              >
                                Pay Remaining
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end mt-10">
                      <button
                        type="submit"
                        className="bg-blue-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-blue-600"
                      >
                        Update
                      </button>
                      <button
                        onClick={() => setIsModalOpen(false)}
                        className="ml-4 bg-red-500 text-white font-semibold px-4 py-2 rounded-md hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-96 relative z-[70]">
            <h2 className="text-lg font-semibold mb-4">Pay Remaining</h2>
            <p className="mb-2">
              Remaining:{" "}
              <span className="font-bold">{remainingAmount.toFixed(2)}</span>
            </p>
            <input
              type="number"
              placeholder="Enter amount"
              value={extraPayment}
              onChange={(e) => setExtraPayment(e.target.value)}
              className="block w-full p-2 mb-3 text-sm border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 focus:border-green-500"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePayRemaining}
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-lg hover:bg-green-700"
              >
                Pay Now
              </button>
            </div>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-[60]">
          <div className="bg-white p-6 rounded-lg shadow-lg w-[500px] max-h-[80vh] overflow-y-auto relative z-[70]">
            <h2 className="text-lg font-semibold mb-4">Transaction History</h2>

            {historyLoading ? (
              <p className="text-center text-gray-500">Loading...</p>
            ) : historyData.length === 0 ? (
              <p className="text-center text-gray-500">No transactions found</p>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-[#4CBBA1] text-white">
                    <th className="px-3 py-2">Date</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Payment Mode</th>
                  </tr>
                </thead>
                <tbody>
                  {historyData.map((entry, idx) => (
                    <tr key={idx} className="border-b border-gray-200">
                      <td className="px-3 py-2">
                        {entry.date
                          ? new Date(entry.date).toLocaleDateString("en-GB")
                          : "-"}
                      </td>
                      <td
                        className={`px-3 py-2 font-semibold ${
                          entry.d_c === "c"
                            ? parseFloat(entry.amount) < 0
                              ? "text-red-600"
                              : "text-blue-600"
                            : "text-green-600"
                        }`}
                      >
                        {entry.d_c === "c"
                          ? parseFloat(entry.amount) < 0
                            ? "Return"
                            : "Invoice"
                          : "Payment"}
                      </td>
                      <td className="px-3 py-2">{entry.description}</td>
                      <td className="px-3 py-2">
                        {parseFloat(entry.amount || 0).toFixed(2)}
                      </td>
                      <td className="px-3 py-2">
                        {entry.d_c === "d" ? (entry.payment_mode || "-") : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowHistoryModal(false)}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PurchaseItem;
