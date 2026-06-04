// import React, { useState, useContext, useEffect } from "react";
// import { Link, useNavigate } from "react-router-dom";
// import { AuthContext } from "../store/AuthContext";
// import loginimage from "../assets/log-in-image.webp";
// import axios from "axios";
// import { toast } from "react-toastify";
// import { FaEye, FaEyeSlash } from "react-icons/fa";

// const Log_in = () => {
//   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
//   console.log("🔍 API_BASE_URL:", API_BASE_URL);

//   const [email, setEmail] = useState("");
//   const [password, setPassword] = useState("");
//   const [error, setError] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();
//   const { storeToken } = useContext(AuthContext);
//   const [showPassword, setShowPassword] = useState(false);

//   const VITE_IMG_URL=import.meta.env.VITE_IMG_URL
//   const [data, setData] = useState([]);
//   const handleLogin = async () => {
//     setIsLoading(true);
//     try {
//       const response = await axios.post(`${API_BASE_URL}/login`, {
//         email,
//         password,
//       });

//       // Extract token, username, and permissions from the response
//       const { token, username, userId, permData, isAdmin } = response.data;
//       console.log("data log in aaya h ", response.data);
//       // Store the token and permissions in the context
//       storeToken(token, permData, username, userId, isAdmin);

//       localStorage.setItem("token", token);

//       // Show the toast message with the username
//       toast.success(`Log-In successful, Welcome ${username}!`);

//       // Redirect to a protected route after login
//       navigate("/");
//     } catch (error) {
//       toast.error(
//         error.response?.data?.error || "Invalid Username or Password"
//       );

//       setError(error.response?.data?.error || "Login failed");
//       console.error(error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchImageData = () => {
//     axios
//       .get(`${API_BASE_URL}/websetting`)
//       .then((response) => {
//         console.log("previwe",response)
//         setData(response.data.data);
//       })
//       .catch((error) => {
//         console.error("Error fetching image data:", error);
//       });
//   };

//   useEffect(() => {
//     fetchImageData();
//   }, []);
//   const logoUrls = data.map((val) => {

//     return `${VITE_IMG_URL}${val.logo}`; // Correctly concatenate APP_URL with val.logo

// });

//   return (
//     <div className="flex min-h-screen">
//     {/* Left Side - Login Form */}
//     <div className="w-2/5 flex flex-col justify-center items-center bg-white p-10 shadow-lg">
//       <img src={logoUrls} alt="Smart Order POS" className="mb-6 w-[350px] h-[200px]" />
//       <h2 className="text-2xl font-bold mb-4 text-[#1C1D3E]">
//         Welcome Back! <span className="text-xl text-[#1C1D3E]">Smart Order</span>{" "}
//         <span className="text-[#4CBBA1]"> POS</span>
//       </h2>
//       <h2 className="text-2xl mb-3 font-semibold text-[#1C1D3E]">LogIn</h2>
//       <div className="w-full max-w-sm">
//         <label className="block text-gray-700 font-bold">Enter Email</label>
//         <input
//           type="email"
//           className="w-full p-3 border rounded mt-1 bg-[#1C1D3E] text-white font-semibold"
//           placeholder="admin@gmail.com"
//           value={email}
//           onChange={(e) => setEmail(e.target.value)}
//           disabled={isLoading}
//         />
//         <label className="block text-gray-700 mt-4 font-bold">Enter Password</label>
//         <div className="relative">
//           <input
//             type={showPassword ? "text" : "password"}
//             className="w-full p-3 border rounded mt-1 pr-10 bg-[#1C1D3E] text-white font-semibold"
//             placeholder="********"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             disabled={isLoading}
//           />
//           <button
//             type="button"
//             onClick={() => setShowPassword((prev) => !prev)}
//             className="absolute right-3 top-4 text-gray-500"
//           >
//             {showPassword ? <FaEyeSlash /> : <FaEye />}
//           </button>
//         </div>
//         <div className="flex items-center mt-4">
//           <input type="checkbox" className="mr-2 custom-checkbox" /> <span>Remember me</span>
//         </div>
//         <button
//           className="w-full bg-[#4CBBA1] text-white p-3 rounded mt-6 hover:bg-[#2a7765] transition"
//           onClick={handleLogin}
//           disabled={isLoading}
//         >
//           {isLoading ? "Logging In..." : "Login"}
//         </button>
//         {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
//       </div>
//     </div>
//     {/* Right Side - Image */}
//     <div
//   className="w-3/5 bg-cover bg-center"
//   style={{ backgroundImage: `url(${loginimage})` }}
// ></div>  </div>

//   );
// };

// export default Log_in;

import React, { useState, useContext, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../store/AuthContext";
import loginimage from "../assets/log-in-image.webp";
import axios from "axios";
import { toast } from "react-toastify";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const Log_in = () => {
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:4500/api";
  console.log("🔍 API_BASE_URL:", API_BASE_URL);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { storeToken } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [subscriptionKey, setSubscriptionKey] = useState("");

  const VITE_IMG_URL = import.meta.env.VITE_IMG_URL;
  const [data, setData] = useState([]);

  const handleLogin = async () => {
    setIsLoading(true);

    try {
      // ✅ 1. Activate EXE from live server
      const activateResponse = await axios.post(
        `https://krayon.softwarestesting.co.in/api/activate-exe`,
        {
          email,
          password,
          subscription_key: subscriptionKey,
        },
      );

      if (activateResponse.data.success) {
        const syncData = activateResponse.data.data;

        // ✅ 2. Save live activation data into local SQLite
        await axios.post(`${API_BASE_URL}/sync-activation-data`, syncData);

        toast.success("EXE activated successfully");
      }

      // ✅ 3. Login from local SQLite
      const response = await axios.post(`${API_BASE_URL}/login`, {
        email,
        password,
      });

      const {
        token,
        username,
        userId,
        permData = [],
        planData = null,
        isAdmin = false,
        superAdmin = false,
        websitelink,
        subscriptionStatus = "no_subscription",
        planExpired = false,
      } = response.data;

      storeToken(token, permData, username, userId, isAdmin);

      localStorage.setItem("planData", JSON.stringify(planData || null));
      localStorage.setItem("superAdmin", String(superAdmin));
      localStorage.setItem("subscriptionStatus", subscriptionStatus);

      if (websitelink) {
        localStorage.setItem("websitelink", websitelink);
      }

      toast.success(`Log-In successful, Welcome ${username}!`);

      // ✅ 5. Redirect logic
      if (planExpired || subscriptionStatus === "expired") {
        window.location.href =
          "https://krayon.softwarestesting.co.in/my-subscription";
      } else if (superAdmin && websitelink) {
        window.location.href = websitelink;
      } else {
        navigate("/", { replace: true });
      }
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Invalid Username or Password",
      );

      setError(
        error.response?.data?.message ||
          error.response?.data?.error ||
          "Login failed",
      );

      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchImageData = () => {
    axios
      .get(`${API_BASE_URL}/websetting`)
      .then((response) => {
        console.log("previwe", response);
        setData(response.data.data);
      })
      .catch((error) => {
        console.error("Error fetching image data:", error);
      });
  };

  useEffect(() => {
    fetchImageData();
  }, []);
  const logoUrls = data.map((val) => {
    return `${VITE_IMG_URL}${val.logo}`; // Correctly concatenate APP_URL with val.logo
  });

  return (
    <div className="flex min-h-screen">
      {/* Left Side - Login Form */}
      <div className="w-2/5 flex flex-col justify-center items-center bg-white p-10 shadow-lg">
        <img
          src={logoUrls}
          alt="Smart Order POS"
          className="mb-6 w-[350px] h-[200px]"
        />
        <h2 className="text-2xl font-bold mb-4 text-[#1C1D3E]">
          Welcome Back!{" "}
          <span className="text-xl text-[#1C1D3E]">Smart Order</span>{" "}
          <span className="text-[#4CBBA1]"> POS</span>
        </h2>
        <h2 className="text-2xl mb-3 font-semibold text-[#1C1D3E]">LogIn</h2>
        <div className="w-full max-w-sm">
          <label className="block text-gray-700 font-bold">Enter Email</label>
          <input
            type="email"
            className="w-full p-3 border rounded mt-1 bg-[#1C1D3E] text-white font-semibold"
            placeholder="admin@gmail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={isLoading}
          />
          <label className="block text-gray-700 mt-4 font-bold">
            Enter Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              className="w-full p-3 border rounded mt-1 pr-10 bg-[#1C1D3E] text-white font-semibold"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-3 top-4 text-gray-500"
            >
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </button>
          </div>
          <label className="block text-gray-700 mt-4 font-bold">
            Enter Subscription Key
          </label>
          <input
            type="text"
            className="w-full p-3 border rounded mt-1 bg-[#1C1D3E] text-white font-semibold"
            placeholder="Enter subscription key"
            value={subscriptionKey}
            onChange={(e) => setSubscriptionKey(e.target.value)}
            disabled={isLoading}
          />
          <div className="flex items-center mt-4">
            <input type="checkbox" className="mr-2 custom-checkbox" />{" "}
            <span>Remember me</span>
          </div>
          <button
            className="w-full bg-[#4CBBA1] text-white p-3 rounded mt-6 hover:bg-[#2a7765] transition"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? "Logging In..." : "Login"}
          </button>
          {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        </div>
      </div>
      {/* Right Side - Image */}
      <div
        className="w-3/5 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginimage})` }}
      ></div>{" "}
    </div>
  );
};

export default Log_in;
