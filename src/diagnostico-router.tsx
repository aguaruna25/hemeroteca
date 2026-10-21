import React, { useState } from "react";
import { createRoot } from "react-dom/client";
import { createRootRoute, createRoute, createRouter, RouterProvider, Outlet, createHashHistory, Link } from "@tanstack/react-router";
function Fields(){const [email,setEmail]=useState("");const [msg,setMsg]=useState("");return <main><h1>Prueba TanStack Router</h1><p>React 19 + TanStack Router, sin Supabase ni código de Hemeroteca. No envía datos.</p><nav><Link to="/" style={{color:"#b5e65a"}}>Inicio</Link> · <Link to="/prueba" style={{color:"#b5e65a"}}>Formulario</Link></nav><label>Correo<input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Escribe aquí" style={{display:"block",width:"95%",padding:14,fontSize:18,margin:"12px 0 25px"}} /></label><label>Mensaje<textarea value={msg} onChange={e=>setMsg(e.target.value)} rows={4} placeholder="Escribe aquí" style={{display:"block",width:"95%",padding:14,fontSize:18,margin:"12px 0 25px"}} /></label><p style={{color:"#b5e65a"}}>Router y React responden: {email.length} caracteres en correo, {msg.length} en mensaje.</p></main>}
const rootRoute=createRootRoute({component:()=> <Outlet />});
const indexRoute=createRoute({getParentRoute:()=>rootRoute,path:"/",component:Fields});
const pruebaRoute=createRoute({getParentRoute:()=>rootRoute,path:"/prueba",component:Fields});
const router=createRouter({routeTree:rootRoute.addChildren([indexRoute,pruebaRoute]),history:createHashHistory()});
declare module "@tanstack/react-router" { interface Register { router: typeof router } }
createRoot(document.getElementById("root")!).render(<RouterProvider router={router}/>);
