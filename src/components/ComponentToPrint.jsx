import React, { useEffect, useState,useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/AuthContext";
export const ComponentToPrint = React.forwardRef((props, ref) => {
 const { cart, total, vat, subtotal, serviceCharge } = props;
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const VITE_IMG_URL=import.meta.env.VITE_IMG_URL
  const [data, setData] = useState([]);

  const fetchImageData = () => {
    axios
      .get(`${API_BASE_URL}/websetting`)
      .then((response) => {
        console.log("previwe",response)
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
const logoUrls2 = data.map((val) => {
 
  return `${VITE_IMG_URL}${val.logo_footer}`; // Correctly concatenate APP_URL with val.logo

});

  return (
    <div ref={ref}>
    <div className="max-w-lg mx-auto p-4 bg-white border rounded-lg shadow-md">
      <header className="text-center">
        {data.length > 0 && (
          <>
            <img src={logoUrls[0]} alt="Logo" className="mx-auto block" width={200} />
            <h1 className="text-xl font-bold">{data[0].restro_name}</h1>
            <p>{data[0].address}</p>
          </>
        )}
      </header>

      <div className="text-center mt-2">
        <p>
          <strong>Date:</strong> {new Date().toLocaleDateString()}
        </p>
      </div>
      <hr className="my-4" />

      <table className="w-full text-left">
        <thead>
          <tr>
            <th className="border-b py-2">Item</th>
            <th className="border-b py-2 text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, index) => {
            const itemTotal = item.price * item.quantity;
            const addonsTotal = item.checkedaddons
              ? item.checkedaddons.reduce(
                  (sum, addon) => sum + addon.add_on_price * addon.add_on_quantity,
                  0
                )
              : 0;
            const grandTotal = itemTotal + addonsTotal + item.productvat;

            return (
              <React.Fragment key={index}>
                <tr>
                  <td className="py-2">{item.ProductName}</td>
                  <td className="py-2 text-right">${itemTotal.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="py-2">
                    {item.variantName} <br />
                    {item.price} x {item.quantity}
                  </td>
                  <td className="py-2 text-right"></td>
                </tr>
                {item.checkedaddons &&
                  item.checkedaddons.map((addon, aIndex) => (
                    <tr key={aIndex}>
                      <td className="py-2">{addon.add_on_name}</td>
                      <td className="py-2 text-right">
                        {typeof addon.add_on_price === "number"
                          ? `$${addon.add_on_price.toFixed(2)} x ${addon.add_on_quantity}`
                          : "Invalid price"}
                      </td>
                    </tr>
                  ))}
                <tr className="border-b border-dashed border-2">
                  <td></td>
                </tr>
              </React.Fragment>
            );
          })}
          <tr className="font-bold">
            <td className="py-2 border-t">Subtotal</td>
            <td className="py-2 text-right border-t">${subtotal}</td>
          </tr>
          <tr className="font-bold">
            <td className="py-2 ">Vat</td>
            <td className="py-2 text-right">${vat}</td>
          </tr>
          <tr className="font-bold">
            <td className="py-2 border-t">Service Charge</td>
            <td className="py-2 text-right border-t">${serviceCharge}</td>
          </tr>
          <tr className="font-bold">
            <td className="py-2 border-t">Total payment</td>
            <td className="py-2 text-right border-t">${total}</td>
          </tr>
        </tbody>
      </table>

      <div className="text-center mt-4">
        {data.length > 0 && (
          <>
            <p className="text-sm">Powered By: {data[0].powerbytxt}</p>
            <img src={logoUrls2[0]} alt="Logo" className="mx-auto block" width={200} />
          </>
        )}
      </div>
    </div>
  </div>
  );
});
