import React, { useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { AiOutlineSwap } from "react-icons/ai";
import { FaRegEye } from "react-icons/fa";
const CounterList = () => {
  const ActionButtion = [
    { btn: "Copy" },
    { btn: "CSV" },
    { btn: "Excel" },
    { btn: "PDF" },
    { btn: "Column Visiblity" },
  ];
  const headers = ["SL.", "Counter Number", "Action"];

  const data = [
    {
      CounterNumber: "1",
    },
    {
      CounterNumber: "2",
    },
    {
      CounterNumber: "9",
    },
    {
      CounterNumber: "8",
    },
    {
      CounterNumber: "2",
    },
    {
      CounterNumber: "5",
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
          <div className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Counter List
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              </div>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <section className="tablebutton">
                <form action="">
                  <div className="  flex items-center gap-x-10">
                    <label htmlFor="" className=" font-semibold ">
                      Counter Number
                    </label>
                    <input
                      placeholder="Enter Number.."
                      type="number"
                      className="shadow border border-[#4CBBA1]  rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outlin"
                    />

                    <button
                      type="submut"
                      className="h-[40px] w-[143px] bg-[#1C1D3E] rounded text-white"
                    >
                      Add Counter
                    </button>
                  </div>
                </form>
              </section>
            </div>

            {/* Table data */}
            <section className="tabledata">
              <div className="w-full mt-10 drop-shadow-[#4CBBA1]">
                <div>
                  <table className="min-w-full bg-white text-center">
                    <thead>
                      <tr>
                        {headers.map((header, index) => (
                          <th
                            key={index}
                            className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm text-center"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {data.map((row, index) => (
                        <tr key={index} className="border-b text-center">
                          <td className="py-2 px-4 border border-[#4CBBA1] text-center">
                            {index + 1}
                          </td>
                          <td className="py-2 px-4 border border-[#4CBBA1] text-center">
                            {row.CounterNumber}
                          </td>
                          <td className="py-2 px-4 border border-[#4CBBA1] text-center">
                            <div className="font-bold flex justify-center">
                              <Tooltip message="Check Status">
                                <button className="bg-[#1C1D3E] p-1 rounded-sm text-white hover:scale-105">
                                  <AiOutlineSwap />
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
          </div>
        </section>
      </div>
    </>
  );
};

export default CounterList;
