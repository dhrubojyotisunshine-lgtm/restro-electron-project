import React, { useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";

import { FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";

const FoodVariant = () => {
  const ActionButtion = [
    { btn: "Copy" },
    { btn: "CSV" },
    { btn: "Excel" },
    { btn: "PDF" },
    { btn: "Column Visiblity" },
  ];
  const headers = ["SL.", "Varient Name", "Food Name", "Action"];

  const data = [
    {
      VariantName: "Burger",
      FoodName: "Burger",
    },
    {
      VariantName: "Burger",
      FoodName: "saled Burger",
    },
    {
      VariantName: "Non-Vegr",
      FoodName: "Hot Dog",
    },
    {
      VariantName: "veg",
      FoodName: "Mix Veg",
    },
    {
      VariantName: "Tea",
      FoodName: "Ice Tea",
    },
    {
      VariantName: "pizza",
      FoodName: "Cheez Pizza",
    },
  ];

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
  const [isOpen, setOpen] = useState(true);
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
                Food Variant
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              </div>
            </div>

            <div className=" flex justify-between mt-11">
              <span></span>

              <button
                className=" bg-[#4CBBA1] h-[46px] w-[165px] rounded-sm  flex justify-center items-center
               gap-x-1 text-white font-semibold"
              >
                <IoIosAddCircleOutline className=" font-semibold text-lg" />
                Add Variant
              </button>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <section className=" tablebutton">
                <div className="orderButton  flex justify-evenly flex-wrap gap-x-5   ">
                  <div className="flex items-center space-x-2">
                    <label className="text-gray-900 pr-1">Display</label>
                    <div className="relative flex items-baseline border-[1px] border-[#4CBBA1] p-1 rounded">
                      <h1>05 X</h1>
                      <select className="appearance-none w-16 pl-3 pr-8 py-1 rounded-md text-gray-700 focus:outline-none ">
                        <option>5</option>
                        <option>10</option>
                        <option>20</option>
                        <option>50</option>
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
                    <h1 className=" ">Recorde per pages</h1>
                  </div>

                  {ActionButtion.map((val, index) => (
                    <>
                      <div className="">
                        <button className="  hover:bg-[#1C1D3E] text-[#000] hover:scale-110 duration-300 hover:text-white border-[2px] border-zinc-300 rounded-md py-2  px-11 ">
                          {" "}
                          <div className="">
                            <span>{val.btn}</span>
                          </div>{" "}
                        </button>
                      </div>
                    </>
                  ))}

                  <div className="flex m-auto   px-4   rounded-md border-[1px] border-gray-900">
                    <button className="px-4 text-[#0f044a] text-sm">
                      <FaMagnifyingGlass />
                    </button>
                    <input
                      placeholder="Search Product..."
                      type="search"
                      className="py-2 rounded-md text-gray-700 leading-tight focus:outline-none"
                    />
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
                      {data.map((row, index) => (
                        <tr key={index}>
                          <td className="py-2 px-4 border border-[#4CBBA1]">
                            {index + 1}
                          </td>

                          <td className="py-2 px-4 border border-[#4CBBA1]">
                            {row.VariantName}
                          </td>

                          <td className="py-2 px-4 border border-[#4CBBA1]">
                            {row.FoodName}
                          </td>
                          <td className="py-2 px-4 border border-[#4CBBA1]">
                            <div className="flex justify-center gap-x-2 font-bold">
                              <Tooltip message="Edit">
                                <button className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105">
                                  <FaRegEdit />
                                </button>
                              </Tooltip>
                              <Tooltip message="Cancel Order">
                                <button className="bg-[#FB3F3F] p-1 rounded-sm text-white hover:scale-105">
                                  <FaRegTrashCan />
                                </button>
                              </Tooltip>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </section>
            <div className="flex justify-between mt-7">
              <h1>Showing 1 to 6 of 100 entries</h1>
              {/* navigation */}
              <div>
                <nav
                  aria-label="Page navigation "
                  className=" border-[1px] border-black rounded-md"
                >
                  <ul class="inline-flex -space-x-px text-base h-10">
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 ms-0 leading-tight text-gray-900 bg-white border border-e-0 border-gray-300 rounded-s-lg hover:bg-gray-100 hover:text-gray-700"
                      >
                        Previous
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 "
                      >
                        1
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 "
                      >
                        2
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        aria-current="page"
                        class="flex items-center justify-center px-4 h-10 text-white border border-gray-300 bg-[#1C1D3E] hover:bg-blue-100"
                      >
                        3
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 "
                      >
                        4
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 leading-tight text-gray-500 bg-white border border-gray-300 hover:bg-gray-100 hover:text-gray-700 "
                      >
                        5
                      </a>
                    </li>
                    <li>
                      <a
                        href="#"
                        class="flex items-center justify-center px-4 h-10 leading-tight text-gray-900 bg-white border border-gray-300 rounded-e-lg hover:bg-gray-100 hover:text-gray-700"
                      >
                        Next
                      </a>
                    </li>
                  </ul>
                </nav>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default FoodVariant;
