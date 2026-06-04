import React, { useState } from "react";

const CalculatorModal = ({ closeCalculator }) => {
    const [display, setDisplay] = useState("");

    const appendToDisplay = (value) => {
        setDisplay((prev) => prev + value);
    };

    const calculateResult = () => {
        try {
            setDisplay(eval(display).toString());
        } catch (error) {
            setDisplay("Error");
        }
    };

    const clearDisplay = () => {
        setDisplay("");
    };

    return (
        <div className="fixed inset-0 flex  justify-end  items-center bg-black bg-opacity-50 z-[999]">
            <div className="bg-white p-5 rounded shadow-lg w-80">
                <span onClick={closeCalculator} className="cursor-pointer text-red-500 float-right text-2xl">
                    &times;
                </span>
                <h2 className="text-lg font-bold text-center mb-2">Calculator</h2>
                <input
                    type="text"
                    value={display}
                    disabled
                    className="border p-2 w-full mb-2 text-right"
                />
                <div className="grid grid-cols-4 gap-2">
                    {["1", "2", "3", "+", "4", "5", "6", "-", "7", "8", "9", "*", "0", "=", "C", "/"].map((item) => (
                        <button
                            key={item}
                            onClick={() => {
                                if (item === "=") {
                                    calculateResult();
                                } else if (item === "C") {
                                    clearDisplay();
                                } else {
                                    appendToDisplay(item);
                                }
                            }}
                            className="p-4 bg-gray-200 rounded hover:bg-gray-300 text-lg"
                        >
                            {item}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CalculatorModal;
