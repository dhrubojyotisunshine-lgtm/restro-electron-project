import React, { useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { AiOutlineStop, AiOutlineCheckCircle } from "react-icons/ai";

import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import useFullScreen from "../../components/useFullScreen";

const PosSetting = () => {
  const [modalType, setModalType] = useState(null);
  const [waiterChecked, setWaiterChecked] = useState(false);
  const [tableChecked, setTableChecked] = useState(false);
  const [cookingTimeChecked, setCookingTimeChecked] = useState(false);
  const [tableMapChecked, setTableMapChecked] = useState(false);
  const [isSoundEnableChecked, setIsSoundEnableChecked] = useState(false);

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [QwaiterChecked, setQwaiterChecked] = useState(false);
  const [QtableChecked, setQtableChecked] = useState(false);
  const [QcookingTimeChecked, setQcookingTimeChecked] = useState(false);
  const [QtableMapChecked, setQtableMapChecked] = useState(false);
  const [QisSoundEnableChecked, setQisSoundEnableChecked] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [enableModal, setEnableModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const [isOpen, setOpen] = useState(true);
  const Modal = ({ type }) => {
    return (
      <div className="fixed inset-0 bg-gray-600  bg-opacity-10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6  w-1/3  border-[2px] border-[#4CBBA1] ">
          <div className="text-center">
            <AiOutlineStop className="text-[#FB3F3F] text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Disable</h2>
            <p className="text-gray-600 mb-6">
              Make This Field Is Optional On Pos Page.
            </p>
            <button
              onClick={() => closeModal(type)}
              className="bg-[#4CBBA1] text-white px-6 py-2 rounded-md text-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  const Modal2 = ({ type }) => {
    return (
      <div className="fixed inset-0 bg-gray-800 bg-opacity-10 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-1/3  border-[2px] border-[#4CBBA1] ">
          <div className="text-center">
            <AiOutlineCheckCircle className="text-[#4CBBA1] text-6xl mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Enable</h2>
            <p className="text-gray-600 mb-6">
              Enable This Option to show on POS Invoice.
            </p>
            <button
              onClick={() => closeModal(type)}
              className="bg-[#4CBBA1] text-white px-6 py-2 rounded-md text-lg"
            >
              OK
            </button>
          </div>
        </div>
      </div>
    );
  };

  //   const handleCheckboxChange = (event) => {
  //     setIsChecked(event.target.checked);
  //     if (event.target.checked) {
  //       setShowModal(true);
  //     } else {
  //       setEnableModal(true);
  //     }
  //   };

  const handleCheckboxChange = (type, event) => {
    const isChecked = event.target.checked;
    switch (type) {
      case "waiter":
        setWaiterChecked(isChecked);
        break;
      case "table":
        setTableChecked(isChecked);
        break;
      case "cookingTime":
        setCookingTimeChecked(isChecked);
        break;
      case "tableMap":
        setTableMapChecked(isChecked);
        break;
      case "isSoundEnable":
        setIsSoundEnableChecked(isChecked);
        break;
      default:
        break;
    }
    // Set modal type based on whether checkbox is checked or unchecked
    setModalType(isChecked ? "enable" : "disable");
  };

  const closeModal = (type) => {
    switch (type) {
      case "waiter":
        break;
      case "table":
        setTableChecked(false);
        break;
      case "cookingTime":
        setCookingTimeChecked(false);
        break;
      case "tableMap":
        setTableMapChecked(false);
        break;
      case "isSoundEnable":
        setIsSoundEnableChecked(false);
        break;
      default:
        break;
    }
    setModalType(null); // Reset modal type to null to close the modal
  };

  const renderModal = (type) => {
    if (modalType === "enable") {
      return <Modal2 type={type} closeModal={closeModal} />;
    }
    if (modalType === "disable") {
      return <Modal type={type} closeModal={closeModal} />;
    }
    return null;
  };

  const handleEnableModalClose = () => {
    setEnableModal(false);
    setIsChecked(false);
  };

  const handleShowModalClose = () => {
    setShowModal(false);
    setIsChecked(true);
  };
  return (
    <>
      <div className="main_div bg-white ">
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
                Complete Order
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              </div>
            </div>
            {/* Search Bar */}
            <div className=" mt-11  w-full">
              <div>
                <h1 className="text-[#1C1D3E] font-bold text-xl mb-7">
                  Place Order Setting
                </h1>
                <div className=" flex justify-evenly items-center  w-1/2">
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="" className=" font-serif text-md ">
                      Waiter
                    </label>
                    <input
                      type="checkbox"
                      checked={waiterChecked}
                      onChange={(e) => handleCheckboxChange("waiter", e)}
                      className="custom-checkbox2"
                    />
                    {waiterChecked && renderModal("waiter")}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Table</label>
                    <input
                      type="checkbox"
                      checked={tableChecked}
                      onChange={(e) => handleCheckboxChange("table", e)}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Cooking Time</label>
                    <input
                      type="checkbox"
                      checked={cookingTimeChecked}
                      onChange={(e) => handleCheckboxChange("cookingTime", e)}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Table Map</label>
                    <input
                      type="checkbox"
                      checked={tableMapChecked}
                      onChange={(e) => handleCheckboxChange("tableMap", e)}
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Is Sound Enable</label>
                    <input
                      type="checkbox"
                      checked={isSoundEnableChecked}
                      onChange={(e) => handleCheckboxChange("isSoundEnable", e)}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                </div>
              </div>

              <div className=" mt-11">
                <h1 className="text-[#1C1D3E] font-bold text-xl mb-7">
                  Quick Order Setting
                </h1>
                <div className=" flex justify-evenly items-center  w-1/2">
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="" className=" font-serif text-md ">
                      Waiter
                    </label>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Table</label>
                    <input
                      type="checkbox"
                      className="custom-checkbox2"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Cooking Time</label>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Table Map</label>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                  <div className=" flex items-center gap-x-3">
                    <label htmlFor="">Is Sound Enable</label>
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={handleCheckboxChange}
                      className="custom-checkbox2"
                    />
                    {enableModal && (
                      <Modal setEnableModal={handleEnableModalClose} />
                    )}
                    {showModal && (
                      <Modal2 setShowModal={handleShowModalClose} />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default PosSetting;
