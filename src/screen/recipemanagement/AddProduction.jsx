import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import { AuthContext } from "../../store/AuthContext";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";

import useFullScreen from "../../components/useFullScreen";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const headers = [
  "SL.",
  "Food Name",
  "Item Quantity",
  "Variant Name",
  "Production date ",
  "Expiry date",
];
const AddProduction = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [foodData, setFoodData] = useState([]); // all food
  const [variant, setVariant] = useState([]); // variant accourdin to food
  const [selectedFood, setSelectedFood] = useState(""); // Selected Food name
  const [selectedVariant, setSelectedVariant] = useState(""); // Selected variant
  const [searchName, setSearchName] = useState("");
  // get all production data
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [productionData, setProductionData] = useState([]);
  const token = localStorage.getItem("token");
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [errors, setErrors] = useState({});
  
  const getFoodData = () => {
    axios
      .get(`${API_BASE_URL}/foodname`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setFoodData(res.data.data);
        console.log(res.data.data); // Ensure API response structure matches your expectations
      })
      .catch((error) => console.error(error));
  };

  const getProductionData = () => {
    axios
      .get(`${API_BASE_URL}/productiondetails`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        setProductionData(response.data.data);
      })
      .catch(() => {
        toast.error("Error fetching production data");
      });
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getProductionData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/productiondetails`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setProductionData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        // toast.error("Error fetching filtered data");
      });
  };

  // fetch variant accourdin to food
  const fetchVariant = async (foodid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/variantdata`, {
        params: { foodid },
        headers: {
          Authorization: token,
        },
      });
      console.log("Variants received: ", response.data.data);
      setVariant(response.data.data); // Update variant list based on food
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };
  const handleFoodChange = (e) => {
    const foodid = e.target.value;
    setSelectedFood(foodid);
    setFormData((prevData) => ({
      ...prevData,
      itemid: foodid, // Update itemid in form data
    }));
    fetchVariant(foodid);
  };
  // Handle variant selection change
  const handleVariantChange = (e) => {
    const variantid = e.target.value;
    setSelectedVariant(variantid);
    setFormData((prevData) => ({
      ...prevData,
      itemvid: variantid, // Update itemvid in form data
    }));
  };
  const validateForm = () => {
    const newErrors = {};

    if (!formData.itemid) newErrors.itemid = "Food Name is required.";
    if (!formData.itemvid) newErrors.itemvid = "Variant Name is required.";
    if (!formData.saveddate)
      newErrors.saveddate = "Production Date is required.";
    if (!formData.itemquantity)
      newErrors.itemquantity = "Serving Unit is required.";
    if (!formData.productionexpiredate)
      newErrors.productionexpiredate = "Expiry Date is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // State for form data
  const [formData, setFormData] = useState({
    itemid: selectedFood,
    itemvid: selectedVariant,
    itemquantity: "",
    saveddate: "",
    productionexpiredate: "",
  });

  // Handle changes in form inputs

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submit if validation fails
    }

    try {
      const res = await axios.post(`${API_BASE_URL}/productiondata`, formData, {
        headers: { Authorization: token },
      });

      if (res.data.message === "Please set Ingredients first!") {
        toast.error("Please set Ingredients first!");
        return;
      }

      toast.success("Production Data Added Successfully");

      getFoodData();
      fetchVariant();
      getProductionData();

      setFormData({
        saveddate: new Date().toISOString().split("T")[0],
        itemquantity: "",
        productionexpiredate: new Date().toISOString().split("T")[0],
        itemid: "",
        itemvid: "",
      });

      setSelectedFood("");
      setSelectedVariant("");
    } catch (error) {
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to submit production data.");
      }
      console.error("Error submitting production data:", error);
    }
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/productiondetails`, {
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
    const data = await fetchData(); // Fetch data
    const csvData = data.map((item) => ({
      // Map your data structure as needed

      Food_Name: item.food_name ? `${item.food_name}` : "No food Found",
      Variant_Name: item.variant_name
        ? `${item.variant_name}`
        : "No varient found",
      Item_Quantity: item.itemquantity,
      Production_date: new Date(item.saveddate).toLocaleDateString(),
      Expiry_date: new Date(item.productionexpiredate).toLocaleDateString(),
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
      { header: "Food Name", key: "food_name" },
      { header: "Variant Name", key: "variant_name" },
      { header: "Item Quantity", key: "item_quantity" },
      { header: "Production_date", key: "production_date" },
      { header: "Expiry_date", key: "expiry_date" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        food_name: item.food_name ? `${item.food_name}` : "No food Found",
        variant_name: item.variant_name
          ? `${item.variant_name}`
          : "No varient found",
        item_quantity: item.itemquantity,
        Production_date: new Date(item.saveddate).toLocaleDateString(),
        expiry_date: new Date(item.productionexpiredate).toLocaleDateString(),
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
      item.food_name ? `${item.food_name}` : "No food Found",
      item.variant_name ? `${item.variant_name}` : "No varient found",
      item.itemquantity,
      new Date(item.saveddate).toLocaleDateString(),
      new Date(item.productionexpiredate).toLocaleDateString(),
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [
        [
          "Food Name",
          "Item Quantity",
          "Variant Name",
          "Production date ",
          "Expiry date",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(productionData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  useEffect(() => {
    getFoodData();
    fetchVariant();
    getProductionData();
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
                Add Production Set
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

            <form
              onSubmit={handleSubmit}
              className="p-10 mt-11 border-[1px] border-[#4CBBA1] rounded shadow-sm grid grid-cols-3 gap-10"
            >
              {/* Food Name */}
              <div className="flex flex-col col-span-1">
                <label className="font-semibold mb-2">Food Name*</label>
                <select
                  name="itemid"
                  value={selectedFood}
                  onChange={handleFoodChange}
                  className="p-2 rounded w-full border-[1px] border-[#4CBBA1]"
                >
                  <option value="">Select Food</option>
                  {foodData.map((val, index) => (
                    <option key={index} value={val.ProductsID}>
                      {val.ProductName}
                    </option>
                  ))}
                </select>
                {errors.itemid && (
                  <p className="text-red-500 text-sm">{errors.itemid}</p>
                )}
              </div>

              {/* Variant Name */}
              <div className="flex flex-col col-span-1">
                <label className="font-semibold mb-2">Variant Name*</label>
                <select
                  name="itemvid"
                  value={selectedVariant}
                  onChange={handleVariantChange}
                  className="p-2 rounded w-full border-[1px] border-[#4CBBA1]"
                >
                  <option value="">Select Option</option>
                  {variant.map((variantItem, index) => (
                    <option key={index} value={variantItem.variantid}>
                      {variantItem.variantname}
                    </option>
                  ))}
                </select>
                {errors.itemvid && (
                  <p className="text-red-500 text-sm">{errors.itemvid}</p>
                )}
              </div>

              {/* Production Date */}
              <div className="flex flex-col col-span-1">
                <label className="font-semibold mb-2">Production Date*</label>
                <input
                  type="date"
                  name="saveddate"
                  value={formData.saveddate}
                  onChange={handleChange}
                  className="p-2 rounded w-full border-[1px] border-[#4CBBA1]"
                />
                {errors.saveddate && (
                  <p className="text-red-500 text-sm">{errors.saveddate}</p>
                )}
              </div>

              {/* Serving Unit */}
              <div className="flex flex-col col-span-1">
                <label className="font-semibold mb-2">Serving Unit*</label>
                <input
                  type="text"
                  name="itemquantity"
                  value={formData.itemquantity}
                  onChange={handleChange}
                  placeholder="Enter Quantity"
                  className="p-2 rounded w-full border-[1px] border-[#4CBBA1]"
                />
                {errors.itemquantity && (
                  <p className="text-red-500 text-sm">{errors.itemquantity}</p>
                )}
              </div>

              {/* Expiry Date */}
              <div className="flex flex-col col-span-1">
                <label className="font-semibold mb-2">Expiry Date*</label>
                <input
                  type="date"
                  name="productionexpiredate"
                  value={formData.productionexpiredate}
                  onChange={handleChange}
                  className="p-2 rounded w-full border-[1px] border-[#4CBBA1]"
                />
                {errors.productionexpiredate && (
                  <p className="text-red-500 text-sm">
                    {errors.productionexpiredate}
                  </p>
                )}
              </div>

              {/* Submit */}
              <div className="col-span-1 flex items-end">
                <HasPermission module="Add Production" action="create">
                  <button
                    type="submit"
                    className="w-[168px] h-[46px] bg-[#1C1D3E] text-white p-2 rounded"
                  >
                    Submit
                  </button>
                </HasPermission>
              </div>
            </form>

            <div className=" mt-11">
              <h1 className=" text-center font-semibold text-xl">
                Production Set List
              </h1>
            </div>
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
                      {productionData.length > 0 ? (
                        productionData
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
                                {row.food_name ? row.food_name : "Not found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.itemquantity
                                  ? row.itemquantity
                                  : "Not found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.variant_name
                                  ? row.variant_name
                                  : "Not found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.saveddate
                                  ? new Date(row.saveddate).toLocaleDateString()
                                  : "Not found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.productionexpiredate
                                  ? new Date(
                                      row.productionexpiredate
                                    ).toLocaleDateString()
                                  : "Not found"}
                              </td>
                              {/* <td className="py-2 px-4 border border-[#4CBBA1]">
                              <div className="flex justify-center gap-x-2 font-bold">
                              
                                <Tooltip message="Edit">
                                  <button
                                    onClick={() => handleEditClick(row.id)}
                                    className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                  >
                                    <FaRegEdit />
                                  </button>
                                </Tooltip>

                               
                                <Tooltip message="Delete">
                                  <button
                                    onClick={() => handleDeleteClick(row.id)}
                                    className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                  >
                                    <FaRegTrashCan />
                                  </button>
                                </Tooltip>
                              </div>
                            </td> */}
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td
                            colSpan={4} // Adjust column span based on your table headers
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

            <div className="flex justify-between mt-7">
              {productionData.length > 0 && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(data - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[
                      ...Array(Math.ceil(productionData.length / itemsPerPage)),
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
                        Math.ceil(productionData.length / itemsPerPage)
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
  );
};

export default AddProduction;
