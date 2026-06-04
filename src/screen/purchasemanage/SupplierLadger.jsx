import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import HasPermission from "../../store/HasPermission";

import axios from "axios";
import useFullScreen from "../../components/useFullScreen";
import { AuthContext } from "../../store/AuthContext";
const SupplierLadger = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [suppliers, setSuppliers] = useState([]); // All suppliers
  const [selectSupplier, setSelectSupplier] = useState();
  const [startData, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [ledgerData, setLedgerData] = useState([]);
const {token}=useContext(AuthContext)
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const fetchSuppliers = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/suppliers`,{
        headers:{
          Authorization: token
        }
      });
      setSuppliers(response.data.data);
    } catch (error) {
      console.error(error);
    }
  };
  const getLadgerData = async (e) => {  
    e.preventDefault();

    try {
      const response = await axios.get(`${API_BASE_URL}/supplierledger`, {
        params: {
          supplier_id: selectSupplier, // Ensure this value is set properly
          startDate: startData, // Start date for filtering
          endDate: endDate, // End date for filtering
        },
      });

      // Assuming response.data contains your expected structure
      setLedgerData(response.data.data);
    } catch (error) {
      console.error("Error fetching ledger data: ", error);
    }
  };
 

  useEffect(() => {
    fetchSuppliers();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div className={`${isOpen == false ? "hidden" : ""}`}>
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Supplier Ledger
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>

            <div className=" mt-11  w-full ">
              <div className="border-[1px] border-[#4CBBA1] rounded-md p-10">
                <form action="" className=" w-auto">
                  <div className="  flex justify-center items-center">
                    <div>
                      <div className="mb-4 flex  gap-x-6 justify-center items-center">
                        <label
                          className="block text-nowrap text-gray-700 w-[300px] text-right  font-semibold mb-2"
                          htmlFor="categoryName"
                        >
                          Select Supplier
                        </label>

                        <select
                          onChange={(e) => {
                            setSelectSupplier(e.target.value);
                          }}
                          className="shadow w-full  border-[#4CBBA1]  border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        >
                          <option value="">Select Supplier</option>
                          {suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.supid}>
                              {supplier.supName}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-4 flex  gap-x-5 justify-center items-center">
                        <label
                          className="block text-nowrap text-gray-700   w-[300px] text-right  font-semibold mb-2"
                          htmlFor="categoryName"
                        >
                          From
                        </label>
                        <input
                          onChange={(e) => {
                            setStartDate(e.target.value);
                          }}
                          className="shadow w-full  border-[#4CBBA1] appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="categoryName"
                          type="date"
                          placeholder="Enter Category Name"
                        />
                      </div>

                      <div className="mb-4 flex  gap-x-5 justify-center items-center">
                        <label
                          className="block text-nowrap text-gray-700  w-[300px]  text-right font-semibold mb-2"
                          htmlFor="categoryName"
                        >
                          To
                        </label>
                        <input
                          onChange={(e) => {
                            setEndDate(e.target.value);
                          }}
                          className="shadow w-full  border-[#4CBBA1] appearance-none border rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          id="categoryName"
                          type="date"
                          placeholder="Enter Category Name"
                        />
                      </div>
                    </div>

                    <div className=" ml-[190px] flex gap-x-4">
                      <div>
                      <HasPermission module="Supplier Ledger" action="access ">
                        <button
                          type="button"
                          onClick={getLadgerData}
                          className="bg-[#4CBBA1] text-white p-2 rounded"
                        >
                          Generate
                        </button>
                        </HasPermission>
                      </div>

                      {/* <div>
                        <button
                          type="button"
                          className="bg-[#1C1D3E] text-white p-2 px-4 rounded"
                        >
                          Print
                        </button>
                      </div> */}
                    </div>
                  </div>
                </form>
              </div>

              <div className="App mt-11">
                <header className="App-header">
                  <h1 className="text-md font-semibold  my-4">
                    Supplier Ledgere Data
                  </h1>
                </header>
              </div>

              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-[#4CBBA1] text-white">
                  <tr>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Date
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Description
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Invoice No.
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Deposit ID
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Debit
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Credit
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
  {
    ledgerData.reduce(
      (acc, item, index) => {
        const debit = Number(item.debit_amount) || 0;
        const credit = Number(item.credit_amount) || 0;
        const balance = (acc.balance || 0) - credit + debit;

        acc.rows.push(
          <tr key={index} className="text-center">
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {new Date(item.date).toLocaleDateString()}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {item.description}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {item.invoice_no}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {item.deposit_no || "Update Later"}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {debit.toFixed(2)}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {credit.toFixed(2)}
            </td>
            <td className="py-2 px-4 border border-[#4CBBA1]">
              {balance.toFixed(2)}
            </td>
          </tr>
        );

        acc.balance = balance;
        return acc;
      },
      { rows: [], balance: 0 }
    ).rows
  }
</tbody>


<tfoot>
  <tr className="text-center font-semibold">
    <td className="py-2 px-4 border border-[#4CBBA1]" colSpan="4">
      Grand Total:
    </td>
    <td className="py-2 px-4 border border-[#4CBBA1]">
      {/* Calculate total debit */}
      {ledgerData
        .reduce((total, item) => total + (Number(item.debit_amount) || 0), 0)
        .toFixed(2)}
    </td>
    <td className="py-2 px-4 border border-[#4CBBA1]">
      {/* Calculate total credit */}
      {ledgerData
        .reduce((total, item) => total + (Number(item.credit_amount) || 0), 0)
        .toFixed(2)}
    </td>
    <td className="py-2 px-4 border border-[#4CBBA1]">
      {/* Display final balance */}
      {ledgerData
        .reduce(
          (balance, item) =>
            balance - (Number(item.credit_amount) || 0) + (Number(item.debit_amount) || 0),
          0
        )
        .toFixed(2)}
    </td>
  </tr>
</tfoot>
              </table>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SupplierLadger;
