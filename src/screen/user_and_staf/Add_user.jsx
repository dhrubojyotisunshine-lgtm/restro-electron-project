import React, { useState, useEffect, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import * as XLSX from "xlsx";
import { AuthContext } from "../../store/AuthContext";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { toast } from "react-toastify";
import axios from "axios";
import useFullScreen from "../../components/useFullScreen";
import HasPermission from "../../store/HasPermission";
import { useNavigate } from "react-router-dom";

const Add_user = () => {
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const navigate = useNavigate();
  const initialFormData = {
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    about: "",
    status: 1,
    is_admin: 0,
    image: null, // This will hold the image file
  };

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [formData, setFormData] = useState(initialFormData);
  const [isChecked, setIsChecked] = useState(false);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Handle image file input
  const handleImageChange = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0], // Set the image file in formData
    });
  };

  // Handle checkbox for is_admin
  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
    setFormData({
      ...formData,
      is_admin: e.target.checked ? 1 : 0, // Update is_admin based on checkbox
    });
  };

  // Reset form data
  const resetForm = () => {
    setFormData(initialFormData);
    setIsChecked(false);
  };

  const [bulkfile, setBulkfile] = useState(null);

  const handleFileChange = (e) => {
    setBulkfile(e.target.files[0]);
  };
  const handleUpload = async () => {
    if (!bulkfile) {
      toast.error("Please select a file before uploading.");
      return;
    }

    const reader = new FileReader();
    reader.readAsBinaryString(bulkfile);
    reader.onload = async (e) => {
      const data = e.target.result;
      const workbook = XLSX.read(data, { type: "binary" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const users = XLSX.utils.sheet_to_json(sheet); // Convert Excel to JSON

      try {
        const response = await axios.post(
          `${API_BASE_URL}/add-bulk-user`,
          { users },
          {
            headers: { "Content-Type": "application/json" }, // Explicitly set JSON header
          }
        );
        toast.success(response.data.message);
      } catch (error) {
        toast.error(
          "Error uploading file: " +
            (error.response?.data?.error || error.message)
        );
      }
    };
  };

  const handleDownloadUserSample = () => {
    const sampleData = [
      {
        firstname: "Sample user",
        lastname: "Doe",
        about: "Software Engineer",
        email: "john.doe@example.com",
        password: "12345678",
        status: 1,
        is_admin: 0,
      },
    ];

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Users");

    XLSX.writeFile(wb, "user-sample-upload.xlsx");
  };
  // const SubmitData = async (e) => {
  //    e.preventDefault();
  //   // Validate form data
  //   if (!formData.firstname) {
  //     toast.error("First name is required.");
  //     return;
  //   }
  //   if (!formData.lastname) {
  //     toast.error("Last name is required.");
  //     return;
  //   }
  //   if (!formData.email) {
  //     toast.error("Email is required.");
  //     return;
  //   }

  //   // ✅ Email format validation
  //   const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  //   if (!emailPattern.test(formData.email.toLowerCase())) {
  //     toast.error("Enter a valid email address.");
  //     return;
  //   }

  //   if (!formData.password) {
  //     toast.error("Password is required.");
  //     return;
  //   }

  //   // ✅ Password strength validation: Minimum 6 characters
  //   if (formData.password.length < 6) {
  //     toast.error("Password must be at least 6 characters long.");
  //     return;
  //   }

  //   if (!formData.about) {
  //     toast.error("About field is required.");
  //     return;
  //   }
  //   if (!formData.status) {
  //     toast.error("Status is required.");
  //     return;
  //   }

  //   const data = new FormData();
  //   data.append("firstname", formData.firstname);
  //   data.append("lastname", formData.lastname);
  //   data.append("email", formData.email);
  //   data.append("password", formData.password);
  //   data.append("about", formData.about);
  //   data.append("status", formData.status);
  //   data.append("is_admin", formData.is_admin);
  //   if (formData.image) {
  //     data.append("image", formData.image);
  //   }

  //   // Offline fallback
  //   if (!navigator.onLine) {
  //     const offlineData = JSON.parse(localStorage.getItem("offlineData")) || [];
  //     const newEntry = {
  //       id: Date.now(),
  //       formData: {
  //         firstname: formData.firstname,
  //         lastname: formData.lastname,
  //         email: formData.email,
  //         password: formData.password,
  //         about: formData.about,
  //         status: formData.status,
  //         is_admin: formData.is_admin,
  //       },
  //       image: formData.image || null,
  //     };
  //     offlineData.push(newEntry);
  //     localStorage.setItem("offlineData", JSON.stringify(offlineData));
  //     toast.success("You are offline. Data has been saved locally.");
  //     resetForm();
  //     return;
  //   }

  //   // Submit online
  //   try {
  //     const response = await axios.post(`${API_BASE_URL}/add`, data, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //         Authorization: token,
  //       },
  //     });
  //     if (response.status === 201) {
  //       toast.success("User added successfully!");
  //       resetForm();
  //     }
  //   } catch (error) {
  //     console.error("Error submitting form:", error);
  //     toast.error(error.response?.data?.error || "Failed to add user.");
  //   }
  // };

  const SubmitData = async (e) => {
    e.preventDefault();

    // Validate form data
    if (!formData.firstname) {
      toast.error("First name is required.");
      return;
    }
    if (!formData.lastname) {
      toast.error("Last name is required.");
      return;
    }
    if (!formData.email) {
      toast.error("Email is required.");
      return;
    }

    // Email format validation
    const emailPattern = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
    if (!emailPattern.test(formData.email.toLowerCase())) {
      toast.error("Enter a valid email address.");
      return;
    }

    if (!formData.password) {
      toast.error("Password is required.");
      return;
    }

    if (formData.password.length < 6) {
      toast.error("Password must be at least 6 characters long.");
      return;
    }

    if (!formData.about) {
      toast.error("About field is required.");
      return;
    }

    if (!formData.status) {
      toast.error("Status is required.");
      return;
    }

    // Prepare form data
    const data = new FormData();
    data.append("firstname", formData.firstname);
    data.append("lastname", formData.lastname);
    data.append("email", formData.email);
    data.append("password", formData.password);
    data.append("about", formData.about);
    data.append("status", formData.status);
    data.append("is_admin", formData.is_admin);

    if (formData.image) {
      data.append("image", formData.image);
    }

    // If offline — save locally
    if (!navigator.onLine) {
      const offlineData = JSON.parse(localStorage.getItem("offlineData")) || [];

      const newEntry = {
        id: Date.now(),
        formData: {
          firstname: formData.firstname,
          lastname: formData.lastname,
          email: formData.email,
          password: formData.password,
          about: formData.about,
          status: formData.status,
          is_admin: formData.is_admin,
        },
        image: formData.image || null,
      };

      offlineData.push(newEntry);
      localStorage.setItem("offlineData", JSON.stringify(offlineData));
      toast.success("You are offline. Data has been saved locally.");

      resetForm();
      return;
    }

    // Submit online
    try {
      const response = await axios.post(`${API_BASE_URL}/add`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      });

      if (response.status === 200 || response.status === 201) {
        toast.success("User added successfully!");
        resetForm();
        navigate("/user-list");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.response?.data?.error || "Failed to add user.");
    }
  };

  const syncDataToServer = async () => {
    const offlineData = JSON.parse(localStorage.getItem("offlineData")) || [];
    if (offlineData.length === 0) return;

    const remainingData = []; // To store unsynced data
    for (const item of offlineData) {
      const data = new FormData();
      Object.keys(item.formData).forEach((key) => {
        data.append(key, item.formData[key]);
      });

      if (item.image) {
        data.append("image", item.image);
      }

      try {
        const response = await axios.post(`${API_BASE_URL}/add`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        });

        if (response.status === 200) {
          console.log("Offline data synced:", item);
        } else {
          console.error(
            "Error syncing data:",
            response.data?.message || "Unknown error"
          );
          remainingData.push(item); // Keep this data for retry
        }
      } catch (error) {
        console.error("Error syncing offline data:", error);
        remainingData.push(item); // Keep this data for retry
      }
    }

    // Update localStorage with unsynced data or remove if empty
    if (remainingData.length > 0) {
      localStorage.setItem("offlineData", JSON.stringify(remainingData));
    } else {
      localStorage.removeItem("offlineData");
      toast.success("All offline data synced successfully!");
    }
  };

  // Listen for online and offline events
  useEffect(() => {
    const handleOnline = () => {
      toast.info("You are back online. Syncing offline data...");
      syncDataToServer();
    };

    const handleOffline = () => {
      toast.warning(
        "You are offline. Changes will be synced when you're back online."
      );
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Cleanup event listeners on component unmount
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Reset form function

  return (
    <>
      <div className="main_div ">
        <section className="side_section flex">
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
          <div className="contant_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className=" font-semibold mb-3">
                Add Users <br />
                <span>This Section is Use Only for Store Management</span>
              </h1>
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
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
                  onClick={handleDownloadUserSample}
                  className="px-4 py-2 border border-[#1C1D3E] text-[#1C1D3E] rounded-md font-medium hover:bg-[#1C1D3E] hover:text-white transition-colors duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  Download Sample
                </button>
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            <div className="mt-28 border-[1px] border-[#4CBBA1] bg-white rounded-sm">
              <form onSubmit={SubmitData}>
                <div className="pt-11 pb-16 pr-24">
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="firstname"
                    >
                      First Name*
                    </label>
                    <input
                      value={formData.firstname}
                      onChange={handleChange}
                      type="text"
                      maxLength={30}
                      name="firstname"
                      placeholder="First Name"
                      className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="lastname"
                    >
                      Last Name*
                    </label>
                    <input
                      value={formData.lastname}
                      onChange={handleChange}
                      type="text"
                      maxLength={30}
                      name="lastname"
                      placeholder="Last Name"
                      className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="email"
                    >
                      Email Address*
                    </label>
                    <input
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      name="email"
                      required
                      pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                      placeholder="Email Address"
                      className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Enter a valid email (e.g., user@example.com)
                  </p>
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="password"
                    >
                      Password*
                    </label>
                    <input
                      required
                      pattern="(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}"
                      value={formData.password}
                      onChange={handleChange}
                      name="password"
                      type="password"
                      placeholder="Password"
                      className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Minimum 6 characters long password .
                  </p>
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="image"
                    >
                      Image*
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
                  <div className="mb-11 flex gap-x-7">
                    <label className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2">
                      Description*
                    </label>
                    <textarea
                      name="about"
                      value={formData.about}
                      onChange={handleChange}
                      className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    ></textarea>
                  </div>
                  <div className="mb-11 flex gap-x-7">
                    <label
                      className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="status"
                    >
                      Status*
                    </label>
                    <select
                      className="shadow border border-[#4CBBA1] rounded w-full py-2 px-2 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      id="status"
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                    >
                      <option value="1">Active</option>
                      <option value="0">Inactive</option>
                    </select>
                  </div>
                  <div className="mb-11 gap-x-3 hidden">
                    <label
                      className="  ml-44 text-nowrap text-gray-700 font-semibold mb-2"
                      htmlFor="is_admin"
                    >
                      Is Admin
                    </label>
                    <input
                      type="checkbox"
                      name="is_admin"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="size-5 custom-checkbox"
                    />
                  </div>
                  <HasPermission module="Add User" action="create">
                    <div className="float-right flex ml-16 space-x-4">
                      <button
                        type="reset"
                        className="w-[104px] h-[42px] bg-[#4CBBA1] text-gray-50 rounded-md"
                        onClick={resetForm}
                      >
                        Reset
                      </button>

                      <button
                        type="submit"
                        className="w-[104px] h-[42px] bg-[#1C1D3E] text-white rounded-md"
                      >
                        Save
                      </button>
                    </div>
                  </HasPermission>
                </div>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Add_user;
