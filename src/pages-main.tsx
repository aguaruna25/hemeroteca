import React from "react";
import { createRoot } from "react-dom/client";
import { createRouter, RouterProvider, createHashHistory } from "@tanstack/react-router";
import { QueryClient } from "@tanstack/react-query";
import { routeTree } from "./routeTree.gen";
import "./styles.css";

const queryClient = new QueryClient();
const router = createRouter({ routeTree, history: createHashHistory(), context: { queryClient }, defaultPreload: "intent" });

declare module "@tanstack/react-router" { interface Register { router: typeof router } }

createRoot(document.getElementById("root")!).render(<React.StrictMode><RouterProvider router={router} /></React.StrictMode>);
