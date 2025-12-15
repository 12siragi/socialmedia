import useSWR from "swr";
import { fetcher } from "../components/helpers/axios";

export default function usePosts() {
  const { data, error, isLoading, mutate } = useSWR(
    "/api/post/posts/",
    fetcher
  );

  const results = Array.isArray(data)
    ? data
    : data?.results ?? [];

  return {
    posts: results,   // 🔥 ALWAYS an array
    refresh: mutate,
    isLoading,
    error,
  };
}
