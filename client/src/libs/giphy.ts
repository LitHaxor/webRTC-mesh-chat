import axios from "axios";
import type { Gif } from "../types/gif.ts";

type GiphyResponse = {
  data: {
    id: string;
    title: string;
    images: { fixed_height: { url: string } };
  }[];
};

const apiKey = import.meta.env.VITE_GIPHY_API_KEY;

const giphy = axios.create({
  baseURL: "https://api.giphy.com/v1/gifs",
  params: { api_key: apiKey },
});

export const hasGiphy = Boolean(apiKey);

export const searchGifs = async (query: string): Promise<Gif[]> => {
  const { data } = await giphy.get<GiphyResponse>("/search", {
    params: { q: query, limit: 12, rating: "g" },
  });
  return data.data.map((gif) => ({
    id: gif.id,
    title: gif.title,
    url: gif.images.fixed_height.url,
  }));
};
