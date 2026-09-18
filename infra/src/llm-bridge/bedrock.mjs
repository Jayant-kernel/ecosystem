import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime';
import { UpstreamError } from './errors.mjs';

export const DEFAULT_MODEL_ID = 'anthropic.claude-3-haiku-20240307-v1:0';
export const DEFAULT_REGION = 'ap-south-1';

/** Credentials come from the Lambda execution role — never hardcoded. */
export function createBedrockClient(region = process.env.BEDROCK_REGION || DEFAULT_REGION) {
  return new BedrockRuntimeClient({ region });
}

/**
 * Single Bedrock Converse call. Throws UpstreamError on any SDK failure so the
 * handler can map throttling/timeouts to a safe response.
 */
export async function converse(client, params) {
  try {
    return await client.send(new ConverseCommand(params));
  } catch (error) {
    const status = error?.$metadata?.httpStatusCode || 0;
    throw new UpstreamError('Bedrock', status, error?.name || error?.message);
  }
}
