import React, { useState, useEffect ,useContext} from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import axios from "axios";
import { toast } from "react-toastify";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen"
import { AuthContext } from "../../store/AuthContext";
import { useNavigate } from "react-router-dom";


const PurchaseReturn = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  
const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(true);
  const [suppliers, setSuppliers] = useState([]); // All suppliers
  const [invoices, setInvoices] = useState([]); // Related invoices based on supplier
  const [selectedSupplier, setSelectedSupplier] = useState(""); // Selected supplier
  const [selectedInvoice, setSelectedInvoice] = useState(""); // Selected invoice
  const [returnData, setReturnData] = useState([]);
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  // Fetch suppliers when component loads
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



  // Fetch invoice data based on selected supplier
  const fetchInvoices = async (suplierID) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchasereturnsearch`, {
        params: { suplierID },
        headers: { Authorization: token },
      });
      setInvoices(response.data.data); // Update invoices based on supplier
    } catch (error) {
      console.error("Error fetching invoices:", error);
    }
  };

  // Handle supplier change
  const handleSupplierChange = (e) => {
    const supplierId = e.target.value;
    setSelectedSupplier(supplierId);
    setSelectedInvoice(""); // Reset invoice selection when supplier changes
    fetchInvoices(supplierId); // Fetch related invoices for the selected supplier
  };

  // Handle search button click
  const handleSearch = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/purchasereturn`, {
        params: {
          supplierID: selectedSupplier,
          invoiceID: selectedInvoice,
        },
        headers: { Authorization: token },
      });
      setReturnData(response.data.data.purchaseDetails);
      console.log("The result data is", response.data.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async () => {
    if (!returnData.length || !returnData[0].reason) {
      toast.error("Please select a reason for return");
      return;
    }
  
    const returnpurchasedetail = {
      supplier_id: selectedSupplier,
      poNO: selectedInvoice,
      return_date: new Date().toLocaleDateString(), // returns a string in the format "MM/dd/yyyy"
      totalamount: returnData.reduce(
        (acc, item) => acc + item.price * (item.return_quantity || 0),
        0
      ), 
       totaldiscount: 0,
      return_reason: returnData[0].reason, // Shared reason for all items
    };
  
    const itemDetails = returnData.map((item) => ({
      product_id: item.ingredient,
      product_rate: item.price,
      total_qntt: item.return_quantity || 0,
      total_price: item.price * (item.return_quantity || 0),
    }));
  
    const requestData = {
      returnpurchasedetail: [returnpurchasedetail],
      itemdetails: itemDetails,
    };
  
    console.log("Request Data:", requestData);
  
    try {
      const response = await axios.post(
        `${API_BASE_URL}/returnitem`,
        requestData,
        { headers: { Authorization: token } }
      );
      toast.success("Item Returned Successfully");
       // Redirect after success
       navigate("/return-invoice"); 
      setReturnData([]);
    } catch (error) {
      console.error("Error submitting return data:", error);
      toast.error("Something went wrong.");
    }
  };
  

  const handleInputChange = (e, index) => {
    const { name, value } = e.target;
    setReturnData((prevData) =>
      prevData.map((item, i) =>
        i === index ? { ...item, [name]: value } : item
      )
    );
  };
  const calculateTotalReturnAmount = () => {
    return returnData.reduce(
      (total, item) => total + item.price * (item.return_quantity || 0),
      0
    );
  };
  // Fetch suppliers on component mount
  useEffect(() => {
    fetchSuppliers();
  }, []);

  console.log("return data ",returnData)

  return (
    <>
      <div className="main_div ">
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
                Purchase Return
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
              
                <MdOutlineZoomOutMap  onClick={toggleFullScreen} className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl" />              </div>
            </div>

            <div className=" grid grid-cols-3 mt-11 border-[1px] border-[#4CBBA1] p-5">
              <div className="mb-4 flex  gap-x-5 justify-center items-center">
                <label className="block text-nowrap text-gray-700  w-[100px]  font-semibold mb-2">
                  Supplier Name*
                </label>
                <select
                  value={selectedSupplier}
                  onChange={handleSupplierChange}
                  className="shadow border border-[#4CBBA1] rounded py-2 px-3  text-gray-700 leading-tight focus:outline-none focus:shadow-outline  mx-2"
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
                <label className="block text-nowrap text-gray-700  w-[100px]  font-semibold mb-2">
                  Invoice No.*
                </label>
                <select
                  value={selectedInvoice}
                  onChange={(e) => setSelectedInvoice(e.target.value)}
                  className="shadow border border-[#4CBBA1] rounded py-2 px-3  text-gray-700 leading-tight focus:outline-none focus:shadow-outline mx-2"
                  id="parentCategory"
                >
                  <option value="">Select Invoice</option>
                  {invoices.map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      {invoice.invoiceid}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4 flex  gap-x-5 justify-center items-center">
                <button
                  onClick={handleSearch}
                  className="bg-[#4CBBA1] text-white font-semibold rounded h-[40px] w-[146px]"
                >
                  Search
                </button>
              </div>
            </div>

            <section className="tabledata pr-4 pl-4">
              <div className="w-full mt-10 border-[1px] border-[#4CBBA1] drop-shadow-[#4CBBA1]">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr>
                      <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                        Ingredient Name
                      </th>
                      <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                        Purchase Qty
                      </th>
                      <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                        Return Qty
                      </th>
                      <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                        Price
                      </th>
                      <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {returnData.map((item, index) => (
                      <tr className="border-b text-center" key={index}>
                        <td className="py-2 px-4 border border-[#4CBBA1]">
                          {item.ingredient_name}
                        </td>
                        <td className="py-2 px-4 border border-[#4CBBA1]">
                          {item.purchase_quantity}
                        </td>
                        <td className="border border-[#4CBBA1]">
                          <input
                            type="number"
                            value={item.return_quantity || 0}
                            onChange={(e) => handleInputChange(e, index)}
                            name="return_quantity"
                            className="shadow w-full appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </td>
                        <td className="py-2 px-4 border border-[#4CBBA1]">
                          {item.price}
                        </td>
                        <td className="py-2 px-4 border border-[#4CBBA1]">
                          {item.price * item.return_quantity}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="mt-2 p-3">
                <textarea
  cols={70}
  name="reason"
  placeholder="Reason For Return *"
  value={returnData[0]?.reason || ""} // Ensure controlled input
  onChange={(e) => handleInputChange(e, 0)}
  className="shadow w-full border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
/>
                </div>
                <div
                  className=" flex justify-between
p-5"
                >
                  <span></span>{" "}
                  <HasPermission module="Purchase Return" action="create">
                    <button
                      onClick={handleSubmit}
                      className="bg-[#1C1D3E] p-2 rounded-md text-white mt-9 hover:scale-105"
                    >
                      Return
                    </button>
                  </HasPermission>
                </div>
              </div>
              <h1 className="font-bold mt-5 mb-4 pr-3 text-right w-full">
                Total Return Amount :- ₹{calculateTotalReturnAmount()}
              </h1>
            </section>
          </div>
        </section>
      </div>
    </>
  );
};

export default PurchaseReturn;
