import React, { useEffect, useState,useMemo } from "react";
import { useParams } from "react-router-dom";
import { useLocation } from "react-router-dom";
import { SiFoodpanda } from "react-icons/si";
import axios from "axios";
import defaultimage from "../../assets/images/nudel.jpeg";
import { toast } from "react-toastify";
import MobileviewDialogBox from "../../components/MobileviewDialogBox";
import { FaCartShopping } from "react-icons/fa6";
import { useNavigate } from "react-router-dom";
import { FiEdit } from "react-icons/fi"
;
const QrOrder_Page = () => {
  const { tableId } = useParams();
  const [products, setProducts] = useState([]);
  const [searchName, setSearchName] = useState("");
  const [cart, setCart] = useState([]);
  const [orderDetail, setOrderDetail] = useState([]);
  const [Categories, setCategory] = useState([]);
  const [addonsModal, setAddonsModal] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL= import.meta.env.VITE_IMG_URL
  const defaultImage = defaultimage;
  const [selectAddone, setSelectAddone] = useState([]);
  const handleImageError = (e) => {
    e.target.src = defaultImage;
  };
  useEffect(() => {
    if (tableId) {
      // Fetch data based on the tableId or perform other actions
      console.log("Table ID from QR code:", tableId);
    }
  }, [tableId]);

  const location = useLocation();
  const { orderId } = location.state || {};

  const navigate=useNavigate()
  //  get all product
  const fetchProducts = (categoryId) => {
    if (categoryId) {
      axios
        .get(`${API_BASE_URL}/qrorderdata`, {
          params: { categoryId },
        })
        .then((res) => {
          console.log(res.data);
          setProducts(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    } else {
      axios
        .get(`${API_BASE_URL}/qrorderdata`)
        .then((res) => {
          console.log(res.data);
          setProducts(res.data);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  };
  // Search  products
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchName(value);

    if (value.trim() === "") {
      fetchProducts();
      return;
    }

    axios
      .get(`${API_BASE_URL}/qrorderdata`, {
        params: { searchTerm: value },
      })
      .then((res) => {
        setProducts(res.data.length > 0 ? res.data : []);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        toast.error("Item Not Available");
      });
  };
  // all categorys list
  const getCategoryMenu = () => {
    axios
      .get(`${API_BASE_URL}/getCategoryList`)
      .then((res) => {
        console.log(res.data.data);
        setCategory(res.data.data);
      })
      .catch((error) => {
        console.log(error);
      });
  };
  
  const addProductToCart = (action, product) => {
    if (product.addons && product.addons.length > 0) {
      openAddons(product); // Open addon modal
    } else {
      setCart((prevCart) => {
        console.log("Previous cart:", prevCart);

        const currentProduct = prevCart.find(
          (item) => item.variantid === product.variantid
        );

        if (action === "increment") {
          if (currentProduct) {
            const updatedCart = prevCart.map((item) =>
              item.variantid === product.variantid
                ? { ...item, quantity: item.quantity + 1 }
                : item
            );
            console.log("Updated cart (increment):", updatedCart);
            return updatedCart;
          } else {
            const newCart = [...prevCart, { ...product, quantity: 1 }];
            console.log("Updated cart (new product):", newCart);
            return newCart;
          }
        }

        if (action === "decrement") {
          if (currentProduct) {
            if (currentProduct.quantity - 1 <= 0) {
              const filteredCart = prevCart.filter(
                (item) => item.variantid !== product.variantid
              );
              console.log("Updated cart (decrement to 0):", filteredCart);
              return filteredCart;
            } else {
              const decrementedCart = prevCart.map((item) =>
                item.variantid === product.variantid
                  ? { ...item, quantity: item.quantity - 1 }
                  : item
              );
              console.log("Updated cart (decrement):", decrementedCart);
              return decrementedCart;
            }
          }
        }

        return prevCart;
      });
      setOrderDetail((prevOrderDetail) => {
        const productIndex = prevOrderDetail.findIndex(
          (item) => item.variantid === product.variantid
        );

        if (productIndex > -1) {
          const updatedOrder = [...prevOrderDetail];
          if (action === "increment") {
            updatedOrder[productIndex].quantity += 1;
          } else if (action === "decrement") {
            updatedOrder[productIndex].quantity -= 1;
            if (updatedOrder[productIndex].quantity <= 0) {
              updatedOrder.splice(productIndex, 1);
            }
          }
          return updatedOrder;
        } else {
          return [
            ...prevOrderDetail,
            { ...product, quantity: 1, addons: [], totalAmount: product.price },
          ];
        }
      });
    }
  };

  // Derive orderDetail from cart using useEffect
  const derivedOrderDetail = useMemo(
    () =>
      cart.map((item) => ({
        variantid: item.variantid,
        quantity: item.quantity,
        ProductsID: item.ProductsID,
        price: item.price,
        productvat: item.productvat,
        variantName: item.variantName,
        checkedaddons: item.checkedaddons || [],
        addons: item.addons || [],
        totalAmount: item.quantity * item.price + (item.addonTotal || 0),
      })),
    [cart]
  );
  
  useEffect(() => {
    setOrderDetail(derivedOrderDetail);
    console.log("Updated orderDetail:", derivedOrderDetail);
  }, [derivedOrderDetail]);


 


  const handleProceedToCheckout = () => {
    console.log(orderDetail)
    if(cart.length === 0){
toast.error("Please add foof in cart to procide");
return;
    }else{
      const checkoutData = {
        orderDetails: orderDetail, // existing cart/order data
        tableId, // Include the tableId here
      };
    
  
      // Navigate to Checkout page and pass data
      navigate(`/checkout-order/${tableId}`, { state: checkoutData });
    }
   
  };

  const [addOneData, setAddOneData] = useState({
    productvat: "",
    ProductName: "",
    price: "",
    variants: "",
    variantid: "",
    addons: [],
    quantity: 1,
  });

  const handleaddonQuantityChange = (e, index) => {
    const quantity = parseInt(e.target.value, 10) || 1;

    setAddOneData((prev) => {
      const updatedAddons = [...prev.addons];
      updatedAddons[index] = {
        ...updatedAddons[index],
        add_on_quantity: quantity,
      };

      const updatedCheckedAddons = prev.checkedaddons.map((addon) =>
        addon.add_on_name === updatedAddons[index].add_on_name
          ? { ...addon, add_on_quantity: quantity }
          : addon
      );

      return {
        ...prev,
        addons: updatedAddons,
        checkedaddons: updatedCheckedAddons,
      };
    });

    console.log("Addon Quantities Updated:", addOneData.checkedaddons);
  };

  const handleAddonChange = (e, index) => {
    const selectedAddon = addOneData.addons[index];
    const isSelected = e.target.checked;

    setAddOneData((prev) => {
      const updatedCheckedAddons = [...(prev.checkedaddons || [])];

      if (isSelected) {
        // Add the selected addon with default quantity = 1
        const existingAddon = updatedCheckedAddons.find(
          (addon) => addon.add_on_name === selectedAddon.add_on_name
        );

        if (!existingAddon) {
          updatedCheckedAddons.push({
            ...selectedAddon,
            add_on_quantity: 1, // Set default quantity to 1
            selected: true,
          });
        }
      } else {
        // Remove the addon if unchecked
        const filteredAddons = updatedCheckedAddons.filter(
          (addon) => addon.add_on_name !== selectedAddon.add_on_name
        );
        return {
          ...prev,
          checkedaddons: filteredAddons,
        };
      }

      return {
        ...prev,
        checkedaddons: updatedCheckedAddons,
      };
    });

    console.log("Addon Selection Updated:", addOneData.checkedaddons);
  };

  const handleQuantityChange = (event) => {
    const { value } = event.target;
    setAddOneData((prevData) => ({
      ...prevData,
      quantity: parseInt(value, 10),
    }));
  };

  //addons submit
  const handleAddOnSubmit = () => {
    console.log("Submit Addons Data:", addOneData);
    const addonTotal = addOneData.checkedaddons.reduce(
      (acc, addon) =>
        addon.selected
          ? acc + addon.add_on_price * (addon.add_on_quantity || 1)
          : acc,
      0
    );

    const findProductInCart = cart.find(
      (item) => item.variantid === addOneData.variantid
    );

    if (findProductInCart) {
      const updatedCart = cart.map((cartItem) => {
        if (cartItem.variantid === addOneData.variantid) {
          let newQuantity = cartItem.quantity + addOneData.quantity;

          // Update existing checkedaddons
          let updatedCheckedAddons = cartItem.checkedaddons.map((addon) => {
            const matchingAddon = addOneData.checkedaddons.find(
              (newAddon) => newAddon.add_on_name === addon.add_on_name
            );

            if (matchingAddon) {
              return {
                ...addon,
                add_on_quantity:
                  addon.add_on_quantity + (matchingAddon.add_on_quantity || 1),
              };
            } else {
              return addon;
            }
          });

          // Add new checkedaddons
          addOneData.checkedaddons.forEach((newAddon) => {
            if (
              !cartItem.checkedaddons.find(
                (addon) => addon.add_on_name === newAddon.add_on_name
              )
            ) {
              updatedCheckedAddons.push({
                ...newAddon,
                add_on_quantity: newAddon.add_on_quantity || 1,
              });
            }
          });

          // Calculate new addon total
          const updatedAddonTotal = updatedCheckedAddons.reduce(
            (acc, addon) =>
              acc + addon.add_on_price * (addon.add_on_quantity || 1),
            0
          );

          return {
            ...cartItem,
            quantity: newQuantity,
            checkedaddons: updatedCheckedAddons,
            totalAmount: cartItem.price * newQuantity + updatedAddonTotal,
          };
        }
        return cartItem;
      });

      setCart(updatedCart);

      setOrderDetail((prevOrderDetail) => {
        return prevOrderDetail.map((order) =>
          order.variantid === addOneData.variantid
            ? {
                ...order,
                quantity: order.quantity + addOneData.quantity,
                checkedaddons: updatedCart.find(
                  (item) => item.variantid === order.variantid
                ).checkedaddons,
              }
            : order
        );
      });
    } else {
      const addonTotal = addOneData.checkedaddons.reduce(
        (acc, addon) =>
          addon.selected
            ? acc + addon.add_on_price * (addon.add_on_quantity || 1)
            : acc,
        0
      );

      const newProduct = {
        ...addOneData,
        totalAmount: addOneData.price * addOneData.quantity + addonTotal,
        checkedaddons: addOneData.checkedaddons || [],
      };

      setCart([...cart, newProduct]);
      setOrderDetail((prevOrderDetail) => [...prevOrderDetail, newProduct]);
    }

    setAddonsModal(false);
  };

  const openAddons = (val) => {
    setSelectAddone([]);
    setAddOneData((prevData) => ({
      ...prevData,
      ProductsID: val.ProductsID,
      productvat: val.productvat,
      ProductName: val.ProductName,
      price: val.price,
      variantName: val.variantName,
      addons: [...val.addons],
      variantid: val.variantid,
      quantity: 1,
      checkedaddons: selectAddone,
      kitchenid: val.kitchenid,
      kitchen_name: val.kitchen_name,
    }));
    setAddonsModal(true);
  };

  const totalProducts = Object.values(cart).reduce(
    (total, product) => total + product.quantity,
    0
  );
  const handleProceedEdit = () => {
    if (!orderId) { // Check if orderId is null, undefined, or falsy
      toast.error("Please select an order to edit."); // Alternatively, use a toast notification
      return;
    }
    
    // Navigate to the edit page with the orderId
    navigate(`/editqrorder`, { state: { orderId } });
  };
  
  useEffect(() => {
    fetchProducts();
    getCategoryMenu();
  }, []);
  return (
    <>
      <div className="min-h-screen bg-gray-100 p-4">
        {/* Header */}
        <div className="flex justify-between items-center gap-x-2 mb-4">
          <header className="flex items-center h-11 w-full bg-[#1C1D3E] rounded-md shadow-md p-2">
            <SiFoodpanda className="text-3xl text-zinc-50 mr-2" />
            <h1 className="text-xl font-bold text-gray-50">Goo Food</h1>
          </header>

          <div className="relative h-11 w-11 bg-[#3ba579] rounded-md flex items-center justify-center">
            <FaCartShopping
              className="text-white text-2xl"
              onClick={handleProceedToCheckout}
            />
            {totalProducts > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {totalProducts}
              </span>
            )}
          </div>

          <div className="relative h-11 w-11 bg-[#3ba579] rounded-md flex items-center justify-center">
            <FiEdit
              className="text-white text-2xl"   
              onClick={handleProceedEdit}
            />
          </div>
        </div>

        {/* Category Carousel */}
        <div className="flex overflow-x-auto gap-3 py-2 mb-4 bg-white shadow-md rounded-lg px-2">
          <button
            onClick={() => {
              fetchProducts();
            }}
            className="flex-shrink-0 hover:bg-[#3ba579] bg-[#1C1D3E]  duration-200 hover:text-zinc-950 text-gray-200 px-4 py-2 rounded-full text-sm font-medium"
          >
            All Products
          </button>
          {Categories.map((category) => (
            <button
              onClick={() => {
                fetchProducts(category.CategoryID);
              }}
              key={category.CategoryID}
              className="flex-shrink-0 hover:bg-[#3ba579] bg-[#1C1D3E]  duration-200 hover:text-zinc-950 text-gray-200 px-4 py-2 rounded-full text-sm font-medium"
            >
              {category.CategoryName}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search for products..."
            className="w-full px-4 py-2 rounded-md border-[1px] border-[#3ba579]"
            value={searchName}
            onChange={handleSearch}
          />
        </div>
        {/* Product List */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 ">
          {products.map((product) => {
            const quantity = cart[product.variantid]?.quantity || 0; // Access quantity properly

            return (
              <div
                key={product.variantid}
                className="flex items-center bg-white shadow-md border-[1px] border-[#3ba579] rounded-lg p-4"
              >
                <img
                  src={`${VITE_IMG_URL}${product.ProductImage}`}
                  alt={product.ProductName}
                  onError={handleImageError}
                  className="w-14 h-14 object-cover rounded-md"
                />

                <div className="ml-4 flex-grow">
                  <h3 className="text-md font-semibold">
                    {product.variantName}
                  </h3>
                  <h3 className="text-sm font-semibold">{product.price}</h3>
                </div>

                <div className="flex items-center">
                  {(() => {
                    // Find the current product in the cart
                    const currentProduct = cart.find(
                      (item) => item.variantid === product.variantid
                    );

                    const quantity = currentProduct
                      ? currentProduct.quantity
                      : 0;

                    return quantity > 0 ? (
                      <>
                        <button
                          onClick={() => addProductToCart("decrement", product)}
                          className="bg-red-500 hover:bg-red-600 text-white px-2 rounded-l-md"
                        >
                          -
                        </button>
                        <span className="bg-gray-200 px-1">{quantity}</span>
                        <button
                          onClick={() => addProductToCart("increment", product)}
                          className="bg-[#1C1D3E] text-white px-2 rounded-r-md"
                        >
                          +
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => addProductToCart("increment", product)}
                        className="bg-[#1C1D3E] text-white text-sm p-1 rounded-md"
                      >
                        Add
                      </button>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <MobileviewDialogBox
        isOpen={addonsModal}
        title={"Food detais with add-On "}
        onClose={() => {
          setAddonsModal(false);
        }}
        isClick={handleAddOnSubmit}
        button={"Add to Cart"}
      >
        <div className="overflow-x-auto">
          <div className=" mb-2">
            <table className="min-w-full bg-white">
              <thead>
                <tr>
                  <th className="py-4 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Product Name
                  </th>

                  <th className="py-4 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Quantity
                  </th>
                  <th className="py-4 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                    Price
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b text-center">
                  <td className="py-2 px-2 w-[100px] border border-[#4CBBA1]">
                    {addOneData.variantName}
                  </td>

                  <td className="py-2 px-2 border border-[#4CBBA1]">
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
                  <td className="py-2 px-2 border border-[#4CBBA1]">
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
          <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="py-2 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                  Select
                </th>
                <th className="py-2 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                  Add on name
                </th>
                <th className="py-2 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                  Add on Quantity
                </th>
                <th className="py-2 px-2 bg-[#4CBBA1] text-gray-50 uppercase text-sm">
                  Price
                </th>
              </tr>
            </thead>
            <tbody>
              {addOneData.addons.map((val, index) => (
                <tr key={index} className="border-b text-center">
                  <td className="py-2 px-2 border border-[#4CBBA1]">
                    <input
                      type="checkbox"
                      className="form-checkbox  size-1 custom-checkbox  text-[#4CBBA1]"
                      value={val.add_on_name}
                      onChange={(e) => handleAddonChange(e, index)}
                    />
                  </td>
                  <td className="py-2 px-2 border border-[#4CBBA1] text-sm">
                    {val.add_on_name}
                  </td>
                  <td className="py-2 px-2 border border-[#4CBBA1]">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      // disabled={!addon.selected}
                      className="border border-gray-300 rounded p-1 w-full"
                      placeholder="1"
                      onChange={(e) => handleaddonQuantityChange(e, index)}
                    />
                  </td>
                  <td className="py-2 px-2 border border-[#4CBBA1]">
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
      </MobileviewDialogBox>
    </>
  );
};

export default QrOrder_Page;
