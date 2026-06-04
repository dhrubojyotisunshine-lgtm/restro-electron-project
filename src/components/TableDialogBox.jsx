import React from "react";
const TableDialogBox = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div>
      <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
        <div className=" w-auto px-20 ">
          <div className=" py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
            <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
              <h2 className="text-xl  font-semibold">{title}</h2>
              <button
                onClick={onClose}
                className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
              >
                X
              </button>
            </div>
            <div className="">{children}</div>
          </div>
        </div>
      </div>
      <div className=" opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
    </div>
  );
};

export default TableDialogBox;
