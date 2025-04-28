"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminStore } from "./useAdminStore";

const AuthGuard = ({ children }) => {
  const { admin } = useAdminStore();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      if (Object.keys(admin).length === 0) {
        router.push("/");
      } else {
        setIsAuthenticated(true);
      }
      setLoading(false);
    };

    const timer = setTimeout(checkAuth, 0);

    return () => clearTimeout(timer);
  }, [admin, router]);

  if (loading) {
    return null;
  }

  return isAuthenticated ? children : null;
};

export default AuthGuard;
