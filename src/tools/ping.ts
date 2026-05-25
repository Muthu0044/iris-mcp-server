import { asMcpText, ok } from "../utils/responses.js";

export async function pingTool() {
  return asMcpText(ok({ status: "ok" }));
}
