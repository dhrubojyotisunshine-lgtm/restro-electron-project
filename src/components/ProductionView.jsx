import React from 'react'

const ProductionView = ({isOpen, onClose,data}) => {
    if (!isOpen) return null;
  if (!data || data.length === 0) {
    return <div>Loading...</div>;
  }
   const fooddetails =data.data.fooddetails;
  const itemdetails =data.data.itemdetails;
  const totalPriceSum =data.data.totalPriceSum;

  console.log("object",data)
  return (
    <div>
  {/* Modal Overlay */}
  <div className="justify-center flex items-center overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
    <div className="w-full px-4">
      <div className="bg-white max-w-[794px] w-full mx-auto rounded-md shadow-lg border border-gray-300">
        
        {/* Header */}
        <div className="flex justify-between items-center py-4 px-6 border-b border-gray-300 bg-[#1C1D3E] rounded-t-md">
          <h2 className="text-lg font-semibold text-white">Production Details</h2>
          <button
            onClick={onClose}
            className="text-white bg-red-500 px-3 py-1 rounded-md hover:bg-red-600 transition duration-200"
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-6 print:p-8 bg-gray-50">
          {/* Food Details */}
          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-[#1C1D3E]">🍽️ Food Information</h3>
            <table className="w-full table-auto border border-gray-300 rounded overflow-hidden">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border">Food Name</th>
                  <th className="px-4 py-2 border">Variant Name</th>
                </tr>
              </thead>
              <tbody>
                {fooddetails.map((food, index) => (
                  <tr key={index} className="text-center bg-white hover:bg-gray-100">
                    <td className="px-4 py-2 border">{food.foodName}</td>
                    <td className="px-4 py-2 border">{food.variantName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Ingredient Details */}
          <section className="mb-8">
            <h3 className="text-lg font-bold mb-4 text-[#1C1D3E]">🧂 Ingredient Breakdown</h3>
            <table className="w-full table-auto border border-gray-300 rounded overflow-hidden">
              <thead className="bg-gray-200 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border">Ingredient</th>
                  <th className="px-4 py-2 border">Quantity</th>
                  <th className="px-4 py-2 border">Price</th>
                  <th className="px-4 py-2 border">Total Price</th>
                </tr>
              </thead>
              <tbody>
                {itemdetails.map((item, index) => (
                  <tr key={index} className="text-center bg-white hover:bg-gray-100">
                    <td className="px-4 py-2 border">{item.ingredient_name}</td>
                    <td className="px-4 py-2 border">{item.productionDetailqty}</td>
                    <td className="px-4 py-2 border">₹{item.price}</td>
                    <td className="px-4 py-2 border">₹{item.totalPriceofproductioningredient}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* Summary */}
          <div className="text-right text-lg font-semibold text-[#1C1D3E]">
          <p>🧾 Total Cost: ₹{Number(totalPriceSum).toFixed(2)}</p>

          </div>
        </div>
      </div>
    </div>
  </div>

  {/* Background Overlay */}
  <div className="opacity-60 fixed inset-0 z-40 bg-gray-900"></div>
</div>

  )
}

export default ProductionView
