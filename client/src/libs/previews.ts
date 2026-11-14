import type { LinkPreview } from "../types/preview.ts";
import { api } from "./api.ts";

export const fetchPreview = async (url: string) => {
  const { data } = await api.get<LinkPreview>("/previews", { params: { url } });
  return data;
};
