import type { AgentInputSubmitParams } from "@cialloclaw/protocol";

type SubmitTextInputParams = {
  text: string;
  source: AgentInputSubmitParams["source"];
  trigger: AgentInputSubmitParams["trigger"];
  inputMode: AgentInputSubmitParams["input"]["input_mode"];
};

function createRequestMeta(): AgentInputSubmitParams["request_meta"] {
  const now = new Date().toISOString();
  const traceId = typeof globalThis.crypto?.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `trace_${Date.now()}_${Math.random().toString(16).slice(2)}`;

  return {
    trace_id: traceId,
    client_time: now,
  };
}

export function createTextInputSubmitParams(input: SubmitTextInputParams): AgentInputSubmitParams | null {
  const normalizedText = input.text.trim();

  if (normalizedText === "") {
    return null;
  }

  return {
    request_meta: createRequestMeta(),
    source: input.source,
    trigger: input.trigger,
    input: {
      type: "text",
      text: normalizedText,
      input_mode: input.inputMode,
    },
    context: {
      files: [],
    },
  };
}

export async function submitTextInput(input: SubmitTextInputParams) {
  const params = createTextInputSubmitParams(input);

  if (params === null) {
    return null;
  }

  const importRpcMethods = new Function("return import('../rpc/methods')") as () => Promise<{
    submitInput: (request: AgentInputSubmitParams) => Promise<unknown>;
  }>;
  const rpcMethods = await importRpcMethods();
  return rpcMethods.submitInput(params);
}
