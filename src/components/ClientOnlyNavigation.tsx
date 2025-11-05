"use client";

import { useEffect, useState } from "react";
import Navigation from "./Navigation";

const ClientOnlyNavigation = () => {
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  if (!hasMounted) {
    return null;
  }

  return <Navigation />;
};

export default ClientOnlyNavigation;
