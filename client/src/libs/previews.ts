import type { LinkPreview } from "../types/preview.ts";
import { api } from "./api.ts";

const cache = new Map<string, Promise<LinkPreview>>();

const requestPreview = async (url: string) => {
  try {
    const { data } = await api.get<LinkPreview>("/previews", {
      params: { url },
    });
    return data;
  } catch (error) {
    cache.delete(url);
    throw error;
  }
};

export const fetchPreview = (url: string) => {
  const cached = cache.get(url);
  if (cached) {
    return cached;
  }
  const request = requestPreview(url);
  cache.set(url, request);
  return request;
};
