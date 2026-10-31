import React, { useEffect, useState, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import * as XLSX from "xlsx";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoMdCart, IoIosMan, IoIosArrowDown } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import { FaMagnifyingGlass } from "react-icons/fa6";

import pic from "../../assets/images/pizza.jpeg";
import FoodEditDialogBox from "../../components/FoodEditDialogBox";
import axios from "axios";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import { Link } from "react-router-dom";

import { AuthContext } from "../../store/AuthContext";
import HasPermission from "../../store/HasPermission";

import Papa from "papaparse";
import ExcelJS from "exceljs";
import { toast } from "react-toastify";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import useFullScreen from "../../components/useFullScreen";

const DeleteModal = ({ show, onClose, onDelete, type }) => {
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

const AddFood = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const [isOpen, setOpen] = useState(true);
  const [variantData, setVariantData] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedMenuID, setSelectedMenuID] = useState(null);
  const [isChecked, setIsChecked] = useState(false);
  const [isChecked1, setIsChecked1] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);
  const [isExpanded2, setIsExpanded2] = useState(false);
  const [isExpanded1, setIsExpanded1] = useState(false);
  const [variantModal, setVariantModal] = useState(false);
  const [categoryData, setcategoryData] = useState([]);
  const [kitchenData, setKitchenData] = useState([]);
  const [AddonsData, setAddonsData] = useState([]);
  const [menuCardData, setMenuCardData] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [allAddonsData, setAllAddonsData] = useState([]);
  const [variantFormData, setVariantFormdata] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [itemImage, setItemImage] = useState(null);
  const importInputRef = useRef(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const processImportFile = async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    let rows = [];
    try {
      if (ext === "csv") {
        const text = await file.text();
        const result = Papa.parse(text, { header: true, skipEmptyLines: true });
        rows = result.data;
      } else if (ext === "xlsx" || ext === "xls") {
        const ExcelJS = (await import("exceljs")).default;
        const workbook = new ExcelJS.Workbook();
        const buffer = await file.arrayBuffer();
        await workbook.xlsx.load(buffer);
        const worksheet = workbook.worksheets[0];
        const headers = [];
        worksheet.getRow(1).eachCell((cell) => headers.push(cell.value));
        worksheet.eachRow((row, rowNumber) => {
          if (rowNumber === 1) return;
          const obj = {};
          row.eachCell((cell, colNumber) => { obj[headers[colNumber - 1]] = cell.value; });
          rows.push(obj);
        });
      } else {
        toast.error("Only CSV or XLSX files are supported.");
        return;
      }
      if (rows.length === 0) { toast.error("No data found in file."); return; }
      const importToken = localStorage.getItem("token");
      const res = await axios.post(`${API_BASE_URL}/fooditems/import`, { rows }, { headers: { Authorization: importToken } });
      if (res.data.success) {
        toast.success(`Imported: ${res.data.imported}, Skipped: ${res.data.skipped}`);
        setShowImportModal(false);
        cardData();
      } else {
        toast.error(res.data.message || "Import failed.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.message || "Import failed.");
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processImportFile(file);
  };

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [formData, setFormData] = useState({
    CategoryID: "",
    kitchenid: "",
    ProductName: "",
    descrp: "",
    ProductImage: "",
    productvat: "",
    special: "",
    isoffer: "",
    offerstartdate: "",
    offerenddate: "",
    is_custom_quantity: "",
    cooktime: "",
    status: "",
    menuid: "",
  });
  const initialFormData = {
    name: "",
    parentid: "",
    offerstartdate: "",
    offerendate: "",
    status: "",
  };

  const addonsFormData = {
    addonName: "",
    price: "",
  };

  const [formdata, setFormdata] = useState(initialFormData);
  const [Addonformdata, setAddonformdata] = useState(addonsFormData);
  const [isChecked3, setIsChecked3] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [editModalData, setEditModalData] = useState({
    ProductsID: null,
    CategoryID: "",
    CategoryName: "",
    ProductName: "",
    productvat: "",
    ProductImage: "",
    offerIsavailable: "",
    offerstartdate: "",
    offerenddate: "",
    special: "",
    is_customqty: "",
    menutype: "",
    ProductsIsActive: "",
    kitchenid: "",
    kitchenName: "",
    descrip: "",
    UserIDInserted: "",
  });

  const [innerModal, setInnerModal] = useState(false);
  const Pic = pic;

  const handleDeleteClick = (ProductsID) => {
    setSelectedMenuID(ProductsID);
    setShowModal(true);
  };
  const navigate = useNavigate();
  const handleModalClose = () => {
    setShowModal(false);
    setSelectedMenuID(null);
  };

  const handleModalDelete = () => {
    deletemenu(selectedMenuID);
    handleModalClose();
  };

  const [file, setFile] = useState(null);
  const handleImageChange = (e) => {
    setFile(e.target.files[0]);
  };
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };

  const toggleExpand2 = () => {
    setIsExpanded2(!isExpanded2);
  };
  const toggleExpand1 = () => {
    setIsExpanded1(!isExpanded1);
  };

  const handleCheckboxChange1 = (e) => {
    setIsChecked1(e.target.checked);
  };
  const handleCheckboxChange2 = (e) => {
    setIsChecked2(e.target.checked);
  };

  const handleCheckboxChange3 = (e) => {
    setIsChecked3((e.target.checked = 1));
  };

  const EditFoodhandleChange = (e) => {
    setEditModalData({ ...editModalData, [e.target.name]: e.target.value });
  };

  const handleChangeVariant = (e) => {
    setVariantFormdata({ ...variantFormData, [e.target.name]: e.target.value });
  };

  const handleaddonchange = (e) => {
    const value = Number(e.target.value); // Ensure consistent type
    const { checked } = e.target;

    if (checked) {
      setAllAddonsData((prevData) => [...prevData, value]);
    } else {
      setAllAddonsData((prevData) =>
        prevData.filter((addon) => addon !== value),
      );
    }
  };
  const handleFileChange1 = (e) => {
    setItemImage(e.target.files[0]);
  };

  // add variants
  const variantFormSubmit = async (formvariantdata) => {
    let findProduct = variantData.find(
      (i) => i.variantName === formvariantdata.variantName,
    );

    if (findProduct) {
      let newVariantData = variantData.map((variantcart) =>
        variantcart.id === formvariantdata.id
          ? { ...variantcart, [formvariantdata.name]: formvariantdata.value }
          : variantcart,
      );
      setVariantData(newVariantData);
    } else {
      let newVariant = {
        id: formvariantdata.id,
        variantName: formvariantdata.variantName,
        price: formvariantdata.price,
      };
      setVariantData([...variantData, newVariant]);
    }
  };

  const removeProduct = (variantItem) => {
    const newVariantData = variantData.filter(
      (cartItem) => cartItem.variantName !== variantItem.variantName,
    );
    setVariantData(newVariantData);
  };

  const deletemenu = (ProductsID) => {
    axios
      .delete(`${API_BASE_URL}/itemfood/${ProductsID}`, { headers: { Authorization: token } })
      .then((res) => {
        console.log(res.data);
        getCategoryData();
        getmenuData();
        getkitchenData();
        cardData();
        toast.success("Item delete sucessfully.");
      })
      .catch((err) => {
        console.error("Error deleting category:", err);
      });
  };

  const handleImageError = (e) => {
    e.target.src = Pic;
  };

  //   handle edit modal of food
  const handleEditButtonClick = async (ProductID) => {
    axios
      .get(`${API_BASE_URL}/itemfooddetail/${ProductID}`, { headers: { Authorization: token } })
      .then((res) => {
        console.log("Fetched data:", res.data); // Log fetched data for debugging

        const productData = res.data.productDetails;
        const addonsData = res.data.addons;
        const variantData = res.data.variants;
        console.log(addonsData, variantData);
        console.log("productdata", productData);
        const allAddonsIds = addonsData
          .map((addon) => addon.add_on_id)
          .filter((id) => id && id !== 0);

        setAllAddonsData(allAddonsIds);
        console.log("All adons id", allAddonsIds, allAddonsData);
        setVariantData(variantData);
        setEditModalData({
          ProductsID: productData.ProductsID || null,
          CategoryID: productData.CategoryID || "",
          CategoryName: productData.Name || "",
          ProductName: productData.ProductName || "",
          productvat: productData.productvat || "",
          ProductImage: productData.ProductImage || "",
          offerIsavailable: productData.offerIsavailable || "",
          offerstartdate: productData.offerstartdate || "",
          offerenddate: productData.offerendate || "",
          special: productData.special || "",
          is_customqty: productData.is_customqty || "",
          menutype: productData.menutypeid || "",
          menuName: productData.menutype || "",
          ProductsIsActive: productData.ProductsIsActive || "",
          // kitchenid: productData.kitchenid || "",
          // kitchenName: productData.kitchen_name || "",
          kitchenid: productData.kitchenid || "",
          kitchenName: productData.kitchen_name || "",
          UserIDInserted: productData.UserIDInserted,
          descrip: productData.descrip || "",

          // Add any other fields needed
        });
        if (productData.offerIsavailable == 1) setIsChecked(true);

        if (productData.special == 1) setIsChecked1(true);
        if (productData.is_customqty == 1) setIsChecked2(true);

        setEditModal(true); // Open the modal after data is set
      })
      .catch((error) => {
        console.log(error);
      });
  };

  useEffect(() => {
    if (editModalData) {
    }
  }, [editModalData]);

  const getCategoryData = () => {
    axios
      .get(`${API_BASE_URL}/data`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setcategoryData(res.data);
        console.log(res.data); // Ensure API response structure matches your expectations
      })
      .catch((error) => console.error(error));
  };

  const getmenuData = () => {
    axios
      .get(`${API_BASE_URL}/menutype`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setMenuData(res.data.data);
      })
      .catch((error) => console.error(error));
  };

  const getActiveAddOns = () => {
    axios
      .get(`${API_BASE_URL}/getActiveAddOns`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("active addon ", res.data);
        setAddonsData(res.data);
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
        console.log("kitchen", res.data);
        setKitchenData(res.data);
      });
  };

  const cardData = () => {
    axios
      .get(`${API_BASE_URL}/itemfood`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("hey data recivee", res.data);
        setMenuCardData(res.data);
      })
      .catch((error) => console.error(error));
  };

  // search
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    if (value.trim() === "") {
      cardData();
      return;
    }

    axios
      .get(`${API_BASE_URL}/itemfood`, {
        params: { searchItem: value },

        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setMenuCardData(res.data.length > 0 ? res.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Error fetching filtered data");
      });
  };
  const token = localStorage.getItem("token");
  const submitUpdateFood = async () => {
    // Validation checks
    if (!editModalData.CategoryID) {
      toast.error("Please select a Category.");
      return;
    }
    if (!editModalData.ProductName.trim()) {
      toast.error("Please enter Food Name.");
      return;
    }
    if (!editModalData.menutype) {
      toast.error("Please select a Menu Type.");
      return;
    }
    if (!variantData || variantData.length === 0) {
      toast.error("Please add at least one Variant.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("CategoryID", editModalData.CategoryID);
      formData.append("ProductName", editModalData.ProductName);
      formData.append("productvat", editModalData.productvat);
      formData.append("offerIsavailable", isChecked ? 1 : 0);
      formData.append("offerstartdate", editModalData.offerstartdate || "");
      formData.append("offerenddate", editModalData.offerenddate || "");
      formData.append("special", isChecked1 ? 1 : 0);
      formData.append("is_customqty", isChecked2 ? 1 : 0);
      formData.append("menutypeid", editModalData.menutype);
      formData.append("ProductsIsActive", editModalData.ProductsIsActive)
      formData.append("descrip", editModalData.descrip || "");
      formData.append("UserIDInserted", editModalData.UserIDInserted);

      // Add variants
      formData.append("variants", JSON.stringify(variantData));

      // Add addons
      formData.append("addons", JSON.stringify(allAddonsData));

      // Add image if new file selected
      if (
        editModalData.ProductImage &&
        editModalData.ProductImage instanceof File
      ) {
        formData.append("ProductImage", editModalData.ProductImage);
      }
      console.log("Sending form data:");
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }
      console.log("formdata", formData);
      await axios.put(
        `${API_BASE_URL}/itemfood/${editModalData.ProductsID}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token,
          },
        },
      );
      cardData();
      toast.success("Food updated successfully.");
      setEditModal(false);
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong while updating the food.");
    }
  };
  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/itemfood`, {
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

      Food_Name: item.ProductName ? `${item.ProductName}` : "No food Found",
      Category_Name: item.Name ? `${item.Name}` : "No Category Found",
      Menu_Type: item.menutype,
      Product_Vat: item.productvat,
      Kitchen_Name: item.kitchen_name,
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
      { header: "Category Name", key: "category_name" },
      { header: "Menu Type", key: "menu_type" },
      { header: "Product Vat", key: "product_vat" },
      { header: "Kitchen Name", key: "kitchen_name" },
    ];

    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        food_name: item.ProductName ? `${item.ProductName}` : "No food Found",
        category_name: item.Name ? `${item.Name}` : "No Category Found",
        menu_type: item.menutype ? `${item.menutype}` : "No Category Found",
        product_vat: item.productvat
          ? `${item.productvat}`
          : "No Category Found",
        kitchen_name: item.kitchen_name
          ? `${item.kitchen_name}`
          : "No Category Found",
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
      item.ProductName ? `${item.ProductName}` : "No food Found",
      item.Name ? `${item.Name}` : "No Category Found",
      item.menutype,
      item.productvat,
      item.kitchen_name,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [
        [
          "Food Name",
          "Category Name",
          "Menu Type",
          "Product Vat",
          "Kitchen Name",
        ],
      ],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };
  const [bulkfile, setBulkfile] = useState(null);

  const handleFileChange = (e) => {
    setBulkfile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!bulkfile) {
      toast.error("Please select a file");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkfile);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/bulk-upload-food`,
        formData,
        {
          headers: { "Content-Type": "multipart/form-data", Authorization: token },
        },
      );

      toast.success(response.data.message);
    } catch (error) {
      toast.error("Upload failed");
      console.error("Upload error:", error);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        CategoryID: 1,
        kitchenid: 2,
        ProductName: "Pizza",
        descrip: "Delicious cheese pizza",
        productvat: 10,
        special: 1,
        isoffer: 0,
        offerstartdate: "",
        offerenddate: "",
        is_custom_quantity: 0,
        status: 1,
        menuid: 5,
        variant: JSON.stringify([
          { price: 12.99, variantName: "Small" },
          { price: 15.99, variantName: "Large" },
        ]),
        addons: JSON.stringify([1, 2]),
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");

    XLSX.writeFile(wb, "food-sample-upload.xlsx");
  };

  useEffect(() => {
    getCategoryData();
    getmenuData();
    getkitchenData();
    cardData();

    getActiveAddOns();
  }, []);
  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : ""}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Food List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            {/* Upload Button */}
            <div className=" flex justify-between mt-11">
              <span></span>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <HasPermission module="Food List" action="create">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="bg-[#1C1D3E] h-[46px] px-4 rounded-sm flex justify-center items-center text-white font-semibold"
                  >
                    Import
                  </button>
                  <button
                    onClick={() => {
                      navigate("/add-food");
                    }}
                    className="bg-[#4CBBA1] h-[46px] w-[207px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
                  >
                    <IoIosAddCircleOutline className="font-semibold text-lg" />
                    Add Food
                  </button>
                </HasPermission>
              </div>
            </div>
            <div className=" mt-11 w-full">
              <section>
                <div className=" flex justify-between">
                  <div className=" flex flex-wrap gap-x-5">
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
                  <div>
                    <div className="flex m-auto   px-4   rounded-md border-[1px] border-gray-900">
                      <button
                        onClick={handleSearch}
                        className="px-4 text-[#0f044a] text-sm"
                      >
                        <FaMagnifyingGlass />
                      </button>
                      <input
                        value={searchName}
                        onChange={handleSearch}
                        placeholder="Search food..."
                        type="search"
                        className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* menucard section */}
            <div className="mt-7 h-screen overflow-y-auto bg-white border border-[#4CBBA1] px-8 py-6 rounded-md">
              {/* Card Container */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                {menuCardData.slice(0, 6).map((val, index) => (
                  <div
                    key={index}
                    className="border border-[#4CBBA1] rounded-md shadow-md transition-transform transform hover:scale-105"
                  >
                    <div className="flex flex-col items-center p-4   transition-transform transform hover:scale-105">
                      <div className="border border-[#4CBBA1] rounded-sm overflow-hidden mb-2">
                        <img
                          src={`${VITE_IMG_URL}${val.ProductImage}`}
                          alt={val.ProductName}
                          className="h-[60px] w-[80px] object-cover"
                        />
                      </div>
                      <h1 className="font-semibold text-md text-center">
                        {val.ProductName}
                      </h1>
                      <h2 className="text-gray-600 text-sm text-center">
                        {val.Name}
                      </h2>
                      <h2 className="text-gray-600 text-sm text-center">
                        {val.variantName}
                      </h2>
                      <div className="mt-1">
                        <span className="bg-[#4CBBA1]/10 text-[#4CBBA1] text-xs font-semibold px-3 py-1 rounded-full">
                          🍳 {val.kitchen_name}
                        </span>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <HasPermission module="Food List" action="edit">
                          <Tooltip message="Edit">
                            <button
                              onClick={() =>
                                handleEditButtonClick(val.ProductsID)
                              }
                              className="bg-[#1C1D3E] p-2 rounded-md text-white hover:scale-105 transition-transform"
                            >
                              <FaRegEdit />
                            </button>
                          </Tooltip>
                        </HasPermission>

                        <HasPermission module="Food List" action="delete">
                          <Tooltip message="Delete">
                            <button
                              className="bg-[#FB3F3F] p-2 rounded-md text-white hover:scale-105 transition-transform"
                              onClick={() => handleDeleteClick(val.ProductsID)}
                            >
                              <FaRegTrashCan />
                            </button>
                          </Tooltip>
                        </HasPermission>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Card End */}
            </div>
          </div>
        </section>
      </div>

      {/* Menu item edit Dialog box */}

      <div>
        <FoodEditDialogBox
          title={"Edit Food Details"}
          onClose={() => {
            setEditModal(false);
          }}
          isOpen={editModal}
        >
          <div className=" p-10">
            <form className="space-y-4">
              {/* main div */}
              <div className=" grid grid-flow-col gap-x-10">
                {/* Left form */}
                <div className="">
                  <div className="">
                    <label
                      className="block text-sm mb-2 font-medium text-gray-700"
                      htmlFor=""
                    >
                      Category
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                      name="CategoryID"
                      value={editModalData.CategoryID}
                      onChange={EditFoodhandleChange}
                    >
                      <option value="">Select option</option>

                      {categoryData.map((val, index) => (
                        <option key={index} value={val.CategoryID}>
                          {val.Name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className=" mb-2  mt-5">
                    <label className="block mb-2  text-sm font-medium text-gray-700">
                      Food Name
                    </label>
                    <input
                      type="text"
                      name="ProductName"
                      placeholder="Food Name"
                      value={editModalData.ProductName}
                      onChange={EditFoodhandleChange}
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div className=" mb-2  mt-5">
                    <label className="block  mb-2 text-sm font-medium text-gray-700">
                      Vat
                    </label>
                    <input
                      type="number"
                      name="productvat"
                      value={editModalData.productvat}
                      onChange={EditFoodhandleChange}
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  <div className=" mb-2  mt-5">
                    <label className="block  mb-2 text-sm font-medium text-gray-700">
                      Image
                    </label>
                    <input
                      type="file"
                      name="ProductImage"
                      accept="image/*"
                      onChange={handleFileChange1}
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>

                  {/* offer */}

                  <div className="flex  items-center justify-between">
                    <div>
                      <label className="block mb-2  text-sm font-medium text-gray-700">
                        Offer
                      </label>
                      <input
                        value={isChecked}
                        checked={isChecked}
                        type="checkbox"
                        name="isoffer"
                        id="offer"
                        onChange={handleCheckboxChange}
                        className="size-5 custom-checkbox"
                      />
                      {isChecked && (
                        <span className="text-gray-700 text-sm">
                          <div>
                            <div className="mb-4 flex   flex-col justify-center items-center">
                              <label
                                className="block text-nowrap text-gray-700 w-[200px] font-semibold mb-2"
                                htmlFor="offerStartDate"
                              >
                                Offer Start Date
                              </label>
                              <input
                                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="offerStartDate"
                                value={editModalData.offerstartdate}
                                type="date"
                                placeholder="Offer Start Date"
                                name="offerstartdate"
                                onChange={EditFoodhandleChange}
                              />
                            </div>
                            <div className="mb-4 flex  flex-col justify-center items-center">
                              <label
                                className="block text-nowrap text-gray-700 w-[200px] font-semibold mb-2"
                                htmlFor="offerEndDate"
                              >
                                Offer End Date
                              </label>
                              <input
                                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                id="offerEndDate"
                                type="date"
                                value={editModalData.offerenddate}
                                placeholder="Offer End Date"
                                name="offerenddate"
                                onChange={EditFoodhandleChange}
                              />
                            </div>
                          </div>
                        </span>
                      )}
                    </div>
                    <div>
                      <label className="block mb-2  text-sm font-medium text-gray-700">
                        Special
                      </label>
                      <input
                        type="checkbox"
                        name="special"
                        value={isChecked1}
                        checked={isChecked1}
                        onChange={handleCheckboxChange1}
                        className="size-5 custom-checkbox"
                      />
                    </div>
                    <div>
                      <label className="block mb-2  text-sm font-medium text-gray-700">
                        Custom Quantity
                      </label>
                      <input
                        type="checkbox"
                        name="customQuantity"
                        value={isChecked2}
                        checked={isChecked2}
                        onChange={handleCheckboxChange2}
                        className="size-5 custom-checkbox"
                      />
                    </div>
                  </div>

                  <div className=" mb-2 ">
                    <label
                      className="block mb-2  text-sm font-medium text-gray-700"
                      htmlFor=""
                    >
                      Menu Type
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="parentCategory"
                      value={editModalData.menutype}
                      name="menuid"
                      onChange={EditFoodhandleChange}
                    >
                      <option value="">Select option</option>
                      {menuData.map((val, index) => (
                        <option key={index} value={val.menutypeid}>
                          {val.menutype}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Right Form */}

                <div className="">
                  {/* Add Add-ons */}
                  <div className="border-[1px] border-[#4CBBA1] mt-5 rounded-sm">
                    <div
                      onClick={toggleExpand1}
                      className="relative p-2 h-[50px] text-base text-black"
                    >
                      <div className="flex justify-between pt-3">
                        <h1>Add on</h1>
                        <IoIosArrowDown
                          onClick={toggleExpand1}
                          className={`cursor-pointer text-[#000000] ${
                            isExpanded1 ? "rotate-180" : ""
                          } border-[1px] bg-white rounded-full text-xl transition-transform`}
                        />
                      </div>
                    </div>

                    {isExpanded1 && (
                      <div className="h-[150px] overflow-y-scroll">
                        {AddonsData.length > 0 &&
                          AddonsData.map((val, index) => (
                            <div
                              key={index}
                              className="flex justify-between items-center mt-5 px-2"
                            >
                              <div>
                                <h1>{val.add_on_name}</h1>
                                <p>Price: {val.price}</p>
                              </div>
                              <div>
                                <div className="flex justify-center gap-x-4 font-bold">
                                  <input
                                    type="checkbox"
                                    name="addons"
                                    value={val.add_on_id}
                                    id={`offer-${index}`}
                                    checked={allAddonsData.includes(
                                      val.add_on_id,
                                    )}
                                    onChange={handleaddonchange}
                                    className="size-5 custom-checkbox"
                                    // checked={addonsData.add_on_id.includes(val.add_on_id)}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                  {/* Add Variant */}
                  <div className="border-[1px] border-[#4CBBA1] mt-5 rounded-sm">
                    <div
                      onClick={toggleExpand2}
                      className="relative p-2 h-[50px] text-base text-black"
                    >
                      <div className="flex justify-between pt-3">
                        <h1>Variants</h1>
                        <IoIosArrowDown
                          onClick={toggleExpand2}
                          className={`cursor-pointer text-[#000000] ${
                            isExpanded2 ? "rotate-180" : ""
                          } border-[1px] bg-white rounded-full text-xl transition-transform`}
                        />
                      </div>
                    </div>

                    {isExpanded2 && (
                      <div className=" h-[150px]  overflow-y-scroll">
                        {variantData.map((val, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center mt-5 px-2 "
                          >
                            <div>
                              <h1>Variant Name :-{val.variantName}</h1>
                              <p> Price :-{val.price}</p>
                            </div>
                            <div>
                              <div className="flex justify-center gap-x-4 font-bold">
                                <Tooltip message={"Delete"}>
                                  <button
                                    onClick={() => removeProduct(val)}
                                    type="button"
                                    className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                  >
                                    <FaRegTrashCan />
                                  </button>
                                </Tooltip>
                              </div>
                            </div>
                          </div>
                        ))}

                        <div className="text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setVariantModal(true);
                            }}
                            className="h-[32px] w-[125px] text-white bg-[#4CBBA1] rounded-sm mt-3 mb-5"
                          >
                            Add Variant
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className=" mb-2  mt-5">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={editModalData.ProductsIsActive}
                      name="ProductsIsActive"
                      onChange={EditFoodhandleChange}
                      className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    >
                      {" "}
                      {/* <option value=""> Select Option</option> */}
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className=" mb-2  mt-5">
                    <label className="block mb-2 text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      name="descrip"
                      value={editModalData.descrip}
                      onChange={EditFoodhandleChange}
                      className="shadow w-full h-[60px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Button */}

              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={submitUpdateFood}
                  className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </FoodEditDialogBox>
      </div>

      {/* Add Variant Modal*/}

      <DialogBoxSmall
        title={"Add Variants"}
        onClose={() => {
          setVariantModal(false);
        }}
        isOpen={variantModal}
      >
        <div className="p-10">
          <form>
            <div className="mb-2">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Variant Name
              </label>
              <input
                type="text"
                name="variantName"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={variantFormData.variantName}
                onChange={handleChangeVariant}
              />
            </div>
            <div className="mb-2 mt-5">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Price
              </label>
              <input
                type="number"
                name="price"
                className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={variantFormData.price}
                onChange={handleChangeVariant}
              />
            </div>
            <div className="flex justify-start space-x-4 mt-5">
              <button
                onClick={() => {
                  setVariantModal(false);
                }}
                type="button"
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  variantFormSubmit(variantFormData);
                  setVariantModal(false);
                  setVariantFormdata("");
                }}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>
      <DeleteModal
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
        type={"Food"}
      />

      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-[#1C1D3E]">Import Food Items</h2>
              <button onClick={() => setShowImportModal(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
            </div>
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => importInputRef.current?.click()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${isDragging ? "border-[#4CBBA1] bg-green-50" : "border-gray-300 hover:border-[#4CBBA1]"}`}
            >
              <p className="text-gray-500 text-sm">Drag & drop a CSV or XLSX file here, or click to browse</p>
              <input ref={importInputRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => { if (e.target.files[0]) processImportFile(e.target.files[0]); }} />
            </div>
            <div className="mt-3 text-center">
              <a href="/food_import_sample.csv" download className="text-sm text-[#4CBBA1] underline">Download Sample CSV</a>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AddFood;
