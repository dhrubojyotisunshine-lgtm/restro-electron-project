import React, { useEffect } from "react";
import ReactDOM from 'react-dom/client';
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from "./store/AuthContext.jsx";
import App from './App';
import './index.css';
import axios from "axios";


const Main = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const APP_URL = import.meta.env.VITE_APP_URL;
  const VITE_IMG_URL= import.meta.env.VITE_IMG_URL;
  useEffect(() => {
    const fetchFavicon = async () => {
      try {
        // Replace with your actual API endpoint
        const response = await axios.get(`${API_BASE_URL}/websetting`);
        const data = await response.data.data;
        const logoUrls = data?.map((val) => `${VITE_IMG_URL}${val.fevicon}`) || [];
        const link =
          document.querySelector("link[rel*='icon']") ||
          document.createElement("link");
        link.type = "image/svg+xml";
        link.rel = "icon";
        link.href = logoUrls;
        document.head.appendChild(link);
      } catch (error) {
        console.error("Error fetching favicon:", error);
      }
    };

    fetchFavicon();
  }, []);

  return (
    <>
      <App  />
      <ToastContainer
        position="top-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider >
    <AuthProvider>
      <React.StrictMode>
        <Main />
      </React.StrictMode>
    </AuthProvider>
  </AuthProvider>
);