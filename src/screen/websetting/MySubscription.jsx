// import React, { useState, useContext, useEffect } from "react";
// import Nav from "../../components/Nav";
// import Hamburger from "hamburger-react";
// import { IoMdNotifications } from "react-icons/io";
// import { MdOutlineZoomOutMap } from "react-icons/md";
// import { FaCheck } from "react-icons/fa";
// import axios from "axios";
// import useFullScreen from "../../components/useFullScreen";
// import { toast } from "react-toastify";
// import { AuthContext } from "../../store/AuthContext";

// const headers = [
//   "SL.",
//   "Plan Name",
//   "Start Date",
//   "End Date",
//   "Price",
//   "Transaction ID",
//   " Payment Method",
//   "Status",
// ];
// const MySubscription = () => {
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//   const APP_URL = import.meta.env.VITE_APP_URL;
//   const { isFullScreen, toggleFullScreen } = useFullScreen();
//   const { userId } = useContext(AuthContext);
//   const [isOpen, setOpen] = useState(true);
//   const [plans, setPlans] = useState([]);
//   const [subscription, setSubscription] = useState([]);

//   const getallPackages = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/getallpackages`);
//       setPlans(res.data.data);
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   const getSubscription = async () => {
//     try {
//       const res = await axios.get(`${API_BASE_URL}/subscriptions/${userId}`);
//       setSubscription(res.data.data);
//     } catch (error) {
//       console.log(error);
//     }
//   };

//   const handleBuyNow = async (planId) => {
//     try {
//       const res = await axios.post(`${API_BASE_URL}/createsubscription`, {
//         user_id: userId,
//         plan_id: planId,
//       });

//       if (res.data.success) {
//         toast.success("Subscription requested successfully! (Pending)");
//         getSubscription(); // refresh subscription list
//       }
//     } catch (error) {
//       console.error(error);
//       toast.error("Failed to request subscription.");
//     }
//   };

//   useEffect(() => {
//     getallPackages();
//     getSubscription();
//   }, []);

//   return (
//     <div className="main_div ">
//       <section className="side_section flex">
//         <div
//           className={`${
//             isOpen == false
//               ? "hidden"
//               : "nav-container hide-scrollbar h-screen overflow-y-auto"
//           }`}
//         >
//           <Nav />
//         </div>
//         <div className="nav-container hide-scrollbar h-screen overflow-y-auto w-full ml-4 pr-7 mt-4">
//           {" "}
//           <header className="">
//             <Hamburger toggled={isOpen} toggle={setOpen} />
//           </header>
//           <div className="contant_div">
//             <div className="activtab flex justify-between">
//               <h1 className="flex items-center justify-center gap-1 font-semibold">
//                 My Subscription
//               </h1>

//               <div className="notification flex gap-x-5">
//                 <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

//                 <MdOutlineZoomOutMap
//                   onClick={toggleFullScreen}
//                   className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
//                 />
//               </div>
//             </div>

//             <div className="h-auto text-black">
//               <section className="tabledata  mt-6">
//                 <div className=" font-semibold text-2xl mb-2">
//                   Subscription Plan Details
//                 </div>

//                 {subscription.some(
//                   (s) =>
//                     s.end_date &&
//                     new Date(s.end_date) <=
//                       new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
//                 ) && (
//                   <div className="bg-red-100 text-red-800 p-4 rounded mb-4 font-semibold">
//                     ⚠️ Some of your subscriptions are about to expire soon!
//                   </div>
//                 )}

//                 <div className="overflow-hidden shadow-lg rounded-lg border border-gray-200 bg-white">
//                   <div className="w-full overflow-x-auto hide-scrollbar">
//                     <table className="min-w-full divide-y divide-gray-200 text-nowrap">
//                       <thead className="bg-[#4CBBA1]">
//                         <tr>
//                           {headers.map((header, index) => (
//                             <th
//                               key={index}
//                               className="py-4 px-6 text-center text-md font-semibold text-white uppercase tracking-wider"
//                             >
//                               {header}
//                             </th>
//                           ))}
//                         </tr>
//                       </thead>
//                       <tbody className="divide-y divide-gray-100 text-gray-700 text-center">
//                         {subscription.length > 0 ? (
//                           subscription.map((row, index) => {
//                             let badgeColor = "";
//                             switch (row.plan_status.toLowerCase()) {
//                               case "active":
//                                 badgeColor = "bg-green-500";
//                                 break;
//                               case "expired":
//                                 badgeColor = "bg-red-500";
//                                 break;
//                               case "pending":
//                                 badgeColor = "bg-yellow-400";
//                                 break;
//                               default:
//                                 badgeColor = "bg-gray-400";
//                             }

//                             const startDate =
//                               row.start_date && row.start_date !== "0000-00-00"
//                                 ? new Date(row.start_date).toLocaleDateString(
//                                     "en-US",
//                                     {
//                                       year: "numeric",
//                                       month: "long",
//                                       day: "numeric",
//                                     }
//                                   )
//                                 : "Not Approved Yet";

//                             const endDate =
//                               row.end_date && row.end_date !== "0000-00-00"
//                                 ? new Date(row.end_date).toLocaleDateString(
//                                     "en-US",
//                                     {
//                                       year: "numeric",
//                                       month: "long",
//                                       day: "numeric",
//                                     }
//                                   )
//                                 : "Not Approved Yet";

//                             return (
//                               <tr
//                                 key={index}
//                                 className="hover:bg-gray-50 transition duration-200"
//                               >
//                                 <td className="py-3 px-6">{index + 1}</td>
//                                 <td className="py-3 px-6">
//                                   {row.package_name}
//                                 </td>
//                                 <td className="py-3 px-6">{startDate}</td>
//                                 <td className="py-3 px-6">{endDate}</td>
//                                 <td className="py-3 px-6">
//                                   {row.price_with_currency}
//                                 </td>
//                                 <td className="py-3 px-6">
//                                   {row.transaction_id || "N/A"}
//                                 </td>
//                                 <td className="py-3 px-6">
//                                   {row.paid_via || "N/A"}
//                                 </td>
//                                 <td className="py-3 px-6">
//                                   <span
//                                     className={`text-white px-2 py-1 rounded ${badgeColor}`}
//                                   >
//                                     {row.package_status}
//                                   </span>
//                                 </td>
//                               </tr>
//                             );
//                           })
//                         ) : (
//                           <tr>
//                             <td
//                               colSpan={8}
//                               className="py-6 text-gray-500 text-center"
//                             >
//                               No subscriptions found.
//                             </td>
//                           </tr>
//                         )}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </section>

//               {/* Packages Section */}

//               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6  h-auto rounded-sm mt-20">
//                 {plans.length === 0 ? (
//                   <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-md text-center">
//                     <p className="text-lg">There are no packages available.</p>
//                   </div>
//                 ) : (
//                   plans.map((plan) => (
//                     <div
//                       key={plan.plan_id}
//                       className="bg-blue-50 text-black rounded-2xl shadow-lg overflow-hidden w-full max-w-sm"
//                     >
//                       {/* Header Curve */}
//                       <div className="bg-[#1d1717] text-white text-center py-4 rounded-b-full">
//                         <h2 className="text-lg font-semibold">
//                           {" "}
//                           {plan.package_name}
//                         </h2>
//                       </div>

//                       {/* Subscription Details */}
//                       <div className="p-5">
//                         <ul className="space-y-3 text-lg">
//                           <p className="text-sm text-gray-900 mb-4 font-bold">
//                             {plan.package_description}
//                           </p>

//                           <li className="flex items-start gap-2">
//                             <FaCheck className="text-green-400" size={18} />
//                             <span>
//                               <strong>Users:</strong>{" "}
//                               {plan.number_of_active_users === 0
//                                 ? "Unlimited"
//                                 : plan.number_of_active_users}
//                             </span>
//                           </li>
//                           <li className="flex items-start gap-2">
//                             <FaCheck className="text-green-400" size={18} />
//                             <span>
//                               <strong>Invoices:</strong>{" "}
//                               {plan.number_of_invoice === 0
//                                 ? "Unlimited"
//                                 : plan.number_of_invoice}
//                             </span>
//                           </li>
//                           <li className="flex items-start gap-2">
//                             <FaCheck className="text-green-400" size={18} />
//                             <span>
//                               <strong>Trial:</strong> {plan.trial_days} days
//                             </span>
//                           </li>
//                           <li className="flex items-start gap-2">
//                             <FaCheck className="text-green-400" size={18} />
//                             <span>
//                               <strong>Duration:</strong> {plan.interval_value}{" "}
//                               {plan.price_interval}
//                             </span>
//                           </li>
//                           <li className="flex items-start gap-2">
//                             <FaCheck className="text-green-400" size={18} />
//                             <span>
//                               <strong>Price:</strong> {plan.price_with_currency}
//                               / {plan.currency}
//                             </span>
//                           </li>
//                         </ul>

//                         {/* Buttons */}
//                         <div className="mt-6 flex flex-col sm:flex-row gap-2">
//                           <button
//                             onClick={() => handleBuyNow(plan.plan_id)}
//                             className="w-full px-4 py-2 border border-gray-900 text-gray-900 rounded-md flex items-center justify-center gap-1 text-base font-bold bg-[#4CBBA1]"
//                           >
//                             Buy Now
//                           </button>
//                         </div>
//                       </div>
//                     </div>
//                   ))
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </section>
//     </div>
//   );
// };

// export default MySubscription;

import React, { useState, useContext, useEffect } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoMdClose } from "react-icons/io";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaCheck } from "react-icons/fa";
import axios from "axios";
import useFullScreen from "../../components/useFullScreen";
import { toast } from "react-toastify";
import { AuthContext } from "../../store/AuthContext";

const headers = [
  "SL.",
  "Plan Name",
  "Start Date",
  "End Date",
  "Price",
  "Transaction ID",
  " Payment Method",
  "Status",
  "Action",
];

const MySubscription = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const { userId } = useContext(AuthContext);
  const [isOpen, setOpen] = useState(true);
  const [plans, setPlans] = useState([]);
  const [subscription, setSubscription] = useState([]);
  const token = localStorage.getItem("token");
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [renewConfirmOpen, setRenewConfirmOpen] = useState(false);
  const [selectedRenewPlanId, setSelectedRenewPlanId] = useState(null);

  const getallPackages = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/getallpackages`);
      setPlans(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getSubscription = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/subscriptions/${userId}`);
      setSubscription(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const handleBuyNow = async (planId) => {
    try {
      const res = await axios.post(`${API_BASE_URL}/createsubscription`, {
        user_id: userId,
        plan_id: planId,
      });

      if (res.data.success) {
        toast.success("Subscription requested successfully! (Pending)");
        getSubscription(); // refresh subscription list
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to request subscription.");
    }
  };

  const openModal = (planId) => {
    setSelectedPlanId(planId);
    setPaymentMethod("");
    setModalOpen(true);
  };

  const openRenewConfirm = (userPlanId) => {
    setSelectedRenewPlanId(userPlanId);
    setRenewConfirmOpen(true);
  };

  const handleRenewConfirm = async () => {
    try {
      await axios.put(`${API_BASE_URL}/renew-plan/${selectedRenewPlanId}`, {}, {
        headers: { Authorization: token },
      });
      toast.success("Renewal requested! Waiting for Super Admin approval.");
      setRenewConfirmOpen(false);
      getSubscription();
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to request renewal.");
      setRenewConfirmOpen(false);
    }
  };

  const handleModalBuy = () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method!");
      return;
    }
    handleBuyNow(selectedPlanId);
    setModalOpen(false);
  };

  useEffect(() => {
    getallPackages();
    getSubscription();
  }, []);

  return (
    <div className="main_div">
      <section className="side_section flex">
        <div
          className={`${
            isOpen === false
              ? "hidden"
              : "nav-container hide-scrollbar h-screen overflow-y-auto"
          }`}
        >
          <Nav />
        </div>
        <div className="nav-container hide-scrollbar h-screen overflow-y-auto w-full ml-4 pr-7 mt-4">
          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className="contant_div">
            <div className="activtab flex justify-between">
              <h1 className="flex items-center justify-center gap-1 font-semibold">
                My Subscription
              </h1>
              <div className="notification flex gap-x-5">
                <IoMdNotifications className="bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className="bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />
              </div>
            </div>

            {/* Subscription Table */}
            <div className="h-auto text-black">
              <section className="tabledata mt-6">
                <div className="font-semibold text-2xl mb-2">
                  Subscription Plan Details
                </div>
                {subscription.some(
                  (s) =>
                    s.end_date &&
                    new Date(s.end_date) <=
                      new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
                ) && (
                  <div className="bg-red-100 text-red-800 p-4 rounded mb-4 font-semibold">
                    ⚠️ Some of your subscriptions are about to expire soon!
                  </div>
                )}

                <div className="overflow-hidden shadow-lg rounded-lg border border-gray-200 bg-white">
                  <div className="w-full overflow-x-auto hide-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200 text-nowrap">
                      <thead className="bg-[#4CBBA1]">
                        <tr>
                          {headers.map((header, index) => (
                            <th
                              key={index}
                              className="py-4 px-6 text-center text-md font-semibold text-white uppercase tracking-wider"
                            >
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-gray-700 text-center">
                        {(() => {
                          const latestPending = subscription.find(s => s.package_status === 'pending');
                          return subscription.length > 0 ? (
                            subscription.map((row, index) => {
                              const planStatus = row.plan_status || "Unknown";
                              let badgeColor = "";
                              switch (planStatus.toLowerCase()) {
                                case "active":
                                  badgeColor = "bg-green-500";
                                  break;
                                case "expired":
                                  badgeColor = "bg-red-500";
                                  break;
                                case "pending":
                                  badgeColor = "bg-yellow-400";
                                  break;
                                case "renew requested":
                                  badgeColor = "bg-blue-500";
                                  break;
                                case "superseded":
                                  badgeColor = "bg-gray-500";
                                  break;
                                default:
                                  badgeColor = "bg-gray-400";
                              }

                              const isLatestPending = row.package_status === 'pending' && latestPending?.user_plan_id === row.user_plan_id;

                              const startDate =
                                row.start_date && row.start_date !== "0000-00-00"
                                  ? new Date(row.start_date).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "Not Approved Yet";

                              const endDate =
                                row.end_date && row.end_date !== "0000-00-00"
                                  ? new Date(row.end_date).toLocaleDateString("en-US", {
                                      year: "numeric",
                                      month: "long",
                                      day: "numeric",
                                    })
                                  : "Not Approved Yet";

                              return (
                                <tr
                                  key={index}
                                  className="hover:bg-gray-50 transition duration-200"
                                >
                                  <td className="py-3 px-6">{index + 1}</td>
                                  <td className="py-3 px-6">{row.package_name || "—"}</td>
                                  <td className="py-3 px-6">{startDate}</td>
                                  <td className="py-3 px-6">{endDate}</td>
                                  <td className="py-3 px-6">{row.price_with_currency}</td>
                                  <td className="py-3 px-6">{row.transaction_id || "N/A"}</td>
                                  <td className="py-3 px-6">{row.paid_via || "N/A"}</td>
                                  <td className="py-3 px-6">
                                    <span className={`text-white px-2 py-1 rounded ${badgeColor}`}>
                                      {planStatus}
                                    </span>
                                  </td>
                                  <td className="py-3 px-6">
                                    {isLatestPending && (
                                      <button
                                        onClick={() => openRenewConfirm(row.user_plan_id)}
                                        className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1 rounded text-sm font-semibold"
                                      >
                                        Renew Plan
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td colSpan={9} className="py-6 text-gray-500 text-center">
                                No subscriptions found.
                              </td>
                            </tr>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              {/* Packages Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6 h-auto rounded-sm mt-20">
                {plans.length === 0 ? (
                  <div className="bg-gray-800 text-white rounded-2xl p-6 shadow-md text-center">
                    <p className="text-lg">There are no packages available.</p>
                  </div>
                ) : (
                  plans.map((plan) => (
                    <div
                      key={plan.plan_id}
                      className="bg-blue-50 text-black rounded-2xl shadow-lg overflow-hidden w-full max-w-sm"
                    >
                      <div className="bg-[#1d1717] text-white text-center py-4 rounded-b-full">
                        <h2 className="text-lg font-semibold">
                          {plan.package_name}
                        </h2>
                      </div>

                      <div className="p-5">
                        <ul className="space-y-3 text-lg">
                          <p className="text-sm text-gray-900 mb-4 font-bold">
                            {plan.package_description}
                          </p>
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-400" size={18} />
                            <span>
                              <strong>Users:</strong>{" "}
                              {plan.number_of_active_users === 0
                                ? "Unlimited"
                                : plan.number_of_active_users}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-400" size={18} />
                            <span>
                              <strong>Invoices:</strong>{" "}
                              {plan.number_of_invoice === 0
                                ? "Unlimited"
                                : plan.number_of_invoice}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-400" size={18} />
                            <span>
                              <strong>Trial:</strong> {plan.trial_days} days
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-400" size={18} />
                            <span>
                              <strong>Duration:</strong> {plan.interval_value}{" "}
                              {plan.price_interval}
                            </span>
                          </li>
                          <li className="flex items-start gap-2">
                            <FaCheck className="text-green-400" size={18} />
                            <span>
                              <strong>Price:</strong> {plan.price_with_currency}
                              /{plan.currency}
                            </span>
                          </li>
                        </ul>

                        <div className="mt-6 flex flex-col sm:flex-row gap-2">
                          <button
                            onClick={() => openModal(plan.plan_id)}
                            className="w-full px-4 py-2 border border-gray-900 text-gray-900 rounded-md flex items-center justify-center gap-1 text-base font-bold bg-[#4CBBA1]"
                          >
                            Buy Now
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Modal */}
              {modalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white rounded-3xl p-6 w-96 relative shadow-2xl border border-gray-200">
                    <IoMdClose
                      onClick={() => setModalOpen(false)}
                      className="absolute top-4 right-4 cursor-pointer text-2xl text-gray-600 hover:text-red-500 transition-colors"
                    />
                    <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">
                      Select Payment Method
                    </h2>

                    <div className="flex flex-col gap-3">
                      <button
                        onClick={() => setPaymentMethod("card")}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          paymentMethod === "card"
                            ? "bg-green-100 border-green-500"
                            : "border-gray-300 hover:bg-gray-100"
                        } transition-all duration-200`}
                      >
                        <span className="text-xl">💳</span>
                        <span>Card Payment</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("upi")}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          paymentMethod === "upi"
                            ? "bg-green-100 border-green-500"
                            : "border-gray-300 hover:bg-gray-100"
                        } transition-all duration-200`}
                      >
                        <span className="text-xl">📲</span>
                        <span>UPI Payment</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("stripe")}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          paymentMethod === "stripe"
                            ? "bg-green-100 border-green-500"
                            : "border-gray-300 hover:bg-gray-100"
                        } transition-all duration-200`}
                      >
                        <span className="text-xl">💻</span>
                        <span>Stripe Payment</span>
                      </button>

                      <button
                        onClick={() => setPaymentMethod("cash")}
                        className={`flex items-center gap-3 p-3 rounded-lg border ${
                          paymentMethod === "cash"
                            ? "bg-green-100 border-green-500"
                            : "border-gray-300 hover:bg-gray-100"
                        } transition-all duration-200`}
                      >
                        <span className="text-xl">💵</span>
                        <span>Cash Payment</span>
                      </button>
                    </div>

                    <button
                      onClick={handleModalBuy}
                      className="w-full mt-6 px-4 py-3 bg-[#4CBBA1] text-white font-bold rounded-2xl hover:bg-[#3ca38f] transition-colors"
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              )}
              {/* Renew Plan Confirmation Modal */}
              {renewConfirmOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                  <div className="bg-white rounded-2xl p-6 w-96 relative shadow-2xl border border-gray-200">
                    <IoMdClose
                      onClick={() => setRenewConfirmOpen(false)}
                      className="absolute top-4 right-4 cursor-pointer text-2xl text-gray-600 hover:text-red-500 transition-colors"
                    />
                    <h2 className="text-xl font-bold mb-4 text-center text-gray-800">
                      Confirm Plan Renewal
                    </h2>
                    <p className="text-gray-600 text-center mb-6">
                      Your current active plan will be <strong>superseded</strong> once the Super Admin approves this renewal. Do you want to proceed?
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setRenewConfirmOpen(false)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleRenewConfirm}
                        className="flex-1 px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white font-bold rounded-lg"
                      >
                        Yes, Request Renewal
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default MySubscription;
