import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { requireOptionalNativeModule } from "expo-modules-core";
import {
  endConnection,
  fetchProducts,
  finishTransaction,
  getAvailablePurchases,
  initConnection,
  isUserCancelledError,
  purchaseErrorListener,
  purchaseUpdatedListener,
  requestPurchase,
  type Product,
  type Purchase,
} from "expo-iap";
import {
  DIAMOND_PACKS,
  diamondPackByStoreId,
  type DiamondPack,
} from "./catalog";

export const IAP_SKUS = DIAMOND_PACKS.map((pack) => pack.storeId);

const iapSupported = requireOptionalNativeModule("ExpoIap") != null;

type ShopIapValue = {
  ready: boolean;
  configuredStoreIds: string[];
  displayPrices: Record<string, string>;
  buyPack: (pack: DiamondPack) => Promise<boolean>;
  reconnect: () => Promise<boolean>;
};

const FALLBACK: ShopIapValue = {
  ready: false,
  configuredStoreIds: [],
  displayPrices: {},
  buyPack: async () => false,
  reconnect: async () => false,
};

const ShopIapContext = createContext<ShopIapValue>(FALLBACK);

export function ShopIapProvider({
  children,
  onGranted,
}: {
  children: React.ReactNode;
  onGranted: (pack: DiamondPack) => void;
}) {
  const onGrantedRef = useRef(onGranted);
  const processed = useRef<Set<string>>(new Set());

  const [connected, setConnected] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    onGrantedRef.current = onGranted;
  }, [onGranted]);

  const grantAndFinish = useCallback((purchase: Purchase) => {
    const pack = diamondPackByStoreId(purchase.productId);
    if (!pack) {
      return;
    }
    const key = purchase.transactionId ?? purchase.purchaseToken;
    if (!key || processed.current.has(key)) {
      return;
    }
    processed.current.add(key);
    onGrantedRef.current(pack);
    void finishTransaction({ purchase, isConsumable: true }).catch((error) => {
      console.warn("No se pudo cerrar la transaccion:", error);
    });
  }, []);

  useEffect(() => {
    if (!iapSupported) {
      return;
    }
    const purchaseSub = purchaseUpdatedListener(grantAndFinish);
    const errorSub = purchaseErrorListener((error) => {
      if (!isUserCancelledError(error)) {
        console.warn("Error de compra:", error.code, error.message);
      }
    });

    let mounted = true;
    void initConnection()
      .then((ok) => {
        if (mounted) {
          setConnected(Boolean(ok));
        }
      })
      .catch(() => {
        if (mounted) {
          setConnected(false);
        }
      });

    return () => {
      mounted = false;
      purchaseSub.remove();
      errorSub.remove();
      void endConnection().catch(() => undefined);
    };
  }, [grantAndFinish]);

  useEffect(() => {
    if (!iapSupported || !connected || fetched) {
      return;
    }
    let mounted = true;
    void fetchProducts({ skus: IAP_SKUS, type: "in-app" })
      .then((result) => {
        if (mounted) {
          setProducts(Array.isArray(result) ? (result as Product[]) : []);
        }
      })
      .catch(() => {
        if (mounted) {
          setProducts([]);
        }
      })
      .finally(() => {
        if (mounted) {
          setFetched(true);
        }
      });
    return () => {
      mounted = false;
    };
  }, [connected, fetched]);

  useEffect(() => {
    if (!iapSupported || !connected) {
      return;
    }
    let mounted = true;
    void getAvailablePurchases()
      .then((list) => {
        if (mounted) {
          for (const purchase of list) {
            grantAndFinish(purchase);
          }
        }
      })
      .catch(() => undefined);
    return () => {
      mounted = false;
    };
  }, [connected, grantAndFinish]);

  const configuredStoreIds = IAP_SKUS.filter((storeId) =>
    products.some((product) => product.id === storeId),
  );

  const displayPrices: Record<string, string> = {};
  for (const product of products) {
    displayPrices[product.id] = product.displayPrice;
  }

  const buyPack = useCallback(
    async (pack: DiamondPack): Promise<boolean> => {
      if (!iapSupported) {
        return false;
      }
      let isConnected = connected;
      if (!isConnected) {
        isConnected = await initConnection().catch(() => false);
        setConnected(Boolean(isConnected));
      }
      if (!isConnected) {
        return false;
      }
      try {
        await requestPurchase({
          request: {
            apple: { sku: pack.storeId },
            google: { skus: [pack.storeId] },
          },
          type: "in-app",
        });
        return true;
      } catch (error) {
        if (!isUserCancelledError(error)) {
          console.warn("No se pudo iniciar la compra:", error);
        }
        return false;
      }
    },
    [connected],
  );

  const reconnect = useCallback(async () => {
    if (!iapSupported) {
      return false;
    }
    const ok = await initConnection().catch(() => false);
    setConnected(Boolean(ok));
    return Boolean(ok);
  }, []);

  const value: ShopIapValue = {
    ready: iapSupported && connected && fetched,
    configuredStoreIds,
    displayPrices,
    buyPack,
    reconnect,
  };

  return <ShopIapContext.Provider value={value}>{children}</ShopIapContext.Provider>;
}

export function useShopIap(): ShopIapValue {
  return useContext(ShopIapContext);
}