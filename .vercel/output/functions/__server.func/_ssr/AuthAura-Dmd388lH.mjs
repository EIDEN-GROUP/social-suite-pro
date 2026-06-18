import { j as jsxRuntimeExports } from "../_libs/react.mjs";
function AuroraLayer({ accent }) {
  const lead = accent || "#dc2743";
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("div", { "aria-hidden": true, className: "pointer-events-none absolute inset-0 overflow-hidden", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "animate-aurora absolute -left-[14%] -top-[18%] h-[58vw] w-[58vw] max-w-[720px] rounded-full opacity-60 blur-[120px]",
        style: { background: `radial-gradient(circle at 35% 35%, ${lead}, transparent 68%)` }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "animate-aurora absolute right-[-16%] top-[4%] h-[50vw] w-[50vw] max-w-[620px] rounded-full opacity-45 blur-[120px] [animation-delay:-8s]",
        style: { background: "radial-gradient(circle at 50% 50%, #405de6, transparent 68%)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      "div",
      {
        className: "animate-aurora absolute bottom-[-22%] left-[22%] h-[48vw] w-[48vw] max-w-[600px] rounded-full opacity-40 blur-[120px] [animation-delay:-15s]",
        style: { background: "radial-gradient(circle at 50% 50%, #bc1888, transparent 68%)" }
      }
    ),
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "grain absolute inset-0" })
  ] });
}
function AuthAura({ accent, children }) {
  return /* @__PURE__ */ jsxRuntimeExports.jsxs("main", { className: "relative grid min-h-screen place-items-center overflow-hidden bg-background px-4 py-10 text-foreground", children: [
    /* @__PURE__ */ jsxRuntimeExports.jsx("div", { className: "absolute inset-0 -z-10", children: /* @__PURE__ */ jsxRuntimeExports.jsx(AuroraLayer, { accent }) }),
    children
  ] });
}
export {
  AuthAura as A,
  AuroraLayer as a
};
