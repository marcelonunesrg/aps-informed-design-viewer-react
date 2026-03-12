import { RefObject, useEffect, useMemo, useRef, useState } from "react";
import { MouseEvent, ReactNode } from "react";
import Box from "@mui/material/Box";
import { getBim360Clients, Bim360ClientItem } from "../../services/bim360Service";
import {
  toggleFavoriteProject,
  useFavoriteProjectIds,
} from "../../store/projectFavoritesStore";

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function renderHighlightedMatch(text: string, query: string): ReactNode {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) {
    return text;
  }

  const pattern = new RegExp(`(${escapeRegExp(trimmedQuery)})`, "gi");
  const parts = text.split(pattern);

  return parts.map((part, index) => {
    const isMatch = part.toLowerCase() === trimmedQuery.toLowerCase();

    if (isMatch) {
      return (
        <Box
          key={`${part}-${index}`}
          component="strong"
          sx={(theme) => ({
            bgcolor: theme.palette.mode === "dark" ? "grey.700" : "grey.300",
            px: 0.25,
            borderRadius: 0.5,
            fontWeight: 700,
          })}
        >
          {part}
        </Box>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
}

export function regionToFlag(region?: string): string {
  if (!region) {
    return "🌐";
  }

  const value = region.trim().toUpperCase();
  if (value.length === 2 && /^[A-Z]{2}$/.test(value)) {
    return String.fromCodePoint(...[...value].map((char) => 127397 + char.charCodeAt(0)));
  }

  if (value === "US") return "🇺🇸";
  if (value === "EMEA" || value === "EU") return "🇪🇺";
  if (value === "APAC") return "🌏";

  return "🌐";
}

export interface UseProjectPickerResult {
  hubProjectSearch: string;
  setHubProjectSearch: (value: string) => void;
  hubProjectValue: string;
  selectedHubProject: Bim360ClientItem | null;
  isLoadingHubProjects: boolean;
  hubProjectsError: string | null;
  hubProjectInputRef: RefObject<HTMLInputElement | null>;
  hubProjectPopoverContentRef: RefObject<HTMLDivElement | null>;
  isHubProjectMenuOpen: boolean;
  filteredHubProjectItems: Bim360ClientItem[];
  hubProjectAnchorEl: HTMLElement | null;
  onHubProjectClick: (event: MouseEvent<HTMLElement>) => void;
  closeHubProjectMenu: () => void;
  selectHubProject: (item: Bim360ClientItem) => void;
  selectHubProjectById: (projectId: string) => boolean;
  hubOptions: Array<{ id: string; name: string }>;
  selectedHubAccountId: string | null;
  selectHubAccount: (accountId: string) => void;
  isFavoriteProject: (projectId: string) => boolean;
  toggleFavoriteProject: (projectId: string) => void;
}

export function useProjectPicker(accessType: string): UseProjectPickerResult {
  const [hubProjectAnchorEl, setHubProjectAnchorEl] = useState<HTMLElement | null>(null);
  const [hubProjectSearch, setHubProjectSearch] = useState("");
  const [hubProjectValue, setHubProjectValue] = useState("");
  const [hubProjectItems, setHubProjectItems] = useState<Bim360ClientItem[]>([]);
  const [selectedHubProject, setSelectedHubProject] = useState<Bim360ClientItem | null>(null);
  const [isLoadingHubProjects, setIsLoadingHubProjects] = useState(false);
  const [hubProjectsError, setHubProjectsError] = useState<string | null>(null);
  const hubProjectInputRef = useRef<HTMLInputElement | null>(null);
  const hubProjectPopoverContentRef = useRef<HTMLDivElement | null>(null);
  const hasLoadedHubProjectsRef = useRef(false);
  const favoriteProjectIds = useFavoriteProjectIds();

  const isHubProjectMenuOpen = Boolean(hubProjectAnchorEl);
  const filteredHubProjectItems = useMemo(
    () => {
      const favoriteIdsSet = new Set(favoriteProjectIds);

      return hubProjectItems
        .filter((item) => {
        const query = hubProjectSearch.trim().toLowerCase();

        if (!query) {
          return true;
        }

        return (
          item.name.toLowerCase().includes(query) || item.accountName.toLowerCase().includes(query)
        );
        })
        .sort((left, right) => {
          const leftIsFavorite = favoriteIdsSet.has(left.id);
          const rightIsFavorite = favoriteIdsSet.has(right.id);

          if (leftIsFavorite !== rightIsFavorite) {
            return leftIsFavorite ? -1 : 1;
          }

          return left.name.localeCompare(right.name, undefined, { sensitivity: "base" });
        });
    },
    [hubProjectItems, hubProjectSearch, favoriteProjectIds],
  );

  const hubOptions = useMemo(() => {
    const unique = new Map<string, string>();

    for (const item of hubProjectItems) {
      const accountId = item.accountId?.trim();
      if (!accountId || unique.has(accountId)) {
        continue;
      }

      unique.set(accountId, item.accountName?.trim() || item.name || accountId);
    }

    return Array.from(unique.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: "base" }));
  }, [hubProjectItems]);

  useEffect(() => {
    let active = true;

    async function loadHubProjects() {
      if (accessType !== "ACC" || hasLoadedHubProjectsRef.current) {
        return;
      }

      setIsLoadingHubProjects(true);
      setHubProjectsError(null);
      setHubProjectItems([]);

      try {
        const clients = await getBim360Clients(50, (_pageItems, accumulatedItems) => {
          if (!active) {
            return;
          }

          const sortedPartial = accumulatedItems
            .slice()
            .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));

          setHubProjectItems(sortedPartial);
        });

        if (!active) {
          return;
        }

        const sorted = clients
          .slice()
          .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
        setHubProjectItems(sorted);
        hasLoadedHubProjectsRef.current = true;
      } catch (error) {
        if (!active) {
          return;
        }

        setHubProjectsError((error as Error).message || "Could not load hub/project list.");
        hasLoadedHubProjectsRef.current = false;
      } finally {
        if (active) {
          setIsLoadingHubProjects(false);
        }
      }
    }

    void loadHubProjects();

    return () => {
      active = false;
    };
  }, [accessType]);

  function openHubProjectMenu(anchorElement: HTMLElement): void {
    setHubProjectAnchorEl(anchorElement);
  }

  function onHubProjectClick(event: MouseEvent<HTMLElement>): void {
    openHubProjectMenu(event.currentTarget);
  }

  function closeHubProjectMenu(): void {
    setHubProjectAnchorEl(null);
  }

  useEffect(() => {
    if (!isHubProjectMenuOpen) {
      return;
    }

    const onPointerDown = (event: globalThis.MouseEvent) => {
      const target = event.target as Node | null;
      if (!target) return;

      const clickedInsidePopover = Boolean(hubProjectPopoverContentRef.current?.contains(target));
      const clickedInsideInput = Boolean(hubProjectInputRef.current?.contains(target as Node));

      if (!clickedInsidePopover && !clickedInsideInput) {
        closeHubProjectMenu();
        try {
          hubProjectInputRef.current?.blur();
        } catch {
          // ignore
        }
      }
    };

    document.addEventListener("mousedown", onPointerDown, true);

    return () => {
      document.removeEventListener("mousedown", onPointerDown, true);
    };
  }, [isHubProjectMenuOpen]);

  function selectHubProject(item: Bim360ClientItem): void {
    setHubProjectValue(item.name);
    setSelectedHubProject(item);
    closeHubProjectMenu();
    try {
      hubProjectInputRef.current?.blur();
    } catch {
      // ignore
    }
  }

  function selectHubProjectById(projectId: string): boolean {
    const normalizedProjectId = projectId.trim();
    if (!normalizedProjectId) {
      return false;
    }

    const match = hubProjectItems.find((item) => item.id === normalizedProjectId);
    if (!match) {
      return false;
    }

    selectHubProject(match);
    return true;
  }

  function selectHubAccount(accountId: string): void {
    const normalizedAccountId = accountId.trim();
    if (!normalizedAccountId) {
      return;
    }

    const match = hubProjectItems.find((item) => item.accountId === normalizedAccountId);
    if (!match) {
      return;
    }

    setSelectedHubProject(match);
    setHubProjectValue(match.accountName || match.name);
  }

  return {
    hubProjectSearch,
    setHubProjectSearch,
    hubProjectValue,
    selectedHubProject,
    isLoadingHubProjects,
    hubProjectsError,
    hubProjectInputRef,
    hubProjectPopoverContentRef,
    isHubProjectMenuOpen,
    filteredHubProjectItems,
    hubProjectAnchorEl,
    onHubProjectClick,
    closeHubProjectMenu,
    selectHubProject,
    selectHubProjectById,
    hubOptions,
    selectedHubAccountId: selectedHubProject?.accountId || null,
    selectHubAccount,
    isFavoriteProject: (projectId: string) => favoriteProjectIds.includes(projectId),
    toggleFavoriteProject,
  };
}