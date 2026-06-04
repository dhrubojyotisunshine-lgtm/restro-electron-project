import React from 'react'

const SplitModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
  return (
   

    <div id="modal" className="fixed inset-0 flex items-start justify-center bg-black bg-opacity-50  p-10">
    <div className="bg-white rounded-lg shadow-lg  w-full">
        <div className="p-4 border-b flex justify-between">
            <h2 className="text-lg font-semibold">Split Bill for Menu Items</h2>
            <button
               onClick={onClose}
               className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold">X</button>
        </div>
        <div  className=' flex gap-x-10 p-10'>{children}</div>
    </div>
</div>
  )
}

export default SplitModal
