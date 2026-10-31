import React, { useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications } from "react-icons/io";
import { MdOutlineZoomOutMap } from "react-icons/md";
import useFullScreen from "../../components/useFullScreen";
import axios from "axios";

const KitchenDashboard = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const token = localStorage.getItem("token");

  const [isOpen, setOpen] = useState(true);
  const { toggleFullScreen } = useFullScreen();

  const [activeKitchen, setActiveKitchen] = useState(null);
  const [kitchenData, setKitchenData] = useState([]);
  const [kotOrders, setKotOrders] = useState([]);

  const [selectedItems, setSelectedItems] = useState({});
  const [rejectModal, setRejectModal] = useState(null);
  const [reason, setReason] = useState("");

  const [confirmAll, setConfirmAll] = useState(null);

  // Get Kitchen List
  const getkitchenData = async () => {
    const res = await axios.get(`${API_BASE_URL}/getkitchen`, {
      headers: { Authorization: token },
    });
    return res.data || [];
  };

  // Get Orders
  const getKitchenOrders = async () => {
    const res = await axios.get(`${API_BASE_URL}/printkitchen/kot-list`, {
      headers: { Authorization: token },
    });
    return res.data.data || [];
  };

  useEffect(() => {
    const loadData = async (isFirstLoad = false) => {
      const [kitchens, orders] = await Promise.all([getkitchenData(), getKitchenOrders()]);
      setKitchenData(kitchens);
      setKotOrders(orders);
      // Auto-select only on first load so user's manual tab selection isn't overridden
      if (isFirstLoad && kitchens.length > 0) {
        const kitchenWithOrders = kitchens.find((k) =>
          orders.some((o) => Number(o.kitchen_id) === Number(k.id))
        );
        setActiveKitchen(
          kitchenWithOrders ? kitchenWithOrders.id : kitchens[0].id
        );
      }
    };
    loadData(true);
    const interval = setInterval(() => loadData(false), 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredOrders = kotOrders.filter(
    (o) => Number(o.kitchen_id) === Number(activeKitchen),
  );

  // Toggle single checkbox
  const toggleItem = (orderId, itemId) => {
    setSelectedItems((prev) => {
      const order = prev[orderId] || [];
      return order.includes(itemId)
        ? { ...prev, [orderId]: order.filter((id) => id !== itemId) }
        : { ...prev, [orderId]: [...order, itemId] };
    });
  };

  // Open Select All Modal
  const toggleAll = (order) => {
    setSelectedItems((prev) => ({
      ...prev,
      [order.order_id]: order.items.map((item) => item.id),
    }));
  };

  // Confirm Select All
  // const confirmAllSelection = () => {
  //   setSelectedItems((prev) => ({
  //     ...prev,
  //     [confirmAll.order_id]: confirmAll.items.map((item) => item.id),
  //   }));
  // };
  const confirmAllSelection = async () => {
    const item_ids = confirmAll.items.map((item) => item.id);

    // select all items
    setSelectedItems((prev) => ({
      ...prev,
      [confirmAll.order_id]: item_ids,
    }));

    // 👇 AUTO ACTION
    if (confirmAll.action === "accept") {
      await axios.post(
        `${API_BASE_URL}/printkitchen/order/accept`,
        {
          order_id: confirmAll.order_id,
          kitchen_id: confirmAll.kitchen_id,
          item_ids,
        },
        { headers: { Authorization: token } },
      );
    }

    if (confirmAll.action === "prepared") {
      await axios.post(
        `${API_BASE_URL}/printkitchen/order/complete`,
        {
          order_id: confirmAll.order_id,
          kitchen_id: confirmAll.kitchen_id,
          item_ids,
        },
        { headers: { Authorization: token } },
      );
    }

    setConfirmAll(null);
    setKotOrders(await getKitchenOrders());
  };

  // Accept Order
  const handleAccept = async (orderId, kitchenId) => {
    const order = kotOrders.find((o) => o.order_id === orderId);

    if (!selectedItems[orderId] || selectedItems[orderId].length === 0) {
      setConfirmAll({
        order_id: orderId,
        kitchen_id: kitchenId,
        items: order?.items || [],
        action: "accept",
      });
      return;
    }

    // 👇 Convert selected index → actual item.id
    const item_ids = selectedItems[orderId];

    await axios.post(
      `${API_BASE_URL}/printkitchen/order/accept`,
      { order_id: orderId, kitchen_id: kitchenId, item_ids },
      { headers: { Authorization: token } },
    );

    setKotOrders(await getKitchenOrders());
  };

  const handlePrepared = async (orderId, kitchenId) => {
    const order = kotOrders.find((o) => o.order_id === orderId);

    if (!selectedItems[orderId] || selectedItems[orderId].length === 0) {
      setConfirmAll({
        order_id: orderId,
        kitchen_id: kitchenId,
        items: order?.items || [],
        action: "prepared",
      });

      return;
    }

    const item_ids = selectedItems[orderId];

    await axios.post(
      `${API_BASE_URL}/printkitchen/order/complete`,
      { order_id: orderId, kitchen_id: kitchenId, item_ids },
      { headers: { Authorization: token } },
    );

    setKotOrders(await getKitchenOrders());
  };

  // Submit Reject
  const submitReject = async () => {
    if (!reason.trim()) {
      alert("Please enter reject reason");
      return;
    }

    await axios.post(
      `${API_BASE_URL}/printkitchen/order/reject`,
      {
        order_id: rejectModal.orderId,
        kitchen_id: rejectModal.kitchenId,
        reason,
      },
      { headers: { Authorization: token } },
    );

    // 🚀 UI se order turant hata do
    setKotOrders((prev) =>
      prev.filter((o) => o.order_id !== rejectModal.orderId),
    );

    setRejectModal(null);
    setReason("");
  };

  const handlePrintKOT = async (order) => {
    // Try configured kitchen printer first
    try {
      await axios.post(
        `${API_BASE_URL}/printkitchenkot/${order.kitchen_id}`,
        { order_id: order.order_id },
        { headers: { Authorization: token } },
      );
      return; // Sent to configured printer — done
    } catch {
      // No printer configured — fall back to browser print dialog
    }

    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString();

    const itemRows = order.items
      .map(
        (item) => `
        <tr>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;">${item.name}</td>
          <td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:center;">${item.qty}</td>
        </tr>`,
      )
      .join("");

    const html = `
      <html><head><title>KOT</title>
      <style>
        body { font-family: monospace; width: 280px; margin: 0 auto; font-size: 13px; }
        h2 { text-align: center; margin: 4px 0; }
        p { margin: 2px 0; }
        table { width: 100%; border-collapse: collapse; margin-top: 8px; }
        th { background: #222; color: #fff; padding: 6px 8px; text-align: left; }
        th:last-child { text-align: center; }
        hr { border: 1px dashed #000; }
      </style></head>
      <body>
        <h2>Kitchen Order Ticket</h2>
        <hr/>
        <p><b>Table:</b> ${order.table_name || "--"}</p>
        <p><b>Order #:</b> ${order.saleinvoice || order.order_id}</p>
        <p><b>Token:</b> ${order.tokenno || "--"}</p>
        <p><b>Date:</b> ${dateStr} ${timeStr}</p>
        <hr/>
        <table>
          <thead><tr><th>Item</th><th>Qty</th></tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
        <hr/>
      </body></html>`;

    const win = window.open("", "_blank", "width=320,height=500");
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  return (
    <>
      <div className="main_div">
        <section className="side_section flex">
          <div className={`${!isOpen ? "hidden" : "h-screen overflow-y-auto"}`}>
            <Nav />
          </div>

          <header>
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>

          <div className="w-full ml-4 pr-7 mt-4">
            <div className="flex justify-between">
              <h1 className="font-semibold">Kitchen Dashboard</h1>

              <div className="flex gap-4">
                <IoMdNotifications className="bg-[#1C1D3E] text-white p-1 text-4xl rounded-sm" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className="bg-[#1C1D3E] text-white p-1 text-4xl rounded-sm cursor-pointer"
                />
              </div>
            </div>

            {/* Kitchen Tabs */}
            <div className="flex gap-3 my-6">
              {kitchenData.map((k) => (
                <button
                  key={k.id}
                  onClick={() => setActiveKitchen(k.id)}
                  className={`px-4 py-2 border rounded-lg ${
                    activeKitchen === k.id
                      ? "bg-green-600 text-white"
                      : "border-green-500 text-green-700"
                  }`}
                >
                  {k.kitchen_name}
                </button>
              ))}
            </div>

            {/* Orders */}
            <div className="grid grid-cols-2 gap-6">
              {filteredOrders.length ? (
                filteredOrders.map((order) => {
                  const allAccepted = order.items.every(
                    (i) => i.status === "accepted" || i.status === "completed",
                  );

                  const allCompleted = order.items.every(
                    (i) => i.status === "completed",
                  );

                  return (
                    <div
                      key={order.order_id}
                      className="rounded-xl shadow-lg overflow-hidden border"
                    >
                      {/* HEADER */}
                      <div
                        className={`p-4 text-white ${
                          allAccepted ? "bg-green-600" : "bg-red-600"
                        }`}
                      >
                        <div className="flex justify-between font-bold text-lg">
                          <span>Table: {order.table_name}</span>
                          <span>Order: #{order.order_id}</span>
                        </div>

                        <div className="flex justify-between mt-1 text-sm font-semibold">
                          <span>Token: {order.tokenno || "--"}</span>
                          <span>Customer Name: Walk-In</span>
                        </div>
                      </div>

                      {/* COOKING TIME */}
                      <div
                        className={`px-5 py-2 text-white font-semibold ${
                          allAccepted ? "bg-green-700" : "bg-red-700"
                        }`}
                      >
                        Cooking Time: Time Over
                      </div>

                      {/* BODY */}
                      <div className="bg-white p-5">
                        {order.items.map((item) => {
                          // ✅ Correct checkbox state logic
                          const isChecked =
                            selectedItems[order.order_id]?.includes(item.id) ??
                            (item.status === "accepted" ||
                              item.status === "completed");

                          return (
                            <div
                              key={item.id}
                              className="flex justify-between border-b pb-3 mb-3"
                            >
                              <div className="flex gap-2 items-start">
                                <input
                                  type="checkbox"
                                  disabled={item.status === "completed"} // completed locked
                                  checked={isChecked}
                                  onChange={() =>
                                    toggleItem(order.order_id, item.id)
                                  }
                                  className="w-5 h-5"
                                />

                                <div>
                                  <p className="font-bold">{item.name}</p>
                                </div>
                              </div>

                              <span className="font-bold text-lg">
                                {item.qty}X
                              </span>
                            </div>
                          );
                        })}

                        {/* FOOTER */}
                        <div className="flex justify-between items-center mt-2">
                          {/* ALL CHECK */}
                          <div className="flex gap-2 items-center">
                            <input
                              type="checkbox"
                              onChange={() => toggleAll(order)}
                              className="w-5 h-5"
                            />
                            <span className="font-semibold">All</span>
                          </div>

                          {/* BUTTONS */}
                          {allAccepted ? (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handlePrepared(
                                    order.order_id,
                                    order.kitchen_id,
                                  )
                                }
                                className="bg-green-600 px-7 py-2 rounded text-white font-semibold hover:bg-green-700"
                              >
                                Prepared
                              </button>

                              <button
                                onClick={() => handlePrintKOT(order)}
                                className="bg-sky-400 px-4 py-2 rounded text-white text-xl hover:bg-sky-500"
                              >
                                🖨
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() =>
                                  handleAccept(order.order_id, order.kitchen_id)
                                }
                                className="bg-green-600 px-7 py-2 rounded text-white font-semibold hover:bg-green-700"
                              >
                                Accept
                              </button>

                              <button
                                onClick={() =>
                                  setRejectModal({
                                    orderId: order.order_id,
                                    kitchenId: order.kitchen_id,
                                  })
                                }
                                className="bg-red-500 px-7 py-2 rounded text-white font-semibold hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="col-span-2 text-center text-2xl text-green-600">
                  No Order Found !!!
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Confirm All Modal */}
        {confirmAll && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white shadow-2xl rounded-xl w-[480px] p-6 border border-green-300">
              <h2 className="text-2xl font-bold text-green-700 text-center mb-3">
                Select All Items?
              </h2>

              <p className="text-gray-600 text-center">
                This will select all items in
                <span className="font-semibold text-black">
                  {" "}
                  Order #{confirmAll.order_id}
                </span>
              </p>

              <div className="mt-6 flex justify-center gap-4">
                <button
                  onClick={() => setConfirmAll(null)}
                  className="px-5 py-2 rounded-lg border border-gray-400 hover:bg-gray-200"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmAllSelection}
                  className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700"
                >
                  Yes, Select All
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <div className="fixed inset-0 flex justify-center items-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white shadow-2xl rounded-xl w-[500px] p-6 border border-red-300">
              <h2 className="text-2xl font-bold text-red-600 text-center mb-2">
                Cancel Order
              </h2>

              <p className="text-gray-600 text-center mb-4">
                You are rejecting
                <span className="font-semibold text-black">
                  {" "}
                  Order #{rejectModal.orderId}
                </span>
              </p>

              <textarea
                className="w-full border rounded-lg p-3 focus:ring-2 focus:ring-red-400 outline-none"
                rows={3}
                placeholder="Enter reject reason..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setRejectModal(null)}
                  className="px-5 py-2 rounded-lg border border-gray-400 hover:bg-gray-200"
                >
                  Close
                </button>

                <button
                  onClick={submitReject}
                  className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700"
                >
                  Submit
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default KitchenDashboard;
