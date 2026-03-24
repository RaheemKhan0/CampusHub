import createClient from "openapi-fetch";
import { paths } from "@/types/openapi";

export const api = createClient<paths>({
  baseUrl: process.env.NEXT_PUBLIC_API_URL,
  headers: { "Content-Type": "application/json" },
  credentials : 'include',
});


