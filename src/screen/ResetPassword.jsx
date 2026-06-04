import React, { useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa";
import axios from "axios";
import { toast } from "react-toastify";



const ResetPassword = () => {
  const [password, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const { id, token } = useParams();
  const navigate = useNavigate();

  const handleResetPassword = async () => {
    if (password !== confirmPassword) {
      toast.error("Passwords do not match!");
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/resetpassword/${id}/${token}`, {
        password,
      });
      toast.success("Password reset successful! Please log in.");
      navigate("/log-in");
    } catch (error) {
      toast.error(error.response?.data?.error || "Password reset failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-black">
      <div className="relative flex flex-col md:flex-row items-center justify-center bg-white p-8 md:p-12 rounded-lg shadow-lg max-w-4xl w-full">

        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            CHANGE PASSWORD
          </h2>
          <div className="mt-6">
            <div className="relative border-b-2 border-gray-300 w-full mb-6">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                className="w-full border-none focus:outline-none text-lg py-2 pr-10"
                value={password}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <div className="relative border-b-2 border-gray-300 w-full mb-6">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="w-full border-none focus:outline-none text-lg py-2 pr-10"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-2 top-2 text-gray-500"
              >
                {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>

            <button
              onClick={handleResetPassword}
              className="w-full bg-green-500 text-white py-2 rounded-lg font-semibold hover:bg-green-600 transition duration-300"
            >
              CHANGE PASSWORD
            </button>
            <div className="text-center mt-4">
              <Link to="/dashboard" className="text-blue-600 hover:underline">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        <div className="hidden md:flex flex-col justify-center bg-purple-700 text-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h2 className="text-2xl font-bold">
            Password <span className="text-green-400">Requirements</span>.
          </h2>
          <ul className="mt-4 space-y-2 text-lg">
            <li>• Password must contain numbers</li>
            <li>• Length must be greater than 8 characters</li>
            <li>• Must include at least one special character</li>
            <li>• Must not contain repetitions</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
