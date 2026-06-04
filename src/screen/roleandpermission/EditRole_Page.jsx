import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { toast } from "react-toastify";
import useFullScreen from "../../components/useFullScreen";
const EditRole_Page = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const { id } = useParams(); // Get the ID from the URL
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [permissions, setPermissions] = useState([]);
  const[createby,setCreateby]=useState()
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const navigate = useNavigate();
  useEffect(() => {
    // Fetch data for the given ID when the component mounts
    axios
      .get(`${API_BASE_URL}/rolepermission/${id}`)
      .then((response) => {
        const roleData = response.data.data.role;
        const permissionsData = response.data.data.permissionsQueryResult;

        setRoleName(roleData.role_name);
        setCreateby(roleData.create_by);
        setRoleDescription(roleData.role_description);
        setPermissions(permissionsData);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [id]);

  const handleCheckboxChange = (moduleId, permissionType) => {
    setPermissions((prevPermissions) =>
      prevPermissions.map((permission) =>
        permission.id === moduleId
          ? {
              ...permission,
              [permissionType]: permission[permissionType] ? 0 : 1,
            }
          : permission
      )
    );
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();

    const updatedRoleData = {
      role_name: roleName,
      role_description: roleDescription,
      permissions: permissions,
      createby:createby
    };

    // PUT request to update the data
    axios
      .put(`${API_BASE_URL}/rolepermission/${id}`, updatedRoleData)
      .then((response) => {
        console.log("ress",response)
        console.log("Role updated successfully:",updatedRoleData);
        toast.success("Roles Update Sucessfully..");
        navigate("/rolelist");
        // Optionally, navigate to another page or show a success message
      })
      .catch((error) => {
        console.error("Error updating the role:", error);
        toast.error("Roles Update Failed..");
      });
  };

  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div className={isOpen === false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}>
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="content_div w-full ml-4 pr-7 mt-4 nav-container hide-scrollbar h-screen overflow-y-auto">
            <div className="active_tab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                Edit Role page
              </h1>

              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>

            <div>
              <h2 className=" text-center mt-11  text-2xl ">Edit Role</h2>
              {id ? (
                <section className="tabledata p-10">
                  <div className="w-full mt-10 drop-shadow-md">
                    <div>
                      <form className="space-y-4" onSubmit={handleFormSubmit}>
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
                            onChange={(e) => setRoleName(e.target.value)}
                            placeholder="Role Name"
                            className="shadow border border-[#4CBBA1] w-full rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
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
                            onChange={(e) => setRoleDescription(e.target.value)}
                            placeholder="Description"
                            className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          ></textarea>
                        </div>

                        <table className="min-w-full bg-white text-center">
                          <thead>
                            <tr>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                SL.
                              </th>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                Menu Title
                              </th>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                Can Access
                              </th>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                Can Create
                              </th>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                Can Edit
                              </th>
                              <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                                Can Delete
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {permissions.map((permission, index) => (
                              <tr key={permission.id}>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  {index + 1}
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  {permission.module_name}
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <input
                                    className="size-5 custom-checkbox"
                                    type="checkbox"
                                    checked={permission.can_access === 1}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        permission.id,
                                        "can_access"
                                      )
                                    }
                                  />
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <input
                                    className="size-5 custom-checkbox"
                                    type="checkbox"
                                    checked={permission.can_create === 1}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        permission.id,
                                        "can_create"
                                      )
                                    }
                                  />
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <input
                                    className="size-5 custom-checkbox"
                                    type="checkbox"
                                    checked={permission.can_edit === 1}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        permission.id,
                                        "can_edit"
                                      )
                                    }
                                  />
                                </td>
                                <td className="py-2 px-4 border border-[#4CBBA1]">
                                  <input
                                    className="size-5 custom-checkbox"
                                    type="checkbox"
                                    checked={permission.can_delete === 1}
                                    onChange={() =>
                                      handleCheckboxChange(
                                        permission.id,
                                        "can_delete"
                                      )
                                    }
                                  />
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>

                        <div className="text-center mt-4 flex justify-between pb-5">
                          <span></span>
                          <button
                            type="submit"
                            className="bg-[#0f044a] text-[#fff] border-[2px] border-zinc-300 rounded-xl cursor-pointer px-7 py-3"
                          >
                            Submit
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </section>
              ) : (
                <p>Loading...</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
    // edit data
  );
};

export default EditRole_Page;
