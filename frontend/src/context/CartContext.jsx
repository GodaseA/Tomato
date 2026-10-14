import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const CartContext = createContext(null);
const STORAGE_KEY = "foodieexpress_cart_v1";

function readStoredCart() {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!parsed || !Array.isArray(parsed.items)) return { restaurant: null, items: [] };
    return parsed;
  } catch {
    return { restaurant: null, items: [] };
  }
}

export function CartProvider({ children }) {
  const [cartState, setCartState] = useState(readStoredCart);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cartState));
  }, [cartState]);

  const addItem = useCallback((menuItem, restaurant) => {
    if (cartState.restaurant && cartState.restaurant._id !== restaurant._id) {
      return false;
    }

    setCartState((current) => {
      const existing = current.items.find((item) => item._id === menuItem._id);
      const items = existing
        ? current.items.map((item) =>
            item._id === menuItem._id
              ? { ...item, quantity: Math.min(100, item.quantity + 1) }
              : item
          )
        : [
            ...current.items,
            {
              _id: menuItem._id,
              name: menuItem.name,
              price: menuItem.price,
              image: menuItem.image || "",
              quantity: 1,
            },
          ];

      return {
        restaurant: {
          _id: restaurant._id,
          name: restaurant.name,
          image: restaurant.image || "",
        },
        items,
      };
    });
    return true;
  }, [cartState.restaurant]);

  const updateQuantity = useCallback((itemId, quantity) => {
    setCartState((current) => {
      const items = current.items
        .map((item) =>
          item._id === itemId
            ? { ...item, quantity: Math.max(0, Math.min(100, quantity)) }
            : item
        )
        .filter((item) => item.quantity > 0);

      return { ...current, restaurant: items.length ? current.restaurant : null, items };
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setCartState((current) => {
      const items = current.items.filter((item) => item._id !== itemId);
      return { ...current, restaurant: items.length ? current.restaurant : null, items };
    });
  }, []);

  const clearCart = useCallback(() => setCartState({ restaurant: null, items: [] }), []);

  const value = useMemo(() => {
    const items = cartState.items;
    return {
      restaurant: cartState.restaurant,
      items,
      count: items.reduce((sum, item) => sum + item.quantity, 0),
      subtotal: items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0),
      addItem,
      updateQuantity,
      removeItem,
      clearCart,
    };
  }, [cartState, addItem, updateQuantity, removeItem, clearCart]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
