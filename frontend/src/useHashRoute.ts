import { useEffect, useState } from "react";

export type Route = "dashboard" | "board" | "reporters" | "editors";

const ROUTES: Route[] = ["dashboard", "board", "reporters", "editors"];

function parse(): Route {
  const h = window.location.hash.replace(/^#\/?/, "");
  return (ROUTES.includes(h as Route) ? h : "dashboard") as Route;
}

export function useHashRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(parse);

  useEffect(() => {
    const onChange = () => setRoute(parse());
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  const navigate = (r: Route) => {
    window.location.hash = `/${r}`;
  };

  return [route, navigate];
}
