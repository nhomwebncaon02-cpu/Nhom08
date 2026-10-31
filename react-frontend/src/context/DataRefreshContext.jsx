import { createContext, useCallback, useContext, useMemo, useState } from 'react';

/**
 * Khi một nơi thay đổi dữ liệu (VD: "Thêm nhanh" giao dịch), gọi refresh()
 * -> mọi trang dùng `version` trong useEffect sẽ tự tải lại.
 */
const DataRefreshContext = createContext({ version: 0, refresh: () => {} });

export function DataRefreshProvider({ children }) {
  const [version, setVersion] = useState(0);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const value = useMemo(() => ({ version, refresh }), [version, refresh]);
  return <DataRefreshContext.Provider value={value}>{children}</DataRefreshContext.Provider>;
}

export const useDataRefresh = () => useContext(DataRefreshContext);
