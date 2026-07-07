import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaRegEye } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import ProductionView from "../../components/ProductionView";

import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";

import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
  const token = localStorage.getItem("token");

const headers = ["SL.", "Food Name", "Variant Name", "Price", "Action"];
const ActionButtion = [

  { btn: "CSV" },
  { btn: "Excel" },
  { btn: "PDF" },

];
const DeleteModal = ({ show, onClose, onDelete,type }) => {
  if (!show) {
    return null;
  }
  return (
    <div
  className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm flex items-center justify-center z-50"
  onClick={onClose} // Close when clicking outside
>
  <div
    className="bg-white rounded-lg p-6 w-1/3 border-[2px] border-[#4CBBA1] shadow-lg"
    onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
  >
    <div className="text-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">
        Delete {type}
      </h2>
      <p className="text-gray-600 mb-6">
        Are you sure you want to delete this {type}?
      </p>
      <div className="flex gap-x-3 justify-center items-center">
        <button
          onClick={onDelete}
          className="bg-[#FB3F3F] text-white px-6 py-2 rounded-md text-lg"
        >
          OK
        </button>
        <button
          onClick={onClose}
          className="bg-gray-400 text-white px-6 py-2 rounded-md text-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
</div>

  );
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
const SetProductionList = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [data, setData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [searchName, setSearchName] = useState("");
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const navigate = useNavigate();
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const token = localStorage.getItem("token");
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  // get all data
  const getReservationData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/productionsetlist`,{
        headers:{
          Authorization: token
        }
      });
      console.log(response.data);
      setData(response.data.data);
    } catch (error) {
      toast.error(error.response
.data.message?error.response
.data.message:"Not data forund");
      console.error(error);
    }
  };
  // search
const handleSearch = (e) => {
  const value = e.target.value.trimStart();
  setSearchName(value);
  setCurrentPage(1);

  if (value.trim() === "") {
    getReservationData();
    return;
  }

  axios
    .get(`${API_BASE_URL}/productionsetlist`, {
      params: { searchItem: value },
      headers: { Authorization: token }
    })
    .then((res) => {
      setData(res.data.data.length > 0 ? res.data.data : []);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      // toast.error("Error fetching filtered data");
    });
};


  // edit

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [foodData, setFoodData] = useState([]); // all food
  const [variant, setVariant] = useState([]); // variant accourdin to food
  const [selectedFood, setSelectedFood] = useState(""); // Selected Food name
  const [selectedVariant, setSelectedVariant] = useState(""); // Selected variant
  const [editVariantName, setEditVariantName] = useState(""); // Display name for edit modal
  const [ingredientlist, setIngredientlist] = useState([]); // ingrident information
  const[viwedata,setViewdata]=useState([])
  const [viewDataModal, setvieweDataModal] = useState(false);
  const [items, setItems] = useState([
    { item: "", quantity: 0, price: 0, unitPrice: 0 },
  ]);

  const getFoodData = () => {
    axios
      .get(`${API_BASE_URL}/foodname`,{
        headers:{
          Authorization: token
          }
      })
      .then((res) => {
        setFoodData(res.data.data);
        console.log(res.data.data); // Ensure API response structure matches your expectations
      })
      .catch((error) => console.error(error));
  };

  // fetch variant accourdin to food
  const fetchVariant = async (foodid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/variantdata`, {
        params: { foodid },
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
    setSelectedVariant("");
    fetchVariant(foodid);
  };
  // Handle variant selection change
  const handleVariantChange = (e) => {
    const variantid = e.target.value;
    setSelectedVariant(variantid);
  };

  // Fetch ingredient list
  const getingredientlist = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/productionunitingredients`,{
        headers:{
          Authorization: token
          }
      });
      setIngredientlist(res.data.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  // Fetch Price According to Selected Ingredient
  const priceaccourdingtopro = async (index, ingredientId) => {
    if (!ingredientId) return;
    try {
      const res = await axios.get(
        `${API_BASE_URL}/priceperitem/${ingredientId}`
      );
      const newPrice = res.data.data[0].Price;
      // Update the unit price and total price
      const newItems = [...items];
      newItems[index].unitPrice = newPrice;
      newItems[index].price = newPrice * newItems[index].quantity; // Calculate total price based on quantity
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // Handle ingredient change and fetch price for the selected ingredient
  const handleIngredientChange = (index, value) => {
    const newItems = [...items];
    newItems[index].item = value;
    newItems[index].quantity = 1; // Set quantity to 1 by default when item is selected
    setItems(newItems);

    // Fetch price for the newly selected ingredient
    priceaccourdingtopro(index, value);
  };

  // Handle quantity change and update total price
  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value; // Update the quantity or price

    if (field === "quantity") {
      newItems[index].price = newItems[index].unitPrice * value; // Update total price based on unit price
    }
    setItems(newItems);
  };
// edit
  const handleEditClick = async (foodid, pvarientid) => {
    setIsModalOpen(true); // Open the modal
    try {
      const response = await axios.get(
        `${API_BASE_URL}/productiondetail/${foodid}/${pvarientid}`
      );
      const foodDetails = response.data.data.fooddetails[0]; // Directly access the first element
      const itemDetails = response.data.data.itemdetails; // This is an array, not a single object

      console.log("Fetched foodDetails:", foodDetails);
      console.log("Fetched itemDetails:", itemDetails);
      console.log(selectedFood);
      console.log(selectedVariant);
      // Set the selected food and variant
      setSelectedFood(foodDetails.foodid);
      setSelectedVariant(foodDetails.pvarientid);
      setEditVariantName(foodDetails.variantName || "");

      // Pre-fill items from itemDetails
      if (itemDetails.length > 0) {
        setItems(
          itemDetails.map((item) => ({
            item: item.ingredientid, // ingredient ID
            quantity: item.productionDetailqty, // quantity used in production
            price: item.
            totalPriceofproductioningredient
            , // total price (if available)
            unitPrice: item.price, // unit price of ingredient
          }))
        );
      }

      // Fetch variants for the selected food and ingredient list
      fetchVariant(foodDetails.foodid);
      getingredientlist();
    } catch (error) {
      console.error("Error fetching production details:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const requestData = {
      fooddetails: [
        {
          foodid: selectedFood,
          pvarientid: selectedVariant,
        },
      ],
      itemdetails: items.map((item) => ({
        p_id: item.item,
        quantity: item.quantity,
      })),
    };
    console.log("Success:", requestData);
    try {
      const response = await axios.put(
        `${API_BASE_URL}/productiondetail/${selectedFood}/${selectedVariant}`,
        requestData,
        {
          headers: {
            "Content-Type": "application/json",
             Authorization: token,
          },
          
        }
      );

      console.log("Success:", response.data);
setIsModalOpen(false)
      // Show success toast
      toast.success("Production updated successfully!");
      getReservationData()
      setItems([{ item: "", stock_qty: 0, quantity: 0, rate: 0, total: 0 }]);

    } catch (error) {
      console.error("Error:", error);
      // Show error toast

      toast.error("Something went wrong.");
    }
  };

  // Add new item row
  const handleAddItem = () => {
    setItems([...items, { item: "", quantity: 0, price: 0, unitPrice: 0 }]);
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

// view

const returnview = async (foodid, pvarientid) => {
  setvieweDataModal(true); // Open the modal
  try {
    const response = await axios.get(
      `${API_BASE_URL}/viewproductiondetail/${foodid}/${pvarientid}`
    );
  setViewdata(response.data.data)
    
  } catch (error) {
    console.error("Error fetching production details:", error);
  }
};

const fetchData = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/productionsetlist`,{
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
      
    Food_Name:
  item.foodName
    ? `${item.foodName}`
    : "No Waiter Found",
    Variant_Name: item.variantName?`${item.variantName}`:"No varient found",
    Price: item.totalAmount,
 
   
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
    { header: "Price", key: "price" },
   
  ];

  // Add rows
  data.forEach((item) => {
    worksheet.addRow({
     

food_name:
item.foodName
  ? `${item.foodName}`
  : "No Waiter Found",
  variant_name: item.variantName?`${item.variantName}`:"No varient found",
  price: item.totalAmount,

    
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
   


item.foodName
  ? `${item.foodName}`
  : "No Waiter Found",
item.variantName?`${item.variantName}`:"No varient found",
item.totalAmount,

  ]);

  // Add a title
  doc.text("Data Export", 20, 10);

  // Add a table
  autoTable(doc,{
    head: [
      [
        "Food Name", "Variant Name", "Price",
        
      ],
    ],
    body: rows,
    startY: 20,
  });

  doc.save("data.pdf"); // PDF file name
};
const [selectedCategoryIDs, setSelectedCategoryIDs] = useState({
  foodid: null,
  pvarientid: null,
});
const [showModal, setShowModal] = useState(false);
// delete 
const handleModalDelete = () => {
  deleteCategory(selectedCategoryIDs);
};
const handleDeleteClick = (foodid, pvarientid) => {
  setSelectedCategoryIDs({ foodid, pvarientid });
  setShowModal(true);
};

const deleteCategory = ({ foodid, pvarientid }) => {
  axios
    .delete(`${API_BASE_URL}/productiondetail/${foodid}/${pvarientid}`)
    .then((res) => {
      console.log(res.data);
      fetchData(); // Refresh the data list.
      toast.success("Production deleted successfully.");
      setShowModal(false);
      getReservationData();
      getingredientlist();
      getFoodData();
    })
    .catch((err) => {
      console.error("Error deleting category:", err);
      toast.error("Error deleting production.");
    });
};


  useEffect(() => {
    getReservationData();
    getingredientlist();
    getFoodData();
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
                Production Set List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>

            <div className=" flex justify-between mt-11">
              <sapn> </sapn>
              <HasPermission module="Production Set List" action="create">

              <button
                onClick={() => {
                  navigate("/set-production-unit");
                }}
                className=" bg-[#4CBBA1] h-[46px] text-nowrap w-[269px] rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
              >
                <IoIosAddCircleOutline className=" font-semibold text-xl" />
                Set Production Unit
              </button>
              </HasPermission>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5  gap-y-5  ">
                  <div className="flex items-center space-x-2 ">
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
                      {data.length > 0 ? (
                        data
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
                                {row.foodName ? row.foodName : "Not Found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.variantName
                                  ? row.variantName
                                  : "Not Found"}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.totalAmount != null
                                  ? row.totalAmount.toFixed(2)
                                  : "Not Found"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">
                                  <HasPermission module="Production Set List" action="edit">

                                  <Tooltip message="Edit">
                                    <button
                                      onClick={() =>
                                        handleEditClick(
                                          row.foodid,
                                          row.pvarientid
                                        )
                                      }
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>
                                  </Tooltip>
                                  </HasPermission>
                                  <HasPermission
                                    module="Production Set List"
                                    action="access"
                                  >
                                    <Tooltip message="Details">
                                      <button
                                        onClick={() =>
                                          returnview( row.foodid,
                                            row.pvarientid)
                                        }
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                      >
                                        <FaRegEye />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                 
                                  <button
  className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
  onClick={() => handleDeleteClick(row.foodid, row.pvarientid)}
>
  <FaRegTrashCan />
</button>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="py-2 px-4 text-center">
                            No Data found related to this table.
                          </td>
                        </tr>
                      )}
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
                      }
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

      {isModalOpen && (
       <>
       <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
         <div className="w-auto p-6"> {/* Reduced width to 24rem (96) */}
           <div className="py-4 bg-white rounded-md shadow-md border border-[#1C1D3E]">
             <div className="flex py-3 px-4 justify-between items-center border-b border-gray-300">
               <h2 className="text-lg font-semibold">Edit Production Set List</h2>
               <button
                 onClick={() => setIsModalOpen(false)}
                 className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold rounded"
               >
                 X
               </button>
             </div>
             <div className="p-5">
               <form onSubmit={handleSubmit}>
                 <div className="mb-4 flex flex-col gap-y-4">
                   <div className="flex gap-x-4">
                     <div className="flex-1">
                       <label className="text-gray-700 font-semibold mb-1">Food Name*</label>
                       <select
  name="itemid"
  value={selectedFood}
  disabled
  className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-900 w-full  cursor-not-allowed"
>
  <option value="">Select Food</option>
  {foodData.map((val, index) => (
    <option key={index} value={val.ProductsID}>
      {val.ProductName}
    </option>
  ))}
</select>

                     </div>
     
                     <div className="flex-1">
                       <label className="text-gray-700 font-semibold mb-1">Variant Name*</label>
                       <input
  type="text"
  value={editVariantName}
  readOnly
  className="shadow border border-[#4CBBA1] rounded py-2 px-3 text-gray-900 w-full cursor-not-allowed bg-gray-50"
/>

                     </div>
                   </div>
     
                   <div className="p-4 border border-[#4CBBA1] rounded shadow-sm">
                     <div className="flex justify-between mb-4">
                       <div className="font-semibold">Item Information</div>
                       <div className="font-semibold">Quantity</div>
                       <div className="font-semibold">Price</div>
                       <div className="font-semibold">Action</div>
                     </div>
     
                     {items.map((item, index) => (
                       <div key={index} className="flex justify-between mb-4">
                         <select
                           value={item.item || ""}
                           onChange={(e) => handleIngredientChange(index, e.target.value)}
                           className="border border-[#4CBBA1] shadow-md p-2 rounded w-[150px]"
                         >
                           <option value="">Select Option</option>
                           {ingredientlist.map((val, idx) => (
                             <option key={idx} value={val.id}>
                               {val.ingredient_name}
                             </option>
                           ))}
                         </select>
     
                         <input
                           type="number"
                           value={item.quantity || 0}
                           onChange={(e) =>
                             handleInputChange(index, "quantity", parseInt(e.target.value))
                           }
                           className="border border-[#4CBBA1] p-2 rounded w-[80px]"
                         />
     
                         <input
                           type="number"
                           readOnly
                           value={parseInt(item.price) || 0}
                           className="border border-[#4CBBA1] p-2 rounded w-[80px]"
                         />
     
                         <div className="cursor-pointer flex justify-center items-center gap-x-2 text-white font-normal bg-[#FB3F3F] p-2 rounded">
                           <FaRegTrashCan />
                           <button type="button" onClick={() => handleRemoveItem(index)}>
                             Delete 
                           </button>
                         </div>
                       </div>
                     ))}
     
                     <button
                       type="button"
                       onClick={handleAddItem}
                       className="bg-[#4CBBA1] text-white p-2 rounded mt-2"
                     >
                       Add More Item
                     </button>
                   </div>
                 </div>
     
                 <button
                   type="submit"
                   className="h-[42px] w-full bg-[#1C1D3E] text-white p-2 rounded mt-4"
                 >
                   Submit
                 </button>
               </form>
             </div>
           </div>
         </div>
       </div>
       <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
     </>
      )}

      <ProductionView
       isOpen={viewDataModal}
       onClose={() => setvieweDataModal(false)}
      data={viwedata}
      
      >

      </ProductionView>

      <DeleteModal
  show={showModal}
  onClose={() => setShowModal(false)}
  onDelete={handleModalDelete}
  type={"Production"}
/>
    </>
  );
};

export default SetProductionList;
