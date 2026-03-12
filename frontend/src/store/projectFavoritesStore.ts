import { create } from "zustand";

const PROJECT_FAVORITES_STORAGE_KEY = "projectPickerFavorites";

function sanitizeFavoriteIds(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const ids = value.filter((id): id is string => typeof id === "string" && id.trim().length > 0);
  return Array.from(new Set(ids));
}

function readStoredFavoriteIds(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(PROJECT_FAVORITES_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return sanitizeFavoriteIds(JSON.parse(raw));
  } catch {
    return [];
  }
}

function writeStoredFavoriteIds(ids: string[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PROJECT_FAVORITES_STORAGE_KEY, JSON.stringify(ids));
}

interface ProjectFavoritesState {
  favoriteProjectIds: string[];
  toggleFavoriteProject: (projectId: string) => void;
  setFavoriteProject: (projectId: string, isFavorite: boolean) => void;
  resetFavoriteProjects: () => void;
}

const useProjectFavoritesStore = create<ProjectFavoritesState>((set, get) => ({
  favoriteProjectIds: readStoredFavoriteIds(),
  toggleFavoriteProject: (projectId) => {
    const normalizedId = projectId.trim();
    if (!normalizedId) {
      return;
    }

    const currentIds = get().favoriteProjectIds;
    const isFavorite = currentIds.includes(normalizedId);
    const nextIds = isFavorite
      ? currentIds.filter((id) => id !== normalizedId)
      : [...currentIds, normalizedId];

    writeStoredFavoriteIds(nextIds);
    set({ favoriteProjectIds: nextIds });
  },
  setFavoriteProject: (projectId, isFavorite) => {
    const normalizedId = projectId.trim();
    if (!normalizedId) {
      return;
    }

    const currentIds = get().favoriteProjectIds;
    const alreadyFavorite = currentIds.includes(normalizedId);
    const nextIds = isFavorite
      ? alreadyFavorite
        ? currentIds
        : [...currentIds, normalizedId]
      : currentIds.filter((id) => id !== normalizedId);

    writeStoredFavoriteIds(nextIds);
    set({ favoriteProjectIds: nextIds });
  },
  resetFavoriteProjects: () => {
    writeStoredFavoriteIds([]);
    set({ favoriteProjectIds: [] });
  },
}));

function syncFavoritesFromStorage() {
  const storedFavoriteIds = readStoredFavoriteIds();
  const currentFavoriteIds = useProjectFavoritesStore.getState().favoriteProjectIds;

  const isSameLength = currentFavoriteIds.length === storedFavoriteIds.length;
  const isSameOrder =
    isSameLength && currentFavoriteIds.every((id, index) => id === storedFavoriteIds[index]);

  if (!isSameOrder) {
    useProjectFavoritesStore.setState({ favoriteProjectIds: storedFavoriteIds });
  }
}

export function useFavoriteProjectIds(): string[] {
  return useProjectFavoritesStore((state) => state.favoriteProjectIds);
}

export function getFavoriteProjectIds(): string[] {
  syncFavoritesFromStorage();
  return useProjectFavoritesStore.getState().favoriteProjectIds;
}

export function isFavoriteProject(projectId: string): boolean {
  return getFavoriteProjectIds().includes(projectId);
}

export function toggleFavoriteProject(projectId: string): void {
  useProjectFavoritesStore.getState().toggleFavoriteProject(projectId);
}

export function setFavoriteProject(projectId: string, isFavorite: boolean): void {
  useProjectFavoritesStore.getState().setFavoriteProject(projectId, isFavorite);
}

export function resetFavoriteProjects(): void {
  useProjectFavoritesStore.getState().resetFavoriteProjects();
}
