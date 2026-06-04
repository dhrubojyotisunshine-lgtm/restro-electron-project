import React, { useState } from "react";
import { AiOutlineStop, AiOutlineCheckCircle } from "react-icons/ai";

const Modal = ({ setEnableModal }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6  w-1/3  border-[2px] border-[#4CBBA1] ">
        <div className="text-center">
          <AiOutlineStop className="text-[#FB3F3F] text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Disable</h2>
          <p className="text-gray-600 mb-6">
            Make This Field Is Optional On Pos Page.
          </p>
          <button
            onClick={() => setEnableModal(false)}
            className="bg-[#4CBBA1] text-white px-6 py-2 rounded-md text-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal2 = ({ setShowModal }) => {
  return (
    <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-1/3  border-[2px] border-[#4CBBA1] ">
        <div className="text-center">
          <AiOutlineCheckCircle className="text-[#4CBBA1] text-6xl mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Enable</h2>
          <p className="text-gray-600 mb-6">
            Enable This Option to show on POS Invoice.
          </p>
          <button
            onClick={() => setShowModal(false)}
            className="bg-[#4CBBA1] text-white px-6 py-2 rounded-md text-lg"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

const ProductCard = () => {
  const [showModal, setShowModal] = useState(false);
  const [enableModal, setEnableModal] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleCheckboxChange = (event) => {
    setIsChecked(event.target.checked);
    if (event.target.checked) {
      setShowModal(true);
    } else {
      setEnableModal(true);
    }
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
    <div className="App space-y-4">
      <label className="inline-flex items-center">
        <input
          type="checkbox"
          className="form-checkbox h-5 w-5 text-blue-600"
          checked={isChecked}
          onChange={handleCheckboxChange}
        />
        <span className="ml-2 text-gray-700">Enable/Disable Modal</span>
      </label>
      {enableModal && <Modal setEnableModal={handleEnableModalClose} />}
      {showModal && <Modal2 setShowModal={handleShowModalClose} />}
    </div>
  );
};

export default ProductCard;
