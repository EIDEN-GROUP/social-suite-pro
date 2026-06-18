import { c as createServerRpc } from "./createServerRpc-B2L2SJXw.mjs";
import { c as createServerFn } from "./server-DDgu703A.mjs";
import "../_libs/seroval.mjs";
import "../_libs/react.mjs";
import { o as objectType, s as stringType } from "../_libs/zod.mjs";
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
const signUpStudioAdmin_createServerFn_handler = createServerRpc({
  id: "3d47a6cc2b9dbeba8f759d2be5af4b50dfe3841787c3e1c7a595383ba82d23c7",
  name: "signUpStudioAdmin",
  filename: "src/lib/admin.functions.ts"
}, (opts) => signUpStudioAdmin.__executeServer(opts));
const signUpStudioAdmin = createServerFn({
  method: "POST"
}).inputValidator((input) => objectType({
  email: stringType().email().max(255),
  password: stringType().min(8).max(128)
}).parse(input)).handler(signUpStudioAdmin_createServerFn_handler, async ({
  data
}) => {
  const {
    supabaseAdmin
  } = await import("./client.server-DPjt3aO_.mjs");
  const {
    count
  } = await supabaseAdmin.from("user_roles").select("*", {
    count: "exact",
    head: true
  }).eq("role", "superadmin");
  if ((count ?? 0) > 0) throw new Error("The studio account already exists. Please sign in.");
  const {
    data: created,
    error: createErr
  } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true
  });
  if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create studio account");
  const {
    data: existing
  } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", created.user.id).eq("role", "superadmin").maybeSingle();
  if (!existing) {
    const {
      error: roleErr
    } = await supabaseAdmin.from("user_roles").insert({
      user_id: created.user.id,
      role: "superadmin"
    });
    if (roleErr) {
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      throw new Error(roleErr.message);
    }
  }
  return {
    user_id: created.user.id
  };
});
export {
  signUpStudioAdmin_createServerFn_handler
};
