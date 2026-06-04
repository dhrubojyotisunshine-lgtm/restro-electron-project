import React from 'react';

const QrOrderModal = ({ isOpen, onClose, orderDetails, menuItems }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 max-w-md">
        <h2 className="text-xl font-bold mb-4">Order Details</h2>

        {/* Display menu items */}
        {menuItems && menuItems.length > 0 ? (
          <div className="space-y-4">
            {menuItems.map((item) => (
              <div
                key={item.row_id}
                className="border rounded-lg p-4 shadow-sm flex flex-col space-y-2"
              >
                <h3 className="text-lg font-semibold">
                  {item.ProductName} ({item.variantName})
                </h3>
                <p className="text-sm text-gray-600">Price: ${parseFloat(item.price).toFixed(2)}</p>
                <p className="text-sm text-gray-600">Quantity: {item.menuqty}</p>
                {item.add_ons && item.add_ons.length > 0 && (
                  <div className="mt-2">
                    <h4 className="text-sm font-medium">Add-ons:</h4>
                    <ul className="list-disc list-inside text-sm text-gray-700">
                      {item.add_ons.map((addon, index) => (
                        <li key={index}>
                          {addon.add_on_name} - ${parseFloat(addon.add_on_price).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No menu items available.</p>
        )}

        {/* Close button */}
        <button
          className="mt-4 bg-[#1C1D3E] text-white rounded px-4 py-2"
          onClick={onClose}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default QrOrderModal;

