import React from "react";
export const PrintToKitchenPrinter = React.forwardRef((props, ref) => {
  const { groupedData } = props;

  if (!groupedData || !groupedData.length) {
    return <div>No data available</div>;
  }

  return (



    <div ref={ref}>
      {console.log(groupedData)}
      {/* <div className="max-w-lg mx-auto p-4 bg-white border rounded-lg shadow-md">
        <header className="text-center">
          <img src={retrologo} alt="Logo" className="mx-auto block" />
          <h1 className="text-xl font-bold">Restro Uncle</h1>
          <p>
            1st Floor, Plot No, 347, Vijay Nagar Square,
            <br />
            near Krozzon, Scheme 54 PU4, Indore,
            <br />
            Madhya Pradesh 452010
          </p>
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
                          <span>${addon.price.toFixed(2)}</span> x{" "}
                          {addon.quantity}
                        </td>
                        <td className="py-2 text-right">
                          ${(addon.price * addon.quantity).toFixed(2)}
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
          <p>Bill By:John Doe</p>
          <p>
            Table: {invoiceData[0].customerOrderData.table_no} | Order No.:{" "}
            {invoiceData[0].customerOrderData.order_id}
          </p>
          <p className="mt-4 font-bold">Thank you very much</p>
        </footer>

        <div className="text-center mt-4">
          <p className="text-sm">
            Powered By: BDTASK,{" "}
            <a href="http://www.bdtask.com" className="underline">
              www.bdtask.com
            </a>
          </p>
        </div>
      </div> */}

      
    </div>
  );
});
