import { useState, useEffect } from "react";
import { repoApi } from "../services/api";
import type { Repo } from "../types";

export function useRepo(repoId: string | null) {
  const [repo, setRepo] = useState<Repo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!repoId) {
      setRepo(null);
      return;
    }
    setIsLoading(true);
    repoApi
      .getRepo(repoId)
      .then((res) => setRepo(res.data.data))
      .catch(() => setRepo(null))
      .finally(() => setIsLoading(false));
  }, [repoId]);

  return { repo, isLoading };
}
