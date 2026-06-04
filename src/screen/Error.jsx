import React, { useState } from "react";
import Nav from "../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaMagnifyingGlass } from "react-icons/fa6";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { FaRegEye, FaRegEdit } from "react-icons/fa";
import { IoDocumentTextOutline, IoWalletOutline } from "react-icons/io5";

const Error = () => {
  const [isOpen, setOpen] = useState(false);
  return (
    <>
      <div className="main_div bg-slate-200  ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : "nav-container hide-scrollbar h-screen overflow-y-auto"}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
        </section>
        <div className=" h-screen font-bold text-3xl  flex items-center justify-center text-black">
          Sorry.. We are Currenty Working On this Page...
        </div>
      </div>
    </>
  );
};

export default Error;
