import React, { createContext, useState, useContext, useEffect } from 'react';

export const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);

  useEffect(() => {
    const savedCart = localStorage.getItem('studysmart_cart');
    if (savedCart) {
      const cart = JSON.parse(savedCart);
      setCartItems(cart);
      updateCartCount(cart);
    }
  }, []);

  const updateCartCount = (items) => {
    const count = items.reduce((sum, item) => sum + item.quantity, 0);
    setCartCount(count);
  };

  const saveCart = (items) => {
    localStorage.setItem('studysmart_cart', JSON.stringify(items));
    setCartItems(items);
    updateCartCount(items);
  };

  const addToCart = (product, quantity = 1) => {
    const existingItem = cartItems.find(item => item.id === product.id);
    if (existingItem) {
      const updatedCart = cartItems.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + quantity }
          : item
      );
      saveCart(updatedCart);
    } else {
      saveCart([...cartItems, { ...product, quantity }]);
    }
  };

  const removeFromCart = (productId) => {
    saveCart(cartItems.filter(item => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity < 1) { removeFromCart(productId); return; }
    saveCart(cartItems.map(item =>
      item.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => saveCart([]);

  const getCartTotal = () =>
    cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      getCartTotal,
    }}>
      {children}
    </CartContext.Provider>
  );
};
