import React, { useEffect, useRef, useState, useContext } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { NavLink } from "react-router-dom";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoIosPersonAdd } from "react-icons/io";
import { CiCircleList } from "react-icons/ci";
import { FaKitchenSet, FaMagnifyingGlass } from "react-icons/fa6";
import { IoQrCodeOutline, IoPizzaOutline } from "react-icons/io5";
import { GiKnifeFork } from "react-icons/gi";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import { IoIosMan } from "react-icons/io";

import { MdTableBar, MdOutlineZoomInMap } from "react-icons/md";
import defaultimage from "../../assets/images/pizza.jpeg";
import { toast } from "react-toastify";
import {
  FaHandHoldingUsd,
  FaNetworkWired,
  FaCalculator,
  FaMoneyCheck,
  FaKeyboard,
  FaRegTrashAlt,
} from "react-icons/fa";
import { FaCaretDown } from "react-icons/fa6";
import DialogBoxSmall from "../../components/DialogBoxSmall";
import axios from "axios";
import DialogBox from "../../components/DialogBox";
import TableDialogBox from "../../components/TableDialogBox";
import AddonDialogBox from "../../components/AddonDialogBox";
import { ComponentToPrint } from "../../components/ComponentToPrint";
import CompleteOrderDialogBox from "../../components/CompleteOrderDialogBox";
import { ComponentToPrintInvoice } from "../../components/ComponentToPrintInvoice";
import { PrintToKitchenPrinter } from "../../components/PrintToKitchenPrinter";
import { AuthContext } from "../../store/AuthContext";
import useFullScreen from "../../components/useFullScreen";

import CashRegisterModel from "../../components/CashRegisterModel";
import DraftOrder from "./DraftOrder";

const DataTable = ({ total, vat, subtotal }) => {
  return (
    <div className="bg-[#4CBBA1] mb-4 rounded-sm p-2 text-white">
      {/* Subtotal & VAT in a Single Line */}
      <div className="flex justify-between items-center">
        <h1>Subtotal: $ {subtotal}</h1>
        <h1>VAT: $ {vat}</h1>
      </div>

      {/* Total in a Separate Line */}
      <div className="flex justify-between items-center mt-2">
        <h1 className="font-semibold">Total</h1>
        <h1 className="font-semibold">$ {total}</h1>
      </div>
    </div>
  );
};
const Tooltip = ({ message, children }) => {
  return (
    <div className="group relative flex">
      {children}
      <span className="absolute bottom-5 right-1 scale-0 transition-all rounded bg-gray-800 p-2 text-xs text-white group-hover:scale-100">
        {message}
      </span>
    </div>
  );
};

const EditOrder = () => {
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const defaultImage = defaultimage;
  const [isOpen, setOpen] = useState(false);
  const [searchName, setSearchName] = useState("");
  const { id } = useParams(); // Get the ID from the URL
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);
  const [Categories, setCategory] = useState([]);
  const [menuData, setMenuData] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [cModal2, setCmodal2] = useState(false);
  const [cModal3, setCmodal3] = useState(false);
  const [cModal4, setCmodal4] = useState(false);
  const [serviceChargeAmount, setServiceChargeAmount] = useState(0);
  const [customer, setCustomer] = useState([]);
  const [customerType, setCustomerType] = useState([]);
  const [WaiterData, setWaiterData] = useState([]);
  const [cart, setCart] = useState([]);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [total, setTotal] = useState(0);
  const [subtotal, SetSubtotal] = useState([]);
  const [vat, setVat] = useState(null);
  const [selectAddone, setSelectAddone] = useState([]);
  const [cModal6, setCmodal6] = useState(false);
  const [addOneData, setAddOneData] = useState({
    productvat: "",
    ProductName: "",
    price: "",
    variants: [],
    addons: [],
    quantity: 1,
  });
  const [orderDetais, setOrderDetails] = useState([]);
  const [menuDetails, setMenuDetails] = useState([]);
  const show = (index) => {
    setOpenSubmenuIndex(index === openSubmenuIndex ? null : index);
  };
  const Card = ({ image, title, val }) => {
    const capitalizeFirstLetter = (str) => {
      if (!str) return "";
      return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    };
    return (
      <div className="rounded-lg overflow-hidden shadow-lg border border-gray-300 transition-transform transform hover:scale-105">
        <div
          onClick={() => {
            addProductToCart(val);
            console.log("MENUDATA ", menuData);
          }}
          className="cursor-pointer w-full p-4 hover:bg-gray-100 transition-colors"
        >
          <div className="flex justify-center mb-3">
            <img
              onError={handleImageError}
              src={`${VITE_IMG_URL}${image}`}
              alt="Product Image"
              className="rounded-lg h-[100px] w-[120px] object-cover"
            />
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-gray-800 mb-1">
              {capitalizeFirstLetter(title)}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // all menu data
  const showMenudata = (parentID, categoryID) => {
    const token = localStorage.getItem("token"); // ✅ Get token from localStorage

    let params = {};
    if (categoryID) {
      params.categoryId = categoryID;
    }

    axios
      .get(`${API_BASE_URL}/products/${parentID ? parentID : ""}`, {
        params,
        headers: {
          Authorization: token, // ✅ Pass token here
        },
      })
      .then((res) => {
        console.log(res.data);
        setMenuData(res.data);
      })
      .catch((error) => {
        console.log("Error fetching menu data:", error);
      });
  };
  // image error when no image
  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };
  // category menu
  const getCategoryMenu = () => {
    axios
      .get(`${API_BASE_URL}/getCategoryList`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data.data);
        setCategory(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // all waiter data
  const getWaiter = () => {
    axios
      .get(`${API_BASE_URL}/getWaiter`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setWaiterData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Error in getting waiter");
      });
  };
  // all customer data
  const getCustomer = () => {
    axios
      .get(`${API_BASE_URL}/customer`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data.data);
        setCustomer(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  // get customer type
  const getCustomerType = () => {
    axios
      .get(`${API_BASE_URL}/customertype`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setCustomerType(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

  // search menu item
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);

    if (value.trim() === "") {
      showMenudata();
      return;
    }

    axios
      .get(`${API_BASE_URL}/products`, {
        params: { searchTerm: value },
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setMenuData(res.data.length > 0 ? res.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Item Not Available");
      });
  };

  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/getOrderById/${id}`)
      .then((response) => {
        const orderDetails = response.data.orderDetails[0];
        const menuItems = response.data.menuItems;

        console.log("Prefilled customer data:", orderDetails);
        console.log("Prefilled menu data:", menuItems);

        setOrderDetails(orderDetails);
        setMenuDetails(menuItems);

        const prefilledOrderDetail = menuItems.map((item) => {
          const basePrice = parseFloat(item.price) * (item.menuqty || 1);

          // Map addons correctly
          const checkedAddons = (item.add_ons || []).map((addon) => ({
            add_on_id: addon.add_on_id,
            add_on_name: addon.add_on_name,
            add_on_price: parseFloat(addon.add_on_price), // ✅ parseFloat
            add_on_quantity: parseInt(addon.add_on_quantity) || 1,
          }));

          const addonPrice = checkedAddons.reduce(
            (acc, addon) => acc + addon.add_on_price * addon.add_on_quantity,
            0
          );

          return {
            ProductsID: item.menu_id,
            row_id: item.row_id,
            price: parseFloat(item.price),
            quantity: item.menuqty || 1,
            ProductName: item.ProductName || "Default Name",
            variantid: item.varientid || 0,
            variantName: item.variantName || "Default",
            addons: item.add_ons || [],
            checkedaddons: checkedAddons, // ✅ correct format
            productvat: item.productvat || 0,
            totalAmount: basePrice + addonPrice, // ✅ base + addon
          };
        });

        setCart(prefilledOrderDetail);
        setOrderDetail(prefilledOrderDetail);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
      });
  }, [id]);

  console.log("Order Details State:", cart);

  const handleVariantChange = (event) => {
    const selectedVariantName = event.target.value;
    const selectedVariant = addOneData.variants.find(
      (variant) => variant.variantName === selectedVariantName
    );

    // Update the variant information in addOneData
    if (selectedVariant) {
      setAddOneData((prevData) => ({
        ...prevData,
        price: selectedVariant.price,
        variantid: selectedVariant.variantid,
        variantName: selectedVariant.variantName,
      }));
    }
  };

  const addProductToCart = (val) => {
    if (val.addons.length > 0 || val.variants.length > 1) {
      openAddons(val);
    } else {
      let findProductInCart = cart.find((i) => {
        return (
          i.ProductsID === val.ProductsID &&
          i.variantid === val.variants[0].variantid
        );
      });

      if (findProductInCart) {
        let newCart = cart.map((cartItem) => {
          if (
            cartItem.ProductsID === val.ProductsID &&
            cartItem.variantid === val.variants[0].variantid
          ) {
            let newQuantity = cartItem.quantity + 1;
            return {
              ...cartItem,
              quantity: newQuantity,
              totalAmount: cartItem.price * newQuantity,
            };
          } else {
            return cartItem;
          }
        });
        setCart(newCart);

        // Update quantity in orderDetail for the same item
        let updatedOrderDetail = orderDetail.map((item) =>
          item.ProductsID === val.ProductsID &&
          item.variantid === val.variants[0].variantid
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        setOrderDetail(updatedOrderDetail);
      } else {
        let addingProduct = {
          ...val,
          ProductsID: val.ProductsID,
          productvat: val.productvat,
          variantid: val.variantid || val.variants[0].variantid,
          variantName: val.variants[0].variantName || val.variants[0].variant,
          menuid: val.menuid,
          quantity: 1,
          totalAmount: val.price || val.variants[0].price,
          price: val.price || val.variants[0].price,
          addons: val.checkedaddons || [],
        };
        setCart([...cart, addingProduct]);
        setOrderDetail([...orderDetail, addingProduct]);
      }
    }
  };

  const openAddons = (val) => {
    setSelectAddone([]); // Clear selected add-ons after 1 time selected
    const initialPrice = val.variants.length > 0 ? val.variants[0].price : "";

    setAddOneData((prevData) => ({
      ...prevData,
      ProductsID: val.ProductsID,
      productvat: val.productvat,
      ProductName: val.ProductName,
      price: initialPrice,
      variants: [...val.variants],
      addons: [...val.addons],
      quantity: 1,
      variantid: val.variants.length > 0 ? val.variants[0].variantid : "",
      variantName: val.variants.length > 0 ? val.variants[0].variantName : "",
      checkedaddons: selectAddone,
      kitchenid: val.kitchenid,
      kitchen_name: val.kitchen_name,
      ip_address: val.ip_address,
      port: val.port,
    }));
    setCmodal6(true);
  };

  const handleaddonchange = (e, index) => {
    const { value, checked } = e.target;
    const selectedAddon = {
      add_on_id: addOneData.addons[index].add_on_id,
      add_on_name: value,
      add_on_price: addOneData.addons[index].price,
      add_on_quantity: 1,
    };

    setAddOneData((prevState) => {
      const updatedCheckedAddons = checked
        ? [...prevState.checkedaddons, selectedAddon]
        : prevState.checkedaddons.filter(
            (addon) => addon.add_on_name !== value
          );

      return {
        ...prevState,
        checkedaddons: updatedCheckedAddons,
      };
    });
  };

  const handleaddonQuantityChange = (e, index) => {
    const newQuantity = parseInt(e.target.value, 10) || 1;

    setAddOneData((prevState) => ({
      ...prevState,
      checkedaddons: prevState.checkedaddons.map((addon, idx) =>
        idx === index ? { ...addon, add_on_quantity: newQuantity } : addon
      ),
    }));
  };
  const handleAddOnSubmit = () => {
    let findProductInCart = cart.find(
      (i) =>
        i.ProductName === addOneData.ProductName &&
        i.variantid === addOneData.varientid
    );

    if (findProductInCart) {
      let newCart = cart.map((cartItem) => {
        if (
          cartItem.ProductName === addOneData.ProductName &&
          cartItem.variantid === addOneData.varientid
        ) {
          let newQuantity = cartItem.quantity + addOneData.quantity;

          let updatedCheckedAddons = cartItem.checkedaddons.map((addon) => {
            let matchingAddon = addOneData.checkedaddons.find(
              (newAddon) => newAddon.add_on_name === addon.add_on_name
            );

            if (matchingAddon) {
              return {
                ...addon,
                add_on_quantity:
                  addon.add_on_quantity + matchingAddon.add_on_quantity,
              };
            } else {
              return addon;
            }
          });

          addOneData.checkedaddons.forEach((newAddon) => {
            if (
              !cartItem.checkedaddons.find(
                (addon) => addon.add_on_name === newAddon.add_on_name
              )
            ) {
              updatedCheckedAddons.push(newAddon);
            }
          });

          let addonTotal = updatedCheckedAddons.reduce((acc, addon) => {
            return acc + addon.add_on_price * addon.add_on_quantity;
          }, 0);

          return {
            ...cartItem,
            quantity: newQuantity,
            checkedaddons: updatedCheckedAddons,
            totalAmount: cartItem.price * newQuantity + addonTotal,
            variantName: addOneData.variantName, // Ensure correct variant name is set here
          };
        } else {
          return cartItem;
        }
      });

      setCart(newCart);
    } else {
      let addonTotal = addOneData.checkedaddons.reduce((acc, addon) => {
        return acc + addon.add_on_price * addon.add_on_quantity;
      }, 0);

      let addingProduct = {
        ...addOneData,
        totalAmount: addOneData.price * addOneData.quantity + addonTotal,
        addons: addOneData.checkedaddons || [],
        variantName: addOneData.variantName, // Ensure variant name is added here
      };

      setCart([...cart, addingProduct]);
      setOrderDetail([...orderDetail, addingProduct]);
    }

    setCmodal6(false);
  };

  const increaseQuantity = (productId, variantid) => {
    let newCart = cart.map((cartItem) => {
      if (
        cartItem.ProductsID === productId &&
        cartItem.variantid === variantid
      ) {
        let newQuantity = cartItem.quantity + 1;

        let addonTotal = (cartItem.checkedaddons || []).reduce((acc, addon) => {
          return acc + addon.add_on_price * addon.add_on_quantity;
        }, 0);

        let newTotalAmount = cartItem.price * newQuantity + addonTotal;

        return {
          ...cartItem,
          quantity: newQuantity,
          totalAmount: newTotalAmount,
        };
      } else {
        return cartItem;
      }
    });
    setCart(newCart);
    setOrderDetail(newCart);
  };

  const decreaseQuantity = (productId, variantid) => {
    let newCart = cart.map((cartItem) => {
      if (
        cartItem.ProductsID === productId &&
        cartItem.variantid === variantid &&
        cartItem.quantity > 1
      ) {
        let newQuantity = cartItem.quantity - 1;

        let addonTotal = (cartItem.checkedaddons || []).reduce((acc, addon) => {
          return acc + addon.add_on_price * addon.add_on_quantity;
        }, 0);

        let newTotalAmount = cartItem.price * newQuantity + addonTotal;

        return {
          ...cartItem,
          quantity: newQuantity,
          totalAmount: newTotalAmount,
        };
      } else {
        return cartItem;
      }
    });
    setCart(newCart);
    setOrderDetail(newCart);
  };

  // calculating total accourding to cart dataa
  // useEffect(() => {
  //   let subTotal = cart.reduce((val, item) => {
  //     return val + item.totalAmount;
  //   }, 0);

  //   let totalVAT = cart.reduce((vat, item) => {
  //     return (
  //       vat + item.quantity * ((item.productvat * item.price) / 100).toFixed(2)
  //     );
  //   }, 0);

  //   let newTotalAmount = subTotal + totalVAT;

  //   SetSubtotal(parseFloat(subTotal).toFixed(2));
  //   setVat(parseFloat(totalVAT).toFixed(2));
  //   setTotal(newTotalAmount);
  // }, [cart]);

  useEffect(() => {
    let subtotal = 0;
    let vat = 0;

    cart.forEach((item) => {
      // ✅ Base price with quantity
      let basePrice = item.price * item.quantity;

      // ✅ Addons price with quantity
      let addonPrice = (item.checkedaddons || []).reduce((acc, addon) => {
        return acc + addon.add_on_price * addon.add_on_quantity;
      }, 0);

      console.log("Addon Price: ", addonPrice);

      // ✅ Add addon price also to subtotal
      subtotal += basePrice + addonPrice;

      // ✅ VAT on (base + addons)
      let itemVat = (item.productvat / 100) * (basePrice + addonPrice);
      vat += itemVat;
    });

    let total = subtotal + vat;

    SetSubtotal(subtotal.toFixed(2));
    setVat(vat.toFixed(2));
    setTotal(total.toFixed(2));
  }, [cart]);

  //servic charge accourding to the change in data
  useEffect(() => {
    const validSubtotal = parseFloat(subtotal) || 0;
    const validServiceCharge = parseFloat(serviceCharge) || 0;
    const validVat = parseFloat(vat) || 0;

    // Bound service charge percentage between 0 and 100
    const boundedServiceCharge = Math.min(Math.max(validServiceCharge, 0), 100);

    // Calculate service charge amount
    const totalServiceCharge = (
      (validSubtotal * boundedServiceCharge) /
      100
    ).toFixed(2);
    setServiceChargeAmount(totalServiceCharge);

    // Calculate total amount
    const allTotal = (
      validSubtotal +
      parseFloat(totalServiceCharge) +
      validVat
    ).toFixed(2);
    setTotal(allTotal);
  }, [serviceCharge, subtotal, vat]);

  const removeProduct = (val) => {
    const newCart = cart.filter(
      (cartItem) =>
        cartItem.ProductsID !== val.ProductsID ||
        cartItem.variantid !== val.variantid
    );
    setCart(newCart);
  };

  const handleQuantityChange = (event) => {
    const { value } = event.target;
    setAddOneData((prevData) => ({
      ...prevData,
      quantity: parseInt(value, 10),
    }));
  };

  const prepareUpdatePayload = () => {
    const payload = {
      customer_id: orderDetais.customer_id,
      customer_type: orderDetais.cutomertype,
      waiter_id: orderDetais.waiter_id || null,
      table_id: orderDetais.table_no || null,
      order_details: orderDetail, // Use the updated orderDetail
      grand_total: total,
      service_charge: serviceCharge,
      discount: 0,
      VAT: vat || 0.0,
      created_by: orderDetais.created_by,
    };

    return payload;
  };

  const navigate = useNavigate();
  const updateOrderDetails = () => {
    const payload = prepareUpdatePayload();
    console.log("data jo gya ", payload);
    axios
      .put(`${API_BASE_URL}/draft/${id}`, payload, {
        headers: { Authorization: token },
      })
      .then((res) => {
        console.log(res.data);
        toast.success("Order placed successfully");
        navigate("/order-list");
      })
      .catch((err) => {
        console.log(err);
      });
  };

  useEffect(() => {
    showMenudata();
    getCustomer();
    getCategoryMenu();
    getCustomerType();
    getWaiter();
  }, []);
  return (
    <>
      <div className=" main_div flex gap-x-3 max-h-screen ">
        {/* nav section */}
        <section className=" side_section min-h-screen bg-[#1C1D3E]">
          <div className=" pt-5  pl-4 ">
            <header className=" text-white  m-auto  ">
              <Hamburger toggled={isOpen} toggle={setOpen} />
            </header>
          </div>

          <div
            className={`${
              isOpen == false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            } hide-scrollbar h-screen overflow-y-auto`}
          >
            <Nav />
          </div>

          <nav className={`${!isOpen == false ? "hidden" : ""}`}>
            <div className="bg-[#1C1D3E] text-left  text-zinc-100  p-2 pt-8 hide-scrollbar h-screen overflow-y-auto">
              <span className="text-2xl flex items-center gap-x-2 justify-start">
                <GiKnifeFork />
                <h1
                  onClick={() => {
                    showMenudata();
                  }}
                  className=" font-semibold text-xl  cursor-pointer"
                >
                  All
                </h1>
              </span>

              {Categories.map((items, index) => (
                <ul key={index}>
                  <li
                    onClick={() => {
                      showMenudata(null, items.CategoryID); // Pass CategoryID in query
                      show(index);
                    }}
                    className="text-lg flex items-center gap-x-2 cursor-pointer p-2 hover:bg-[#4CBBA1] hover:scale-110 duration-150 rounded-md mt-6"
                  >
                    <span
                      onClick={() => {
                        showMenudata(null, items.CategoryID); // Pass CategoryID in query
                      }}
                      className="text-2xl"
                    >
                      <GiKnifeFork />
                    </span>
                    <span className="flex-1">
                      <NavLink
                        onClick={() => {
                          showMenudata(null, items.CategoryID); // Pass CategoryID in query
                        }}
                      >
                        {items.CategoryName}
                      </NavLink>
                    </span>
                    {items.children && items.children.length > 0 && (
                      <FaCaretDown
                        onClick={() => {
                          showMenudata(null, items.CategoryID); // Pass CategoryID in query
                        }}
                        className={`${
                          openSubmenuIndex === index && open ? "rotate-180" : ""
                        } duration-500`}
                      />
                    )}
                  </li>

                  {/* Child Categories */}
                  {items.children &&
                    items.children.length > 0 &&
                    openSubmenuIndex === index &&
                    open && (
                      <ul className="ml-8 rounded-sm">
                        {items.children.map((subItem, subIndex) => (
                          <li
                            key={subIndex}
                            className="duration-500 text-sm flex items-center gap-x-2 cursor-pointer p-2 rounded-md mt-2 hover:scale-125"
                          >
                            <NavLink
                              onClick={() => {
                                showMenudata(subItem.ParentID, null); // Pass ParentID as param
                              }}
                              className="hover:text-[#4cddA1] active"
                            >
                              {subItem.CategoryName}
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                </ul>
              ))}
            </div>
          </nav>
        </section>
        {/* middel Button */}

        <section className="middel_section flex gap-x-6  ">
          <div className="order">
            <div className="  ">
              <div>
                <h1 className=" text-3xl text-center mt-6 mb-6"> Edit Order</h1>
              </div>
            </div>
            {/* Search Box */}
            <div className="flex m-auto items-center px-6 py-2 rounded-md border-[1px] gap-x-3 border-gray-900">
              <button className="px-4 text-[#0f044a] text-sm">
                <FaMagnifyingGlass />
              </button>
              <input
                value={searchName}
                onChange={handleSearch}
                placeholder="Search product..."
                type="search"
                className="flex-grow px-4 py-2 text-gray-700 leading-tight focus:outline-none border border-gray-300 rounded-l-md"
              />
            </div>

            {/*  Card Section */}
            <div className=" h-screen overflow-y-auto">
              <div className=" grid  grid-cols-5 gap-2">
                {menuData.map((val, index) => (
                  <>
                    <div key={index} className="rounded-xl mt-6">
                      <Card
                        val={val}
                        image={val.ProductImage}
                        title={val.ProductName}
                      />
                    </div>
                  </>
                ))}
              </div>
            </div>
          </div>
        </section>
        {/* last section */}

        <section className=" flex-grow flex flex-col gap-y-2     max-h-screen  mr-1 bg-white ">
          <div className="flex items-center">
            <button
              onClick={() => {
                setCmodal3(true);
              }}
              className=" font-semibold  w-full h-[75px] bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer   py-3"
            >
              {" "}
              <div className=" flex flex-col justify-center items-center   text-xl gap-x-1 ">
                <span className="  ">
                  <TfiHeadphoneAlt />
                </span>{" "}
                Order type
              </div>
            </button>

            <button
              onClick={toggleFullScreen}
              className=" font-semibold  w-full h-[75px] bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer   py-3"
            >
              <div className=" flex flex-col justify-center items-center text-xl  gap-x-1 ">
                <span>
                  <MdOutlineZoomInMap onClick={toggleFullScreen} />
                </span>{" "}
                Zoom
              </div>
            </button>
          </div>
          <div className=" flex  justify-between gap-x-4">
            <div>
              <select
                value={orderDetais.waiter_id}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    waiter_id: e.target.value, // Update the orderDetails state when selection changes
                  })
                }
                className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
                id="waiterSelect"
                name="waiter"
              >
                <option value="">Select Waiter</option>
                {WaiterData.map((val, index) => (
                  <option key={index} value={val.id}>
                    {`${val.firstname} ${val.lastname}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={orderDetais.customer_id}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    customer_id: e.target.value, // Update the orderDetails state when selection changes
                  })
                }
                className="shadow border border-[#4CBBA1] rounded  w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
                id="parentCategory"
                name="parentid"
              >
                <option value="">Walk in Cusomer</option>
                {customer.map((val, index) => (
                  <option key={index} value={val.customer_id}>
                    {val.customer_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="cart-container w-full h-[calc(100vh-80px)] border border-black text-white rounded-md p-2 bg-[#f9fafb] flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center py-3 px-4 border-b border-[#4CBBA1] text-zinc-950 shadow text-lg font-bold bg-white">
              <span className="w-[120px] truncate">Product</span>
              <span className="w-[60px] text-center">Price</span>
              <span className="w-[80px] text-center">Quantity</span>
              <span className="w-[50px] text-center">Action</span>
            </div>

            {/* Cart Items - Scrollable */}
            <div className="flex-1 overflow-y-auto py-2 px-1">  
              {cart && cart.length > 0 ? (
                cart.map((val, index) => (
                  <div
                    key={index}
                    className="flex flex-col py-3 px-4 rounded-md m-3 shadow-md text-zinc-900 bg-[#ffffff]"
                  >
                    {/* Product Header Row */}
                    <div className="flex justify-between items-center">
                      {/* Product Name + Variant */}
                      <span className="w-[120px] text-nowrap">
                        {val.ProductName} <br />
                        <span className="text-sm text-gray-600">
                          ({val.variantName || val.variants[0].variantName})
                        </span>
                      </span>

                      {/* Price */}
                      <span className="w-[60px] text-center font-semibold text-[#4CBBA1]">
                        {val.price}
                      </span>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-x-3">
                        <button
                          className="w-[28px] h-[28px] flex justify-center items-center rounded-md bg-[#4CBBA1] text-white font-bold"
                          onClick={() =>
                            increaseQuantity(val.ProductsID, val.variantid)
                          }
                        >
                          +
                        </button>
                        <span className="text-lg">{val.quantity}</span>
                        <button
                          className="w-[28px] h-[28px] flex justify-center items-center rounded-md bg-[#E53E3E] text-white font-bold"
                          onClick={() =>
                            decreaseQuantity(val.ProductsID, val.variantid)
                          }
                        >
                          -
                        </button>
                      </div>

                      {/* Remove Button */}
                      <Tooltip message="Remove">
                        <button onClick={() => removeProduct(val)}>
                          <FaRegTrashAlt className="text-red-500 text-xl cursor-pointer hover:text-red-700" />
                        </button>
                      </Tooltip>
                    </div>

                    {/* ✅ Show Addons under each Product */}
                    {val.checkedaddons && val.checkedaddons.length > 0 && (
                      <div className="ml-2 mt-2 pl-3 border-l-2 border-dashed border-gray-300">
                        {val.checkedaddons.map((addon, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between text-sm text-gray-700"
                          >
                            <span>
                              ➕ {addon.add_on_name} (x{addon.add_on_quantity})
                            </span>
                            <span className="text-[#4CBBA1] font-medium">
                              {addon.add_on_price * addon.add_on_quantity}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-center py-6 text-gray-300">
                  No Items in Cart
                </p>
              )}
            </div>

            {/* Billing Section - Sticky at bottom */}
            <div className="bg-white rounded-md shadow p-3 mt-1">
              <DataTable total={total} vat={vat} subtotal={subtotal} />
            </div>
          </div>

          <section className=" flex float-right  mt-3">
            <div className="flex  gap-x-2">
              <button
                onClick={() => {
                  navigate("/order-list");
                }}
                className={`h-[51px] bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md px-7 py-3 
                    cursor-pointer`}
              >
                Back To POS
              </button>

              <button
                onClick={updateOrderDetails}
                className="h-[51px]   bg-[#3FB500] text-[#fff] border-[2px] border-zinc-300 rounded-md   cursor-pointer  px-7 py-3"
              >
                Place Order /Update Order
              </button>
            </div>
          </section>
        </section>
      </div>

      {/* Waiter  */}

      <DialogBoxSmall
        title={"All Waiter'& List"}
        onClose={() => {
          setCmodal4(false);
        }}
        isOpen={cModal4}
      >
        <div className=" p-16">
          <form action="" onSubmit={(e) => e.preventDefault()}>
            <div className="">
              <label
                className="block text-nowrap text-gray-700 font-semibold mb-2"
                htmlFor="parentCategory"
              >
                All Waiter
              </label>
              <select
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                value={orderDetais.waiter_id}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    waiter_id: e.target.value, // Update the orderDetails state when selection changes
                  })
                }
              >
                <option value="">Select</option>
                {WaiterData.map((val, index) => (
                  <option key={index} value={val.id}>
                    {`${val.firstname} ${val.lastname}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-start space-x-4 float-right  mt-4 ">
              <button
                onClick={() => setCmodal4(false)}
                type="button"
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCmodal4(false);
                }}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
              >
                Select
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>

      {/*  Customer Type */}
      <DialogBoxSmall
        title={"All Customer Type"}
        onClose={() => {
          setCmodal3(false);
        }}
        isOpen={cModal3}
      >
        <div className="p-1">
          {/* Customer Type Selection with Images */}
          <div className="grid grid-cols-5 gap-4">
            {customerType.map((val, index) => (
              <div
                key={index}
                value={orderDetais.cutomertype}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    cutomertype: e.target.value,
                  })
                }
                className={`border-2 p-2 rounded-md cursor-pointer transition duration-200 ${
                  val.customer_type === val.customer_type_id
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={`${VITE_IMG_URL}` + val.picture}
                  alt={val.customer_type}
                  className="w-full h-20 object-cover rounded-md"
                />
                <p className="text-center font-semibold mt-2">
                  {val.customer_type}
                </p>
              </div>
            ))}
          </div>

          {/* Close Button */}
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setCmodal3(false)}
              className="px-4 py-2 bg-red-600 text-gray-100 rounded-md hover:bg-red-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
        {/* <div className="p-1">
          
          <div className="grid grid-cols-5 gap-1">
            {customerType.map((val, index) => (
              <div
                key={index}
                value={orderDetais.cutomertype}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    cutomertype: e.target.value, 
                  })
                }
                className={`border-2 p-2 rounded-md cursor-pointer transition duration-200 ${
                 val.customer_type === val.customer_type_id
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={`${VITE_IMG_URL}` + val.picture}
                  alt={val.customer_type}
                  className="w-full h-20 object-cover rounded-md"
                /><p className="text-center font-semibold mt-2">
                {val.customer_type}
              </p>
               
              </div>
            ))}
          </div>

         
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setCmodal3(false)}
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div> */}
      </DialogBoxSmall>

      {/* See All Customer */}
      <DialogBoxSmall
        title={"See All Customer List"}
        onClose={() => {
          setCmodal2(false);
        }}
        isOpen={cModal2}
      >
        <div className="p-10">
          <form action="" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label
                className="block text-nowrap text-gray-700 font-semibold mb-2"
                htmlFor="parentCategory"
              >
                All Customer
              </label>
              <select
                value={orderDetais.customer_id}
                onChange={(e) =>
                  setOrderDetails({
                    ...orderDetais,
                    customer_id: e.target.value, // Update the orderDetails state when selection changes
                  })
                }
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Select</option>
                {customer.map((val, index) => (
                  <option key={index} value={val.customer_id}>
                    {val.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-start space-x-4 float-right mt-3  ">
              <button
                onClick={() => setCmodal2(false)}
                type="button"
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-md hover:bg-gray-600"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCmodal2(false);
                }}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600"
              >
                Select
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>

      <AddonDialogBox
        isOpen={cModal6}
        title={"Food Add-On & Variant"}
        onClose={() => {
          setCmodal6(false);
        }}
        isClick={handleAddOnSubmit}
        button={"Add to Cart"}
      >
        <div className="flex flex-col gap-y-11 justify-between gap-x-9 p-11">
          <div>
            <div className="">
              <table className="min-w-full bg-white">
                <thead>
                  <tr>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Product
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Variants
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Quantity
                    </th>
                    <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                      Price
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b text-center">
                    <td className="py-2 px-4 w-[200px] border border-[#4CBBA1]">
                      {addOneData.ProductName}
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <select
                        className="border w-[200px] border-gray-300 rounded p-1"
                        onChange={handleVariantChange}
                        value={addOneData.variantName || ""}
                      >
                        {addOneData.variants.map((item, index) => (
                          <option key={index} value={item.variantName}>
                            {item.variantName}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <input
                        min={0}
                        max={100}
                        name="quantity"
                        value={addOneData.quantity}
                        type="number"
                        className="border border-gray-300 rounded p-1 w-full"
                        placeholder="Quantity"
                        onChange={handleQuantityChange}
                      />
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <input
                        disabled={true}
                        value={addOneData.price}
                        type="number"
                        className="border border-gray-300 rounded p-1 w-full"
                        placeholder="Price"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="">
            <table className={`min-w-full bg-white`}>
              <thead className="">
                <tr>
                  <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Select
                  </th>
                  <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Add on name
                  </th>
                  <th className="py-4  px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Add on Quantity
                  </th>
                  <th className="py-4 px-4 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Price
                  </th>
                </tr>
              </thead>

              <tbody>
                {addOneData.addons.map((val, index) => (
                  <tr key={index} className="border-b text-center">
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <input
                        type="checkbox"
                        className="form-checkbox size-5 custom-checkbox"
                        value={val.add_on_name}
                        onChange={(e) => handleaddonchange(e, index)}
                      />
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      {val.add_on_name}
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        className="border border-gray-300 rounded p-1 w-full"
                        placeholder="1"
                        onChange={(e) => handleaddonQuantityChange(e, index)}
                      />
                    </td>
                    <td className="py-2 px-4 border border-[#4CBBA1]">
                      <input
                        disabled={true}
                        type="number"
                        value={val.price}
                        className="border border-gray-300 rounded p-1 w-full"
                        placeholder="Price"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </AddonDialogBox>
    </>
  );
};

export default EditOrder;
