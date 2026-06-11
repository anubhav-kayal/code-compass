import { useState, useCallback } from "react";
import { searchApi } from "../services/api";
import type { SourceCitation } from "../types";

export function useSearch(repoId: string) {
  const [results, setResults] = useState<SourceCitation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const search = useCallback(async (query: string, type: string = "code") => {
    setIsLoading(true);
    try {
      const res = await searchApi.search({ q: query, repoId, type, limit: 30 });
      setResults(res.data.data || []);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [repoId]);

  return { results, isLoading, search };
}
