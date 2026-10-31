import React, { useEffect, useState } from "react";
import Hamburger from "hamburger-react";
import Nav from "../../components/Nav";
import axios from "axios";

const AllTableQr = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const [isOpen, setOpen] = useState(true);
  const [tableData, setTableData] = useState([]);

  const token = localStorage.getItem("token");

  // 🔥 AUTO DETECT BASE URL
  const getBaseUrl = () => {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = "5173"; // vite port

    const url = `${protocol}//${hostname}:${port}`;
    console.log("🌐 Base URL:", url);

    return url;
  };

  // 🔥 GET TABLE DATA
  const getallTable = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/table`, {
        headers: {
          Authorization: token,
        },
      });

      console.log("✅ Table API Response:", res.data);

      if (res.data && Array.isArray(res.data.data)) {
        setTableData(res.data.data);
      } else {
        console.warn("⚠️ Invalid table data format");
        setTableData([]);
      }
    } catch (error) {
      console.error("❌ Table API Error:", error);
    }
  };

  useEffect(() => {
    getallTable();
  }, []);

  useEffect(() => {
    console.log("📦 Updated tableData:", tableData);
  }, [tableData]);

  // 🔥 QR GENERATOR
  const generateQrUrl = (tableId) => {
    const baseUrl = getBaseUrl();
    const finalUrl = `${baseUrl}/#/qr-orders/${tableId}`;

    console.log("🔗 QR URL:", finalUrl);

    return `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
      finalUrl,
    )}&size=200x200`;
  };

  return (
    <div className="main_div">
      <section className="side_section flex">
        {/* Sidebar */}
        <div
          className={`${
            isOpen
              ? "nav-container hide-scrollbar h-screen overflow-y-auto"
              : "hidden"
          }`}
        >
          <Nav />
        </div>

        {/* Header */}
        <header>
          <Hamburger toggled={isOpen} toggle={setOpen} />
        </header>

        {/* Main */}
        <div className="w-full p-5">
          <section className="mt-5">
            <div className="flex justify-between p-5 border border-black rounded-md bg-slate-50">
              <h1 className="font-bold text-2xl">ALL TABLE QR CODE</h1>
            </div>

            <section className="qr grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-6 border border-black p-5 rounded-md">
              {Array.isArray(tableData) && tableData.length > 0 ? (
                tableData.map((val) => (
                  <div key={val.tableid} className="text-center">
                    <img
                      className="border border-emerald-200 rounded-md p-3"
                      src={generateQrUrl(val.tableid)}
                      alt="QR Code"
                    />

                    <h1 className="mt-2 font-semibold text-lg">
                      {val.tablename} QR CODE
                    </h1>
                  </div>
                ))
              ) : (
                <p className="col-span-full text-center text-gray-500">
                  No Tables Found
                </p>
              )}
            </section>
          </section>
        </div>
      </section>
    </div>
  );
};

export default AllTableQr;
