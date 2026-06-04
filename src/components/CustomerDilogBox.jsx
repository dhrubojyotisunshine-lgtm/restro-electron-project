import React from 'react'

const CustomerDilogBox = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto">
    <div className="fixed inset-0 bg-black opacity-50" onClick={onClose}></div>
    <div className="bg-white rounded-lg shadow-lg w-11/12 md:w-1/3 lg:w-1/2 p-2 z-50">
      <div className="flex justify-between items-center border-b pb-2">
        <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
        <button
          onClick={onClose}
          className="text-gray-600 hover:text-red-600 transition duration-200"
          aria-label="Close"
        >
          &times;
        </button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
  )
}

export default CustomerDilogBox
