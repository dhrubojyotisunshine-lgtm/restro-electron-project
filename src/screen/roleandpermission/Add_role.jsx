import React, { useEffect, useState ,useContext} from "react";
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

import useFullScreen from "../../components/useFullScreen";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";
import HasPermission from "../../store/HasPermission";

import { useNavigate } from "react-router-dom";
const modules = [
  "POS Invoice",
  "Order List",
  "Pending Order",
  "Complete Order",
  "Cancel Order",
  "All Reservations",
  "Add Booking",
  "Unavailable today",
  "Purchase Item",
  "Add Purchase",
  "Purchase Return",
  "Return Invoice",
  "Supplier Manage",
  "Supplier Ledger",
  "Stock out ingredients",
  "Add Category",
  "Category List",
  "Add Food",
  "Food List",
  "Menu Type",
  "Add Ons",
  "Ingredient Stock List",
  "Stock Out Ingredient",
  "Set Production Unit",
  "Point Setting",
  "Customer Point List",
  "Production Set List",
  "Add Production",
  "Permission Setup",
  "Add Role",
  "Role List",
  "User Access Role",
  "Add User",
  "User List",
  "Purchase Report",
  "Stock Report (Food Item)", 
  "Stock Report (Kitchen)", 
  "Delevery Type Sale Report", 
  "Sale Report",
  "Waiter Sale Report",
  "Service Charge Report",
  "Sale Report Cashie",
  "Item Sales Report",
  "Cash Register Report",
  "Sale Report Filtering",
  "Sale By Date",
  "Sale By Table",
  "Commission Report",
  "Unit Measurement",
  "Ingredients",
  "Kitchen List",
  "Printers",
  "Table & Floor Manage",
  "All Table-QR",
  "Add Customers",
  "Customer Type",
  "Commission Setup",
  "Designation",
  "Addexpense Item",
  "Add Expense",
  "Add Employee",
  "Manage Employee",
  "Department",
  "Division",
  "Holiday",
  "Leave Type",
  "Leave Application",
  "Packaging Food",
  "Purchase Food Waste",
  "Making Food Waste",
  "Common Setting",
  "Sound Setting",
  "Supplier Ledger",
  "Shipping Type",

  
];
const headers = [
  "SL.",
  "Menu Title",
  "Can Access",
  "Can Create",
  "Can Edit",
  "Can Delete",
];
const Add_role = () => {
  const navigate=useNavigate()
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const token = localStorage.getItem("token");
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [roleNameError, setRoleNameError] = useState("");
const [roleDescriptionError, setRoleDescriptionError] = useState("");
  const [formData, setFormData] = useState(
    modules.reduce((acc, module) => {
      acc[module] = {
        can_access: 0,
        can_delete: 0,
        can_create: 0,
        can_edit: 0,
      };
      return acc;
    }, {})
  );
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const handleCheckboxChange = (module, permission) => {
    setFormData({
      ...formData,
      [module]: {
        ...formData[module],
        [permission]: !formData[module][permission],
      },
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

      setRoleNameError("");
  setRoleDescriptionError("");
  
  // Validate inputs
  let isValid = true;
  
  if (!roleName.trim()) {
    setRoleNameError("Role name is required");
    isValid = false;
  }
  
  if (!roleDescription.trim()) {
    setRoleDescriptionError("Description is required");
    isValid = false;
  }
  
  if (!isValid) {
    return;
  }

    const formattedData = Object.entries(formData).map(
      ([module, permissions]) => ({
        module_name:module,
        can_access: permissions.can_access ? 1 : 0,
        can_delete: permissions.can_delete ? 1 : 0,
        can_create: permissions.can_create ? 1 : 0,
        can_edit: permissions.can_edit ? 1 : 0,
      })
    );

    // Combine role name, description, and permissions
    const dataToSend = {
      role_name: roleName,
      role_description: roleDescription,
      permissions: formattedData,
    };

    try {
      const response = await axios.post(
        `${API_BASE_URL}/rolepermission`,
        dataToSend,{headers:{"Authorization":token}}
      );
      console.log(response.data);
      toast.success("Roles added successfully");
      navigate("/rolelist")
     
    } catch (error) {
      console.error("Error sending data:", error);
      toast.error("Failed to add roles");
    }
  };

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
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 nav-container hide-scrollbar h-screen overflow-y-auto">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Add Roles
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
                </div>
            </div>

            <section className="tabledata">
              <div className="w-full mt-10 drop-shadow-md">
                <div>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="mb-11 flex gap-x-7">
                      <label
                        className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="roleName"
                      >
                        Role Name*
                      </label>
                      <input
                        type="text"
                        maxLength={30}
                        name="role name"
                        value={roleName}
                        onChange={(e) => {
                          setRoleName(e.target.value);
                            setRoleNameError("")
                        }}
                        placeholder="Role Name"
                        className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      />
                          {roleNameError && <p className="text-red-500 text-sm mt-1">{roleNameError}</p>}
                    </div>
                    <div className="mb-11 flex gap-x-7">
                      <label
                        className="m-auto w-[300px] text-right text-nowrap text-gray-700 font-semibold mb-2"
                        htmlFor="description"
                      >
                        Description*
                      </label>
                      <textarea
                        cols={200}
                        value={roleDescription}
                        onChange={(e) => {
                          setRoleDescription(e.target.value);
                           setRoleDescriptionError("");
                        }}
                        placeholder="Role Description"
                        className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      ></textarea>
                       {roleDescriptionError && <p className="text-red-500 text-sm mt-1">{roleDescriptionError}</p>}
                    </div>

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
                        {modules.map((module, index) => (
                          <tr key={module}>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              {index + 1}
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <span>{module}</span>
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <input
                                className="size-5 custom-checkbox"
                                type="checkbox"
                                checked={formData[module].can_access}
                                onChange={() =>
                                  handleCheckboxChange(module, "can_access")
                                }
                              />
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <input
                                className="size-5 custom-checkbox"
                                type="checkbox"
                                checked={formData[module].can_create}
                                onChange={() =>
                                  handleCheckboxChange(module, "can_create")
                                }
                              />
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <input
                                className="size-5 custom-checkbox"
                                type="checkbox"
                                checked={formData[module].can_edit}
                                onChange={() =>
                                  handleCheckboxChange(module, "can_edit")
                                }
                              />
                            </td>
                            <td className="py-2 px-4 border border-[#4CBBA1]">
                              <input
                                className="size-5 custom-checkbox"
                                type="checkbox"
                                checked={formData[module].can_delete}
                                onChange={() =>
                                  handleCheckboxChange(module, "can_delete")
                                }
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    <div className="text-center mt-4 flex justify-between pb-5">
                      <span></span>
                      <HasPermission module="Add Role" action="create">
                      <button
                        type="submit"
                        className=" bg-[#0f044a] text-[#fff] border-[2px] border-zinc-300 rounded-xl cursor-pointer  px-7 py-3"
                      >
                        Submit
                      </button>
                      </HasPermission>
                     
                    </div>
                  </form>
                </div>
              </div>
            </section>
          </div>
        </section>
      </div>
    </>
  );
};

export default Add_role;
