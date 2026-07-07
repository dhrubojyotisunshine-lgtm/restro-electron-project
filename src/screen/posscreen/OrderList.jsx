import React, { useEffect, useRef, useState, useContext } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { RiTodoLine } from "react-icons/ri";
import { IoMdCart } from "react-icons/io";
import { MdCropRotate } from "react-icons/md";
import { IoIosPersonAdd } from "react-icons/io";
import { CiSaveDown2 } from "react-icons/ci";
import { CiCircleList } from "react-icons/ci";
import { FaKitchenSet, FaMagnifyingGlass } from "react-icons/fa6";
import { IoQrCodeOutline, IoPizzaOutline } from "react-icons/io5";
import { GiKnifeFork } from "react-icons/gi";
import { TfiHeadphoneAlt } from "react-icons/tfi";
import { IoIosMan } from "react-icons/io";
import { useReactToPrint } from "react-to-print";
import { MdTableBar, MdOutlineZoomInMap } from "react-icons/md";
import defaultimage from "../../assets/images/pizza.jpeg";
import { toast } from "react-toastify";
import useFullScreen from "../../components/useFullScreen";
import beepSound from "../../assets/beep.mp3";
import { MdOutlineCancelPresentation } from "react-icons/md";
import { FaBan, FaPrint, FaReceipt } from "react-icons/fa";
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
import { AuthContext } from "../../store/AuthContext";
import CashRegisterModel from "../../components/CashRegisterModel";
import DraftOrder from "./DraftOrder";
import CalculatorModal from "../../components/CalculatorModal";
import CustomerDilogBox from "../../components/CustomerDilogBox";
import tableimg from "../../assets/images/tableimg.png";
// Total Data
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
      <span className="absolute  bottom-3  right-10 scale-0 transition-all rounded bg-gray-700 p-2 text-xs font-semibold text-white group-hover:scale-100">
        {message}
      </span>
    </div>
  );
};

const OrderButtons = [
  { id: 1, title: "New Order", icon: <MdCropRotate />, link: "/order-list" },
  {
    id: 2,
    title: "On Going Order",
    icon: <CiSaveDown2 />,
    link: "/ongoing-order",
  },
  {
    id: 3,
    title: "Kitchen Status",
    icon: <FaKitchenSet />,
    link: "/kitchen-status",
  },
  { id: 4, title: "QR Order", icon: <IoQrCodeOutline />, link: "/qr-order" },
  { id: 5, title: "Online Order", icon: <IoMdCart />, link: "/online-order" },
  { id: 6, title: "Today Order", icon: <RiTodoLine />, link: "/today-order" },
];

const OrderList = ({ setIsCashRegisterOpen }) => {
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const token = localStorage.getItem("token");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;

  // Food Card
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
  const defaultImage = defaultimage;

  const [orders, setOrders] = useState([]);

  const [isOpen, setOpen] = useState(false);
  const [openSubmenuIndex, setOpenSubmenuIndex] = useState(null);
  const [cModal, setCmodal] = useState(false);
  const [cModal2, setCmodal2] = useState(false);
  const [cModal3, setCmodal3] = useState(false);
  const [cModal4, setCmodal4] = useState(false);
  const [cModal5, setCmodal5] = useState(false);
  const [cModal7, setCmodal7] = useState(false);
  const [cModal8, setCmodal8] = useState(false);
  const [cModal9, setCmodal9] = useState(false);
  const [customer, setCustomer] = useState([]);
  const [customerType, setCustomerType] = useState([]);
  const [Categories, setCategory] = useState([]);
  const [serviceCharge, setServiceCharge] = useState(0);
  const [serviceChargeAmount, setServiceChargeAmount] = useState(0);
  const [menuData, setMenuData] = useState([]);
  const [floorData, setFloorData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);
  const [subtotal, SetSubtotal] = useState([]);
  const [tableId, setTableid] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedTable, setSelectedTable] = useState(null);
  const [persons, setPersons] = useState("");
  const [sets, setSets] = useState("");
  //selected addon
  //kitchen to print
  const [selectAddone, setSelectAddone] = useState([]);
  // Add-One Modal if data is Avilable

  const [cModal6, setCmodal6] = useState(false);
  const navigate = useNavigate();

  // ✅ OK button press hone ke baad chalne wala function
  const handlePrintInvoice = () => {
    console.log("✅ Redirecting to /ongoing-order...");
    setInvoiceModal(false); // modal close
    navigate("/ongoing-order"); // redirect
  };

  const [addOneData, setAddOneData] = useState({
    productvat: "",
    ProductName: "",
    price: "",
    variants: [],
    addons: [],
    quantity: 1,
  });
  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };
  // place order data
  const [waiterName, setWaiterName] = useState("Please Select");
  const [customerTypeName, setCustomerTypeName] = useState("Dine-in Customer");
  const [tableName, setTableName] = useState("Select Table");
  const [selectCustomerName, setSelectCustomerName] = useState("Walkin");
  const [orderModal, setOrderModal] = useState(false);

  const [customerName, setCustomerName] = useState(1);
  const [selectCustomerType, setSelectCustomerType] = useState(1);
  const [waiter, setWaiter] = useState(null);
  const [selectTable, setSelectTable] = useState(null);
  const [vat, setVat] = useState(null);

  const [orderDetail, setOrderDetail] = useState([]);

  const [formData, setFormdata] = useState({
    customer_name: "",
    customer_email: "",
    customer_address: "",
    customer_phone: "",
  });

  const [WaiterData, setWaiterData] = useState([]);
  const [placeOrderData, setPlaceOrderData] = useState({
    customer_id: "",
    customer_type: "",
    waiter_id: "",
    table_id: "",
    order_details: [],
    grand_total: 0,
    service_charge: 0,
    discount: 0,
    VAT: 0,
  });
  //
  const [invoiceModal, setInvoiceModal] = useState(false);
  const [invoiceData, setInvoiceData] = useState([]);

  // working of escape key
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setInvoiceModal(false);
        setCmodal(false);
        setCmodal2(false);
        setCmodal3(false);
        setCmodal4(false);
        setCmodal5(false);
        setCmodal6(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const playBeep = () => {
    const audio = new Audio(
      "https://www.soundjay.com/buttons/sounds/beep-01a.mp3",
    );
    audio.play();
  };

  const handleholdOrder = () => {
    if (!(selectCustomerType && customerName && cart.length > 0)) {
      if (cart.length === 0) {
        toast.error("Please add data to cart.");
        return;
      }
      if (!customerName) {
        toast.error("Please select a customer.");
        return;
      }
      if (!selectCustomerType) {
        toast.error("Please select a customer type.");
        return;
      }
    }

    // Only require waiter if selectCustomerType is NOT 4
    if (selectCustomerType !== 4 && !waiter) {
      toast.error("Please select a waiter.");
      return;
    }

    if (
      (selectCustomerType === 1 || selectCustomerType === 99) &&
      !selectTable
    ) {
      toast.error("Please select a table for the selected customer type.");
      return;
    }

    const updatedOrderData = {
      customer_id: customerName,
      customer_type: selectCustomerType,
      waiter_id: selectCustomerType === 4 ? null : waiter || null, // Skip waiter for type 4
      table_id: selectTable || null,
      persons: Number(persons),
      order_details: cart.map((item) => ({
        ProductsID: item.ProductsID,
        product_id: item.ProductsID,
        price: item.price,
        quantity: item.quantity,
        variantid: item.variantid || 0,
        addons: (item.checkedaddons || []).map((addon) => ({
          add_on_id: addon.add_on_id,
          add_on_name: addon.add_on_name,
          add_on_quantity: addon.add_on_quantity,
        })),
      })),
      grand_total: total,
      service_charge: serviceChargeAmount,
      discount: 0,
      VAT: vat || 0.0,
    };

    setPlaceOrderData(updatedOrderData);

    axios
      .post(`${API_BASE_URL}/holdorder`, updatedOrderData, {
        headers: { Authorization: token },
      })
      .then((res) => {
        if (res.data.message === "Order placed successfully") {
          playBeep();
          console.log("Hold", updatedOrderData);
          toast.success("Order saved in draft!");
          resetOrderForm();
        } else {
          toast.error("Failed to place order: " + res.data.message);
        }
      })
      .catch((error) => {
        toast.error("Error placing order: " + error.message);
      });
  };

  const [orderitems, setOrderitems] = useState([]);

  useEffect(() => {
    const items = cart.map((item) => ({
      ProductIDs: item.ProductsID,
      variantid: item.variantid,
      quantity: item.quantity,
      checkedaddons: (item.checkedaddons || []).map((addon) => ({
        add_on_id: addon.add_on_id,
        add_on_quantity: addon.add_on_quantity,
      })),
    }));

    setOrderitems(items);
  }, [cart]);

  const handlePlaceOrder = (printKot = true) => {
    if (!(selectCustomerType && customerName && cart.length > 0)) {
      if (cart.length === 0) {
        toast.error("Please add data to cart.");
        return;
      }
      if (!customerName) {
        toast.error("Please select a customer.");
        return;
      }
      if (!selectCustomerType) {
        toast.error("Please select a customer type.");
        return;
      }
    }

    // Only check waiter if selectCustomerType is NOT 4
    if (selectCustomerType !== 4 && !waiter) {
      toast.error("Please select a waiter.");
      return;
    }

    if (
      (selectCustomerType === 1 || selectCustomerType === 99) &&
      !selectTable
    ) {
      toast.error("Please select a table for the selected customer type.");
      return;
    }

    if ((selectCustomerType === 1 || selectCustomerType === 99) && !persons) {
      toast.error("Please enter number of persons");
      return;
    }

    const updatedOrderData = {
      customer_id: customerName,
      customer_type: selectCustomerType,
      waiter_id: selectCustomerType === 4 ? null : waiter || null, // Skip waiter for type 4
      table_id: selectTable || null,
      persons: Number(persons),
      order_details: cart.map((item) => ({
        ProductsID: item.ProductsID,
        product_id: item.ProductsID,
        price: item.price,
        quantity: item.quantity,
        variantid: item.variantid || 0,
        addons: (item.checkedaddons || []).map((addon) => ({
          add_on_id: addon.add_on_id,
          add_on_name: addon.add_on_name,
          add_on_quantity: addon.add_on_quantity,
        })),
      })),
      grand_total: total,
      service_charge: serviceChargeAmount,
      discount: 0,
      VAT: vat || 0.0,
      print_kot: printKot,
    };

    setPlaceOrderData(updatedOrderData);
    console.log("selected order details for kot", orderitems);
    console.log("selected order details", updatedOrderData);
    axios
      .post(`${API_BASE_URL}/orderplace`, updatedOrderData, {
        headers: { Authorization: token },
      })
      .then(async (res) => {
        if (res.data.success) {
          playBeep();
          toast.success("Order placed successfully!");
          resetOrderForm();

          navigate("/kitchen-status");
          if (res.data.kitchens && res.data.kitchens.length > 0) {
            await printToKitchens(res.data.kitchens);
          }
        } else {
          toast.error("Failed to place order: " + res.data.message);
        }
      })
      .catch((error) => {
        const errorMessage =
          error.response?.data?.message ||
          error.message ||
          "Unknown error occurred";
        toast.error("Error placing order: " + errorMessage);
      });
  };

  const printToKitchens = async (kitchens) => {
    if (!Array.isArray(kitchens) || kitchens.length === 0) return;

    for (const kitchenId of kitchens) {
      try {
        await axios.post(
          `${API_BASE_URL}/printkitchenkot/${kitchenId}`,
          {},
          {
            headers: { Authorization: token },
          },
        );
        console.log(`🖨 KOT printed for kitchen ${kitchenId}`);
      } catch (err) {
        console.error(`❌ KOT print failed for kitchen ${kitchenId}`, err);
        toast.error(`KOT print failed for kitchen ${kitchenId}`);
      }
    }
  };

  const resetOrderForm = () => {
    setCart([]);
    setTotal(0);
    setOrderDetail([]);
    setServiceCharge(0);
    setSelectCustomerName("Walkin");
    setSelectCustomerType(1);
    setCustomerName(1);
    setWaiter(null);
    setSelectTable(null);
    getallTable();
    setWaiterName("Please Select");
    setTableName("Select Table");
    setVat(0);
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

      console.log("Price:", val.variants[0].price);
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
              variantName: val.variants[0].variantName, // Ensure correct variant name
            };
          } else {
            return cartItem;
          }
        });
        setCart(newCart);
      } else {
        let addingProduct = {
          ...val,
          ProductsID: val.ProductsID,
          productvat: val.productvat,
          variantid: val.variantid || val.variants[0].variantid,
          variantName: val.variants[0].variantName || val.variants[0].variant,

          menuid: val.menuid,
          quantity: val.quantity || 1,
          totalAmount:
            (val.price || val.variants[0].price) * (val.quantity || 1),
          ProductName: val.ProductName,
          price: val.price || val.variants[0].price,
          addons: val.checkedaddons || [],
        };
        setCart([...cart, addingProduct]);
        setOrderDetail([...orderDetail, addingProduct]);
      }
    }
  };

  const handleAddOnSubmit = () => {
    let findProductInCart = cart.find(
      (i) =>
        i.ProductName === addOneData.ProductName &&
        i.variantid === addOneData.variantid,
    );

    if (findProductInCart) {
      let newCart = cart.map((cartItem) => {
        if (
          cartItem.ProductName === addOneData.ProductName &&
          cartItem.variantid === addOneData.variantid
        ) {
          let newQuantity = cartItem.quantity + addOneData.quantity;

          let updatedCheckedAddons = cartItem.checkedaddons.map((addon) => {
            let matchingAddon = addOneData.checkedaddons.find(
              (newAddon) => newAddon.add_on_name === addon.add_on_name,
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
                (addon) => addon.add_on_name === newAddon.add_on_name,
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
    playBeep();
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
  };

  useEffect(() => {
    // 1️⃣ Calculate subtotal including addons
    let subTotal = cart.reduce((acc, item) => {
      let addonTotal = (item.checkedaddons || []).reduce(
        (sum, addon) => sum + addon.add_on_price * addon.add_on_quantity,
        0,
      );
      return acc + item.quantity * item.price + addonTotal;
    }, 0);

    // 2️⃣ Calculate VAT including addons
    let totalVAT = cart.reduce((vatSum, item) => {
      let addonTotal = (item.checkedaddons || []).reduce(
        (sum, addon) => sum + addon.add_on_price * addon.add_on_quantity,
        0,
      );
      let itemTotal = item.quantity * item.price + addonTotal;
      return vatSum + (itemTotal * item.productvat) / 100;
    }, 0);

    // 3️⃣ Service charge
    let serviceChargeAmount = (subTotal * serviceCharge) / 100 || 0;

    // 4️⃣ Final total
    let finalTotal = subTotal + totalVAT + serviceChargeAmount;

    // 5️⃣ Update states
    SetSubtotal(subTotal.toFixed(2));
    setVat(totalVAT.toFixed(2));
    setServiceChargeAmount(serviceChargeAmount.toFixed(2));
    setTotal(finalTotal.toFixed(2));
  }, [cart, serviceCharge]);

  useEffect(() => {
    let totalServiceCharge = ((subtotal * serviceCharge) / 100).toFixed(2);

    setServiceChargeAmount(totalServiceCharge);

    const allTotal = (
      parseFloat(subtotal) +
      parseFloat(totalServiceCharge) +
      parseFloat(vat)
    ).toFixed(2);
    setTotal(allTotal);
  }, [serviceCharge, subtotal, vat]);

  const removeProduct = (val) => {
    const newCart = cart.filter(
      (cartItem) =>
        cartItem.ProductsID !== val.ProductsID ||
        cartItem.variantid !== val.variantid,
    );
    setCart(newCart);
  };
  const show = (index) => {
    setOpenSubmenuIndex(index === openSubmenuIndex ? null : index);
  };

  const handleChange = (e) => {
    setAddOneData({ ...addOneData, [e.target.name]: e.target.value });
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
    const updatedAddons = checked
      ? [
          ...selectAddone,
          {
            add_on_id: addOneData.addons[index].add_on_id,
            add_on_name: value,
            add_on_price: addOneData.addons[index].price,
            add_on_quantity: 1,
          },
        ]
      : selectAddone.filter((addon) => addon.add_on_name !== value);

    setSelectAddone(updatedAddons);
  };

  const handleaddonQuantityChange = (e, index) => {
    const { value } = e.target;
    const updatedAddons = selectAddone.map((addon) =>
      addon.add_on_name === addOneData.addons[index].add_on_name
        ? { ...addon, add_on_quantity: parseInt(value, 10) }
        : addon,
    );

    setSelectAddone(updatedAddons);
  };

  const handleVariantChange = (event) => {
    const selectedVariantName = event.target.value;
    const selectedVariant = addOneData.variants.find(
      (variant) => variant.variantName === selectedVariantName,
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

  const handleQuantityChange = (event) => {
    const { value } = event.target;
    setAddOneData((prevData) => ({
      ...prevData,
      quantity: parseInt(value, 10),
    }));
  };

  useEffect(() => {
    setAddOneData((prevData) => ({
      ...prevData,
      checkedaddons: selectAddone,
    }));
  }, [selectAddone]);

  const handelReactToPrint = useReactToPrint({
    content: () => componentRef.current,
  });

  const handelReactToPrint3 = useReactToPrint({
    content: () => componentRef3.current,
  });

  const handleprewiew = () => {
    handelReactToPrint();
  };

  const componentRef = useRef();
  const componentRef2 = useRef();
  const componentRef3 = useRef();
  // print invoice

  const handelReactToPrint2 = useReactToPrint({
    content: () => componentRef2.current,
    onBeforeGetContent: () => {
      if (isFullScreen) document.exitFullscreen();
    },
    onAfterPrint: () => {
      if (isFullScreen) document.documentElement.requestFullscreen();
    },
  });

  const handelChange = (e) => {
    setFormdata({ ...formData, [e.target.name]: e.target.value });
  };

  const submitAddcustomer = (e) => {
    e.preventDefault();
    axios
      .post(`${API_BASE_URL}/customer`, formData, { headers: { Authorization: token } })
      .then((res) => {
        console.log(res.data);
        setCmodal(false);
        toast.success("Customer sucessfully added");
        getCustomer();
        setFormdata("");
      })
      .catch((error) => {
        console.log(error);
      });
  };

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

  const getCustomerType = () => {
    axios
      .get(`${API_BASE_URL}/customertype`)
      .then((res) => {
        console.log(res.data);
        setCustomerType(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  // filter api
  const showMenudata = (parentID, categoryID) => {
    let params = {};

    if (categoryID) {
      params.categoryId = categoryID; // Pass category as query
    }

    axios
      .get(`${API_BASE_URL}/products/${parentID ? parentID : ""}`, {
        params,
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);
        setMenuData(res.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };

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

  const getallTable = () => {
    axios
      .get(`${API_BASE_URL}/table`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setTableData(res.data.data);
      })
      .catch((error) => {
        console.log(error);
        toast.error("Cant show table");
      });
  };

  const getWaiter = () => {
    axios
      .get(`${API_BASE_URL}/getWaiter`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        console.log(res.data);

        setWaiterData(res.data.data || []);

        if (res.data.warning) {
          console.warn(res.data.message);
        }
      })
      .catch((error) => {
        console.log(error);
        toast.error("Error in getting waiter");
      });
  };

  useEffect(() => {
    getCustomer();
    getCategoryMenu();
    getCustomerType();
    showMenudata();

    getallTable();
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

          <nav
            className={`${
              !isOpen == false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
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

        {/*middel section*/}
        <section className="middel_section flex gap-x-6  ">
          <div className="order">
            <div className="orderButton flex gap-y-2 flex-wrap mb-6 pt-2">
              {OrderButtons.map((val, index) => (
                <div
                  className={`w-1/3 ${
                    index === 7 ? "pointer-events-none" : ""
                  }`}
                  key={index}
                >
                  <NavLink
                    to={val.link}
                    className={({ isActive }) =>
                      `h-[60px] font-semibold w-full text-xl px-7 py-3 border-[2px] rounded-md flex justify-center items-center gap-3 ${
                        isActive
                          ? "bg-[#4CBBA1] text-white border-[#4CBBA1]"
                          : "bg-[#1C1D3E] text-[#fff] border-zinc-300 hover:bg-[#4CBBA1]"
                      }`
                    }
                  >
                    <span className="text-emerald-50 text-xl">{val.icon}</span>
                    {val.title}
                  </NavLink>
                </div>
              ))}
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

        <section className="table_section flex flex-col gap-y-2 p-2 max-h-screen mt-1 mr-1 bg-white">
          {/* Top controls row - fixed height */}
          <div className="flex flex-col gap-y-2">
            {/* Button grid */}
            <div className="grid grid-cols-6 gap-4">
              <Tooltip message={"Customer Type"}>
                <button
                  onClick={() => {
                    setCmodal3(true);
                  }}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <IoIosPersonAdd className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
              <Tooltip message={"Table"}>
                <button
                  onClick={() => setCmodal5(true)}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <MdTableBar className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
              <Tooltip message={"Hold Order"}>
                <button
                  onClick={() => setCmodal9(true)}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <FaHandHoldingUsd className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
              <Tooltip message={"Calculator"}>
                <button
                  onClick={() => setIsCalculatorOpen(true)}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-white border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <FaCalculator className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
              <Tooltip message={"Close Register"}>
                <button
                  onClick={() => setCmodal7(true)}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <MdOutlineCancelPresentation className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
              <Tooltip message={"Zoom"}>
                <button
                  onClick={toggleFullScreen}
                  className="font-semibold w-full h-full bg-[#1C1D3E] text-[#fff] border-[2px] border-zinc-300 rounded-md cursor-pointer py-3"
                >
                  <div className="flex justify-center items-center h-full">
                    <MdOutlineZoomInMap className="text-3xl" />
                  </div>
                </button>
              </Tooltip>
            </div>

            {/* Select inputs */}
            <div className="flex justify-between gap-x-4">
              <div>
                <select
                  value={waiter}
                  onChange={(e) => {
                    const selectedWaiter = WaiterData.find(
                      (val) => val.id == e.target.value,
                    );
                    setWaiter(e.target.value);
                    setWaiterName(
                      selectedWaiter ? selectedWaiter.firstname : "",
                    );
                  }}
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
                  value={customerName}
                  onChange={(e) => {
                    const selectedCustomer = customer.find(
                      (val) => val.customer_id == e.target.value,
                    );
                    setCustomerName(e.target.value);
                    setSelectCustomerName(
                      selectedCustomer ? selectedCustomer.customer_name : "",
                    );
                  }}
                  className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
                  id="parentCategory"
                  name="parentid"
                >
                  <option value="">Walk in Customer</option>
                  {customer.map((val, index) => (
                    <option key={index} value={val.customer_id}>
                      {val.customer_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Main content area - takes remaining space */}
          <div className="flex-1 flex flex-col min-h-0">
            {/* Cart container */}
            <div className="cart-container w-[530px] min-w-[400px] border-[1px] border-[#000] text-white rounded-md p-2 flex-1 flex flex-col bg-white">
              {/* Scrollable items area */}
              <div className="flex-1 overflow-y-auto">
                {/* Cart header */}
                <div className="flex justify-between items-center py-3 px-4 rounded-lg border-b-[0.5px] border-[#4CBBA1] text-zinc-950 shadow-md bg-[#ffffff] text-lg font-bold sticky top-0 z-10">
                  <span className="w-[120px] text-nowrap">Product</span>
                  <span className="w-[60px] text-center">Price</span>
                  <span className="w-[80px] text-center">Quantity</span>
                  <span className="w-[50px] text-center">Action</span>
                </div>

                {/* Cart Items */}
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
                                ➕ {addon.add_on_name} (x{addon.add_on_quantity}
                                )
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
              <section className="billing p-2 bg-[#ffffff] rounded-md mt-1 shadow-md">
                <DataTable total={total} vat={vat} subtotal={subtotal} />
              </section>
            </div>

            <section className="PreviewButton flex justify-center items-center mt-2">
              <div className="flex gap-x-4">
                <button
                  onClick={handleprewiew}
                  className={`bg-[#1C1D3E] text-[#fff] rounded-md px-6 py-2 ${
                    cart.length === 0
                      ? "cursor-not-allowed opacity-50"
                      : "cursor-pointer"
                  }`}
                  disabled={cart.length === 0}
                >
                  Preview
                </button>

                {total !== 0 ? (
                  <button
                    onClick={() => setOrderModal(true)}
                    className="bg-[#4c9e53] text-[#fff] rounded-md px-6 py-2"
                  >
                    Place Order
                  </button>
                ) : (
                  <button className="bg-[#e24c4c] text-[#fff] rounded-md px-6 py-2">
                    Not Select
                  </button>
                )}
                <button
                  onClick={() => {
                    setCart([]);
                    setTotal(0);
                    setOrderDetail([]);
                    setCustomerName([]);
                    setSelectCustomerType();
                    setWaiter([]);
                    setSelectTable([]);
                    setVat([]);
                  }}
                  className="bg-[#d64848] text-[#fff] rounded-md px-6 py-2"
                >
                  Cancel
                </button>

                <button
                  onClick={handleholdOrder}
                  className="bg-[#5688d4] text-[#fff] rounded-md px-6 py-2"
                >
                  Hold Order
                </button>
              </div>
            </section>
          </div>
        </section>
      </div>

      {/* Preview */}
      <div className="hidden">
        <ComponentToPrint
          ref={componentRef}
          cart={cart}
          total={total}
          vat={vat}
          subtotal={subtotal}
          serviceCharge={serviceChargeAmount}
        />
      </div>
      {/* For print invoice after the place order */}
      <div style={{ display: "none" }}>
        <ComponentToPrintInvoice
          ref={componentRef2}
          invoiceData={invoiceData}
        />
      </div>
      {/* Table */}
      <TableDialogBox
        title={"View All Tables"}
        isOpen={cModal5}
        onClose={() => setCmodal5(false)}
      >
        <div className="p-5">
          {/* TABLE GRID */}
          <div className="grid grid-cols-4 gap-2">
            {tableData.map((val) => {
              const isBooked = val.status === "booked";
              const isPartial = val.status === "partial";
              return (
                <div
                  key={val.tableid}
                  onClick={() => {
                    if (!isBooked) {
                      setSelectedTable(val);
                      setPersons("");
                    }
                  }}
                  className={`cursor-pointer border rounded-md p-2 text-center shadow
              ${isBooked ? "bg-red-100 border-red-400" : "bg-white hover:bg-green-50 border-[#4CBBA1]"}`}
                >
                  <img src={tableimg} className="w-6 mx-auto" />

                  <h1 className="text-sm font-semibold">{val.tablename}</h1>

                  <p className="text-xs">Capacity: {val.person_capicity}</p>
                  <p className="text-xs">Occupied: {val.occupied_seats}</p>
                  <p className="text-xs">Remaining: {val.remaining}</p>

                  {isBooked ? (
                    <span className="text-red-600 text-xs font-medium">
                      Booked
                    </span>
                  ) : isPartial ? (
                    <span className="text-orange-500 text-xs font-medium">
                      Partial
                    </span>
                  ) : (
                    <span className="text-green-600 text-xs font-medium">
                      Free
                    </span>
                  )}
                </div>
              );
            })}
          </div>

          {/* PERSON INPUT */}
          {selectedTable && (
            <div className="mt-4 border p-3 rounded bg-gray-50">
              <h2 className="text-sm font-semibold mb-2">
                Selected Table: {selectedTable.tablename}
              </h2>

              <div>
                <label className="text-xs">Persons</label>
                <input
                  type="number"
                  min="1"
                  max={selectedTable.remaining}
                  value={persons}
                  onChange={(e) => {
                    let value = Number(e.target.value);

                    if (e.target.value === "") {
                      setPersons("");
                      return;
                    }

                    if (value < 1) value = 1;

                    // 🔒 cannot exceed remaining seats
                    if (value > selectedTable.remaining) {
                      value = selectedTable.remaining;
                    }

                    setPersons(value);
                  }}
                  className="border w-full px-2 py-1 rounded"
                  placeholder={`Max ${selectedTable.remaining}`}
                />
              </div>
            </div>
          )}

          {/* BUTTONS */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={() => setCmodal5(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded"
            >
              Close
            </button>

            <button
              onClick={() => {
                if (!selectedTable || !persons) {
                  alert("Please select table and enter persons");
                  return;
                }

                console.log("Selected table:", selectedTable.tableid);
                console.log("Persons:", persons);

                setSelectTable(selectedTable.tableid);
                setCmodal5(false);
              }}
              className="px-4 py-2 bg-[#4CBBA1] text-white rounded"
            >
              Confirm
            </button>
          </div>
        </div>
      </TableDialogBox>

      {/* Place Order Modal */}
      <DialogBoxSmall
        title=""
        isOpen={orderModal}
        onClose={() => setOrderModal(false)}
      >
        <div className="p-3 bg-gradient-to-br from-white to-[#f4fffb] rounded-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-20 h-20 mx-auto rounded-full bg-[#4CBBA1]/10 flex items-center justify-center mb-4">
              <FaReceipt className="text-4xl text-[#4CBBA1]" />
            </div>

            <h2 className="text-3xl font-bold text-gray-800">
              Confirm Your Order
            </h2>

            <p className="text-gray-500 mt-2 text-sm leading-relaxed">
              Choose how you want to place this order. <br />
              You can print the Kitchen Order Ticket (KOT) or directly send the
              order to the kitchen without printing.
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-8">
            {/* Without KOT */}
            <div
              onClick={() => {
                setOrderModal(false);
                handlePlaceOrder(false);
              }}
              className="border border-gray-200 hover:border-gray-400 rounded-2xl p-6 cursor-pointer transition duration-300 hover:shadow-xl hover:-translate-y-1 bg-white"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center">
                  <FaBan className="text-2xl text-gray-500" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Place Without KOT
                  </h3>

                  <p className="text-sm text-gray-500">
                    Directly send order to kitchen
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-600">
                <li>✔ No printer required</li>
                <li>✔ Faster order placement</li>
                <li>✔ Best for quick service</li>
              </ul>
            </div>

            {/* Print KOT */}
            <div
              onClick={() => {
                setOrderModal(false);
                handlePlaceOrder(true);
              }}
              className="border-2 border-[#4CBBA1] rounded-2xl p-6 cursor-pointer transition duration-300 hover:shadow-2xl hover:-translate-y-1 bg-[#f8fffc]"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-full bg-[#4CBBA1]/10 flex items-center justify-center">
                  <FaPrint className="text-2xl text-[#4CBBA1]" />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-800">
                    Print KOT & Place Order
                  </h3>

                  <p className="text-sm text-gray-500">
                    Send order with kitchen print
                  </p>
                </div>
              </div>

              <ul className="space-y-2 text-sm text-gray-600">
                <li>✔ Automatic kitchen printing</li>
                <li>✔ Organized kitchen workflow</li>
                <li>✔ Recommended for restaurants</li>
              </ul>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center">
            <button
              onClick={() => setOrderModal(false)}
              className="text-sm text-gray-500 hover:text-red-500 transition"
            >
              Cancel Order
            </button>
          </div>
        </div>
      </DialogBoxSmall>

      {/* See All Customer */}
      <DialogBoxSmall
        title={"See All Customer List"}
        onClose={() => {
          setCmodal2(false);
        }}
        isOpen={cModal2}
      >
        <div className="p-4">
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-semibold mb-2"
                htmlFor="parentCategory"
              >
                All Customer
              </label>
              <select
                value={customerName}
                onChange={(e) => {
                  const selectedCustomer = customer.find(
                    (val) => val.customer_id == e.target.value,
                  );
                  setCustomerName(e.target.value);
                  setSelectCustomerName(
                    selectedCustomer ? selectedCustomer.customer_name : "",
                  );
                }}
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
                id="parentCategory"
                name="parentid"
              >
                <option value="">Select Customer</option>
                {customer.map((val, index) => (
                  <option key={index} value={val.customer_id}>
                    {val.customer_name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setCmodal2(false)}
                type="button"
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setCustomerName(customerName);
                  setCmodal2(false);
                  console.log(customerName);
                }}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600 transition duration-200"
              >
                Select
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>

      <CustomerDilogBox
        title={"All Customer Type"}
        onClose={() => setCmodal3(false)}
        isOpen={cModal3}
      >
        <div className="p-6">
          {/* Customer Type Selection with Images */}
          <div className="grid grid-cols-5 gap-4">
            {customerType.map((val, index) => (
              <div
                key={index}
                onClick={() => {
                  setSelectCustomerType(val.customer_type_id);
                  setCustomerTypeName(val.customer_type);
                  setCmodal3(false);

                  if (val.customer_type === "Walk In Customer") {
                    setCmodal(true);
                  }
                }}
                className={`border-2 p-2 rounded-md cursor-pointer transition duration-200 ${
                  selectCustomerType === val.customer_type_id
                    ? "border-green-500"
                    : "border-gray-300"
                }`}
              >
                <img
                  src={`${VITE_IMG_URL}` + val.picture}
                  alt={val.customer_type}
                  className="w-full h-24 object-cover rounded-md"
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
              className="px-4 py-2 bg-gray-300 text-gray-800 rounded-md hover:bg-gray-400 transition duration-200"
            >
              Close
            </button>
          </div>
        </div>
      </CustomerDilogBox>

      {/* Add Customer */}
      <DialogBoxSmall
        isOpen={cModal}
        title={"Add Customer"}
        onClose={() => {
          setCmodal(false);
        }}
      >
        <div className="p-6">
          <form
            onSubmit={submitAddcustomer}
            className="bg-white rounded-lg shadow-md p-6"
          >
            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Customer Name
              </label>
              <input
                type="text"
                onChange={handelChange}
                value={formData.customer_name}
                name="customer_name"
                placeholder="Customer Name"
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                onChange={handelChange}
                value={formData.customer_email}
                name="customer_email"
                placeholder="Customer E-mail"
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Mobile
              </label>
              <input
                type="tel"
                onChange={handelChange}
                value={formData.customer_phone}
                name="customer_phone"
                placeholder="Mobile Number"
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
              />
            </div>

            <div className="mb-4">
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Address
              </label>
              <textarea
                onChange={handelChange}
                value={formData.customer_address}
                name="customer_address"
                placeholder="Enter Address"
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
              ></textarea>
            </div>

            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="bg-gray-300 text-gray-800 w-[104px] h-[42px] rounded-md hover:bg-gray-400 transition duration-200"
                type="reset"
              >
                Reset
              </button>
              <button
                className="bg-[#4CBBA1] text-white w-[104px] h-[42px] rounded-md hover:bg-green-600 transition duration-200"
                type="submit"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>

      {/* Waiter  */}

      <DialogBoxSmall
        title={"All Waiters' List"}
        onClose={() => {
          setCmodal4(false);
        }}
        isOpen={cModal4}
      >
        <div className="p-6">
          <form action="" onSubmit={(e) => e.preventDefault()}>
            <div className="mb-4">
              <label
                className="block text-gray-700 font-semibold mb-2"
                htmlFor="waiterSelect"
              >
                Select Waiter
              </label>
              <select
                value={waiter}
                onChange={(e) => {
                  const selectedWaiter = WaiterData.find(
                    (val) => val.id == e.target.value,
                  );
                  setWaiter(e.target.value);
                  setWaiterName(selectedWaiter ? selectedWaiter.firstname : "");
                }}
                className="shadow border border-[#4CBBA1] rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring focus:ring-[#4CBBA1] transition duration-200"
                id="waiterSelect"
                name="waiter"
              >
                <option value="">Select</option>
                {WaiterData.map((val, index) => (
                  <option key={index} value={val.id}>
                    {`${val.firstname} ${val.lastname}`}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-4 mt-6">
              <button
                onClick={() => setCmodal4(false)}
                type="button"
                className="px-4 py-2 bg-[#1C1D3E] text-white rounded-md hover:bg-gray-600 transition duration-200"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setWaiter(waiter);
                  setCmodal4(false);
                  console.log(waiter);
                }}
                type="button"
                className="px-4 py-2 bg-[#4CBBA1] text-white rounded-md hover:bg-green-600 transition duration-200"
              >
                Select
              </button>
            </div>
          </form>
        </div>
      </DialogBoxSmall>
      {/* Plaace Order Dialog box */}

      <CompleteOrderDialogBox
        isOpen={invoiceModal}
        onClose={() => {
          setInvoiceModal(false);
        }}
        onPrint={handlePrintInvoice}
      ></CompleteOrderDialogBox>

      {/* add food and variant data */}
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

      <CashRegisterModel
        onClose={() => {
          setCmodal7(false);
        }}
        isOpen={cModal7}
        setIsCashRegisterOpen={setIsCashRegisterOpen}
      ></CashRegisterModel>

      <DraftOrder
        onClose={() => {
          setCmodal9(false);
        }}
        isOpen={cModal9}
      ></DraftOrder>
      {isCalculatorOpen && (
        <CalculatorModal closeCalculator={() => setIsCalculatorOpen(false)} />
      )}
    </>
  );
};

export default OrderList;
