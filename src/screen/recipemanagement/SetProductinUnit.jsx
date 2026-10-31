import React, { useEffect, useState, useContext } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { IoMdNotifications, IoIosAddCircleOutline } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { FaRegTrashCan } from "react-icons/fa6";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import useFullScreen from "../../components/useFullScreen";
import HasPermission from "../../store/HasPermission";
import { AuthContext } from "../../store/AuthContext";
const SetProductionUnit = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [isOpen, setOpen] = useState(true);
  const [foodData, setFoodData] = useState([]); // all food
  const [variant, setVariant] = useState([]); // variant accourdin to food
  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const [selectedFood, setSelectedFood] = useState(""); // Selected Food name
  const [selectedVariant, setSelectedVariant] = useState("");
  const navigate = useNavigate();
  const [items, setItems] = useState([
    { item: "", quantity: 0, price: 0, unitPrice: 0 },
  ]);
  const [ingredientlist, setIngredientlist] = useState([]); // item information
  const token = localStorage.getItem("token");

  const getFoodData = () => {
    axios
      .get(`${API_BASE_URL}/foodname`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setFoodData(res.data.data);
        console.log(res.data.data); // Ensure API response structure matches your expectations
      })
      .catch((error) => console.error(error));
  };

  // fetch variant accourdin to food
  const fetchVariant = async (foodid) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/variantdata`, {
        params: { foodid },
        headers: {
          Authorization: token,
        },
      });
      console.log("Variants received: ", response.data.data);
      setVariant(response.data.data); // Update variant list based on food
    } catch (error) {
      console.error("Error fetching variants:", error);
    }
  };
  const handleFoodChange = (e) => {
    const foodid = e.target.value;
    setSelectedFood(foodid);
    setSelectedVariant("");
    fetchVariant(foodid);
  };
  // Handle variant selection change
  const handleVariantChange = (e) => {
    const variantid = e.target.value;
    setSelectedVariant(variantid);
  };

  // Fetch ingredient list
  const getingredientlist = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/productionunitingredients`, {
        headers: {
          Authorization: token,
        },
      });
      setIngredientlist(res.data.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    }
  };

  // Fetch price according to the selected ingredient
  const priceaccourdingtopro = async (index, ingredientId) => {
    if (!ingredientId) return;
    console.log("dtaa aa rha a ", ingredientId);
    try {
      const res = await axios.get(
        `${API_BASE_URL}/priceperitem/${ingredientId}`,
        { headers: { Authorization: token } }
      );
      const newPrice = res.data.data[0].Price;
      console.log("price aaaya ", newPrice);
      // Update the unit price and price (total) for the selected item
      const newItems = [...items];
      newItems[index].unitPrice = newPrice;
      newItems[index].price = newPrice * newItems[index].quantity; // Calculate total price based on quantity
      setItems(newItems);
    } catch (error) {
      console.error("Error fetching price:", error);
    }
  };

  // Handle ingredient change and fetch price for the selected ingredient
  const handleIngredientChange = (index, value) => {
    const newItems = [...items];
    newItems[index].item = value;
    newItems[index].quantity = 1; // Set quantity to 1 by default when item is selected
    setItems(newItems);

    // Fetch price for the newly selected ingredient
    priceaccourdingtopro(index, value);
  };

  // Handle quantity change and update total price
  const handleInputChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value; // Update the quantity or price

    if (field === "quantity") {
      newItems[index].price = newItems[index].unitPrice * value; // Update total price based on unit price
    }
    setItems(newItems);
  };

  // Add new item row
  const handleAddItem = () => {
    setItems([...items, { item: "", quantity: 0, price: 0, unitPrice: 0 }]);
  };

  // Remove item row
  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation before building requestData
    if (!selectedFood) {
      toast.error("Please select a food item.");
      return;
    }
    if (!selectedVariant) {
      toast.error("Please select a food variant.");
      return;
    }
    if (!items || items.length === 0) {
      toast.error("Please add at least one item.");
      return;
    }
    // Check each item for validity
    for (let i = 0; i < items.length; i++) {
      if (!items[i].item) {
        toast.error(`Please select an ingredient for row ${i + 1}.`);
        return;
      }
      if (!items[i].quantity || items[i].quantity <= 0) {
        toast.error(`Please enter a valid quantity for row ${i + 1}.`);
        return;
      }
    }

    const requestData = {
      fooddetails: [
        {
          foodid: selectedFood,
          pvarientid: selectedVariant,
        },
      ],
      itemdetails: items.map((item) => ({
        p_id: item.item,
        quantity: item.quantity,
      })),
    };

    console.log("Request Data:", requestData);

    try {
      const response = await fetch(`${API_BASE_URL}/productiondetail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token,
        },
        body: JSON.stringify(requestData),
      });

      if (!response.ok) {
        const errorJson = await response.json().catch(() => ({}));
        throw new Error(errorJson.message || "Something went wrong.");
      }

      const data = await response.json();
      toast.success("Production set successfully!");
      navigate("/set-production-list");
      setSelectedFood("");
      setSelectedVariant("");
      setItems([{ item: "", quantity: 0 }]);
    } catch (error) {
      const errorMessage = error.message || "Something went wrong.";
      console.error(error);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    getFoodData();
    fetchVariant();
    getingredientlist();
  }, []);

  return (
    <>
      <div className="main_div ">
        <section className=" side_section flex">
          <div
            className={`${
              isOpen == false
                ? "hidden"
                : "nav-container hide-scrollbar h-screen overflow-y-auto"
            }`}
          >
            <Nav />
          </div>
          <header className="">
            <Hamburger toggled={isOpen} toggle={setOpen} />
          </header>
          <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
            <div className="activtab flex justify-between">
              <h1 className=" flex items-center justify-center gap-1 font-semibold">
                Set Production Unit*
              </h1>

              <div className="notification flex gap-x-5 ">
                <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                <MdOutlineZoomOutMap
                  onClick={toggleFullScreen}
                  className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                />{" "}
              </div>
            </div>

            {/* Search Bar */}
            <div className=" mt-11  w-full ">
              <form action="" className="flex gap-x-11  items-center">
                <div>
                  <div className="mb-11 flex  gap-x-6">
                    <label
                      className=" m-auto text-left text-nowrap text-gray-700  font-semibold mb-2"
                      htmlFor="categoryName"
                    >
                      {" "}
                      Food Name*
                    </label>

                    <select
                      name="itemid"
                      value={selectedFood}
                      onChange={handleFoodChange}
                      className="shadow border border-[#4CBBA1]   md:min-w-[300px] rounded  py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outlin"
                    >
                      <option value="">Select Food</option>
                      {foodData.map((val, index) => (
                        <option key={index} value={val.ProductsID}>
                          {val.ProductName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-11 flex gap-x-5">
                  <label
                    className="m-auto w-[100px] text-left text-nowrap text-gray-700 font-semibold mb-2"
                    htmlFor="categoryName"
                  >
                    Variant Name*
                  </label>

                  <select
                    name="itemvid"
                    value={selectedVariant}
                    onChange={handleVariantChange}
                    className="shadow border border-[#4CBBA1] md:min-w-[300px] rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    <option value="">Select Option</option>

                    {variant.map((variantItem, index) => (
                      <option key={index} value={String(variantItem.variantid)}>
                        {variantItem.variantName}
                      </option>
                    ))}
                  </select>
                </div>
              </form>
            </div>

            <div className="main_form">
              <form onSubmit={handleSubmit}>
                <div className="p-4 border-[1px] border-[#4CBBA1] rounded shadow-sm">
                  <div className="flex justify-between mb-11">
                    <div className="font-semibold">Item Information*</div>
                    <div className="font-semibold">Quantity*</div>
                    <div className="font-semibold">Price*</div>
                    <div className="font-semibold">Action</div>
                  </div>

                  {items.map((item, index) => (
                    <div key={index} className="flex justify-between mb-6">
                      <select
                        value={item.item || ""} // Ensure controlled value
                        onChange={(e) =>
                          handleIngredientChange(index, e.target.value)
                        }
                        className="border-[1px] w-[250px] border-[#4CBBA1] shadow-md p-2 rounded"
                      >
                        <option value="">Select Option</option>
                        {ingredientlist.map((val, idx) => (
                          <option key={idx} value={val.id}>
                            {val.ingredient_name}
                          </option>
                        ))}
                      </select>

                      <input
                        type="number"
                        min={1}
                        value={item.quantity || 0} // Ensure controlled value
                        onChange={(e) =>
                          handleInputChange(
                            index,
                            "quantity",
                            parseFloat(e.target.value),
                          )
                        }
                        className="border-[1px] border-[#4CBBA1] p-2 rounded"
                      />

                      <input
                        type="number"
                        readOnly
                        value={item.price || 0} // Ensure controlled value
                        className="border-[1px] border-[#4CBBA1] p-2 rounded"
                      />

                      <div className="cursor-pointer flex justify-center items-center gap-x-2 text-white font-normal bg-[#FB3F3F] p-2 rounded">
                        <FaRegTrashCan />

                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="bg-[#4CBBA1] text-white p-2 rounded"
                  >
                    Add More Item
                  </button>
                </div>
                <HasPermission module="Set Production Unit" action="create">
                  <button
                    type="submit"
                    className="h-[42px] w-[168px] bg-[#1C1D3E] text-white p-2 rounded mt-4"
                  >
                    Submit
                  </button>
                </HasPermission>
              </form>
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default SetProductionUnit;
