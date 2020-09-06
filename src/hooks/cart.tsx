import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const getProducts = await AsyncStorage.getItem('@GoMarketPlace:Cart');

      if (!getProducts) {
        return;
      }

      const productsJSON = JSON.parse(getProducts);

      setProducts(productsJSON);
    }

    loadProducts();
  }, []);

  const addToCart = useCallback(
    async (product: Product) => {
      const { id } = product;
      const productsFiltered = products.filter(productInArray => {
        return productInArray.id === id;
      });

      const productReturned = productsFiltered[0];

      if (productReturned) {
        increment(product.id);
        return;
      }

      product.quantity = 1;

      const productsArray = [...products, product];

      await AsyncStorage.setItem(
        '@GoMarketPlace:Cart',
        JSON.stringify(productsArray),
      );

      setProducts(productsArray);
    },
    [products, increment],
  );

  const increment = useCallback(
    async id => {
      const productsUpdated = products.map(product => {
        if (product.id === id) {
          product.quantity += 1;
          return product;
        }

        return product;
      });

      await AsyncStorage.setItem(
        '@GoMarketPlace:Cart',
        JSON.stringify(productsUpdated),
      );

      setProducts([...productsUpdated]);
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productToBeReduced = products.find(product => product.id === id);

      if (productToBeReduced?.quantity === 1) {
        const productsUpdated = products.filter(product => product.id !== id);

        await AsyncStorage.setItem(
          '@GoMarketPlace:Cart',
          JSON.stringify(productsUpdated),
        );

        setProducts(productsUpdated);
      }

      if (productToBeReduced?.quantity > 1) {
        const productsUpdated = products.map(product => {
          if (product.id === id) {
            product.quantity -= 1;
            return product;
          }

          return product;
        });

        await AsyncStorage.setItem(
          '@GoMarketPlace:Cart',
          JSON.stringify(productsUpdated),
        );

        setProducts(productsUpdated);
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
