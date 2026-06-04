import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { FaRegEdit } from "react-icons/fa";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import DialogBox from "../../components/DialogBox";
import { toast } from "react-toastify";
//<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< NO NEED TO USE THIS PAGE>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>
const actionButtons = [
    { btn: "Copy" },
    { btn: "CSV" },
    { btn: "Excel" },
    { btn: "PDF" },
    { btn: "Column Visibility" },
  ];
  const headers = ["SL.", "Menu Title", "Page URL", "Module","Parent Menu","Action"];
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
  
const Premission_setup = () => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const [isOpen, setOpen] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [data,setData]=useState([])
  const [searchName, setSearchName] = useState("");

  
  const selectPage = (page) => {
    if (page > 0 && page <= Math.ceil(data.length / itemsPerPage)) {
      setCurrentPage(page);
    }
  };
  const handleItemsPerPageChange = (e) => {
    setItemsPerPage(Number(e.target.value));
    setCurrentPage(1); // Reset to first page when items per page changes
  };

  const getmenutype=()=>{
    axios.get(`${API_BASE_URL}/menuitems`).then((response) => {
        setData(response.data.data)
        }).catch((error) => {
            console.error(error);
            });

  }



 

useEffect(()=>{
    getmenutype()
})




  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div className={`${!isOpen ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="content_div w-full ml-4 pr-7 mt-4">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
               
Permission Setup
              </h1>
              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
               
              <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />
              </div>
            </div>
            <div className="flex justify-between mt-11">
              <span></span>
              <button
                // onClick={() => setMenuModal(true)}
                className="bg-[#4CBBA1] h-[46px] text-nowrap w-[200px] rounded-sm flex justify-center items-center gap-x-1 text-white font-semibold"
              >
                <IoIosAddCircleOutline className="font-semibold text-lg" />
                Add Menu Item
              </button>
            </div>
            {/* Search Bar */}
            <div className="mt-11 w-full">
              <section className="tablebutton">
                <div className="orderButton flex flex-wrap justify-center sm:justify-evenly gap-y-4 gap-x-5">
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-900 pr-1">Display</label>
                    <div className="relative flex items-baseline border-[1px] border-[#4CBBA1] p-1 rounded">
                      <h1>05 X</h1>
                      <select
                        value={itemsPerPage}
                        onChange={handleItemsPerPageChange}
                        className="appearance-none w-16 pl-3 pr-8 py-1 rounded-md text-gray-700 focus:outline-none"
                      >
                       
                        <option value={10}>10</option>
                        <option value={15}>15</option>
                        <option value={20}>20</option>
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

                  {actionButtons.map((button, index) => (
                    <button
                      key={index}
                      className="hover:bg-[#1C1D3E] text-[#000] hover:scale-110 duration-300 hover:text-white border-[2px] border-zinc-300 rounded-md py-2 px-6 md:px-11"
                    >
                      {button.btn}
                    </button>
                  ))}

                 
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
                                {row.menu_title}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.page_url}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.module}
                              </td>
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                {row.parent_menu_title ?row.parent_menu_title:"No parent menu"}
                              </td>
                              
                              <td className="py-2 px-4 border border-[#4CBBA1]">
                                <div className="flex justify-center gap-x-2 font-bold">
                                  <Tooltip message="Edit">
                                    <button
                                    //   onClick={() =>
                                    //     handleEditClick(row.menutypeid)
                                    //   }
                                      className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105"
                                    >
                                      <FaRegEdit />
                                    </button>

                                    
                                 
                                  </Tooltip>
                                  <Tooltip message="Delete MenuType">
                                    <div>
                                      <button
                                        className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105"
                                        // onClick={() =>
                                        //   handleDeleteClick(row.menutypeid)
                                        // }
                                      >
                                        <FaRegTrashCan />
                                      </button>
                                    </div>
                                  </Tooltip>
                                </div>
                              </td>
                            </tr>
                          ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="py-2 px-4 text-center">
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
                    {[
                      ...Array(Math.ceil(data.length / itemsPerPage)),
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
                        Math.ceil(data.length / itemsPerPage)
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
  )
}

export default Premission_setup
