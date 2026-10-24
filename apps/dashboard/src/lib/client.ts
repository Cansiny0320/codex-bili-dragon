import { createORPCClient } from '@orpc/client';
import { RPCLink } from '@orpc/client/fetch';
import type { RouterClient } from '@orpc/server';
import type { ApiRouter } from '@bili-dragon/runtime/api';
export function createClient(token: string): RouterClient<ApiRouter> {
  return createORPCClient(
    new RPCLink({
      url: new URL('/rpc', window.location.origin),
      headers: () => ({ authorization: 'Bearer ' + token }),
    }),
  );
}
