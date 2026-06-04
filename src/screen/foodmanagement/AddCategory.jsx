import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import * as XLSX from "xlsx";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";

const AddCategory = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [kitchenData, setKitchenData] = useState([]);

  const initialFormData = {
    name: "",
    parentid: "",
    offerstartdate: "",
    offerendate: "",
    status: 1,
    kitchen_id: "",
  };
  const token = localStorage.getItem("token");
  // All get data
  const [data, setData] = useState([]);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  // Nav bar
  const [isOpen, setOpen] = useState(true);

  // Form data
  const [formdata, setFormdata] = useState(initialFormData);

  // File
  const [file, setFile] = useState(null);
  const handleImageChange = (e) => {
    setFile(e.target.files[0]);
  };

  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (e) => {
    // setIsChecked((e.target.checked = 1));
    setIsChecked(e.target.checked);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let newErrors = {};
    if (!formdata.name.trim()) {
      newErrors.name = "Category Name is required";
    }

    // Additional validation example: if offer is checked but dates are missing
    if (isChecked) {
      if (!formdata.offerstartdate) {
        newErrors.offerstartdate = "Offer start date is required";
      }
      if (!formdata.offerendate) {
        newErrors.offerendate = "Offer end date is required";
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      toast.error("Please fix the highlighted errors");
      return;
    }

    const data = {
      name: formdata.name,
      parentid: formdata.parentid,
      offerstartdate: formdata.offerstartdate,
      offerendate: formdata.offerendate,
      status: formdata.status,
      image: file ? file.name : null,
      isoffer: isChecked,
      kitchen_id: formdata.kitchen_id,
    };

    if (!navigator.onLine) {
      const offlineData =
        JSON.parse(localStorage.getItem("offlineCategories")) || [];
      offlineData.push(data);
      localStorage.setItem("offlineCategories", JSON.stringify(offlineData));

      toast.info(
        "You are offline. Data saved locally and will sync when online.",
      );
      resetForm();
    } else {
      try {
        const formDataObj = new FormData();
        Object.keys(data).forEach((key) => {
          if (key === "image" && file) {
            formDataObj.append(key, file);
          } else {
            formDataObj.append(key, data[key]);
          }
        });

        await axios.post(`${API_BASE_URL}/data`, formDataObj, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token,
          },
        });

        toast.success("Category created successfully!");
        resetForm();
        navigate("/category-list");
      } catch (error) {
        console.error("Error submitting form:", error);
        toast.error(
          error.response?.data?.error || "Failed to create category.",
        );
      }
    }
  };

  const [bulkfile, setBulkfile] = useState(null);

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

  const handleFileChange = (e) => {
    setBulkfile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!bulkfile) {
      alert("Please select a file before uploading.");
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(bulkfile);
    reader.onload = async (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      let categories = XLSX.utils.sheet_to_json(sheet);

      categories = categories.filter(
        (category) => category.name && category.status,
      );

      if (categories.length === 0) {
        alert("No valid data found in the file.");
        return;
      }

      try {
        const response = await axios.post(
          `${API_BASE_URL}/bulkupload`,
          { categories },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: token,
            },
          },
        );
        alert(response.data.message);
        navigate("/category-list");
      } catch (error) {
        alert(
          "Error uploading file: " +
            (error.response?.data?.error || error.message),
        );
      }
    };
  };

  const handleDownloadSample = () => {
    const sampleCategoryData = [
      {
        name: "Pizza",
        parentid: "",
        kitchen_id: 1,
        isoffer: 0,
        offerstartdate: "",
        offerendate: "",
        status: 1,
        image: "pizza.jpg",
      },
      {
        name: "Burger",
        parentid: "",
        kitchen_id: 1,
        isoffer: 1,
        offerstartdate: "2024-04-01",
        offerendate: "2024-04-07",
        status: 1,
        image: "burger.png",
      },
      {
        name: "Veg Pizza",
        parentid: 1,
        kitchen_id: 1,
        isoffer: 0,
        offerstartdate: "",
        offerendate: "",
        status: 1,
        image: "",
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleCategoryData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Category Sample");

    XLSX.writeFile(wb, "category-bulk-sample.xlsx");
  };

  // Function to reset the form
  const resetForm = () => {
    setFormdata(initialFormData);
    setFile(null);
    setIsChecked(false);
  };

  // Sync offline data to the server
  const syncDataToServer = async () => {
    const offlineData =
      JSON.parse(localStorage.getItem("offlineCategories")) || [];
    if (offlineData.length === 0) return;

    const remainingData = [];
    for (const item of offlineData) {
      const formData = new FormData();
      Object.keys(item).forEach((key) => {
        if (key === "image" && item.image) {
          formData.append(key, item.image);
        } else {
          formData.append(key, item[key]);
        }
      });

      try {
        const response = await axios.post(`${API_BASE_URL}/data`, formData, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: token,
          },
        });

        if (response.status === 200) {
          console.log("Offline data synced successfully:", item);
        } else {
          console.error(
            "Error syncing data:",
            response.data?.message || "Unknown error",
          );
          remainingData.push(item);
        }
      } catch (error) {
        console.error("Error syncing offline data:", error);
        remainingData.push(item);
      }
    }

    // Update localStorage with unsynced data
    if (remainingData.length > 0) {
      localStorage.setItem("offlineCategories", JSON.stringify(remainingData));
    } else {
      localStorage.removeItem("offlineCategories");
      toast.success("All offline data synced successfully!");
    }
  };

  // Handle online and offline events
  useEffect(() => {
    const handleOnline = () => {
      toast.info("You are back online. Syncing offline data...");
      syncDataToServer();
    };

    const handleOffline = () => {
      toast.warning(
        "You are offline. Changes will be synced when you're back online.",
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup event listeners
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);
  const handelchange = (e) => {
    const { name, value } = e.target;
    setFormdata((prev) => ({ ...prev, [name]: value }));

    // Remove error once field is edited
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

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

  useEffect(() => {
    getData();
    getkitchenData();
  }, []);

  console.log("addcategrryparent", data);

  return (
    <>
      <div className="main_div ">
        <section className="side_section flex">
          <div
            className={`${
              isOpen === false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div w-full ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Add Category
              </h1>
              <div>
                <div></div>
              </div>
              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            {/* Order data */}
            <div className="container mt-11 rounded mx-auto p-4 border-[1px] border-[#4CBBA1]">
              <form
                onSubmit={handleSubmit}
                className="bg-white rounded px-8 pt-6 pb-8 mb-4"
              >
                <div className="flex justify-between">
                  <div className="category">
                    {/* Category Name */}
                    <div className="mb-4 flex gap-x-5 justify-center items-center">
                      <label
                        className="block text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="categoryName"
                      >
                        Category Name*
                      </label>
                      <div className="w-full">
                        <input
                          className={`shadow w-full border ${
                            errors.name ? "border-red-500" : "border-[#4CBBA1]"
                          } appearance-none rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                          id="categoryName"
                          type="text"
                          name="name"
                          placeholder="Enter Category Name"
                          value={formdata.name}
                          onChange={handelchange}
                        />
                        {errors.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.name}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Parent Category */}
                    <div className="mb-4 flex gap-x-5 justify-center items-center">
                      <label
                        className="block text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="parentCategory"
                      >
                        Parent Category
                      </label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="parentCategory"
                        name="parentid"
                        value={formdata.parentid}
                        onChange={handelchange}
                      >
                        <option value="">Select option</option>
                        {data.map((category, index) => (
                          <option key={index} value={category.CategoryID}>
                            {category.Name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Kitchen Selection */}
                    <div className="mb-4 flex gap-x-5 justify-center items-center">
                      <label
                        className="block text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="kitchen_id"
                      >
                        Assign Kitchen*
                      </label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="parentCategory"
                        name="kitchen_id"
                        value={formdata.kitchen_id}
                        onChange={handelchange}
                      >
                        <option value="">Select option</option>
                        {kitchenData.map((val, index) => (
                          // <option key={index} value={val.kitchenid}>
                          <option key={index} value={val.id}>
                            {val.kitchen_name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Image */}
                    <div className="mb-4 flex gap-x-24 justify-between items-center">
                      <label
                        className="block text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="image"
                      >
                        Image
                      </label>
                      <input
                        className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="image"
                        name="image"
                        accept="image/*"
                        type="file"
                        onChange={handleImageChange}
                      />
                    </div>
                  </div>

                  {/* Offer Section */}
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
                          value={isChecked}
                          checked={isChecked}
                          type="checkbox"
                          name="isoffer"
                          id="offer"
                          onChange={handleCheckboxChange}
                          className="size-5 custom-checkbox"
                        />
                      </div>
                    </div>

                    {isChecked && (
                      <div>
                        {/* Offer Start Date */}
                        <div className="mb-4 flex gap-x-5 justify-center items-center">
                          <label
                            className="block text-nowrap text-gray-700 w-[200px] font-semibold mb-2"
                            htmlFor="offerStartDate"
                          >
                            Offer Start Date
                          </label>
                          <div className="w-full">
                            <input
                              className={`shadow w-full border ${
                                errors.offerstartdate
                                  ? "border-red-500"
                                  : "border-[#4CBBA1]"
                              } appearance-none rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                              id="offerStartDate"
                              type="date"
                              placeholder="Offer Start Date"
                              name="offerstartdate"
                              value={formdata.offerstartdate}
                              onChange={handelchange}
                            />
                            {errors.offerstartdate && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.offerstartdate}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Offer End Date */}
                        <div className="mb-4 flex gap-x-5 justify-center items-center">
                          <label
                            className="block text-nowrap text-gray-700 w-[200px] font-semibold mb-2"
                            htmlFor="offerEndDate"
                          >
                            Offer End Date
                          </label>
                          <div className="w-full">
                            <input
                              className={`shadow w-full border ${
                                errors.offerendate
                                  ? "border-red-500"
                                  : "border-[#4CBBA1]"
                              } appearance-none rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline`}
                              id="offerEndDate"
                              type="date"
                              placeholder="Offer End Date"
                              name="offerendate"
                              value={formdata.offerendate}
                              onChange={handelchange}
                            />
                            {errors.offerendate && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.offerendate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="mt-4 flex gap-x-5 justify-center items-center">
                      <label
                        className="block text-gray-700 w-[200px] font-semibold mb-2"
                        htmlFor="status"
                      >
                        Status*
                      </label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="status"
                        name="status"
                        value={formdata.status}
                        onChange={handelchange}
                      >
                        <option value="1">Active</option>
                        <option value="0">Inactive</option>
                      </select>
                    </div>

                    {/* Buttons */}
                    <div className="flex mt-4 float-right gap-x-3">
                      <button
                        className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                        type="reset"
                        onClick={resetForm}
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
            <div className="max-w-md mx-auto my-8 p-6 bg-white rounded-xl shadow-md">
              <h3 className="text-xl font-semibold text-gray-800 mb-6 text-center">
                Bulk Upload
              </h3>

              {/* File Upload Area */}
              <div className="border-2 border-dashed border-gray-300 p-8 rounded-lg mb-6 bg-gray-50 hover:border-green-500 transition-colors duration-300 text-center">
                <svg
                  className="w-12 h-12 mx-auto text-gray-400"
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
                <p className="mt-2 text-sm text-gray-600">
                  Upload your Excel file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Supports .xlsx, .xls files
                </p>
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={handleFileChange}
                  className="hidden"
                  id="file-upload"
                />
                <label
                  htmlFor="file-upload"
                  className="mt-4 inline-flex items-center px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors duration-300 cursor-pointer"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                    />
                  </svg>
                  Select File
                </label>
              </div>

              {/* Upload Button */}
              <button
                onClick={handleUpload}
                disabled={!bulkfile}
                className={`w-full py-2 px-4 rounded-md font-medium transition-colors duration-300 ${
                  !bulkfile
                    ? "bg-gray-300 cursor-not-allowed text-gray-500"
                    : "bg-blue-600 hover:bg-blue-700 text-white"
                }`}
              >
                Upload
              </button>

              {/* Download Sample Button */}
              <div className="mt-4 text-center">
                <button
                  onClick={handleDownloadSample}
                  className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-300"
                >
                  <svg
                    className="w-4 h-4 mr-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                  Download Sample File
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default AddCategory;
