import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import DeleteDialogBox from "../../components/DeleteDialogBox";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";
const headers = ["SL.", "User Name", "Role Name", "Action"];
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
const User_Access_role = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [cModal, setCmodal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [roleData, setRoleData] = useState([]);
  const [userData, setUserData] = useState([]);
  const [searchName, setSearchName] = useState("");
  // delete
  const [deleteModalId, setDeleteModalId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const token = localStorage.getItem("token");
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  // roels
  const [roles, setRoles] = useState([]); // Store roles fetched from API
  const [selectedRoles, setSelectedRoles] = useState(null); // Store selected roles
  const [user, setUser] = useState("");
  const [createdby, setCreatedby] = useState("");
  const [user2, setUser2] = useState("");

  const [userError, setUserError] = useState("");
  const [selectedRolesError, setSelectedRolesError] = useState("");

  const fetchRoles = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/allroles`, {
        headers: {
          Authorization: token,
        },
      }); // Replace with your API URL
      setRoles(response.data.data);
    } catch (error) {
      console.error("Error fetching roles:", error);
    }
  };

  // get all data
  const getReturnData = () => {
    axios
      .get(`${API_BASE_URL}/getalluseraccesses`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        console.log("response", response);
        setRoleData(response.data.data); // assuming response.data.data contains your purchase data
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);
    setCurrentPage(1);
    if (value.trim() === "") {
      getReturnData();
      console.log(roleData);
      return;
    }

    axios
      .get(`${API_BASE_URL}/getalluseraccesses`, {
        params: { searchItem: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setRoleData(res.data.data.length > 0 ? res.data.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Item Not Available");
      });
  };

  // get all user data
  const fetchUserData = () => {
    axios
      .get(`${API_BASE_URL}/all`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setUserData(res.data.data);
      })
      .catch((error) => console.error(error));
  };

  const submitRole = (e) => {
    e.preventDefault();

    setUserError("");
    setSelectedRolesError("");

    // Validate inputs
    let isValid = true;

    if (!user) {
      setUserError("Please select a user");
      isValid = false;
    }

    if (!selectedRoles) {
      setSelectedRolesError("Please select a role");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const assigneRole = {
      fk_role_ids: [selectedRoles],
      fk_user_id: user,
    };

    axios
      .post(`${API_BASE_URL}/useraccess`, assigneRole, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        console.log("User role updated successfully:", response.data);
        toast.success("User role assigned successfully!");
        getReturnData();
        fetchUserData();
        fetchRoles();
        setUser("");
        setCmodal(false);
        setEditId(null);
        setSelectedRoles([]); // Clear the selected roles after successful update
      })
      .catch((error) => {
        console.error("Error updating user role:", error);
        toast.error("Failed to update user role.");
      });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editId, setEditId] = useState(null);

  const handleEditClick = (id) => {
    setEditId(id);
    setIsModalOpen(true);
    console.log("edit id ye i h ", editId);
    // Fetch data for the given ID
    axios
      .get(`${API_BASE_URL}/useraccesss/${id}`)
      .then((response) => {
        const responseData = response.data.data; // Updated to access the 'data' object

        // Safely check if userinfo and accessInfo exist before accessing them
        if (responseData.userinfo && responseData.userinfo.length > 0) {
          setUser(responseData.userinfo[0].id);
        } else {
          console.warn("User info data is not available");
        }

        setCreatedby(responseData.accessInfo[0].created_by);

        if (responseData.accessInfo && responseData.accessInfo.length > 0) {
          // Set the roles that the user has
          const roleIds = responseData.accessInfo.map((role) => role.role_id);
          setSelectedRoles(roleIds[0]);
        } else {
          console.warn("Access info data is not available");
        }
      })
      .catch((error) => {
        console.error("Error fetching user access data:", error);
      });
  };

  const handleCheckboxChange = (e) => {
    const roleId = parseInt(e.target.value, 10);
    if (e.target.checked) {
      setSelectedRoles([...selectedRoles, roleId]);
    } else {
      setSelectedRoles(selectedRoles.filter((id) => id !== roleId));
    }
  };

  const submitRole2 = (e) => {
    e.preventDefault();
    setUserError("");
    setSelectedRolesError("");

    // Validate inputs
    let isValid = true;

    if (!user2) {
      setUserError("Please select a user");
      isValid = false;
    }

    if (selectedRoles.length === 0) {
      setSelectedRolesError("Please select at least one role");
      isValid = false;
    }

    if (!isValid) {
      return;
    }

    const updatedData = {
      fk_role_ids: [selectedRoles],
      fk_user_id: user2,
      created_by: createdby,
    };

    axios
      .put(`${API_BASE_URL}/useraccess/${editId}`, updatedData)
      .then((response) => {
        console.log("User role updated successfully:", response.data);
        toast.success("User role updated successfully!");
        getReturnData();
        fetchUserData();
        fetchRoles();
        setIsModalOpen(false);
        setEditId(null);
        setSelectedRoles([]); // Clear the selected roles after successful update
      })
      .catch((error) => {
        console.error("Error updating user role:", error);
        toast.error("Failed to update user role.");
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
    DeleteUserAcess(deleteModalId);
    handleModalClose();
  };
  const DeleteUserAcess = (id) => {
    axios
      .delete(`${API_BASE_URL}/useraccess/${id}`)
      .then((res) => {
        console.log("Data Deleted");
        toast.success("delete user sucessfully..");
        fetchUserData();
        getReturnData();
      })
      .catch((err) => {
        console.log(err);
      });
  };

  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(roleData.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const fetchData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/getalluseraccesses`);
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
      Name: `${item.firstname} ${item.lastname}`, // Use template literals directly
      Role_Name: item.role_name,
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
      { header: "Name", key: "name" },
      { header: "Role Name", key: "role_name" },
    ];
    // Add rows
    data.forEach((item) => {
      worksheet.addRow({
        name: `${item.firstname} ${item.lastname}`, // Use template literals directly
        role_name: item.role_name,
      });
    });

    console.log("roledata", roleData);

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
      `${item.firstname} ${item.lastname}`,
      item.role_name,
    ]);

    // Add a title
    doc.text("Data Export", 20, 10);

    // Add a table
    autoTable(doc, {
      head: [["Name", "Role Name"]],
      body: rows,
      startY: 20,
    });

    doc.save("data.pdf"); // PDF file name
  };

  useEffect(() => {
    getReturnData();
    fetchUserData();
    fetchRoles();
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
                User Access Role
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            <div className=" flex justify-end mt-11">
              <HasPermission module="User Access Role" action="create">
                <button
                  onClick={() => setCmodal(true)}
                  className=" bg-[#4CBBA1] p-2 rounded-sm  flex justify-center items-center
             gap-x-1 text-white font-semibold"
                >
                  <IoIosAddCircleOutline className=" font-semibold text-lg" />
                  Assign Role
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

                  <div className="flex m-auto px-4 rounded-md border-[1px]  gap-y-3 border-gray-900">
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
                      {roleData.length > 0 ? (
                        roleData
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
                                {`${row.firstname} ${row.lastname}`}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.role_name}
                              </td>

                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">
                                  <HasPermission
                                    module="User Access Role"
                                    action="edit"
                                  >
                                    <Tooltip
                                      message="Edit Role"
                                      key={row.role_id}
                                    >
                                      <button
                                        className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                        onClick={() =>
                                          handleEditClick(row.fk_user_id)
                                        }
                                      >
                                        <FaRegEdit />
                                      </button>
                                    </Tooltip>
                                  </HasPermission>
                                  <HasPermission
                                    module="User Access Role"
                                    action="delete"
                                  >
                                    <Tooltip message="Delete Role">
                                      <div>
                                        <button
                                          className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                          onClick={() =>
                                            handleDeleteClick(row.role_acc_id)
                                          }
                                        >
                                          <FaRegTrashCan />
                                        </button>
                                      </div>
                                    </Tooltip>
                                  </HasPermission>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="py-2 px-4 text-center">
                            No results found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>

            <div className="flex justify-between mt-7">
              {roleData.length > 0 && (
                <div className="mt-10">
                  <div className="float-right flex items-center space-x-2">
                    <button
                      onClick={() => selectPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="h-[46px] w-[70px] cursor-pointer border-[1px] border-[#1C1D3E] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    {[...Array(Math.ceil(roleData.length / itemsPerPage))].map(
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
                        currentPage ===
                        Math.ceil(roleData.length / itemsPerPage)
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
        isOpen={cModal}
        title={"Assing Role To User"}
        onClose={() => {
          setCmodal(false);
          setUserError(""); // Clear error when closing modal
          setSelectedRolesError(""); // Clear error when closing modal
        }}
      >
        <div className="">
          <form
            onSubmit={submitRole}
            className="bg-white rounded px-8 pt-6 pb-8 mb-4"
          >
            <div className="mb-2 mt-5">
              <label className="block mb-2 text-lg font-medium text-gray-700">
                User Name
              </label>
              <select
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                id="parentCategory"
                name="CategoryID"
                value={user}
                onChange={(e) => {
                  setUser(e.target.value);
                  setUserError(""); // Clear error when selecting a user
                }}
              >
                <option value="">Select User</option>
                {userData.map((val) => (
                  <option key={val.id} value={val.id}>
                    {`${val.firstname} ${val.lastname}`}
                  </option>
                ))}
              </select>
              {userError && (
                <p className="text-red-500 text-sm mt-1">{userError}</p>
              )}
            </div>

            <div className="mb-2 text-center mt-5">
              <h1 className="block mb-2 font-semibold text-lg text-gray-700">
                Role List
              </h1>
              <div>
                {roles.map((role) => (
                  <div
                    className="flex mt-5 items-center justify-between"
                    key={role.role_id}
                  >
                    <label className="text-lg font-medium text-gray-700">
                      {role.role_name}
                    </label>
                    <input
                      type="radio"
                      name="roleSelection" // 👈 radio ke liye ek hi name
                      className="size-5"
                      value={role.role_id}
                      checked={selectedRoles === role.role_id} // ab single value hogi
                      onChange={(e) => {
                        setSelectedRoles(parseInt(e.target.value, 10));
                        setSelectedRolesError("");
                      }}
                    />
                  </div>
                ))}
              </div>
              {selectedRolesError && (
                <p className="text-red-500 text-sm mt-1">
                  {selectedRolesError}
                </p>
              )}
            </div>

            <div className="flex mt-4 float-right gap-x-3">
              <button
                className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded focus:outline-none focus:shadow-outline"
                type="reset"
                onClick={() => setSelectedRoles(null)}
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
          </form>
        </div>
      </DialogBoxSmall>

      <DeleteDialogBox
        show={showModal}
        onClose={handleModalClose}
        onDelete={handleModalDelete}
      />

      {/* edit */}
      {isModalOpen && (
        <>
          <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
            <div className="w-96 p-6">
              {" "}
              {/* Reduced width to 24rem (96) */}
              <div className="py-4 bg-white rounded-md shadow-md border border-[#1C1D3E]">
                <div className="flex py-3 px-4 justify-between items-center border-b border-gray-300">
                  <h2 className="text-lg font-semibold">
                    Edit User Access Role
                  </h2>
                  <button
                    //  onClick={() => setIsModalOpen(false)}
                    onClick={() => {
                      setIsModalOpen(false);
                      setUserError("");
                      setSelectedRolesError("");
                    }}
                    className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold rounded"
                  >
                    X
                  </button>
                </div>
                <div className="p-4">
                  <form onSubmit={submitRole2}>
                    <div className="mb-4">
                      <label className="block mb-1 text-md font-medium text-gray-700">
                        User Name
                      </label>
                      <select
                        className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="parentCategory"
                        name="CategoryID"
                        value={user2}
                        //  onChange={(e) => setUser2(e.target.value)}
                        onChange={(e) => {
                          setUser2(e.target.value);
                          setUserError("");
                        }}
                      >
                        <option value="">Select User</option>
                        {userData.map((val) => (
                          <option key={val.id} value={val.id}>
                            {`${val.firstname} ${val.lastname}`}
                          </option>
                        ))}
                      </select>
                      {userError && (
                        <p className="text-red-500 text-sm mt-1">{userError}</p>
                      )}
                    </div>

                    <div className="mb-4 text-center">
                      <h1 className="block mb-2 font-semibold text-md text-gray-700">
                        Role List
                      </h1>
                      <div>
                        {roles.map((role) => (
                          <div
                            className="flex items-center justify-between mb-2"
                            key={role.role_id}
                          >
                            <label className="text-md font-medium text-gray-700">
                              {role.role_name}
                            </label>
                            <input
                              type="radio"
                              name="editRoleSelection"
                              className="size-5"
                              value={role.role_id}
                              checked={selectedRoles === role.role_id}
                              onChange={(e) => {
                                setSelectedRoles(parseInt(e.target.value, 10));
                                setSelectedRolesError("");
                              }}
                            />
                          </div>
                        ))}
                      </div>
                      {selectedRolesError && (
                        <p className="text-red-500 text-sm mt-1">
                          {selectedRolesError}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end gap-x-3 mt-4">
                      <button
                        className="bg-[#4CBBA1] text-white w-[90px] h-[36px] rounded focus:outline-none focus:shadow-outline"
                        type="reset"
                      >
                        Reset
                      </button>
                      <button
                        className="bg-[#1C1D3E] text-white w-[90px] h-[36px] rounded focus:outline-none focus:shadow-outline"
                        type="submit"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
          <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
        </>
      )}
    </>
  );
};

export default User_Access_role;
