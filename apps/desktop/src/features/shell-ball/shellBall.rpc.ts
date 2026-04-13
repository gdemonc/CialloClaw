import type { AgentInputSubmitParams } from "@cialloclaw/protocol";

export async function submitShellBallInputRpc(params: AgentInputSubmitParams): Promise<unknown> {
  const importRpcMethods = new Function("return import('../../rpc/methods')") as () => Promise<{
    submitInput: (request: AgentInputSubmitParams) => Promise<unknown>;
  }>;
  const rpcMethods = await importRpcMethods();
  return rpcMethods.submitInput(params);
}
