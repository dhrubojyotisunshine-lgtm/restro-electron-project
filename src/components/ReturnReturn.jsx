import React from 'react';

const ReturnReturn = ({ isOpen, onClose, invoiceDatas }) => {
  if (!isOpen) return null;

  if (!invoiceDatas) {
    return <div>Loading...</div>;
  }

  const {
    supplier_id,
    return_date,
    totalamount,
    totaldiscount,
    return_reason,
    supName,
    items,
  } = invoiceDatas[0].data;
  console.log("bc data aaaa",invoiceDatas[0].data)

  return (
    <div>
  <div className="fixed inset-0 z-50 flex items-center justify-center px-4 overflow-y-auto">
    <div className="w-full max-w-[794px] bg-white shadow-2xl rounded-xl border border-gray-300 print:w-[794px] print:h-[1123px]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-300">
        <h2 className="text-2xl font-bold text-gray-800">Return Invoice</h2>
        <button
          onClick={onClose}
          className="text-white bg-red-500 hover:bg-red-600 rounded-md w-8 h-8 flex items-center justify-center transition"
        >
          ✕
        </button>
      </div>

      <div className="px-6 py-5">
        {/* Supplier Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Supplier Info</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <p><span className="font-medium">Supplier Name:</span> {supName}</p>
            <p><span className="font-medium">Supplier ID:</span> {supplier_id}</p>
            <p><span className="font-medium">Return Date:</span> {new Date(return_date).toLocaleDateString()}</p>
            <p><span className="font-medium">Return Reason:</span> {return_reason}</p>
          </div>
        </div>

        {/* Summary Info */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2">Return Summary</h3>
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
            <p><span className="font-medium">Total Amount:</span> {totalamount}</p>
            <p><span className="font-medium">Total Discount:</span> {totaldiscount}</p>
          </div>
        </div>

        {/* Items Table */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-3">Returned Items</h3>
          <table className="w-full border text-sm text-left">
            <thead className="bg-gray-100 text-gray-800">
              <tr>
                <th className="border px-3 py-2">Ingredient</th>
                <th className="border px-3 py-2">Qty</th>
                <th className="border px-3 py-2">Rate</th>
                <th className="border px-3 py-2">Discount</th>
                <th className="border px-3 py-2">UOM</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.product_id} className="hover:bg-gray-50">
                  <td className="border px-3 py-2">{item.ingredient_name}</td>
                  <td className="border px-3 py-2">{item.qty}</td>
                  <td className="border px-3 py-2">{item.product_rate}</td>
                  <td className="border px-3 py-2">{item.discount}</td>
                  <td className="border px-3 py-2">{item.uom_short_code}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>

  {/* Background Overlay */}
  <div className="fixed inset-0 z-40 bg-black bg-opacity-40"></div>
</div>

  );
};

export default ReturnReturn;
