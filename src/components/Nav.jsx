import React, { useEffect, useState, useContext } from "react";
import defaultLogo from "../assets/images/Group 206124.png";
import { NavLink, useLocation } from "react-router-dom";
import { VscArrowLeft } from "react-icons/vsc";
import { IoHome, IoSettingsOutline, IoSettings } from "react-icons/io5";
import { SiFoodpanda } from "react-icons/si";
import { SlPeople } from "react-icons/sl";
import { SiUikit } from "react-icons/si";
import { GoGraph } from "react-icons/go";
import { GiCook } from "react-icons/gi";
import { FaRegTrashCan } from "react-icons/fa6";
import { RiDashboard3Fill } from "react-icons/ri";
import { FaBriefcase, FaCartShopping, FaCaretDown } from "react-icons/fa6";
import { IoIosPeople } from "react-icons/io";
import { FaFirstOrder, FaLock, FaTags } from "react-icons/fa";
import { AuthContext } from "../store/AuthContext";
import { FaTrophy } from "react-icons/fa";
import { MdInventory } from "react-icons/md";
import axios from "axios";
const Nav = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const { permissions, isAdmin } = useContext(AuthContext);
  const [open, setOpen] = useState(true);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);
  const location = useLocation();
  const [data, setData] = useState(null);
  const [data2, setData2] = useState(null);
  const { isLogin, logoutUser } = useContext(AuthContext);
  const token = localStorage.getItem("token");
  useEffect(() => {
    Menus.forEach((menu, index) => {
      if (menu.submanu) {
        menu.submanuItems.forEach((subItem) => {
          if (location.pathname === subItem.link) {
            setOpenSubmenuIndex(index);
          }
        });
      }
    });
  }, [location.pathname]);

  const hasAnyPermission = (moduleName) => {
    if (isAdmin) {
      return true;
    }

    const modulePermissions = permissions.find(
      (perm) => perm.module_name === moduleName,
    );
    return (
      modulePermissions &&
      (modulePermissions.can_access === 1 ||
        modulePermissions.can_create === 1 ||
        modulePermissions.can_edit === 1 ||
        modulePermissions.can_delete === 1)
    );
  };
  const toggleSubmenu = (index) => {
    if (!open) setOpen(true);
    setOpenSubmenuIndex(openSubmenuIndex === index ? null : index);
  };
  const Menus = [
    {
      title: "Dashboard",
      link: "/",
      icon: <RiDashboard3Fill />,
    },
    {
      title: "Manage Order",
      submanu: true,
      icon: <FaFirstOrder />,
      submanuItems: [
        { title: "POS Invoice", link: "/order-list" },
        { title: "Order List", link: "/orders-list" },
        { title: "Pending Order", link: "/pending-order" },
        { title: "Complete Order", link: "/complete-order" },
        { title: "Cancel Order", link: "/cancel-order" },
        { title: "Kitchen Dashboard", link: "/kitchen-dashboard" },
        // { title: "Kitchen Dashboard", link: "/kitchen-dashboard" },
        // { title: "Counter Dashboard", link: "/working" },
        // { title: "Counter list", link: "/counter-list" },
        // { title: "POS Setting", link: "/pos-setting" },
      ],
    },
    {
      title: "Reservation",
      submanu: true,
      icon: <FaTags />,
      submanuItems: [
        { title: "All Reservations", link: "/reservation" },
        { title: "Add Booking", link: "/add-booking" },
        { title: "Unavailable today", link: "/unavailability-days" },
        // { title: "Reservation setting", link: "/reservation-setting" },
      ],
    },
    {
      title: "Purchase Manage",
      icon: <FaCartShopping />,
      submanu: true,
      submanuItems: [
        { title: "Purchase Item", link: "/purchase-item" },
        { title: "Add Purchase", link: "/add-purchase" },
        { title: "Purchase Return", link: "/purchase-return" },
        { title: "Return Invoice", link: "/return-invoice" },
        { title: "Supplier Manage", link: "/supplier-manage" },
        { title: "Supplier Ledger", link: "/supplier-ladger" },
      ],
    },
    {
      title: "Food Management",
      icon: <IoHome />,
      submanu: true,
      submanuItems: [
        { title: "Add Category", link: "/add-category" },
        { title: "Category List", link: "/category-list" },
        { title: "Add Food", link: "/add-food" },
        { title: "Food List", link: "/food-list", module_name: "Food List" },
        { title: "Menu Type", link: "/menu-type" },
        { title: "Add Ons", link: "/add-ons" },
      ],
    },
    {
      title: "Recipe Management",
      icon: <GiCook />,
      submanu: true,
      submanuItems: [
        { title: "Set Production Unit", link: "/set-production-unit" },
        { title: "Production Set List", link: "/set-production-list" },
        { title: "Add Production", link: "/add-production" },
        // { title: "Production Setting", link: "/working" },
      ],
    },

    {
      title: "Inventory Management",
      icon: <MdInventory />,
      submanu: true,
      submanuItems: [
        { title: "Ingredient stock list", link: "/stock-list" },
        { title: "Stock out ingredients", link: "/stock-out-ingredients" },
      ],
    },

    {
      title: "Loyalty",
      icon: <FaTrophy />,
      submanu: true,
      submanuItems: [
        { title: "Point Setting", link: "/point-setting" },
        { title: "Customer Point List", link: "/customer-point" },
        // { title: "Cash Adjustment", link: "/working" },
        // { title: "Debit Voucher", link: "/working" },
        // { title: "Credit Voucher", link: "/working" },
        // { title: "Contra Voucher", link: "/working" },
        // { title: "Journal Voucher", link: "/working" },
        // { title: "Voucher Approved", link: "/working" },
        // { title: "Account Report", link: "/working" },
      ],
    },
    {
      title: "Roles & Permission",
      icon: <FaLock />,
      submanu: true,
      submanuItems: [
        // { title: "Permission Setup", link: "/premission-setup" },
        { title: "Add Role", link: "/add-role" },
        { title: "Role List", link: "/rolelist" },
        { title: "User Access Role", link: "/user-access-role" },
      ],
    },
    {
      title: "User & Staff",
      icon: <SlPeople />,
      submanu: true,
      submanuItems: [
        { title: "Add User", link: "/add-user" },
        { title: "User List", link: "/user-list" },
      ],
    },
    {
      title: "Report",
      icon: <GoGraph />,
      submanu: true,
      submanuItems: [
        { title: "Purchase Report", link: "/purchase-report" },
        { title: "Stock Report (Food Items)", link: "/foodstock-report" },
        { title: "Stock Report (Kitchen)", link: "/kitchenstock-report" },
        { title: "Delivery Type Sales Report", link: "/deliverytype-report" },
        { title: "Sale Report", link: "/sale-report" },
        { title: "Waiter Sale Report", link: "/waitersale-report" },
        { title: "Service Charge Report", link: "/servicecharge-report" },
        { title: "Sale Report Cashie", link: "/cashier-report" },
        { title: "Item Sales Report", link: "/itemsale-report" },
        { title: "Cash Register Report", link: "/case-register-report" },
        { title: "Sale Report Filtering", link: "/sale-report-filter" },
        { title: "Sale By Date", link: "/saleby-day" },
        { title: "Sale By Table", link: "/saleby-table" },

        { title: "Commission Report", link: "/commission" },
      ],
    },
    {
      title: "Master Set UP",
      icon: <SiUikit />,
      submanu: true,
      submanuItems: [
        { title: "Unit Measurement", link: "/unit-measurement" },
        { title: "Ingredients", link: "/ingredient-list" },
        { title: "Kitchen List", link: "/kitchen-list" },
        { title: "Printers", link: "/printer-list" },
        { title: "Table & Floor Manage", link: "/table-list" },
        { title: "All Table-QR", link: "/alltable-Qr" },
        { title: "Add Customers", link: "/add-customer" },
        { title: "Order Type", link: "/customer-type" },
        { title: "Shipping Type", link: "/shipping-type" },
        { title: "Commission Setting", link: "/commission-setting" },
      ],
    },
    {
      title: "Human Resource",
      icon: <IoIosPeople />,
      submanu: true,
      submanuItems: [
        { title: "Designation", link: "/designation" },
        { title: "Add Employee", link: "/add-employee" },
        { title: "Manage Employee", link: "/manageemployee" },
        { title: "Add Expense Item", link: "/addexpenseitem" },
        { title: "Add Expense", link: "/addexpense" },
        { title: "Department", link: "/department" },
        { title: "Division", link: "/division" },
        ,
        { title: "Holiday", link: "/holiday" },
        { title: "Leave Type", link: "/leavetype" },
        { title: "Leave Application", link: "/leaveapplication" },
        // { title: "Payroll", link: "/working" },
      ],
    },

    // {
    //   title: "Setting",
    //   icon: <IoSettings />,
    //   submanu: true,
    //   submanuItems: [
    //     { title: "Payment Method Setting", link: "/working" },
    //     { title: "SMS Setting", link: "/working" },
    //     { title: "Bank", link: "/working" },
    //     { title: "Language", link: "/working" },
    //     { title: "Sound Setting", link: "/working" },
    //   ],
    // },
    {
      title: "Waste Tracking",
      icon: <FaRegTrashCan />,
      submanu: true,
      submanuItems: [
        { title: "Packaging Food", link: "/packaging-food" },
        { title: "Purchase Food Waste", link: "/purchasefood-waste" },
        { title: "Making Food Waste", link: "/makingfood-waste" },
      ],
    },
    {
      title: "Web Setting",
      icon: <IoSettingsOutline />,
      submanu: true,
      submanuItems: [
        { title: "Common Setting", link: "/common-setting" },
        { title: "Sound Setting", link: "/sound-setting" },
        { title: "My Subscription", link: "/my-subscription" },
        // { title: "Banner Setting", link: "/working" },
        // { title: "Menu Setting", link: "/working" },
        // { title: "SEO Setting", link: "/working" },
        // { title: "Widget Setting", link: "/working" },
        // { title: "Email Setting", link: "/working" },
        // { title: "Customer Setting", link: "/working" },
        // { title: "Coupon List", link: "/working" },
        // { title: "Subscribe List", link: "/working" },
        // { title: "Tyro", link: "/working" },
      ],
    },
  ];

  const fetchImageData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/websetting`, { headers: { Authorization: token } });
      console.log("API Response:", response);

      if (response?.data?.data && Array.isArray(response.data.data)) {
        if (response.data.data.length > 0) {
          setData(response.data.data[0]);
          // console.log("Set data to:", response.data.data[0]);
        } else {
          // console.warn("Data array is empty");
          setData(null);
        }
      } else {
        // console.warn("Data is not in the expected format:", response.data);
        setData(null);
      }
    } catch (error) {
      console.error("Error fetching image data:", error);
    }
  };
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const logoUrls = data2?.fevicon ? `${VITE_IMG_URL}${data2.fevicon}` : null;

  const fetchImageData2 = () => {
    axios
      .get(`${API_BASE_URL}/websetting`, { headers: { Authorization: token } })
      .then((response) => {
        setData2(response.data.data);
        console.log("data shiw to imag", data);
      })
      .catch((error) => {
        console.error("Error fetching image data:", error);
      });
  };
  useEffect(() => {
    fetchImageData();
    fetchImageData2();
  }, []);

  return (
    <div
      className={`bg-[#1C1D3E] text-zinc-100 h-screen overflow-y-auto p-5 pt-8 ${
        open ? "w-64" : "w-20"
      } relative duration-500 sticky top-0`}
    >
      <VscArrowLeft
        className={`bg-black  text-3xl rounded-full absolute -right-3 top-9 border border-black cursor-pointer ${
          !open && "rotate-180"
        }`}
        onClick={() => setOpen(!open)}
      />
      <div className="flex items-center gap-3 mt-5 py-3">
        {/* <SiFoodpanda
          className="text-4xl float-left block cursor-pointer mr-2"

        /> */}
        <span onClick={() => setOpen(!open)}>
          <img
            src={logoUrls || defaultLogo}
            alt="Logo"
            className="float-start cursor-pointer mr-2"
            width={70}
          />
        </span>
        <h1
          className={`text-2xl cursor-pointer font-bold origin-left ${
            !open && "hidden"
          }`}
        >
          {data?.restro_name || "Restro POS"}
        </h1>
      </div>
      <div>
        {Menus.map((items, index) => {
          // Filter submenu items based on permissions
          const filteredSubmenuItems = items.submanuItems
            ? items.submanuItems.filter((subItem) =>
                hasAnyPermission(subItem.title),
              )
            : [];

          // Skip rendering if it's a submenu and has no accessible items
          if (items.submanu && filteredSubmenuItems.length === 0) return null;

          return (
            <div key={index}>
              <ul>
                <li
                  className={`text-lg flex  items-center gap-x-2 cursor-pointer p-2 hover:bg-[#4cddA1] hover:scale-105 duration-150 rounded-md mt-2${
                    location.pathname === items.link
                      ? "bg-[#4cddA1] text-zinc-900"
                      : ""
                  }`}
                  onClick={() => items.submanu && toggleSubmenu(index)}
                >
                  <span className="text-2xl">{items.icon}</span>
                  <span className={`flex-1 ${!open && "hidden"}`}>
                    <NavLink
                      to={items.link}
                      className={({ isActive }) =>
                        isActive ? "text-[#ffffff]" : "text-zinc-100 "
                      }
                    >
                      {items.title}
                    </NavLink>
                  </span>
                  {items.submanu && open && (
                    <FaCaretDown
                      className={`${
                        openSubmenuIndex === index ? "rotate-180" : ""
                      } duration-500`}
                    />
                  )}
                </li>

                {/* Render sub-menu items only if they exist and are accessible */}
                {items.submanu && openSubmenuIndex === index && open && (
                  <ul className="ml-8 rounded-sm">
                    {filteredSubmenuItems.map((subItem, subIndex) => (
                      <li
                        key={subIndex}
                        className={`duration-500 text-sm flex items-center gap-x-2 cursor-pointer p-2 rounded-md mt-2 ${
                          location.pathname === subItem.link
                            ? "bg-[#464747] text-zinc-900"
                            : ""
                        }`}
                      >
                        <NavLink
                          to={subItem.link}
                          // target={
                          //   subItem.link === "/order-list" ? "_blank" : "_self"
                          // }
                          className={({ isActive }) =>
                            isActive ? "text-[#4cddA1]" : "text-zinc-100"
                          }
                        >
                          {subItem.title}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </ul>
            </div>
          );
        })}

        {localStorage.getItem("subscriptionStatus") === "expired" && (
          <div className={`mt-4 rounded-md bg-red-600 text-white text-xs p-3 ${!open && "hidden"}`}>
            <p className="font-bold mb-1">⚠️ Subscription Expired</p>
            <p className="mb-2">Renew your plan to keep using all features.</p>
            <NavLink
              to="/my-subscription"
              className="underline font-semibold hover:text-red-200"
            >
              View Subscription →
            </NavLink>
          </div>
        )}

        {isLogin ? (
          <li
            className="text-lg flex items-center gap-x-2 rounded-md cursor-pointer p-2 hover:bg-[#4cddA1] hover:scale-105 duration-150"
            onClick={logoutUser}
          >
            Log-out
          </li>
        ) : (
          <li className="text-lg flex items-center gap-x-2 cursor-pointer p-2 hover:bg-[#4cddA1] hover:scale-105 duration-150">
            <NavLink to="/log-in" className="nav-link">
              Log-In
            </NavLink>
          </li>
        )}
      </div>
    </div>
  );
};

export default Nav;
