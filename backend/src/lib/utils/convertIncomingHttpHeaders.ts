import { IncomingHttpHeaders } from 'http';

export function toHeaders(input: HeadersInit): Headers {
  return input instanceof Headers ? input : new Headers(input);
}

export function convertIncomingHttpHeaders(src: IncomingHttpHeaders): Headers {
  const headers = new Headers();
  for (const [key, value] of Object.entries(src)) {
    if (Array.isArray(value)) {
      for (const v of value) {
        headers.append(key, v);
      }
    } else if (value) {
      headers.append(key, value);
    }
  }
  return headers;
}
