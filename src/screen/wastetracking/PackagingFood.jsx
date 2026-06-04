import React, { useState, useEffect,useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";
import HasPermission from "../../store/HasPermission";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import useFullScreen from "../../components/useFullScreen";
const headers = ["SL.", "Used Item", "Qnty", "Lost Price", "Note"];

const PackagingFood = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [searchName, setSearchName] = useState("");
  const [wasteData, setWasteData] = useState([]);
  const token = localStorage.getItem("token");
  const [items, setItems] = useState([
    { item: "", quantity: 0, lostprice: 0, unitPrice: 0, note: "" },
  ]);
  const [ingredientlist, setIngredientlist] = useState([]); // item information
  const [orderid, setorderid] = useState("");
  const totalAmount = wasteData.reduce(
    (acc, row) => acc + parseFloat(row.l_price || 0),
    0
  );
  // page
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(wasteData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };
  // get waste data
  const getSaledata = () => {
    axios
      .get(`${API_BASE_URL}/packagingwaste`,{
        headers:{
          Authorization: token
        }
      })
      .then((response) => {
        console.log("datta", response);
        setWasteData(response.data.data);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setSearchName("");
  };

  // search form date
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!fromDate || !toDate) {
      toast.error("Please select both From and To dates or serach");
      return;
    }
    try {
      const response = await axios.get(`${API_BASE_URL}/packagingwaste`, {
        params: {
          from: fromDate,
          to: toDate,
        },
        headers:{
          Authorization: token
        }
      });
      setWasteData(response.data.data); // Update the displayed data
      console.log("Filtered Data:", response.data.data);
    } catch (error) {
      console.error("Error fetching filtered data:", error);
      toast.error("Error fetching filtered data");
    }
  };
  //search from input
  const handleSearch2 = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    axios
      .get(`${API_BASE_URL}/packagingwaste`, {
        params: { searchItem: value },
        headers:{
          Authorization: token
          }
      })
      .then((res) => {
        setWasteData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };

  // post data

  // Fetch ingredient list
  const getingredientlist = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/productionunitingredientss`,{
        headers:{
          Authorization: token
        }
      });
      setIngredientlist(res.data.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };
  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value; // Update the quantity or price

    if (field === "quantity") {
      newItems[index].lostprice = newItems[index].unitPrice * value; // Update total price based on unit price
    }
    setItems(newItems);
  };

  // Fetch price according to the selected ingredient
  const priceaccourdingtopro = async (index, ingredientId) => {
    if (!ingredientId) return;
    console.log("dtaa aa rha a ", ingredientId);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/priceperitem/${ingredientId}`
      );
      const newPrice = res.data.data[0].Price;
      console.log("price aaaya ", newPrice);
      // Update the unit price and price (total) for the selected item
      const newItems = [...items];
      newItems[index].unitPrice = newPrice;
      newItems[index].lostprice = newPrice * newItems[index].quantity; // Calculate total price based on quantity
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
  // Add new item row
  const handleAddItem = () => {
    setItems([
      ...items,
      { item: "", quantity: 0, lostprice: 0, unitPrice: 0, note: "" },
    ]);
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    const requestData = {
      orderdetails: [
        {
          orderid: orderid,
        },
      ],
      itemdetails: items.map((item) => ({
        ingradient_id: item.item,
        qnty: item.quantity,
        l_price: item.lostprice,
        note: item.note,
      })),
    };
  
    // Log the request data to ensure it’s structured properly
    console.log("Request Data:", requestData);
  
    try {
      const response = await axios.post(`${API_BASE_URL}/packagepost`, requestData, {
        headers: {
          "Content-Type": "application/json",
          "Authorization":token

        },
      });
  
      console.log("Success:", response.data);
      toast.success("Successfully done!");
      getSaledata();
      getingredientlist();
      setItems([]);
    } catch (error) {
      if (error.response && error.response.data) {
        // If the backend returns an error message, show it
        toast.error(error.response.data);
      } else {
        // For any other unexpected errors
        toast.error("Failed to submit production data.");
      }
      console.error("Error:", error);
    }
  };



  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/packagingwaste`,{
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
        
   
      Ingredient_Name:item.ingredient_name,
        Note: item.note,
        Created_At:new Date(item.created_at).toLocaleDateString() ,
        quantity: item.qnty,
        lost_price:item.l_price,
    
   
     
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
      { header: "Ingredient_Name", key: "Ingredient_Name" },
      { header: "Note", key: "Note" },
      { header: "Created_At", key: "Created_At" },
      { header: "quantity", key: "quantity" },
      { header: "lost_price", key: "lost_price" },
   
    
     
    ];
  
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
       
        Ingredient_Name:item.ingredient_name,
        Note: item.note,
        Created_At:new Date(item.created_at).toLocaleDateString() ,
        quantity: item.qnty,
        lost_price:item.l_price,
      
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
      item.ingredient_name,
      item.note,
    new Date(item.created_at).toLocaleDateString() ,
      item.qnty,
      item.l_price,
     
    ]);

    
  
    // Add a title
    doc.text("Data Export", 20, 10);
  
    // Add a table
  autoTable(doc,{
      head: [
        [
        "Ingredient_Mame", "Note"
          ,"Create Date","Quantity","Lost Price"
        ],
      ],
      body: rows,
      startY: 20,
    });
  
    doc.save("data.pdf"); // PDF file name
  };
  
  


  useState(() => {
    getSaledata();
    getingredientlist();
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
          <div className="contant_div w-full ml-4 pr-7 mt-4 nav-container hide-scrollbar h-screen overflow-y-auto">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Set Packaging Food Waste
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>

            {/* Search Bar */}
            <div className="  mt-11 border-[1px] border-[#4CBBA1] bg-white p-8 rounded-sm">
              <div className="main_form">
                <form onSubmit={handleSubmit}>
                  <div className="mb-4 mr-3">
                    <label
                      className=" m-auto mr-3 text-nowrap text-gray-700   font-semibold mb-2"
                      htmlFor="categoryName"
                    >
                   Today's   Order Id
                    </label>
                    <input
                      name="price"
                      value={orderid}
                      onChange={(e) => {
                        setorderid(e.target.value);
                      }}
                      type="text"
                      placeholder="Order id"
                      className="shadow border border-[#4CBBA1]  w-[300px] rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="p-4 border-[1px] border-[#4CBBA1] rounded shadow-sm">
                    <div className="flex justify-between mb-11">
                      <div className="font-semibold">Used Item</div>
                      <div className="font-semibold">Quantity</div>
                      <div className="font-semibold">Lost Price </div>
                      <div className="font-semibold">Note </div>
                      <div className="font-semibold">Action</div>
                    </div>

                    {items.map((item, index) => (
                      <div key={index} className="flex justify-between mb-6">
                        <select
                          value={item.item || ""} // Ensure controlled value
                          onChange={(e) =>
                            handleIngredientChange(index, e.target.value)
                          }
                          className="border-[1px] w-[250px] border-[#4CBBA1] shadow-md p-2 rounded"
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
                          value={item.quantity || 0} // Ensure controlled value
                          onChange={(e) =>
                            handleInputChange(
                              index,
                              "quantity",
                              parseFloat(e.target.value)
                            )
                          }
                          className="border-[1px] border-[#4CBBA1] p-2 rounded"
                        />

                        <input
                          type="number"
                          readOnly
                          value={item.lostprice || 0} // Ensure controlled value
                          className="border-[1px] border-[#4CBBA1] p-2 rounded"
                        />

                        <textarea
                          type="text"
                          placeholder="Reasion"
                          value={item.note || ""} // Ensure controlled value
                          onChange={(e) => handleInputChange(index, "note", e.target.value)} // Add onChange handler
                          className="border-[1px] border-[#4CBBA1] p-2 rounded"
                        />

                        <div className="cursor-pointer flex justify-center items-center gap-x-2 text-white font-normal bg-[#FB3F3F] p-2 rounded">
                          <FaRegTrashCan />
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="bg-[#4CBBA1] text-white p-2 rounded"
                    >
                      Add More Item
                    </button>
                  </div>
<HasPermission module="Packaging Food" action="create">
<button
                    type="submit"
                    className="h-[42px] w-[168px] bg-[#1C1D3E] text-white p-2 rounded mt-4"
                  >
                    Submit
                  </button>
</HasPermission>
                  
                </form>
              </div>
            </div>
            {/* Search Bar */}

            <h1 className=" mt-11 font-semibold">Packaging Food Waste List</h1>
            <div className="mt-11 w-full">
              <section className="tablebutton">
                <div className="orderButton flex  flex-wrap gap-y-5 gap-x-5 px-6">
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
                <div className="w-full sm:w-auto flex items-center justify-center m-auto px-4 rounded-md  border-[0.5px] border-gray-900">
                  <button className="px-4 text-[#0f044a] text-sm">
                    <FaMagnifyingGlass />
                  </button>
                  <input
                    value={searchName}
                    onChange={handleSearch2}
                    placeholder="Search order by details..."
                    type="search"
                    className="  px-4 py-2 text-gray-700 leading-tight focus:outline-none"
                  />
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
                      {wasteData.length > 0 ? (
                        wasteData
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
                                {row.ingredient_name}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.qnty ? row.qnty : "N/F"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.l_price ? row.l_price : "N/F"}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.note}
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="py-2 px-4 text-center">
                            No packaging food waste records found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                  <h1 className="  font-bold mt-5 mb-4 pr-3 text-right w-full">
                    Total Amount: ₹{totalAmount.toFixed(2)}
                  </h1>
                </div>
              </div>
              <div className="flex justify-between mt-7">
                {wasteData.length > 0 && (
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
                        ...Array(Math.ceil(wasteData.length / itemsPerPage)),
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
                          Math.ceil(wasteData.length / itemsPerPage)
                        }
                        className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {/* pagination */}
            </section>
          </div>
        </section>
      </div>
    </>
  );
};

export default PackagingFood;
