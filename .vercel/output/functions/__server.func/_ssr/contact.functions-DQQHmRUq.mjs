import { c as createServerRpc } from "./createServerRpc-B2L2SJXw.mjs";
import { c as createServerFn } from "./server-DDgu703A.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType, l as literalType } from "../_libs/zod.mjs";
import "node:async_hooks";
import "../_libs/h3-v2.mjs";
import "../_libs/rou3.mjs";
import "../_libs/srvx.mjs";
import "node:stream";
import "node:stream/promises";
import "../_libs/tanstack__router-core.mjs";
import "../_libs/tanstack__history.mjs";
import "../_libs/cookie-es.mjs";
import "../_libs/seroval-plugins.mjs";
import "node:stream/web";
import "../_libs/tanstack__react-router.mjs";
import "../_libs/react-dom.mjs";
import "util";
import "crypto";
import "async_hooks";
import "stream";
import "../_libs/isbot.mjs";
const submitContact_createServerFn_handler = createServerRpc({
  id: "1ac20e83585a55e943670fa4670b07889b610801a7a21f28dc367c19f92e50fd",
  name: "submitContact",
  filename: "src/lib/contact.functions.ts"
}, (opts) => submitContact.__executeServer(opts));
const submitContact = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  name: stringType().trim().min(1, "Please add your name").max(120),
  email: stringType().trim().email("Enter a valid email").max(255).optional().or(literalType("")),
  phone: stringType().trim().max(40).optional().or(literalType("")),
  message: stringType().trim().min(1, "Tell us a little about your project").max(2e3)
}).parse(input)).handler(submitContact_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-DPjt3aO_.mjs");
  const {
    error
  } = await supabaseAdmin.from("contacts").insert({
    name: data.name,
    email: data.email || null,
    phone: data.phone || null,
    message: data.message
  });
  if (error) throw new Error(error.message);
  return {
    ok: true
  };
});
export {
  submitContact_createServerFn_handler
};
