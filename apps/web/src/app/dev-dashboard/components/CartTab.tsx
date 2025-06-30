import React from "react";
import { X } from "lucide-react";

interface CartItem {
  name: string;
  description: string;
  price: string;
}

interface CartTabProps {
  cartItems: CartItem[];
  handleRemoveFromCart: (index: number) => void;
  handleProceedToCheckout: () => void;
}

const CartTab: React.FC<CartTabProps> = ({
  cartItems,
  handleRemoveFromCart,
  handleProceedToCheckout,
}) => {
  const total = cartItems.reduce(
    (sum, item) => sum + parseFloat(item.price),
    0,
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-xl font-semibold text-gray-800 mb-4">Quote Cart</h2>
      {cartItems.length === 0 ? (
        <div className="text-center text-gray-500 p-8">
          Your quote cart is empty. Add a sample quote from the Chat tab.
        </div>
      ) : (
        <div className="space-y-4">
          {cartItems.map((item, index) => (
            <div
              key={index}
              className="p-4 bg-gray-50 rounded-md border flex justify-between items-center"
            >
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="text-sm text-gray-600">{item.description}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-lg font-bold">${item.price}</div>
                <button
                  onClick={() => handleRemoveFromCart(index)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-full transition-colors"
                  aria-label="Remove item"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t flex justify-end items-center">
            <span className="text-lg font-semibold mr-4">Total:</span>
            <span className="text-2xl font-bold">${total.toFixed(2)}</span>
          </div>
          <div className="pt-4 text-right">
            <button
              onClick={handleProceedToCheckout}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartTab;
