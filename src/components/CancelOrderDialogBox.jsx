import React from "react";

const CancelOrderDialogBox = ({ isOpen, onClose, order_id }) => {
  if (!isOpen) return null;
  return (
    <>
      <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none ">
        <div className=" w-1/2 px-20 ">
          <div className=" py-4  bg-white  rounded-md shadow-md border-[1px] border-[#1C1D3E]">
            <div className="flex  py-5 px-4 justify-between items-center border-b-[1px] border-black">
              <h2 className="text-xl  font-semibold">Cancle Order</h2>
              <button
                onClick={onClose}
                className="text-white bg-[#FB3F3F] px-2 hover:scale-105 font-bold"
              >
                X
              </button>
            </div>

            <div className=" flex  justify-around mt-11 mb-6">
              <div className="">
                <div className=" flex  gap-x-24">
                  <h1 className=" font-bold">Order Id :</h1>

                  <span className=" float-right">{order_id}</span>
                </div>
                <div className=" flex gap-x-5">
                  <h1 className=" font-bold">Cancle Reasion :-</h1>

                  <textarea
                    rows={7}
                    cols={20}
                    id="message"
                    name="message"
                    required
                    placeholder="Note..."
                    className=" ring-1 ring-[#4CBBA1] rounded-md px-4 outline-none focus:ring-2  text-black py-1 mt-2"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)} // Update reason state on change
                  ></textarea>
                </div>
                <div className=" mt-5">
                  <button
                    onClick={() => {
                      cancelOrder(order_id);
                    }}
                    className="  float-end bg-[#4CBBA1] text-white px-10 py-2 font-semibold rounded"
                  >
                    Confirm Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className=" opacity-5 fixed inset-0 z-40 bg-slate-800"></div>
    </>
  );
};

export default CancelOrderDialogBox;
