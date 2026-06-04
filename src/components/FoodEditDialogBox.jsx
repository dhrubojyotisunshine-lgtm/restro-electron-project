import React from "react";
const FoodEditDialogBox = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black bg-opacity-50" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-[90%] max-w-[500px] bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-300">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-2">{children}</div>
      </div>
    </div>
  );
};


export default FoodEditDialogBox;
