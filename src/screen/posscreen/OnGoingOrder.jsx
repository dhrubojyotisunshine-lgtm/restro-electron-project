import React, { useEffect, useRef, useState, useContext } from "react";
import Nav from "../../components/Nav";
import { useReactToPrint } from "react-to-print";
import { NavLink } from "react-router-dom";
import Hamburger from "hamburger-react";
import { TiFlowMerge } from "react-icons/ti";
import { FaRegEdit } from "react-icons/fa";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { IoMdCheckmarkCircleOutline } from "react-icons/io";
import { IoPrintOutline } from "react-icons/io5";
import { PiSplitHorizontalBold } from "react-icons/pi";
import { IoDocumentAttachOutline } from "react-icons/io5";
import { FaRegTrashCan } from "react-icons/fa6";
import DialogBox from "../../components/DialogBox";
import useFullScreen from "../../components/useFullScreen";
import table from "../../assets/images/table.svg";
import { AuthContext } from "../../store/AuthContext";
import {
  FaUserPlus,
  FaHandHoldingUsd,
  FaCalculator,
  FaMoneyCheck,
  FaNetworkWired,
} from "react-icons/fa";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import { MdCropRotate, MdOutlineZoomInMap, MdTableBar } from "react-icons/md";
import { CiSaveDown2 } from "react-icons/ci";
import { FaKitchenSet, FaKeyboard } from "react-icons/fa6";
import { IoQrCodeOutline } from "react-icons/io5";
import { IoMdCart, IoIosMan } from "react-icons/io";
import { RiTodoLine } from "react-icons/ri";
import { CiShop } from "react-icons/ci";
import axios from "axios";
import logo from "../../assets/images/restrologo.png";
import PaynmentDialogBox from "../../components/PaynmentDialogBox";
import InvoiceDialogBox from "../../components/InvoiceDialogBox";
import { ComponentToPrintInvoice } from "../../components/ComponentToPrintInvoice";
import { InvoiceDialogBox2 } from "../../components/InvoiceDialogeBox2";
import { data } from "autoprefixer";
import { toast } from "react-toastify";
import SplitModal from "../../components/SplitModal";
import SplitPaynmentModal from "../../components/SplitPaynmentModal";
import DuemergePaynmentModal from "../../components/DuemergePaynmentModal";
import SplitpayModal from "../../components/SplitpayModal";

const OnGoingOrder = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState();
  const [paynmentModal, setPaynmentModal] = useState(false);
  const [mergepaynmentModal, setMergePaynmentModal] = useState(false);
  const [splitpaynmentModal, setSplitPaynmentModal] = useState(false);
  const [mergeduepaynmentModal, setMergeduepaynmentModal] = useState(false);
  const [paymentData, setPaymentData] = useState([]);
  const [isDeletOpen, setIsDeletOpen] = useState(false);
  const [ongoingData, setOngoingData] = useState({
    nonmergedata: [],
    mergedOrders: [],
  });
  const [invoiceData, setInvoiceData] = useState([]);
  const [billData, setBillData] = useState([]);
  const [cModal5, setCmodal5] = useState(false);
  const [bookTableData, setBookTableData] = useState([]);
  const [cModal4, setCmodal4] = useState(false);
  const [ubookedData, setUnbookedData] = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [splitData, setSplitData] = useState([]);
  const [splitModal, setSplitModal] = useState(false);
  const [invoiceDataModal, setInvoiceDataModal] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState([]);
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [selectedDueOrders, setSelectedDueOrders] = useState([]);
  const token = localStorage.getItem("token");
  //delete id
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const closeModaldelete = () => setIsDeletOpen(false);

  const OrderButtons = [
    { id: 1, title: "New Order", icon: <MdCropRotate />, link: "/order-list" },
    {
      id: 2,
      title: "On Going Order",
      icon: <CiSaveDown2 />,
      // link: "/ongoing-order",
    },

    { id: 4, title: "QR Order", icon: <IoQrCodeOutline />, link: "/qr-order" },
    { id: 5, title: "Online Order", icon: <IoMdCart />, link: "/online-order" },
    { id: 6, title: "Today Order", icon: <RiTodoLine />, link: "/today-order" },
    {
      id: 3,
      title: "Kitchen Status",
      icon: <FaKitchenSet />,
      link: "/kitchen-status",
    },
  ];
  const ButtonsData2 = [
    { id: 1, title: "AddCust.", icon: <FaUserPlus /> },
    { id: 2, title: "Cust.type", icon: <TfiHeadphoneAlt /> },
    { id: 3, title: "Waiter", icon: <IoIosMan /> },
    { id: 4, title: "Shortcut", icon: <FaKeyboard /> },
    { id: 5, title: "Zoom", icon: <MdOutlineZoomInMap /> },
    { id: 6, title: "TableMgmt.", icon: <MdTableBar /> },
    { id: 7, title: "CaseReg.", icon: <FaMoneyCheck /> },
    { id: 8, title: "Calculator", icon: <FaCalculator /> },
    { id: 9, title: "Hold", icon: <FaHandHoldingUsd /> },
    { id: 10, title: "Transaction", icon: <FaNetworkWired /> },
  ];
  // get all booked table
  const getBookTable = () => {
    axios
      .get(`${API_BASE_URL}/bookedtable`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setBookTableData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Cant show table");
      });
  };

  // get all unbooked table

  const getunBookTable = () => {
    axios
      .get(`${API_BASE_URL}/unbookedtable`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setUnbookedData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Cant show table");
      });
  };

  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setCmodal5(false);
        setPaynmentModal(false);
        setInvoiceDataModal(false);
        setIsDeletOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const showPaynment = (order_id) => {
    axios
      .get(`${API_BASE_URL}/getOrderById/${order_id}`)
      .then((response) => {
        console.log(response.data);
        setPaymentData(response.data);
        setPaynmentModal(true);
        getBookTable();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const allPaynmnetMethod = () => {
    axios
      .get(`${API_BASE_URL}/paynmenttype`, {
        headers: {
          Authorization: token,
        },
      })
      .then((response) => {
        const sorted = [...response.data].sort((a, b) =>
          a.payment_method === "Cash Payment"
            ? -1
            : b.payment_method === "Cash Payment"
            ? 1
            : 0
        );
        setPaymentMethod(sorted);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const getOngoing = async () => {
    try {
      const responce = await axios.get(`${API_BASE_URL}/duemergeorder`, {
        headers: {
          Authorization: token,
        },
      });
      console.log(responce.data.data);
      setOngoingData({
        nonmergedata: responce.data.NonMergedOrder || [],
        mergedOrders: responce.data.MergeOrder || [],
      });
    } catch (error) {
      console.error(error);
    }
  };

  // print bill process
  const componentRef = useRef();

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const showBillDetails = async (order_id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoice/${order_id}`, { headers: { Authorization: token } });
      setBillData([response.data]); // Set the data first
      console.log("Bill me daal na h ye data ", response.data);
      // Delay the print action until after the state has been updated
      setTimeout(() => {
        handlePrint(); // Trigger the print
      }, 100); // A small timeout to ensure state update
    } catch (error) {
      console.error(error);
    }
  };
  // cancle order process
  const deleteOrder = (order_id) => {
    setSelectedOrderId(order_id);
    setIsDeletOpen(true);
  };

  // delete modal
  const DeletModal = ({ isOpen, onClose, order_id }) => {
    if (!isOpen) return null;
    const [anyreason, setAnyreason] = useState(""); // renamed to match backend

    const cancelOrder = (order_id) => {
      axios
        .post(
          `${API_BASE_URL}/cancelAllOrder/${order_id}`,
          { anyreason },
          { headers: { "Content-Type": "application/json" } },
        )
        .then((response) => {
          console.log(response.data);
          getOngoing(); // Assuming this fetches updated order data
          onClose(); // Close modal after successful cancellation
          toast.success("Order cancel sucessfully.");
        })
        .catch((error) => {
          console.error(error);
        });
    };

    return (
      <>
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
          {/* Background Overlay */}
          <div className="fixed inset-0 bg-black bg-opacity-55"></div>

          {/* Modal Container */}
          <div className="relative bg-white rounded-lg shadow-lg w-1/4 p-5 border border-gray-300">
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-3 mb-3">
              <h2 className="text-lg font-semibold">Cancel Order</h2>
              <button
                onClick={onClose}
                className="text-white bg-red-500 px-3 py-1 rounded-md hover:bg-red-600"
              >
                X
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-4">
              <div className="flex justify-between">
                <h1 className="font-medium">Order ID:</h1>
                <span className="text-gray-700">{order_id}</span>
              </div>

              <div>
                <label className="font-medium">Cancel Reason:</label>
                <textarea
                  rows={3}
                  id="message"
                  name="message"
                  required
                  placeholder="Enter reason..."
                  className="w-full p-2 text-sm border rounded border-gray-300 focus:ring-2 focus:ring-teal-400"
                  value={anyreason}
                  onChange={(e) => setAnyreason(e.target.value)}
                ></textarea>
              </div>

              <button
                onClick={() => cancelOrder(order_id)}
                className="w-full bg-teal-500 text-white py-2 rounded-md hover:bg-teal-600"
              >
                Confirm Cancel
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const showShplitData = (order_id, customer_id) => {
    axios
      .get(`${API_BASE_URL}/splitorderdata/${order_id}`)
      .then((response) => {
        const menuItems = response.data.menuItems;
        setSplitData(menuItems); // Update state only when there are multiple items
        setSplitModal(true);
        getBookTable();
      })
      .catch((error) => {
        console.error(error);
      });
  };

  const handleCheckboxChange = (item) => {
    if (selectedItems.some((selected) => selected.sub_id === item.sub_id)) {
      setSelectedItems(
        selectedItems.filter((selected) => selected.sub_id !== item.sub_id),
      );
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };

  const closeModal = () => {
    setSplitModal(false);
    setSelectedItems([]); // Reset selected items when closing modal
  };
  const Toatalsplit = selectedItems
    .reduce((acc, item) => acc + item.menuqty * parseFloat(item.price), 0)
    .toFixed(2);

  const orderIds = selectedItems.map((order) => order.sub_id);
  const payForselecteditem = () => {
    if (!selectedItems || selectedItems.length === 0) {
      toast.error("Please select at least one item to pay.");
      return;
    }
    setSplitPaynmentModal(true);
  };

  const remainingItems = splitData.filter(
    (item) =>
      !selectedItems.some((selected) => selected.sub_id === item.sub_id),
  );

  useEffect(() => {
    if (splitData) {
      console.log("paydata", paymentData);
    }
  }, [splitData]);

  const handleCheckboxMerge = (val) => {
    setSelectedOrders((prevSelected) => {
      if (prevSelected.find((order) => order.order_id === val.order_id)) {
        // If already selected, remove it
        return prevSelected.filter((order) => order.order_id !== val.order_id);
      } else {
        // If not selected, add it
        return [...prevSelected, val];
      }
    });
  };

  const handleMergeOrders = () => {
    if (selectedOrders.length === 1 || selectedOrders.length === 0) {
      toast.error("Please select at least Two order to merge!");
      return;
    }
    setMergePaynmentModal(true);
  };
  const showInvoiceData = async (order_id) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/invoice/${order_id}`, { headers: { Authorization: token } });
      setInvoiceData([response.data]);
      console.log("Invoice Data: ", invoiceData);
      setInvoiceDataModal(true);
    } catch (error) {
      console.error(error);
    }
  };

  const getMergePaymentdata = (id) => {
    setMergeduepaynmentModal(true);
    axios
      .get(`${API_BASE_URL}/invoice/${id}`)
      .then((response) => {
        console.log("due merger data", response.data);
        setSelectedDueOrders(response.data.orderDetails);
      })
      .catch((error) => {
        console.error(error);
      });
  };

  // for selected item total
  const total = selectedItems
    .reduce((acc, item) => {
      const qty = parseFloat(item.menu_qty) || 0; // Ensure qty is a number
      const price = parseFloat(item.total_price) || 0; // Ensure price is a number
      const vat = parseFloat(item.Product_vat) || 0; // Ensure vat is a number

      // Calculate the total price of add-ons
      const addonsPrice =
        item.add_ons && item.add_ons.length > 0
          ? item.add_ons.reduce((addonAcc, val) => {
              const addonQty = parseFloat(val.quantity) || 0; // Ensure addon quantity is a number
              const addonPrice = parseFloat(val.price) || 0; // Ensure addon price is a number
              return addonAcc + addonQty * addonPrice; // Accumulate the add-on total
            }, 0)
          : 0; // Default to 0 if no add-ons

      const vatAmount = (qty * price * vat) / 100;
      return acc + qty * price + vatAmount + addonsPrice; // Accumulate the total
    }, 0)
    .toFixed(2); // Format the total to 2 decimal places
  // for remaining total

  const totalremaning = remainingItems
    .reduce((acc, item) => {
      const qty = parseFloat(item.menu_qty) || 0; // Ensure qty is a number
      const price = parseFloat(item.total_price) || 0; // Ensure price is a number
      const vat = parseFloat(item.Product_vat) || 0; // Ensure vat is a number

      // Calculate the total price of add-ons
      const addonsPrice =
        item.add_ons && item.add_ons.length > 0
          ? item.add_ons.reduce((addonAcc, val) => {
              const addonQty = parseFloat(val.quantity) || 0; // Ensure addon quantity is a number
              const addonPrice = parseFloat(val.price) || 0; // Ensure addon price is a number
              return addonAcc + addonQty * addonPrice; // Accumulate the add-on total
            }, 0)
          : 0; // Default to 0 if no add-ons

      const vatAmount = (qty * price * vat) / 100;
      return acc + qty * price + vatAmount + addonsPrice; // Accumulate the total
    }, 0)
    .toFixed(2); // Format the total to 2 decimal places

  const refreshOrderList = () => {
    getOngoing();
    getBookTable();
    getunBookTable();
    setSplitModal(false);
    closeModal();
  };
  useEffect(() => {
    getOngoing();
    allPaynmnetMethod();
    getBookTable();
    getunBookTable();
  }, []);
  return (
    <>
      {/* Main Div */}

      <div className="main_div  ">
        <section className=" side_section flex">
          <div
            className={`${
              isOpen == false
                ? "hidden"
                : " hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>

          <div className=" ">
            <section className="section1 flex  justify-between gap-x-3 pt-2 ">
              <div className=" flex gap-x-6">
                <div className="orderButton gap-x-2 flex ">
                  {OrderButtons.map((val, index) => (
                    <div
                      className={` ${index === 7 ? "pointer-events-none" : ""}`}
                      key={index}
                    >
                      <NavLink
                        to={val.link}
                        className={({ isActive }) =>
                          `h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer flex justify-center items-center gap-3 ${
                            isActive
                              ? "bg-[#4CBBA1] text-white border-[#4CBBA1]"
                              : "bg-[#1C1D3E] text-[#fff] border-zinc-300 hover:bg-[#4CBBA1]"
                          }`
                        }
                      >
                        <span className="text-emerald-50 text-xl">
                          {val.icon}
                        </span>
                        {val.title}
                      </NavLink>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer" />

                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className="  bg-[#1C1D3E] text-white h-[60px] font-semibold w-full px-7 py-3  rounded-md cursor-pointer"
                />
              </div>
            </section>
            {/* //show booked and unbookd table */}
            <section className=" section2 mt-4">
              <div className=" flex gap-x-6 ">
                <button
                  onClick={() => setCmodal5(true)}
                  className=" cursor-pointer  w-full text-md bg-[#4CBBA1] flex gap-1 justify-center items-center leading-4 px-4 py-5  rounded-md  text-white "
                >
                  {" "}
                  <MdTableBar />
                  Booked Table
                </button>

                <button
                  onClick={() => setCmodal4(true)}
                  className=" cursor-pointer  w-full text-md bg-[#4CBBA1] flex gap-1 justify-center items-center leading-4 px-4 py-5  rounded-md  text-white "
                >
                  {" "}
                  <MdTableBar />
                  Available Table
                </button>

                <button
                  onClick={handleMergeOrders}
                  className=" cursor-pointer  w-full text-md bg-[#4CBBA1] flex gap-1 justify-center items-center leading-4 px-4 py-5  rounded-md  text-white "
                >
                  {" "}
                  <TiFlowMerge />
                  Merge order
                </button>
              </div>
            </section>

            <section className="section3  mt-10">
              <h2 className="text-xl font-bold mb-2">Non-Merged Orders</h2>
              <div className="table_data flex flex-wrap gap-y-8">
                {ongoingData.nonmergedata.length === 0 ? (
                  <div className="no-orders-message">
                    <h2 className=" text-2xl font-semibold ">
                      No ongoing orders are available.
                    </h2>
                  </div>
                ) : (
                  ongoingData.nonmergedata.map((val, index) => (
                    <>
                      <div className=" card p-5">
                        <div className=" p-2 border-[1px] border-[#4CBBA1] shadow-sm shadow-[#4CBBA1]">
                          <div className=" flex gap-2  items-center leading-3 px-3">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 48 48"
                              className=" size-9"
                            >
                              <title>Dining Table</title>
                              <g id="Dining_Table" data-name="Dining Table">
                                <path d="M29.109,37.871,27,36.465V24H37a2,2,0,0,0,2-2V20a2,2,0,0,0-2-2H33.949A10.015,10.015,0,0,0,25,9.051V8h1a1,1,0,0,0,0-2H22a1,1,0,0,0,0,2h1V9.051A10.015,10.015,0,0,0,14.051,18H10a2,2,0,0,0-2,2v2a2,2,0,0,0,2,2H21V36.465l-2.109,1.406A2,2,0,0,0,18,39.535V40a2,2,0,0,0,2,2h8a2,2,0,0,0,2-2v-.465A2,2,0,0,0,29.109,37.871ZM24,11a8.008,8.008,0,0,1,7.931,7H16.069A8.008,8.008,0,0,1,24,11ZM10,22V20H37v2ZM28,40H20v-.465l2.109-1.406A2,2,0,0,0,23,36.465V24h2V36.465a2,2,0,0,0,.891,1.664L28,39.535Z"></path>
                                <path d="M46.374,30.4l1.608-12.133A2,2,0,0,0,46.006,16H44.92a2,2,0,0,0-1.926,1.481l-2.587,9.662H34.243a2.986,2.986,0,0,0-2.892,2.248L31.064,30.5h0a2,2,0,0,0,1.9,2.5l-1.932,7.762a1,1,0,0,0,.73,1.212A.961.961,0,0,0,32,42a1,1,0,0,0,.97-.758L35.022,33H43.2l1.825,8.217A1,1,0,0,0,46,42a1.018,1.018,0,0,0,.218-.024,1,1,0,0,0,.76-1.193l-1.854-8.341A2.992,2.992,0,0,0,46.374,30.4ZM33,31l.286-1.109a.988.988,0,0,1,.956-.747h6.932a1,1,0,0,0,.966-.741L44.92,18H46L44.392,30.133a1,1,0,0,1-.981.867L33,31Z"></path>
                                <path d="M16.58,32.227a1.993,1.993,0,0,0,.357-1.727h0l-.286-1.106a2.988,2.988,0,0,0-2.893-2.25H7.593L5.006,17.481A2,2,0,0,0,3.08,16H1.994A2,2,0,0,0,.018,18.264L1.626,30.4a2.991,2.991,0,0,0,1.161,1.98L.919,40.783a1,1,0,0,0,1.953.434L4.7,33h8.175l2.052,8.242A1,1,0,0,0,15.9,42a.961.961,0,0,0,.242-.03,1,1,0,0,0,.729-1.212L14.935,33h.07A1.981,1.981,0,0,0,16.58,32.227ZM4.589,31a1,1,0,0,1-.981-.867L1.994,18h1.08L5.859,28.4a1,1,0,0,0,.966.741h6.932a.99.99,0,0,1,.957.748L15,31Z"></path>
                              </g>
                            </svg>
                            <span className=" font-semibold">
                              Table:
                              {val.tablename ? val.tablename : "No table found"}
                            </span>

                            {val.splitpay_status !== 1 && (
                              <input
                                type="checkbox"
                                onChange={() => handleCheckboxMerge(val)}
                                className="size-5 custom-checkbox"
                                checked={selectedOrders.some(
                                  (order) => order.order_id === val.order_id,
                                )}
                              />
                            )}
                          </div>

                          <div className="  px-3 font-semibold">
                            <h1>Order Number :{val.order_id}</h1>
                            <h2>
                              Waiter:{" "}
                              {val.waiter_first_name && val.waiter_last_name
                                ? `${val.waiter_first_name} ${val.waiter_last_name}`
                                : "No Waiter Found"}
                            </h2>
                          </div>

                          <div className=" flex gap-x-2">
                            {val.status === "completed" &&
                              val.splitpay_status !== 1 && (
                                <button
                                  onClick={() => {
                                    showPaynment(val.order_id);
                                  }}
                                  className="mb-3 mt-5 w-full items-center justify-center gap-1 px-1 py-1 flex bg-[#4CBBA1] text-[#fff] cursor-pointer rounded-sm"
                                >
                                  <IoMdCheckmarkCircleOutline />
                                  <span className="text-[#fff]">
                                    {" "}
                                    Make Payment
                                  </span>
                                </button>
                              )}

                            <button
                              onClick={() => {
                                showShplitData(val.order_id, val.customer_id);
                              }}
                              className=" mb-3 mt-5  w-full items-center  justify-center gap-1  px-1 py-1 flex bg-[#4CBBA1] text-[#fff]  cursor-pointer  rounded-sm "
                            >
                              <PiSplitHorizontalBold />

                              <span className="text-[#fff]">Split</span>
                            </button>
                          </div>

                          <div className=" flex gap-x-3 overflow-hidden">
                            {/* <button
                              onClick={() => {
                                showInvoiceData(val.order_id);
                              }}
                              className="  items-center gap-1  px-1 py-1 flex bg-[#4CBBA1] text-[#fff]  cursor-pointer rounded-sm text-sm"
                            >
                              <IoDocumentAttachOutline />
                              Invoice
                            </button> */}
                            <button
                              disabled={val.status !== "completed"}
                              onClick={() => {
                                if (val.status === "completed")
                                  showInvoiceData(val.order_id);
                              }}
                              className={`items-center gap-1  px-1 py-1 flex bg-[#4CBBA1] text-[#fff]  cursor-pointer rounded-sm text-sm ${
                                val.status !== "completed"
                                  ? "opacity-50 cursor-not-allowed"
                                  : ""
                              }`}
                            >
                              <IoDocumentAttachOutline />
                              Invoice
                            </button>

                            <button
                              onClick={() => showBillDetails(val.order_id)}
                              className="items-center gap-1 px-1 py-1 flex bg-[#4CBBA1] text-[#fff] cursor-pointer rounded-sm text-sm"
                            >
                              <IoPrintOutline />
                              Print
                            </button>

                            {val.splitpay_status !== 1 && (
                              <button
                                className=" items-center gap-1  px-1 py-1 flex bg-[#a02828] text-[#fff]  cursor-pointer rounded-sm text-sm"
                                onClick={() => {
                                  deleteOrder(val.order_id);
                                }}
                              >
                                <FaRegTrashCan />
                                Cancel
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                  ))
                )}
              </div>
            </section>

            <section className="section3  mt-10">
              <h2 className="text-xl font-bold mt-6 mb-2">Merged Orders</h2>
              <div className="table_data flex flex-wrap gap-y-8">
                {ongoingData.mergedOrders.length === 0 ? (
                  <div className="no-orders-message">
                    <h2 className=" text-2xl font-semibold ">
                      No merge Due orders are available.
                    </h2>
                  </div>
                ) : (
                  ongoingData.mergedOrders.map((val, index) => (
                    <>
                      <div className=" card p-5">
                        <div className=" p-2 border-[1px] border-[#4CBBA1] shadow-sm shadow-[#4CBBA1]">
                          <div className="  px-3 font-semibold">
                            <h1>Order Number :{val.marge_order_id}</h1>
                            <h2>
                              Waiter:{" "}
                              {val.waiter_first_name && val.waiter_last_name
                                ? `${val.waiter_first_name} ${val.waiter_last_name}`
                                : "No Waiter Found"}
                            </h2>
                          </div>
                          {val.bill_status !== 1 && (
                            <div className=" flex gap-x-2">
                              <button
                                onClick={() => {
                                  getMergePaymentdata(val.marge_order_id);
                                }}
                                className=" mb-3 mt-5  w-full items-center  justify-center gap-1  px-1 py-1 flex bg-[#4CBBA1] text-[#fff]  cursor-pointer  rounded-sm "
                              >
                                <IoMdCheckmarkCircleOutline />

                                <span className="text-[#fff]">
                                  {" "}
                                  Make Payment
                                </span>
                              </button>
                            </div>
                          )}

                          <div className="  flex gap-x-3  overflow-hidden">
                            <button
                              onClick={() => {
                                showInvoiceData(val.marge_order_id);
                              }}
                              className="  items-center gap-1  px-1 py-1 flex bg-[#4CBBA1] text-[#fff]  cursor-pointer rounded-sm text-sm"
                            >
                              <IoDocumentAttachOutline />
                              Invoice
                            </button>
                            <button
                              onClick={() =>
                                showBillDetails(val.marge_order_id)
                              }
                              className="items-center gap-1 px-1 py-1 flex bg-[#4CBBA1] text-[#fff] cursor-pointer rounded-sm text-sm"
                            >
                              <IoPrintOutline />
                              Print
                            </button>

                            <button
                              className=" items-center gap-1  px-1 py-1 flex bg-[#a02828] text-[#fff]  cursor-pointer rounded-sm text-sm"
                              onClick={() => {
                                deleteOrder(val.marge_order_id);
                              }}
                            >
                              <FaRegTrashCan />
                              Cancel
                            </button>
                            <DeletModal
                              isOpen={isDeletOpen}
                              order_id={selectedOrderId}
                              onClose={closeModaldelete}
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  ))
                )}
              </div>
            </section>
          </div>
        </section>
      </div>

      {/*  Booked Table */}
      <DialogBox
        title={"View Booked Tables"}
        isOpen={cModal5}
        onClose={() => setCmodal5(false)}
      >
        <div className="mt-2">
          <div className="p-2 overflow-y-scroll items-center ">
            <div className="flex flex-wrap gap-4">
              {bookTableData.length > 0 ? (
                bookTableData.map((val, index) => (
                  <div
                    key={val.tableid}
                    className="border-[#4CBBA1] border w-[180px] rounded-md text-sm"
                  >
                    <div className="flex flex-col items-center p-2">
                      <div className="w-[40px] h-[40px] mb-2">
                        <img
                          src={table}
                          alt="Dining Table"
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="text-center">
                        <div className="mb-1">
                          <span className="font-medium">Table:</span>{" "}
                          {val.tablename}
                        </div>
                        <div>
                          <span className="font-medium">Seat:</span>{" "}
                          {val.person_capicity}
                        </div>
                      </div>
                    </div>
                    <div className="px-2 pb-2">
                      {val.status === 1 ? (
                        <button className="bg-[#bb4c4c] w-full text-white rounded-md text-xs py-2">
                          Reserved
                        </button>
                      ) : (
                        <button className="bg-[#4cbbb2] w-full text-white rounded-md text-xs py-2">
                          Unbooked
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-10">
                  <h1 className="text-[#bb4c4c] text-lg">No Tables Booked</h1>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogBox>

      {/* UnBooked Table */}

      <DialogBox
        title={"View Available Tables"}
        isOpen={cModal4}
        onClose={() => setCmodal4(false)}
      >
        <div className="mt-1">
          <div className="p-1  overflow-y-auto rounded-lg bg-white shadow-inner border border-gray-200">
            <div className="flex flex-wrap gap-4 justify-center">
              {ubookedData.length > 0 ? (
                ubookedData.map((val) => (
                  <div
                    key={val.tableid}
                    className="w-[180px] bg-white border border-[#4CBBA1] rounded-lg shadow-md overflow-hidden"
                  >
                    {/* Image */}
                    <div className="h-[80px] w-full bg-gray-100 flex items-center justify-center">
                      <img
                        src={table} // Make sure this path is correct
                        alt="Table"
                        className="h-[50px] object-contain"
                      />
                    </div>

                    {/* Info Section */}
                    <div className="px-2 py-2 text-xs text-gray-800">
                      <div className="flex mb-1">
                        <span className="font-semibold w-[70px]">Table:</span>
                        <span className="truncate">{val.tablename}</span>
                      </div>
                      <div className="flex">
                        <span className="font-semibold w-[70px]">Seat:</span>
                        <span>{val.person_capicity}</span>
                      </div>
                    </div>

                    {/* Status Button */}
                    <div className="px-2 pb-2">
                      {val.status === 1 ? (
                        <button className="w-full bg-[#bb4c4c] text-white text-xs py-1 rounded-md cursor-not-allowed">
                          Reserved
                        </button>
                      ) : (
                        <button className="w-full bg-[#4cbbb2] text-white text-xs py-1 rounded-md hover:bg-[#3aa199] transition">
                          Unbooked
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-full text-center py-10">
                  <h1 className="text-[#bb4c4c] text-lg">No Tables Booked</h1>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogBox>

      <SplitModal
        title="Split Bill for Menu Items"
        isOpen={splitModal}
        onClose={() => closeModal()}
      >
        <div className="w-full max-w-7xl mx-auto p-4 sm:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MENU */}
            <div className="bg-white border border-[#4CBBA1] rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-[#4CBBA1]">
                🍽 Menu Items
              </h2>

              <div className="overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-[#4CBBA1]/10 sticky top-0">
                    <tr>
                      <th className="p-2"></th>
                      <th className="p-2">Item</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2 text-right">Price</th>
                    </tr>
                  </thead>

                  <tbody>
                    {splitData.map((item) => {
                      const name = item.ProductName || item.variantName;
                      const price = Number(item.total_price);

                      return (
                        <tr
                          key={item.sub_id}
                          className="border-b hover:bg-[#4CBBA1]/5 transition"
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              onChange={() => handleCheckboxChange(item)}
                              className="accent-[#4CBBA1]"
                            />
                          </td>
                          <td className="p-2 font-medium">{name}</td>
                          <td className="p-2">{item.menu_qty}</td>
                          <td className="p-2 text-right text-[#4CBBA1] font-semibold">
                            ₹{price}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SELECTED */}
            <div className="bg-white border border-[#4CBBA1] rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-[#4CBBA1]">
                ✅ Selected
              </h2>

              <div className="flex-1 overflow-auto max-h-[400px]">
                {selectedItems.length === 0 ? (
                  <p className="text-gray-400 text-center mt-10">
                    No items selected
                  </p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {selectedItems.map((item) => {
                        const name = item.ProductName || item.variantName;
                        const total =
                          Number(item.total_price) * Number(item.menu_qty);

                        return (
                          <tr
                            key={item.sub_id}
                            className="border-b hover:bg-[#4CBBA1]/5"
                          >
                            <td className="p-2">{name}</td>
                            <td className="p-2 text-right font-medium">
                              ₹{total}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>

              <div className="mt-4 border-t border-[#4CBBA1] pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#4CBBA1]">₹{total}</span>
              </div>

              <button
                onClick={payForselecteditem}
                className="mt-4 w-full bg-[#4CBBA1] hover:bg-[#35bb9c] text-white py-2 rounded-lg transition duration-200 shadow-sm"
              >
                Pay Selected
              </button>
            </div>

            {/* REMAINING */}
            <div className="bg-white border border-[#4CBBA1] rounded-2xl shadow-sm p-4 sm:p-5 flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-[#4CBBA1]">
                📦 Remaining
              </h2>

              <div className="flex-1 overflow-auto max-h-[400px]">
                <table className="w-full text-sm">
                  <thead className="bg-[#4CBBA1]/10 sticky top-0">
                    <tr>
                      <th className="p-2">Item</th>
                      <th className="p-2">Price</th>
                      <th className="p-2">VAT</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>

                  <tbody>
                    {remainingItems.map((item) => {
                      const name = item.ProductName || item.variantName;
                      const price = Number(item.total_price);
                      const vatPercent = Number(item.Product_vat || 0);
                      const vat = (price * vatPercent) / 100;
                      const total = price + vat;

                      return (
                        <tr
                          key={item.sub_id}
                          className="border-b hover:bg-[#4CBBA1]/5"
                        >
                          <td className="p-2">{name}</td>
                          <td className="p-2">₹{price}</td>
                          <td className="p-2">
                            {vatPercent}% (₹{vat.toFixed(2)})
                          </td>
                          <td className="p-2 text-right font-semibold text-[#4CBBA1]">
                            ₹{total.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-4 border-t border-[#4CBBA1] pt-3 flex justify-between font-bold text-lg">
                <span>Total</span>
                <span className="text-[#4CBBA1]">₹{totalremaning}</span>
              </div>
            </div>
          </div>
        </div>
      </SplitModal>

      <PaynmentDialogBox
        refreshOrderList={refreshOrderList}
        isOpen={paynmentModal}
        onClose={() => setPaynmentModal(false)}
        paymentData={[paymentData]}
        paymentMethod={paymentMethod}
      ></PaynmentDialogBox>

      <SplitPaynmentModal
        refreshOrderList={refreshOrderList}
        isOpen={mergepaynmentModal}
        onClose={() => setMergePaynmentModal(false)}
        paymentData={[selectedOrders]}
        paymentMethod={paymentMethod}
      ></SplitPaynmentModal>

      <SplitpayModal
        refreshOrderList={refreshOrderList}
        isOpen={splitpaynmentModal}
        onClose={() => setSplitPaynmentModal(false)}
        paymentData={[selectedItems]}
        paymentMethod={paymentMethod}
        Orderids={orderIds}
      ></SplitpayModal>

      <DuemergePaynmentModal
        refreshOrderList={refreshOrderList}
        isOpen={mergeduepaynmentModal}
        onClose={() => setMergeduepaynmentModal(false)}
        paymentData={[selectedDueOrders]}
        paymentMethod={paymentMethod}
      />
      <InvoiceDialogBox
        isOpen={invoiceDataModal}
        onClose={() => setInvoiceDataModal(false)}
        invoiceDatas={invoiceData}
        img={logo}
      ></InvoiceDialogBox>
      <DeletModal
        isOpen={isDeletOpen}
        order_id={selectedOrderId}
        onClose={closeModaldelete}
      />
      <div className=" hidden">
        <InvoiceDialogBox2 billData={billData} ref={componentRef} />
      </div>
    </>
  );
};

export default OnGoingOrder;
