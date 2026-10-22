import React from "react";
import { createRoot } from "react-dom/client";
import { createRootRouteWithContext, createRoute, createRouter, RouterProvider, Outlet, createHashHistory } from "@tanstack/react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthPage } from "./routes/auth";
import { Admin } from "./routes/admin";
import "./styles.css";
const queryClient = new QueryClient();
const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({ component: () => <QueryClientProvider client={queryClient}><Outlet /></QueryClientProvider> });
const authRoute = createRoute({ getParentRoute: () => rootRoute, path: "/auth", component: AuthPage });
const adminRoute = createRoute({ getParentRoute: () => rootRoute, path: "/admin", component: Admin });
const homeRoute = createRoute({ getParentRoute: () => rootRoute, path: "/", component: () => <p className="p-10">Abriendo panel… <a href="#/admin" className="underline">Ir al panel</a></p>, beforeLoad: () => { if (typeof window !== "undefined") window.location.hash = "/admin"; } });
const router = createRouter({ routeTree: rootRoute.addChildren([homeRoute,authRoute,adminRoute]), history: createHashHistory(), context: { queryClient } });
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
