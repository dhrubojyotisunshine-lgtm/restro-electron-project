import React, { useState } from "react";

const TableModal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  const handleBackdropClick = (e) => {
    // Close only if the user clicked directly on the backdrop (not inside the modal)
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none"
        onClick={handleBackdropClick}
      >
        {/* Modal container */}
        <div className="w-auto px-20">
          <div className="py-4 bg-white rounded-md shadow-md border-[1px] border-[#1C1D3E]">
            {/* Header */}
            <div className="flex py-5 px-4 justify-between items-center border-b-[1px] border-black">
              <h2 className="text-xl font-semibold">{title}</h2>
              <button
                type="button"
                className="bg-red-500 text-white px-4 py-2 rounded mr-2"
                onClick={onClose}
              >
                X
              </button>
            </div>
            {/* Body */}
            <div className="p-4">{children}</div>
          </div>
        </div>
      </div>

      {/* Dimmed overlay */}
      <div className="opacity-55 fixed inset-0 z-40 bg-slate-800"></div>
    </>
  );
};


export default TableModal;
