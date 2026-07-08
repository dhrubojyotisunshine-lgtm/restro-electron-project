import React, { useEffect, useState, useContext } from "react";
import Select from "react-select";
import Nav from "../../components/Nav";
import * as XLSX from "xlsx";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoMdCart, IoIosMan, IoIosArrowDown } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import CategoryDialogBox from "../../components/CategoryDialogBox";
import { AuthContext } from "../../store/AuthContext";
import axios from "axios";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import { useNavigate } from "react-router-dom";

const Tooltip = ({ message, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <span className="absolute  bottom-5  right-4 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">
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
  const [errors, setErrors] = useState({});
  const [variantModal, setVariantModal] = useState(false);
  const [AddCategoryModal, setAddCategoryModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isChecked1, setIsChecked1] = useState(false);
  const [isChecked2, setIsChecked2] = useState(false);
  const [isExpanded2, setIsExpanded2] = useState(false);
  const [isExpanded1, setIsExpanded1] = useState(false);
  const [categoryData, setcategoryData] = useState([]);
  const [kitchenData, setKitchenData] = useState([]);
  const [AddonsData, setAddonsData] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [variantData, setVariantData] = useState([]);
  const [allAddonsData, setAllAddonsData] = useState([]);
  const [variantFormData, setVariantFormdata] = useState({
    variantName: "",
    price: "",
  });
  const [variantErrors, setVariantErrors] = useState({});
  const [itemImage, setItemImage] = useState(null);
  const [data, setData] = useState([]);
  const token = localStorage.getItem("token");
  const initialFormData = {
    name: "",
    parentid: "",
    offerstartdate: "",
    offerendate: "",
    status: "",
  };
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [formdata, setFormdata] = useState(initialFormData);
  const [isChecked3, setIsChecked3] = useState(false);
  const [file, setFile] = useState(null);

  const [formData, setFormData] = useState({
    CategoryID: "",
    // kitchenid: "",
    ProductName: "",
    descrp: "",
    ProductImage: "",
    productvat: 0,
    special: "",
    isoffer: "",
    offerstartdate: "",
    offerenddate: "",
    is_custom_quantity: "",
    status: 1,
    menuid: "",
    variant: [],
    addon: [],
  });

  const handleSubmit1 = (e) => {
    e.preventDefault();

    if (!formdata.name) {
      toast.error("Category Name is required");
      return;
    }

    const data = new FormData();
    data.append("name", formdata.name);
    data.append("parentid", formdata.parentid);
    data.append("offerstartdate", formdata.offerstartdate);
    data.append("offerendate", formdata.offerendate);
    data.append("status", formdata.status);
    data.append("image", file);
    data.append("isoffer", isChecked);

    axios
      .post(`${API_BASE_URL}/data`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("Data sent successfully");

        // Reset the form data to initial state
        setFormdata(initialFormData);
        setFile(null);

        setIsChecked(false);

        setAddCategoryModal(false);
        toast.success("Category added sucessfully.");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const handleImageChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleCheckboxChange3 = (e) => {
    setIsChecked3((e.target.checked = 1));
  };

  const handleChange1 = (e) => {
    setFormdata({ ...formdata, [e.target.name]: e.target.value });
  };

  const toggleExpand2 = () => {
    setIsExpanded2(!isExpanded2);
  };
  const toggleExpand1 = () => {
    setIsExpanded1(!isExpanded1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // clear field error when user edits
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleFileChange1 = (e) => {
    const file = e.target.files?.[0] || null;
    setItemImage(file);
    if (errors.ProductImage)
      setErrors((prev) => ({ ...prev, ProductImage: "" }));
  };

  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };
  const handleCheckboxChange1 = (e) => {
    setIsChecked1(e.target.checked);
  };
  const handleCheckboxChange2 = (e) => {
    setIsChecked2(e.target.checked);
  };
  const handleChangeVariant = (e) => {
    setVariantFormdata({
      ...variantFormData,
      [e.target.name]: e.target.value,
    });
    setVariantErrors({ ...variantErrors, [e.target.name]: "" }); // clear error on change
  };

  const handleaddonchange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setAllAddonsData((prevData) => [...prevData, value]);
    } else {
      setAllAddonsData((prevData) =>
        prevData.filter((addon) => addon !== value),
      );
    }
  };

  const variantFormSubmit = async (formvariantdata) => {
    let errors = {};
    if (!formvariantdata.variantName.trim()) {
      errors.variantName = "Variant name is required";
    }
    if (!formvariantdata.price || parseFloat(formvariantdata.price) <= 0) {
      errors.price = "Price must be greater than 0";
    }

    // stop if any error
    if (Object.keys(errors).length > 0) {
      setVariantErrors(errors);
      return;
    }

    let findProduct = variantData.find(
      (i) => i.variantName === formvariantdata.variantName,
    );

    if (findProduct) {
      let newVariantData = variantData.map((variantcart) =>
        variantcart.id === formvariantdata.id
          ? { ...variantcart, ...formvariantdata }
          : variantcart,
      );
      setVariantData(newVariantData);
    } else {
      let newVariant = {
        id: Date.now(), // generate id if not provided
        variantName: formvariantdata.variantName,
        price: formvariantdata.price,
      };
      setVariantData([...variantData, newVariant]);
    }

    // reset form after save
    setVariantFormdata({ variantName: "", price: "" });
    setVariantErrors({});

    setVariantModal(false);
  };
  const removeProduct = (variantItem) => {
    const newVariantData = variantData.filter(
      (cartItem) => cartItem.variantName !== variantItem.variantName,
    );
    setVariantData(newVariantData);
  };

  // get category data for add food
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
  // get menu type data
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
  // get Add on data
  const getActiveAddOns = () => {
    axios
      .get(`${API_BASE_URL}/getActiveAddOns`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setAddonsData(res.data);
      });
  };
  // get Kitchen data
  const getkitchenData = () => {
    axios
      .get(`${API_BASE_URL}/getkitchen`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log("Kitchen API response:", res.data);

        setKitchenData(res.data);
      });
  };

  // get Category data for add categeory
  const getData = () => {
    axios
      .get(`${API_BASE_URL}/data`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setData(res.data);
        console.log(res);
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    // Required field checks
    if (!formData.CategoryID) newErrors.CategoryID = "Category is required";
    // if (!formData.kitchenid) newErrors.kitchenid = "Kitchen is required";
    if (!formData.ProductName?.trim())
      newErrors.ProductName = "Food Name is required";
    if (!formData.menuid) newErrors.menuid = "Menu Type is required";

    // Image required
    if (!itemImage) newErrors.ProductImage = "Product image is required";

    // Variant required
    if (!variantData.length)
      newErrors.variant = "At least one variant is required";

    // Offer dates validation
    if (isChecked) {
      if (!formData.offerstartdate)
        newErrors.offerstartdate = "Offer start date is required";
      if (!formData.offerenddate)
        newErrors.offerenddate = "Offer end date is required";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    // All good: build payload and submit
    const itemdata = new FormData();
    itemdata.append("CategoryID", formData.CategoryID);
    // itemdata.append("kitchenid", formData.kitchenid);
    // itemdata.append("kitchenid", formData.kitchenid);
    itemdata.append("ProductName", formData.ProductName);
    itemdata.append("productvat", formData.productvat);
    itemdata.append("descrp", formData.descrp);
    itemdata.append("isoffer", isChecked);
    itemdata.append("special", isChecked1);
    itemdata.append("is_custom_quantity", isChecked2);
    itemdata.append("variant", JSON.stringify(variantData));
    itemdata.append("addons", JSON.stringify(allAddonsData));
    itemdata.append("menuid", formData.menuid);
    itemdata.append("status", formData.status);
    itemdata.append("offerstartdate", formData.offerstartdate);
    itemdata.append("offerenddate", formData.offerenddate);
    itemdata.append("ProductImage", itemImage);

    axios
      .post(`${API_BASE_URL}/itemfood`, itemdata, {
        headers: { Authorization: token },
      })
      .then(() => {
        // reset form + errors
        setFormData({
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
          status: "",
          menuid: "",
          variant: [],
          addon: [],
        });
        setItemImage(null);
        setIsChecked(false);
        setIsChecked1(false);
        setIsChecked2(false);
        setIsExpanded1(false);
        setVariantData([]);
        setAllAddonsData([]);
        setErrors({});
        toast.success("Food and Variant added successfully.");

        navigate("/food-list");
      })
      .catch((error) => {
        console.error(error);
        toast.error("Failed to add food item.");
      });
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
      navigate("/food-list");
    } catch (error) {
      toast.error("Upload failed");
      console.error("Upload error:", error);
    }
  };

  const handleDownloadSample = () => {
    const sampleData = [
      {
        CategoryID: 1,
        ProductName: "Cheese Pizza",
        productvat: 5,
        ProductImage: "pizza.jpg",
        isoffer: 1,
        offerstartdate: "2024-04-01",
        offerenddate: "2024-04-10",
        special: 1,
        is_custom_quantity: 0,
        menuid: 2,
        status: 1,
        descrp: "Delicious cheese loaded pizza",

        // JSON string for variants
        variant: JSON.stringify([
          { variantName: "Small", price: 199 },
          { variantName: "Medium", price: 299 },
          { variantName: "Large", price: 399 },
        ]),

        // JSON string for addons
        addons: JSON.stringify([1, 3, 5]),
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Food Sample");

    XLSX.writeFile(wb, "food-bulk-sample.xlsx");
  };

  useEffect(() => {
    getCategoryData();
    getmenuData();
    getkitchenData();
    getData();
    getActiveAddOns();
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
                Add Food
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
                {/* File Upload Section */}
                {/* <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                  <label
                    htmlFor="file-upload"
                    className="relative cursor-pointer bg-white border border-gray-300 rounded-md px-4 py-2 flex items-center justify-center hover:bg-gray-50 transition-colors w-full sm:w-auto"
                  >
                    <span className="mr-2">Choose File</span>
                    <svg
                      className="w-5 h-5 text-gray-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                      />
                    </svg>
                    <input
                      type="file"
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                    />
                  </label>

                  <button
                    onClick={handleUpload}
                    disabled={!bulkfile}
                    className={`px-4 py-2 rounded-md font-medium transition-all duration-300 w-full sm:w-auto ${
                      !bulkfile
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-[#1C1D3E] text-white hover:bg-[#2D2F5A] transform hover:scale-105"
                    }`}
                  >
                    Upload Bulk
                  </button>

                  <button
                    onClick={handleDownloadSample}
                    className="px-4 py-2 border border-[#1C1D3E] text-[#1C1D3E] rounded-md font-medium hover:bg-[#1C1D3E] hover:text-white transition-colors duration-300 transform hover:scale-105 w-full sm:w-auto"
                  >
                    Download Sample
                  </button>
                </div> */}

                {/* Add Category Button (conditionally rendered) */}
                <HasPermission module="Category List" action="create">
                  <button
                    onClick={() => navigate("/add-category")}
                    className="bg-[#4CBBA1] hover:bg-[#3CA991] text-white font-semibold px-4 py-2 rounded-md flex items-center justify-center gap-2 transition-colors duration-300 transform hover:scale-105 w-full sm:w-auto mt-4 sm:mt-0"
                  >
                    <IoIosAddCircleOutline className="text-xl" />
                    Add Category
                  </button>
                </HasPermission>
              </div>
            </div>
            {/* Add Food Section*/}
            <div className="form ">
              <div className="">
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* main div */}
                  <div className=" grid grid-flow-col gap-x-10">
                    {/* Left form */}
                    <div className="">
                      <div className="">
                        <label
                          className="block text-sm mb-2 font-medium text-gray-700"
                          htmlFor=""
                        >
                          Category*
                        </label>
                        <select
                          className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="parentCategory"
                          name="CategoryID"
                          value={formData.CategoryID}
                          onChange={handleChange}
                        >
                          <option value="">Select option</option>

                          {categoryData.map((val, index) => (
                            <option key={index} value={val.CategoryID}>
                              {val.Name}
                            </option>
                          ))}
                        </select>
                        {errors.CategoryID && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.CategoryID}
                          </p>
                        )}
                      </div>

                      <div className=" mb-2  mt-5">
                        <label className="block mb-2  text-sm font-medium text-gray-700">
                          Food Name*
                        </label>

                        <input
                          type="text"
                          name="ProductName"
                          value={formData.ProductName}
                          onChange={handleChange}
                          className={`shadow w-full py-2 px-3 rounded border ${
                            errors.ProductName
                              ? "border-red-500"
                              : "border-[#4CBBA1]"
                          }`}
                        />
                        {errors.ProductName && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.ProductName}
                          </p>
                        )}
                      </div>

                      <div className=" mb-2  mt-5">
                        <label className="block  mb-2 text-sm font-medium text-gray-700">
                          Vat
                        </label>
                        <input
                          type="number"
                          name="productvat"
                          max={100}
                          value={formData.productvat}
                          onChange={handleChange}
                          className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                      </div>

                      <div className=" mb-2  mt-5">
                        <label className="block  mb-2 text-sm font-medium text-gray-700">
                          Image*
                        </label>
                        <input
                          type="file"
                          name="ProductImage"
                          accept="image/*"
                          onChange={handleFileChange1}
                          className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        />
                        {errors.ProductImage && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.ProductImage}
                          </p>
                        )}
                      </div>

                      {/* offer */}

                      <div className="flex  mt-5 items-center justify-between">
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
                                <div className="mb-4 flex gap-x-5 justify-center items-center">
                                  <label
                                    className="block text-nowrap text-gray-700 w-[200px] font-semibold mb-2"
                                    htmlFor="offerStartDate"
                                  >
                                    Offer Start Date
                                  </label>
                                  <input
                                    className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                                    id="offerStartDate"
                                    type="date"
                                    placeholder="Offer Start Date"
                                    name="offerstartdate"
                                    value={formData.offerstartdate}
                                    onChange={handleChange}
                                  />
                                </div>
                                <div className="mb-4 flex gap-x-5 justify-center items-center">
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
                                    placeholder="Offer End Date"
                                    name="offerenddate"
                                    value={formData.offerenddate}
                                    onChange={handleChange}
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
                            value={isChecked1}
                            type="checkbox"
                            name="special"
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
                            value={isChecked2}
                            type="checkbox"
                            name="customQuantity"
                            checked={isChecked2}
                            onChange={handleCheckboxChange2}
                            className="size-5 custom-checkbox"
                          />
                        </div>
                      </div>

                      <div className=" mb-2  mt-5">
                        <label
                          className="block mb-2  text-sm font-medium text-gray-700"
                          htmlFor=""
                        >
                          Menu Type*
                        </label>
                        <select
                          name="menuid"
                          value={formData.menuid}
                          onChange={handleChange}
                          className={`shadow w-full appearance-none rounded py-2 px-3 leading-tight focus:outline-none focus:shadow-outline ${
                            errors.menuid
                              ? "border-red-500 border"
                              : "border-[#4CBBA1] border"
                          }`}
                        >
                          <option value="">Select option</option>
                          {menuData.map((val, index) => (
                            <option key={index} value={val.menutypeid}>
                              {val.menutype}
                            </option>
                          ))}
                        </select>
                        {errors.menuid && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.menuid}
                          </p>
                        )}
                      </div>

                      <div className=" mb-2  mt-5">
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                          Status
                        </label>
                        <select
                          name="status"
                          value={formData.status}
                          onChange={handleChange}
                          className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          {" "}
                          <option value="1">Active</option>
                          <option value="0">Inactive</option>
                        </select>
                      </div>
                    </div>

                    {/* Right Form */}

                    <div className="">
                      {/* Add Add-ons */}
                      <div className="border-[1px] border-[#4CBBA1] mt-5 rounded-sm">
                        <div
                          onClick={toggleExpand1}
                          className="relative p-2 h-[80px] text-base text-black"
                        >
                          <div className="flex justify-between pt-3 ">
                            <h1>Addons</h1>
                            <IoIosArrowDown
                              onClick={toggleExpand1}
                              className={`cursor-pointer text-[#000000] ${
                                isExpanded1 ? "rotate-180" : ""
                              } border-[1px] bg-white rounded-full text-xl transition-transform`}
                            />
                          </div>
                        </div>

                        {isExpanded1 && (
                          <div className=" h-[150px]  overflow-y-scroll">
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
                                        onChange={handleaddonchange}
                                        id={`offer-${index}`}
                                        className="size-5 custom-checkbox"
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
                          className="relative p-2 h-[80px] text-base text-black"
                        >
                          <div className="flex justify-between pt-3">
                            <h1>Variants*</h1>
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
                          Description
                        </label>
                        <textarea
                          name="descrp"
                          maxLength={20000}
                          value={formData.descrp}
                          onChange={handleChange}
                          className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        ></textarea>
                      </div>
                    </div>
                  </div>

                  {/* Button */}

                  <div className="flex justify-end space-x-4">
                    <HasPermission module="Add Food" action="create">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
                      >
                        Save
                      </button>
                    </HasPermission>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </section>
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
              {variantErrors.variantName && (
                <p className="text-red-500 text-xs mt-1">
                  {variantErrors.variantName}
                </p>
              )}
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
              {variantErrors.price && (
                <p className="text-red-500 text-xs mt-1">
                  {variantErrors.price}
                </p>
              )}
            </div>

            <div className="flex justify-start space-x-4 mt-5">
              <button
                onClick={() => setVariantModal(false)}
                type="button"
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => variantFormSubmit(variantFormData)}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>
      {/* Category Dialog Box */}

      <CategoryDialogBox
        title={"Add  New Category"}
        isOpen={AddCategoryModal}
        onClose={() => {
          setAddCategoryModal(false);
        }}
      >
        <div className="max-w-md mx-auto p-6">
          {" "}
          {/* Set a maximum width and center the form */}
          <form
            onSubmit={handleSubmit1}
            className="bg-white rounded px-6 pt-6 pb-8 mb-4" // Reduced padding
          >
            <div className="flex flex-col gap-y-6">
              {" "}
              <div className="category">
                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="categoryName"
                  >
                    Category Name
                  </label>
                  <input
                    className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="categoryName"
                    type="text"
                    name="name"
                    placeholder="Enter Category Name"
                    value={formdata.name}
                    onChange={handleChange1}
                  />
                </div>

                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="parentCategory"
                  >
                    Parent Category
                  </label>
                  <select
                    name="CategoryID"
                    value={formData.CategoryID}
                    onChange={handleChange}
                    className={`shadow w-full py-2 px-3 rounded border ${
                      errors.CategoryID ? "border-red-500" : "border-[#4CBBA1]"
                    }`}
                  >
                    <option value="">Select option</option>
                    {categoryData.map((val) => (
                      <option key={val.CategoryID} value={val.CategoryID}>
                        {val.Name}
                      </option>
                    ))}
                  </select>
                  {errors.CategoryID && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.CategoryID}
                    </p>
                  )}
                </div>

                <div className="mb-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-nowrap text-gray-700 font-semibold mb-2 w-1/3" // Set width for label
                    htmlFor="image"
                  >
                    Image
                  </label>
                  <input
                    className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>
              </div>
              <div className="offer_category">
                <div className="mb-6">
                  <div className="flex gap-2">
                    <label
                      className="text-nowrap font-semibold text-gray-700 w-[130px]"
                      htmlFor="offer"
                    >
                      Offer
                    </label>
                    <input
                      value={isChecked3}
                      checked={isChecked3}
                      type="checkbox"
                      name="isoffer"
                      id="offer"
                      onChange={handleCheckboxChange3}
                      className="size-5 custom-checkbox"
                    />
                  </div>
                </div>

                {isChecked3 && (
                  <span className="text-gray-700 text-sm">
                    <div>
                      <div className="mb-4 flex gap-x-5 justify-between items-center">
                        <label
                          className="block text-nowrap text-gray-700 w-1/3 font-semibold mb-2"
                          htmlFor="offerStartDate"
                        >
                          Offer Start Date
                        </label>
                        <input
                          className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerStartDate"
                          type="date"
                          placeholder="Offer Start Date"
                          name="offerstartdate"
                          value={formdata.offerstartdate}
                          onChange={handleChange1}
                        />
                      </div>
                      <div className="mb-4 flex gap-x-5 justify-between items-center">
                        <label
                          className="block text-nowrap text-gray-700 w-1/3 font-semibold mb-2"
                          htmlFor="offer EndDate"
                        >
                          Offer End Date
                        </label>
                        <input
                          className="shadow w-2/3 border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="offerEndDate"
                          type="date"
                          placeholder="Offer End Date"
                          name="offerendate"
                          value={formdata.offerendate}
                          onChange={handleChange1}
                        />
                      </div>
                    </div>
                  </span>
                )}

                <div className="mt-4 flex gap-x-5 justify-between items-center">
                  <label
                    className="block text-gray-700 w-1/3 font-semibold mb-2"
                    htmlFor="status"
                  >
                    Status
                  </label>
                  <select
                    className="shadow border border-[#4CBBA1] rounded w-2/3 py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    id="status"
                    name="status"
                    value={formdata.status}
                    onChange={handleChange1}
                  >
                    <option value="">Select option</option>
                    <option value="1">Active</option>
                    <option value="0">Inactive</option>
                  </select>
                </div>

                <div className="flex mt-4 justify-end gap-x-3">
                  <button
                    className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                    type="reset"
                  >
                    Reset
                  </button>
                  <button
                    className="bg-[#1C1D3E] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                    type="submit"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>
      </CategoryDialogBox>
    </>
  );
};

export default AddFood;
