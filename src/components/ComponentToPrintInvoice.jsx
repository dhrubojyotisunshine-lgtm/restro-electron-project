import React, { useEffect, useState,useContext } from "react";
import axios from "axios";
import { AuthContext } from "../store/AuthContext";

export const ComponentToPrintInvoice = React.forwardRef((props, ref) => {
  const { invoiceData } = props;
   const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    const VITE_IMG_URL=import.meta.env.VITE_IMG_URL
    const [data, setData] = useState([]);
    const { userId, username } = useContext(AuthContext);
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
  if (!invoiceData || !invoiceData.length) {
    return <div>No data available</div>;
  }
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
            {invoiceData[0].orderMenuData.map((item, index) => {
              const itemTotal = item.price * item.menuqty;
              return (
                <React.Fragment key={index}>
                  <tr>
                    <td className="py-2">{item.ProductName}</td>
                    <td className="py-2 text-right">${itemTotal.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="py-2">
                      <span>{item.variantName}</span> <br />
                      {item.price} x {item.menuqty}
                    </td>
                    <td className="py-2 text-right"></td>
                  </tr>
                  {item.addons &&
                    item.addons.length > 0 &&
                    item.addons.map((addon, aIndex) => (
                      <tr key={aIndex}>
                        <td className="py-2">
                          {addon.name}
                          <br />
                          <span>${addon.price ? Number(addon.price).toFixed(2) : "0.00"}</span> x{" "}
                          {addon.quantity}
                        </td>
                        <td className="py-2 text-right">
                          ${(addon.price ? Number(addon.price) * addon.quantity : 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  <tr className="border-b border-dashed border-1">
                    <td></td>
                  </tr>
                </React.Fragment>
              );
            })}
            <tr className="font-semibold">
              <td className="py-2 border-t">Subtotal</td>
              <td className="py-2 text-right border-t">
                ${invoiceData[0].billData.total_amount}
              </td>
            </tr>
            <tr className=" font-semibold">
              <td className="py-2 ">Vat</td>
              <td className="py-2 text-right">
                ${invoiceData[0].billData.VAT}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 border-t">Service Charge</td>
              <td className="py-2 text-right border-t">
                ${invoiceData[0].billData.service_charge}
              </td>
            </tr>
            <tr className="font-semibold">
              <td className="py-2 border-t">Total Payment</td>
              <td className="py-2 text-right border-t">
                ${invoiceData[0].billData.bill_amount}
              </td>
            </tr>
          </tbody>
        </table>

        <footer className="text-center mt-4">
        <p>Billing To: {invoiceData[0].customerOrderData.customer_name}</p>
          <p>Bill By:{username} </p>
          <p>
            Table: {invoiceData[0].customerOrderData.table_no} | Order No.:{" "}
            {invoiceData[0].customerOrderData.order_id}
          </p>
          <p className="mt-4 font-bold">Thank you very much</p>
        </footer>

        <div className="text-center mt-4">
          <p className="text-sm">
            Powered By:{data[0].powerbytxt}
          </p>
          <img src={logoUrls2} alt="Logo" className="mx-auto block" width={200} />
        </div>


       

        
      </div>
    </div>
  );
});
