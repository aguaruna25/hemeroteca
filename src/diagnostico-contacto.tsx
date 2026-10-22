import React from "react";
import { createRoot } from "react-dom/client";
import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet, createHashHistory } from "@tanstack/react-router";
import { Contacto } from "./routes/contacto";
import "./styles.css";
const rootRoute = createRootRoute({ component: () => <Outlet /> });
const indexRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: Contacto });
const router = createRouter({ routeTree: rootRoute.addChildren([indexRoute]), history: createHashHistory() });
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
