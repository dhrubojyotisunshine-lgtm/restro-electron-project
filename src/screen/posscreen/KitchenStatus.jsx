import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import { NavLink } from "react-router-dom";
import Hamburger from "hamburger-react";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";
import { FaCheckCircle, FaClock, FaTimesCircle } from "react-icons/fa";
import { MdExpandMore } from "react-icons/md";

import { IoMdNotifications } from "react-icons/io";
import { MdOutlineZoomOutMap, MdCropRotate } from "react-icons/md";
import { CiSaveDown2 } from "react-icons/ci";
import { FaKitchenSet } from "react-icons/fa6";
import { IoMdCart } from "react-icons/io";
import { IoQrCodeOutline } from "react-icons/io5";
import { RiTodoLine } from "react-icons/ri";

import useFullScreen from "../../components/useFullScreen";

const KitchenItemCard = ({ item, formatTime }) => {
  const [open, setOpen] = useState(false);

  const status = (item.status || "").toUpperCase();

  const statusConfig = {
    COMPLETED: {
      color: "border-green-400 bg-green-50",
      icon: "✅",
      label: "Ready",
    },
    ACCEPTED: {
      color: "border-yellow-400 bg-yellow-50",
      icon: "⏳",
      label: "Processing",
    },
    REJECTED: {
      color: "border-red-400 bg-red-50",
      icon: "❌",
      label: "Rejected",
    },
    DEFAULT: {
      color: "border-gray-300 bg-gray-50",
      icon: "🕓",
      label: "Pending",
    },
  };

  const config = statusConfig[status] || statusConfig.DEFAULT;

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm space-y-2 ${config.color}`}
    >
      <div className="flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-gray-800">{item.name}</h3>
          <p className="text-sm text-gray-500">Qty: {item.qty}</p>
        </div>

        <div className="text-sm font-semibold flex gap-1 items-center">
          <span>{config.icon}</span>
          {config.label}
        </div>
      </div>

      {(status === "ACCEPTED" || status === "COMPLETED") && (
        <p className="text-xs text-gray-600">
          ⏱ Accepted: {formatTime(item.accept_time)}
        </p>
      )}

      {status === "COMPLETED" && (
        <p className="text-xs text-green-700 font-semibold">
          ✅ Ready: {formatTime(item.ready_time)}
        </p>
      )}

      {status === "REJECTED" && (
        <div>
          <button
            onClick={() => setOpen(!open)}
            className="text-xs text-red-600 font-semibold hover:underline"
          >
            {open ? "Hide reason" : "View reject reason"}
          </button>

          {open && (
            <div className="mt-2 bg-red-100 border border-red-300 rounded-lg p-3 text-sm text-red-700">
              {item.reject_reason || "No reason provided"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const KitchenStatus = () => {
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { toggleFullScreen } = useFullScreen();
  const [isOpen, setOpen] = useState(true);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("ongoing");

  // ===== GET KITCHEN STATUS =====
  useEffect(() => {
    const fetchKitchenStatus = async () => {
      try {
        const res = await axios.get(
          `${API_BASE_URL}/printkitchen/kot-history`,
          {
            headers: { Authorization: token },
          }
        );

        if (res.data.success) setOrders(res.data.data || []);
        else setOrders([]);
      } catch (error) {
        console.error("Kitchen KOT API Error:", error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchKitchenStatus();
    const interval = setInterval(fetchKitchenStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (time) => {
    if (!time) return "--";
    const date = new Date(time);
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // const filteredOrders = orders.filter((o) => {
  //   const itemStatuses = o.items.map((i) => (i.status || "").toLowerCase());

  //   if (activeTab === "ongoing")
  //     return itemStatuses.some((s) => s === "" || s === "pending");

  //   if (activeTab === "accepted")
  //     return itemStatuses.some((s) => s === "accepted");

  //   if (activeTab === "completed")
  //     return itemStatuses.every((s) => s === "completed");

  //   if (activeTab === "rejected")
  //     return itemStatuses.some((s) => s === "rejected");

  //   return true;
  // });

  // ===== TOP NAV TABS =====
 
 const filteredOrders = orders.filter((o) => {
  const itemStatuses = o.items.map((i) =>
    (i.status || "pending").toLowerCase()
  );

  if (activeTab === "ongoing")
    return itemStatuses.some((s) => s === "pending");

  if (activeTab === "accepted")
    return itemStatuses.some((s) => s === "accepted");

  if (activeTab === "completed")
    return itemStatuses.every((s) => s === "completed");

  if (activeTab === "rejected")
    return itemStatuses.some((s) => s === "rejected");

  return true;
});

  const OrderButtons = [
    { title: "New Order", icon: <MdCropRotate />, link: "/order-list" },
    { title: "On Going Order", icon: <CiSaveDown2 />, link: "/ongoing-order" },
    { title: "Kitchen Status", icon: <FaKitchenSet /> },
    { title: "QR Order", icon: <IoQrCodeOutline />, link: "/qr-order" },
    { title: "Online Order", icon: <IoMdCart />, link: "/online-order" },
    { title: "Today Order", icon: <RiTodoLine />, link: "/today-order" },
  ];

  const getStatusLabel = (status) => {
    status = (status || "").toLowerCase();

    if (status === "accepted") return "Processing";
    if (status === "completed") return "Ready";
    if (status === "rejected") return "Rejected";
    if (status === "" || status === "pending") return "Kitchen Not Accept";

    return status.toUpperCase();
  };

  return (
    <div className="main_div">
      <section className="side_section flex">
        <div className={`${!isOpen ? "hidden" : "h-screen overflow-y-auto"}`}>
          <Nav />
        </div>

        <header>
          <Hamburger toggled={isOpen} toggle={setOpen} />
        </header>

        <div className="w-full px-4">
          {/* ========= Header Bar ========= */}
          <section className="flex justify-between pt-3">
            <div className="flex gap-2">
              {OrderButtons.map((val, index) => (
                <NavLink
                  key={index}
                  to={val.link || "#"}
                  className={({ isActive }) =>
                    `h-[60px] px-7 py-3 rounded-md flex items-center gap-3 font-semibold ${
                      val.title === "Kitchen Status" || isActive
                        ? "bg-[#4CBBA1] text-white"
                        : "bg-[#1C1D3E] text-white hover:bg-[#4CBBA1]"
                    }`
                  }
                >
                  {val.icon}
                  {val.title}
                </NavLink>
              ))}
            </div>

            <div className="flex gap-3">
              <IoMdNotifications className="bg-[#1C1D3E] text-white h-[60px] px-7 py-3 rounded-md cursor-pointer" />
              <MdOutlineZoomOutMap
                onClick={toggleFullScreen}
                className="bg-[#1C1D3E] text-white h-[60px] px-7 py-3 rounded-md cursor-pointer"
              />
            </div>
          </section>

          {/* ========= STATUS FILTER TABS ========= */}
          <div className="mt-8 flex gap-4">
            {[
              { key: "ongoing", label: "On Going" },
              { key: "accepted", label: "Accepted" },
              { key: "completed", label: "Completed" },
              { key: "rejected", label: "Rejected" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-6 py-2 rounded-md font-semibold border
                  ${
                    activeTab === tab.key
                      ? "bg-[#4CBBA1] text-white border-[#4CBBA1]"
                      : "bg-white border-gray-400 text-gray-700 hover:bg-gray-200"
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ========= CONTENT ========= */}
          <section className="mt-10">
            {loading && <div>Loading kitchen orders...</div>}

            {!loading && filteredOrders.length === 0 && (
              <div className="text-center text-lg text-gray-600">
                No {activeTab} orders found
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
              {filteredOrders.map((order, index) => {
                const statuses = order.items.map((i) =>
                  (i.status || "").toLowerCase()
                );

                const hasPending = statuses.some(
                  (s) => s === "" || s === "pending"
                );

                const hasAccepted = statuses.some((s) => s === "accepted");

                const allCompleted =
                  statuses.length > 0 &&
                  statuses.every((s) => s === "completed");

                const getHeaderColor = () => {
                  if (allCompleted) return "bg-green-700"; // Ready
                  if (hasAccepted && !hasPending) return "bg-yellow-600"; // Processing
                  return "bg-red-700"; // Pending
                };

                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl shadow-xl border overflow-hidden hover:scale-[1.01] transition"
                  >
                    {/* HEADER */}
                    <div className={`p-4 text-white ${getHeaderColor()}`}>
                      <div className="flex justify-between text-sm font-semibold">
                        <div>
                          <div>Table: {order.table_name}</div>
                          <div>Token: {order.tokenno || "-"}</div>
                        </div>

                        <div className="text-right">
                          <div>Order #{order.order_id}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-4 space-y-3">
                      {order.items.map((item) => (
                        <KitchenItemCard
                          key={item.id}
                          item={item}
                          formatTime={formatTime}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
};

export default KitchenStatus;
