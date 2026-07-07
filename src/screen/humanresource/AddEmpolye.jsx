import React, { useContext, useEffect, useState } from "react";
import Nav from "../../components/Nav";
import Hamburger from "hamburger-react";
import { toast } from "react-toastify";
import { IoMdNotifications } from "react-icons/io";
import { IoSettings } from "react-icons/io5";
import { LiaLanguageSolid } from "react-icons/lia";
import { MdOutlineZoomOutMap } from "react-icons/md";
import { AuthContext } from "../../store/AuthContext";
import axios from "axios";
import Designation from "./Designation";
import HasPermission from "../../store/HasPermission";
import useFullScreen from "../../components/useFullScreen";
import { useNavigate } from "react-router-dom";

const AddEmpolye = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const [isOpen, setOpen] = useState(true);
  const [step, setStep] = useState(1);
  const [division, setDivision] = useState([]);
  const [dutyType, setDutyType] = useState([]);
  const [position, setPosition] = useState([]);
  const [payfrequency, setPayfrequency] = useState([]);
  const [rateType, setRateType] = useState([]);
  const [mstatus, setMstatus] = useState([]);
  const [gendar, setGendar] = useState([]);
  const navigate = useNavigate();
  const [countries, setCountries] = useState([]);
  const [states, setStates] = useState([]);
  const [cities, setCities] = useState([]);

  const { isFullScreen, toggleFullScreen } = useFullScreen();
  const token = localStorage.getItem("token");

  // full screen

  const handleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    setIsFullScreen(!isFullScreen);
  };

  // get division
  const getallDivision = async () => {
    await axios
      .get(`${API_BASE_URL}/division`, {
        headers: {
          Authorization: token,
        },
      })
      .then((res) => {
        setDivision(res.data.data);
        console.log("data recive hua", division);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // duty type
  const getDutyType = async () => {
    await axios
      .get(`${API_BASE_URL}/dutytype`)
      .then((res) => {
        setDutyType(res.data.data);
        console.log("data recive  duty ak", dutyType);
      })
      .catch((err) => {
        console.log(err);
      });
  };
  // get all designations
  const getPositions = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/designation`, {
        headers: {
          Authorization: token,
        },
      });
      console.log(res.data);
      setPosition(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  // get Pay frequency
  const getPayFrequency = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/frequencytype`);
      console.log(res.data);
      setPayfrequency(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  // get rate type

  const getrateType = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/ratetype`);
      console.log(res.data);
      setRateType(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  // mstatus
  const getMstatus = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/mstatus`);
      console.log(res.data);
      setMstatus(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };

  const getGender = async () => {
    try {
      let res = await axios.get(`${API_BASE_URL}/gender`);
      console.log(res.data);
      setGendar(res.data.data);
    } catch (error) {
      console.log(error);
    }
  };
  // post data
  // File

  const initialFormData = {
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    country: "",
    state: "",
    city: "",
    zip: "",
    gender: "",
    dob: "",
    marital_status: "",
    picture: null,
    division_id: "",
    pos_id: "", // designation id
    duty_type: "",
    voluntary_termination: "",
    home_email: "",
    home_phone: "",
    emerg_contct: "",
    emrg_w_phone: "",
    termination_reason: "",
    hire_date: "",
    original_hire_date: "",
    termination_date: "",
    rehire_date: "",
    rate_type: "",
    rate: "",
    pay_frequency: "",
    pay_frequency_txt: "",
  };
  const [formdata, setFormdata] = useState(initialFormData);

  const validateFields = (fields) => {
    for (const field of fields) {
      if (!formdata[field] || formdata[field].trim() === "") {
        toast.error(
          `${
            field.charAt(0).toUpperCase() +
            field.slice(1).replace(/([A-Z])/g, " $1")
          } is required.`
        );
        return false;
      }
    }
    return true;
  };

  // Handle image file input
  const handleImageChange = (e) => {
    setFormdata({
      ...formdata,
      picture: e.target.files[0], // Set the image file in formData
    });
  };

  // Handle input changes
  // const handleChange = (e) => {
  //   const { name, value } = e.target;
  //   setFormdata({
  //     ...formdata,
  //     [name]: value,
  //   });
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // reset dependent dropdowns when higher-level changes
    if (name === "country") {
      setFormdata({ ...formdata, country: value, state: "", city: "" });
    } else if (name === "state") {
      setFormdata({ ...formdata, state: value, city: "" });
    } else {
      setFormdata({ ...formdata, [name]: value });
    }
  };

  // Fetch countries once
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/countries1`)
      .then((res) => setCountries(res.data.data))
      .catch((err) => console.error("Error fetching countries:", err));
  }, []);

  // Fetch states when country changes
  useEffect(() => {
    if (formdata.country) {
      axios
        .get(`${API_BASE_URL}/states1/${formdata.country}`)
        .then((res) => setStates(res.data.data))
        .catch((err) => console.error("Error fetching states:", err));
    } else {
      setStates([]);
      setCities([]);
      setFormdata((prev) => ({ ...prev, state: "", city: "" }));
    }
  }, [formdata.country]);

  // Fetch cities when state changes
  useEffect(() => {
    if (formdata.state && formdata.country) {
      axios
        .get(`${API_BASE_URL}/cities1/${formdata.country}/${formdata.state}`)
        .then((res) => setCities(res.data.data))
        .catch((err) => console.error("Error fetching cities:", err));
    } else {
      setCities([]);
      setFormdata((prev) => ({ ...prev, city: "" }));
    }
  }, [formdata.state, formdata.country]);

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form data to be sent:", formdata);

    // Create a FormData object
    const formDataToSend = new FormData();

    // Validation function to check if fields are empty
    const validateFields = (fields) => {
      for (const field of fields) {
        if (!formdata[field]) {
          toast.error(`${field.replace(/_/g, " ")} is required.`);
          return false;
        }
      }
      return true;
    };

    // Fields to validate
    const requiredFields = [
      "first_name",
      "last_name",
      "email",
      "phone",
      "gender",
      "dob",
      "pos_id",
      "duty_type",
      "hire_date",
      "country",
      "state",
      "city",
    ];

    // Validate required fields
    if (!validateFields(requiredFields)) {
      return; // Stop submission if validation fails
    }

    // ✅ Validate phone number (must be 10 digits)
    if (!/^[0-9]{10}$/.test(formdata.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return;
    }

    // ✅ Validate email address
    if (
      !/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(
        formdata.email.toLowerCase()
      )
    ) {
      toast.error("Enter a valid email address");
      return;
    }

    // Append all fields to FormData
    formDataToSend.append("first_name", formdata.first_name);
    formDataToSend.append("last_name", formdata.last_name);
    formDataToSend.append("email", formdata.email);
    formDataToSend.append("phone", formdata.phone);
    formDataToSend.append("zip", formdata.zip);
    formDataToSend.append("state", formdata.state);
    formDataToSend.append("country", formdata.country);
    formDataToSend.append("city", formdata.city);
    formDataToSend.append("gender", formdata.gender);
    formDataToSend.append("dob", formdata.dob);
    formDataToSend.append("marital_status", formdata.marital_status);
    formDataToSend.append("picture", formdata.picture);
    formDataToSend.append("division_id", formdata.division_id);
    formDataToSend.append("pos_id", formdata.pos_id);
    formDataToSend.append("duty_type", formdata.duty_type);
    formDataToSend.append(
      "voluntary_termination",
      formdata.voluntary_termination
    );
    formDataToSend.append("home_email", formdata.home_email);
    formDataToSend.append("home_phone", formdata.home_phone);
    formDataToSend.append("emerg_contct", formdata.emerg_contct);
    formDataToSend.append("emrg_w_phone", formdata.emrg_w_phone);
    formDataToSend.append("termination_reason", formdata.termination_reason);
    formDataToSend.append("hire_date", formdata.hire_date);
    formDataToSend.append("original_hire_date", formdata.original_hire_date);
    formDataToSend.append("termination_date", formdata.termination_date);
    formDataToSend.append("rehire_date", formdata.rehire_date);
    formDataToSend.append("rate_type", formdata.rate_type);
    formDataToSend.append("rate", formdata.rate);
    formDataToSend.append("pay_frequency", formdata.pay_frequency);
    formDataToSend.append("pay_frequency_txt", formdata.pay_frequency_txt);

    // Send POST request to create a new employee
    axios
      .post(`${API_BASE_URL}/createemployee`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token,
        },
      })
      .then((response) => {
        console.log(response.data);
        toast.success("Employee added successfully.");
        setFormdata({
          first_name: "",
          last_name: "",
          email: "",
          phone: "",
          zip: "",
          gender: "",
          dob: "",
          marital_status: "",
          picture: null,
          division_id: "",
          pos_id: "",
          duty_type: "",
          voluntary_termination: "",
          home_email: "",
          home_phone: "",
          emerg_contct: "",
          emrg_w_phone: "",
          termination_reason: "",
          hire_date: "",
          original_hire_date: "",
          termination_date: "",
          rehire_date: "",
          rate_type: "",
          rate: "",
          pay_frequency: "",
          pay_frequency_txt: "",
        });
        navigate("/manageemployee");
      })
      .catch((err) => {
        if (err.response && err.response.data && err.response.data.message) {
          toast.error(err.response.data.message);
        } else {
          toast.error("Something went wrong. Please try again.");
        }
      });
  };

  useEffect(() => {
    getallDivision();
    getDutyType();
    getPositions();
    getPayFrequency();
    getrateType();
    getMstatus();
    getGender();
  }, []);

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};

    if (!formdata.country) newErrors.country = "Please select a country.";
    if (!formdata.state) newErrors.state = "Please select a state.";
    if (!formdata.city) newErrors.city = "Please select a city.";
    // if (!formdata.address) newErrors.address = "Address is required.";
    if (!formdata.zip) newErrors.zip = "Pincode is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (!validateForm()) {
      toast.error("Please fill all required fields before continuing.");
      return;
    }

    // agar sab valid hai toh next step pe jao
    setStep(step + 1); // or jo bhi logic hai tumhara
  };

  const prevStep = () => {
    setStep(step - 1);
  };

  return (
    <>
      <>
        <div className="main_div ">
          <section className=" side_section flex">
            <div className={isOpen ? "" : "hidden"}>
              <Nav />
            </div>
            <header className="">
              <Hamburger toggled={isOpen} toggle={setOpen} />
            </header>
            <div className=" contant_div w-full  ml-4 pr-7 mt-4 ">
              <div className="activtab flex justify-between">
                <h1 className=" flex items-center justify-center gap-1 font-semibold">
                  Add Employee
                </h1>

                <div className="notification flex gap-x-5 ">
                  <IoMdNotifications className="  bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                  <IoSettings className="   bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />
                  <LiaLanguageSolid className=" bg-[#1C1D3E] text-white rounded-sm p-1 text-4xl" />

                  <MdOutlineZoomOutMap
                    onClick={toggleFullScreen}
                    className=" bg-[#1C1D3E] text-white cursor-pointer rounded-sm p-1 text-4xl"
                  />
                </div>
              </div>

              {/* Search Bar */}

              <div className=" w-full border-[#4CBBA1] border-[1px] p-2 mt-11">
                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">
                      Employee Information - Step 1
                    </h2>
                    <form>
                      {/* Persional information */}
                      <div className="info1 flex items-center justify-between mt-9">
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            First Name*
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.first_name}
                            name="first_name"
                            type="text"
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Last Name*
                          </label>
                          <input
                            name="last_name"
                            onChange={handleChange}
                            value={formdata.last_name}
                            type="text"
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Email*
                          </label>
                          <input
                            name="email"
                            onChange={handleChange}
                            value={formdata.email}
                            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                            type="email"
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter a valid email (e.g., user@example.com)
                          </p>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Phone*
                          </label>
                          <input
                            name="phone"
                            onChange={handleChange}
                            value={formdata.phone}
                            type="tel"
                            pattern="[0-9]{10,15}"
                            maxLength={10}
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter 10 digit phone number
                          </p>
                        </div>
                      </div>

                      {/* Country */}
                      <div className="country flex justify-between items-center mt-8">
                        <div>
                          <label className="block mb-2 text-sm font-medium text-gray-700">
                            Country*
                          </label>
                          <select
                            name="country"
                            value={formdata.country}
                            onChange={handleChange}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select Country</option>
                            {countries.map((country) => (
                              <option
                                key={country.id}
                                value={country.countryName}
                              >
                                {country.countryName}
                              </option>
                            ))}
                          </select>
                          {errors.country && (
                            <p className="text-red-500 text-sm">
                              {errors.country}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            State*
                          </label>
                          <select
                            name="state"
                            value={formdata.state}
                            onChange={handleChange}
                            disabled={!states.length}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select State</option>
                            {states.map((state) => (
                              <option key={state.id} value={state.stateName}>
                                {state.stateName}
                              </option>
                            ))}
                          </select>
                          {errors.state && (
                            <p className="text-red-500 text-sm">
                              {errors.state}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            City*
                          </label>
                          <select
                            name="city"
                            value={formdata.city}
                            onChange={handleChange}
                            disabled={!cities.length}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select City</option>
                            {cities.map((city) => (
                              <option key={city.id} value={city.cityName}>
                                {city.cityName}
                              </option>
                            ))}
                          </select>
                          {errors.city && (
                            <p className="text-red-500 text-sm">
                              {errors.city}
                            </p>
                          )}
                        </div>

                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Zip Code*
                          </label>
                          <input
                            name="zip"
                            onChange={handleChange}
                            value={formdata.zip}
                            placeholder="Zip Code"
                            type="number"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          {errors.zip && (
                            <p className="text-red-500 text-sm">{errors.zip}</p>
                          )}
                        </div>
                      </div>
                      {/* Division 1*/}

                      <div className="country flex justify-between items-center mt-9">
                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Division*
                          </label>
                          <select
                            value={formdata.division_id}
                            onChange={handleChange}
                            name="division_id"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {division.map((val) => (
                              <option key={val.dept_id} value={val.division_id}>
                                {val.division_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Designation*
                          </label>
                          <select
                            value={formdata.pos_id}
                            onChange={handleChange}
                            name="pos_id"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {position.map((val) => (
                              <option key={val.pos_id} value={val.pos_id}>
                                {val.position_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Duty Type*
                          </label>
                          <select
                            onChange={handleChange}
                            name="duty_type"
                            value={formdata.duty_type}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {dutyType.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.type_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Voluntary Termination
                          </label>
                          <select
                            value={formdata.voluntary_termination}
                            onChange={handleChange}
                            name="voluntary_termination"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>

                            <option value="1">Yes</option>
                            <option value="0">No</option>
                          </select>
                        </div>
                      </div>

                      {/* Persional information */}
                      <div className="info1 flex items-center justify-between mt-9">
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            DOB*
                          </label>
                          <input
                            name="dob"
                            value={formdata.dob}
                            onChange={handleChange}
                            type="date"
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Gender*
                          </label>
                          <select
                            onChange={handleChange}
                            name="gender"
                            value={formdata.gender}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {gendar.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.gender_name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Marital Status*
                          </label>
                          <select
                            onChange={handleChange}
                            name="marital_status"
                            value={formdata.marital_status}
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {mstatus.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.marital_sta}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Photo*
                          </label>
                          <input
                            name="picture"
                            type="file"
                            onChange={handleImageChange}
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                        </div>
                      </div>

                      {/* Persional information 2 */}
                      <div className="info1 flex items-center justify-between mt-9">
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Home Email
                          </label>
                          <input
                            onChange={handleChange}
                            name="home_email"
                            value={formdata.home_email}
                            type="email"
                            pattern="[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}$"
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter a valid email (e.g., user@example.com)
                          </p>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Home Phone
                          </label>
                          <input
                            value={formdata.home_phone}
                            onChange={handleChange}
                            name="home_phone"
                            type="tel"
                            pattern="[0-9]{10,15}"
                            maxLength={10}
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter 10 digit phone number
                          </p>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Emergency Contact*
                          </label>
                          <input
                            value={formdata.emerg_contct}
                            onChange={handleChange}
                            name="emerg_contct"
                            type="tel"
                            pattern="[0-9]{10,15}"
                            maxLength={10}
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter 10 digit phone number
                          </p>
                        </div>
                        <div className="mb-4">
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Emergency Work Phone *
                          </label>
                          <input
                            onChange={handleChange}
                            name="emrg_w_phone"
                            value={formdata.emrg_w_phone}
                            type="tel"
                            pattern="[0-9]{10,15}"
                            maxLength={10}
                            className="shadow w-[250px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            Enter 10 digit phone number
                          </p>
                        </div>
                      </div>

                      <div className=" mt-5">
                        <label className="block mb-2  font-semibold text-xl text-gray-700">
                          Termination Reason
                        </label>
                        <textarea
                          className="shadow w-full h-[100px] border-[#4CBBA1] appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          name="termination_reason"
                          value={formdata.termination_reason}
                          onChange={handleChange}
                          id=""
                          rows={5}
                          cols={10}
                        ></textarea>
                      </div>
                      <div className=" flex justify-between">
                        <span></span>
                        <button
                          type="button"
                          onClick={nextStep}
                          className="bg-blue-500 text-white mt-11  mb-3 px-4 py-2 rounded hover:bg-blue-600"
                        >
                          Next
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-bold mb-4">
                      Employe Information - Step 2
                    </h2>
                    <form>
                      {/*  division 2*/}

                      <div className="country flex justify-between items-center mt-9">
                        <div>
                          <label
                            className=" block mb-2  text-sm font-medium text-gray-700"
                            htmlFor="categoryName"
                          >
                            Hire Date *
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.hire_date}
                            name="hire_date"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="date"
                          />
                        </div>

                        <div>
                          <label
                            className=" block mb-2  text-sm font-medium text-gray-700"
                            htmlFor="categoryName"
                          >
                            Original Hire Date *
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.original_hire_date}
                            name="original_hire_date"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="date"
                          />
                        </div>

                        <div>
                          <label
                            className=" block mb-2  text-sm font-medium text-gray-700"
                            htmlFor="categoryName"
                          >
                            Termination Date*
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.termination_date}
                            name="termination_date"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="date"
                          />
                        </div>

                        <div>
                          <label
                            className=" block mb-2  text-sm font-medium text-gray-700"
                            htmlFor="categoryName"
                          >
                            Re Hire Date*
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.rehire_date}
                            name="rehire_date"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="date"
                          />
                        </div>
                      </div>

                      {/* division 3 */}

                      <div className="country flex justify-between items-center mt-9">
                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Rate Type*
                          </label>
                          <select
                            onChange={handleChange}
                            value={formdata.rate_type}
                            name="rate_type"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {rateType.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.r_type_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Rate*
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.rate}
                            name="rate"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="number"
                          />
                        </div>

                        <div>
                          <label className="block mb-2  text-sm font-medium text-gray-700">
                            Pay Frequency *
                          </label>

                          <select
                            onChange={handleChange}
                            value={formdata.pay_frequency}
                            name="pay_frequency"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                          >
                            <option value="">Select</option>
                            {payfrequency.map((val) => (
                              <option key={val.id} value={val.id}>
                                {val.frequency_name}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className=" block mb-2  text-sm font-medium text-gray-700">
                            Pay Frequency Text
                          </label>
                          <input
                            onChange={handleChange}
                            value={formdata.pay_frequency_txt}
                            name="pay_frequency_txt"
                            className="shadow border border-[#4CBBA1] rounded w-[250px] py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            type="text"
                          />
                        </div>
                      </div>

                      {/* divsion 4 */}

                      <button
                        type="button"
                        onClick={prevStep}
                        className="bg-gray-500 mt-10 text-white px-4 py-2 rounded mr-2 hover:bg-gray-600"
                      >
                        Previous
                      </button>
                      <HasPermission module="Add Employee" action="create">
                        <button
                          type="submit"
                          onClick={handleSubmit}
                          className="bg-green-500 mb-10 text-white px-4 py-2 rounded hover:bg-green-600"
                        >
                          Submit
                        </button>
                      </HasPermission>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </>
    </>
  );
};

export default AddEmpolye;
