import React, { useState } from "react";
import { Link } from "react-router-dom";
import pizzaImage from "../assets/images/Log_in_pizza.jpg";
import logo from "../assets/images/restrologo.png";
import axios from "axios";
import { toast } from "react-toastify";

const ForgetPassword = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleForgetPassword = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_BASE_URL}/forgetpassword`, {
        email,
      });

      // Show success toast message
      toast.success(response.data.message || "Password reset link sent to email!");

      // Clear the email input
      setEmail("");
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to send password reset email"
      );
      setError(error.response?.data?.message || "Something went wrong!");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-stone-500 via-violet-800 to-blue-900">
      <div
        className="relative flex flex-col md:flex-row items-center justify-center h-auto w-full rounded-md max-w-4xl bg-gray-500 bg-no-repeat bg-cover p-6 md:p-12"
        style={{ backgroundImage: `url(${pizzaImage})` }}
      >
       
        <div className="absolute bg-black opacity-50 inset-0 z-0"></div>

       
        <div className="relative z-10 text-center md:text-left text-white md:max-w-sm pr-10">
          <h1 className="text-4xl font-bold tracking-wide">Reset Password</h1>
          <p className="text-2xl my-4">
            Enter your email to receive a password reset link.
          </p>
        </div>

       
        <div className="relative lg:h-[500px] lg:w-[500px] w-full h-auto z-10 mt-8 md:mt-0 bg-white p-8 rounded-md shadow-lg flex flex-col items-center gap-y-14 max-w-sm">
          <img src={logo} alt="Logo" className="mb-4" />
          <div className="border-b-2 border-gray-300 w-full">
            <input
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Email Address"
              className="w-full border-none focus:outline-none text-lg py-2"
              value={email}
              disabled={isLoading}
            />
          </div>

          <button
            onClick={handleForgetPassword}
            className={`bg-[#339780] text-white font-semibold py-2 rounded shadow-md hover:bg-[#4CBBA1] transition duration-300 w-full ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={isLoading}
            aria-live="polite"
          >
            {isLoading ? "Sending..." : "Send Reset Link"}
          </button>
          <Link to="/log-in"  className=" text-[#1b1638] tracking-widest font-serif">
            Back to Login
          </Link>
          {error && <p className="text-red-600 mt-2 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default ForgetPassword;