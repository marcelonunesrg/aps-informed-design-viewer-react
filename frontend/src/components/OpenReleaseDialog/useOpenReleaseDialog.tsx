import { useCallback, useEffect, useRef, useState } from "react";
import { getTopFolders, getFolderContents } from "../../services/accService";
import { getViewerAccessToken } from "../../services/authService";
import {
  InformedDesignPublisher,
  InformedDesignProduct,
  InformedDesignReleaseItem,
  listPublishers,
  listProductReleases,
  listProducts,
} from "../../services/informedDesignService";
import { useProjectPicker } from "../ProjectPicker/useProjectPicker";
import { FolderTreeNode } from "./FolderTree";
import type { ProductReleaseData } from "../../types";
import {
  buildUrlWithProductReleaseData,
  saveProductReleaseDataToLocalStorage,
} from "../../utils/productReleaseStorage";

export interface OpenReleaseDialogProps {
  open: boolean;
  onClose: () => void;
  accessType: string;
  currentReleaseId?: string;
  onAccessTypeChange: (value: string) => void;
  onSubmit: (releaseData: ProductReleaseData) => void;
}

interface OpenReleaseDialogStateSnapshot {
  accessType: string;
  selectedHubProjectId: string;
  selectedFolderId: string;
  expandedProductId: string | null;
  selectedReleaseId: string;
}

export interface SelectedReleaseDetails {
  product: InformedDesignProduct;
  release: InformedDesignReleaseItem;
  isDefaultRelease: boolean;
}

const OPEN_RELEASE_DIALOG_STATE_KEY = "idv_open_release_dialog_state";

function readOpenReleaseDialogState(): OpenReleaseDialogStateSnapshot | null {
  try {
    const raw = localStorage.getItem(OPEN_RELEASE_DIALOG_STATE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as OpenReleaseDialogStateSnapshot;

    if (
      !parsed ||
      typeof parsed.accessType !== "string" ||
      typeof parsed.selectedHubProjectId !== "string" ||
      typeof parsed.selectedFolderId !== "string" ||
      typeof parsed.selectedReleaseId !== "string"
    ) {
      return null;
    }

    if (parsed.expandedProductId !== null && typeof parsed.expandedProductId !== "string") {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function writeOpenReleaseDialogState(snapshot: OpenReleaseDialogStateSnapshot): void {
  try {
    localStorage.setItem(OPEN_RELEASE_DIALOG_STATE_KEY, JSON.stringify(snapshot));
  } catch {
    // noop
  }
}

function ensurePrefixedB(value?: string): string {
  if (!value) {
    return "";
  }

  return value.startsWith("b.") ? value : `b.${value}`;
}

function toFolderTreeNode(item: { id: string; name: string; hasChildren?: boolean; type?: string }): FolderTreeNode {
  const inferredHasChildren = item.type === "folders" || item.type === "folder";

  return {
    id: item.id,
    name: item.name,
    hasChildren: item.hasChildren ?? inferredHasChildren,
    loaded: false,
    expanded: false,
    loading: false,
  };
}

function findNodeById(nodes: FolderTreeNode[], nodeId: string): FolderTreeNode | null {
  for (const node of nodes) {
    if (node.id === nodeId) {
      return node;
    }

    if (node.children?.length) {
      const found = findNodeById(node.children, nodeId);
      if (found) {
        return found;
      }
    }
  }

  return null;
}

function updateNodeInTree(
  nodes: FolderTreeNode[],
  nodeId: string,
  updater: (node: FolderTreeNode) => FolderTreeNode,
): FolderTreeNode[] {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return updater(node);
    }

    if (!node.children?.length) {
      return node;
    }

    return {
      ...node,
      children: updateNodeInTree(node.children, nodeId, updater),
    };
  });
}

function isMatchingDefaultRelease(product: InformedDesignProduct, release: InformedDesignReleaseItem): boolean {
  const defaultRelease = product.defaultRelease?.trim();
  if (!defaultRelease) {
    return false;
  }

  const normalizedDefault = defaultRelease.toUpperCase();
  const releaseId = release.id.trim().toUpperCase();
  const releaseNumber = release.releaseNumber?.trim().toUpperCase();
  const releaseName = release.name.trim().toUpperCase();

  return normalizedDefault === releaseId || normalizedDefault === releaseNumber || normalizedDefault === releaseName;
}

function selectReleaseForExpandedProduct(
  releases: InformedDesignReleaseItem[],
  product: InformedDesignProduct | undefined,
  currentReleaseId?: string,
): string | null {
  const normalizedCurrentReleaseId = currentReleaseId?.trim().toUpperCase();
  if (normalizedCurrentReleaseId) {
    const matchingCurrentRelease = releases.find(
      (release) => release.id.trim().toUpperCase() === normalizedCurrentReleaseId,
    );

    if (matchingCurrentRelease) {
      return matchingCurrentRelease.id;
    }
  }

  const defaultRelease = product
    ? releases.find((release) => isMatchingDefaultRelease(product, release))
    : undefined;

  return defaultRelease?.id || null;
}

export function useOpenReleaseDialog(accessType: string, isOpen: boolean, currentReleaseId?: string) {
  const projectPicker = useProjectPicker(accessType);
  const selectedHubProject = projectPicker.selectedHubProject;
  const selectedProjectId = selectedHubProject?.projectId;

  const [treeNodes, setTreeNodes] = useState<FolderTreeNode[]>([]);
  const [accError, setAccError] = useState<string | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<string | null>(null);
  const [publishers, setPublishers] = useState<InformedDesignPublisher[]>([]);
  const [isLoadingPublishers, setIsLoadingPublishers] = useState(false);
  const [publishersError, setPublishersError] = useState<string | null>(null);
  const [selectedPublisherId, setSelectedPublisherId] = useState<string | null>(null);
  const [indProjects, setIndProjects] = useState<InformedDesignProduct[]>([]);
  const [isLoadingIndProjects, setIsLoadingIndProjects] = useState(false);
  const [indProjectsError, setIndProjectsError] = useState<string | null>(null);
  const [expandedProductIds, setExpandedProductIds] = useState<string[]>([]);
  const [productReleasesByProductId, setProductReleasesByProductId] = useState<
    Record<string, InformedDesignReleaseItem[]>
  >({});
  const [productReleaseLoadingByProductId, setProductReleaseLoadingByProductId] = useState<
    Record<string, boolean>
  >({});
  const [productReleaseErrorByProductId, setProductReleaseErrorByProductId] = useState<
    Record<string, string | null>
  >({});
  const [selectedReleaseId, setSelectedReleaseId] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const restoreSnapshotRef = useRef<OpenReleaseDialogStateSnapshot | null>(null);
  const shouldRestoreRef = useRef(false);
  const hasRestoredFolderRef = useRef(false);
  const hasRestoredProductRef = useRef(false);
  const latestSelectedReleaseDataRef = useRef<ProductReleaseData | null>(null);

  const normalizeProjectAccessId = useCallback((projectId?: string): string => {
    if (!projectId) {
      return "";
    }

    return projectId.startsWith("b.") ? projectId.slice(2) : projectId;
  }, []);

  const selectedProductsAccessId = (() => {
    if (accessType === "ACC") {
      const folderId = selectedFolderId?.trim();
      const projectAccessId = normalizeProjectAccessId(selectedProjectId).trim();

      if (!folderId || !projectAccessId) {
        return null;
      }

      return `${projectAccessId}|${folderId}`;
    }

    if (accessType === "PUBLIC") {
      return selectedPublisherId?.trim() || null;
    }

    return null;
  })();

  const selectedContextId = accessType === "PUBLIC" ? selectedPublisherId : selectedFolderId;

  const categoryOptions = Array.from(
    new Set(indProjects.map((product) => product.classification?.trim()).filter((value): value is string => Boolean(value))),
  ).sort((left, right) => left.localeCompare(right, undefined, { sensitivity: "base" }));

  const filteredIndProjects =
    selectedCategory === "ALL"
      ? indProjects
      : indProjects.filter((product) => (product.classification || "").trim() === selectedCategory);

  useEffect(() => {
    if (selectedCategory === "ALL") {
      return;
    }

    const stillExists = categoryOptions.includes(selectedCategory);
    if (!stillExists) {
      setSelectedCategory("ALL");
    }
  }, [categoryOptions, selectedCategory]);

  const handleFolderSelect = useCallback(async (nodeId: string) => {
    setSelectedFolderId(nodeId);
    setIndProjects([]);
    setIndProjectsError(null);
    setIsLoadingIndProjects(true);
    setExpandedProductIds([]);
    setProductReleasesByProductId({});
    setProductReleaseLoadingByProductId({});
    setProductReleaseErrorByProductId({});
    setSelectedReleaseId(null);

    const node = findNodeById(treeNodes, nodeId);
    if (!node) {
      setIsLoadingIndProjects(false);
      return;
    }

    const projectAccessId = normalizeProjectAccessId(selectedProjectId);
    if (!projectAccessId || accessType !== "ACC") {
      setIsLoadingIndProjects(false);
      return;
    }

    try {
      const token = await getViewerAccessToken();
      const accessId = `${projectAccessId}|${nodeId}`;
      const products = await listProducts({
        accessType: "ACC",
        accessId,
        accessToken: token.access_token,
      });

      setIndProjects(products);
    } catch (error) {
      setIndProjects([]);
      setIndProjectsError((error as Error).message || "Could not load IND projects.");
    } finally {
      setIsLoadingIndProjects(false);
    }
  }, [accessType, normalizeProjectAccessId, selectedProjectId, treeNodes]);

  const handlePublisherSelect = useCallback(async (publisherId: string) => {
    const normalizedPublisherId = publisherId.trim();
    if (!normalizedPublisherId || accessType !== "PUBLIC") {
      return;
    }

    setSelectedPublisherId(normalizedPublisherId);
    setIndProjects([]);
    setIndProjectsError(null);
    setIsLoadingIndProjects(true);
    setExpandedProductIds([]);
    setProductReleasesByProductId({});
    setProductReleaseLoadingByProductId({});
    setProductReleaseErrorByProductId({});
    setSelectedReleaseId(null);

    try {
      const token = await getViewerAccessToken();
      const products = await listProducts({
        accessType: "PUBLIC",
        accessId: normalizedPublisherId,
        accessToken: token.access_token,
      });

      setIndProjects(products);
    } catch (error) {
      setIndProjects([]);
      setIndProjectsError((error as Error).message || "Could not load IND projects.");
    } finally {
      setIsLoadingIndProjects(false);
    }
  }, [accessType]);

  const handleToggleProduct = useCallback(async (productId: string) => {
    const isExpanded = expandedProductIds.includes(productId);

    if (isExpanded) {
      setExpandedProductIds([]);
      return;
    }

    setExpandedProductIds([productId]);

    const product = indProjects.find((item) => item.id === productId);

    if (productReleasesByProductId[productId]) {
      const cachedReleases = productReleasesByProductId[productId] || [];
      setSelectedReleaseId(selectReleaseForExpandedProduct(cachedReleases, product, currentReleaseId));
      return;
    }

    if (!selectedProductsAccessId) {
      return;
    }

    if (accessType !== "ACC" && accessType !== "PUBLIC") {
      return;
    }

    setProductReleaseLoadingByProductId((prev) => ({ ...prev, [productId]: true }));
    setProductReleaseErrorByProductId((prev) => ({ ...prev, [productId]: null }));

    try {
      const token = await getViewerAccessToken();
      const accessId = selectedProductsAccessId;
      const releases = await listProductReleases({
        accessType,
        accessId,
        productId,
        accessToken: token.access_token,
      });

      setProductReleasesByProductId((prev) => ({ ...prev, [productId]: releases }));
      setSelectedReleaseId(selectReleaseForExpandedProduct(releases, product, currentReleaseId));
    } catch (error) {
      setProductReleaseErrorByProductId((prev) => ({
        ...prev,
        [productId]: (error as Error).message || "Could not load releases.",
      }));
      setProductReleasesByProductId((prev) => ({ ...prev, [productId]: [] }));
      setSelectedReleaseId(null);
    } finally {
      setProductReleaseLoadingByProductId((prev) => ({ ...prev, [productId]: false }));
    }
  }, [
    accessType,
    currentReleaseId,
    expandedProductIds,
    indProjects,
    productReleasesByProductId,
    selectedProductsAccessId,
  ]);

  useEffect(() => {
    if (!isOpen) {
      restoreSnapshotRef.current = null;
      shouldRestoreRef.current = false;
      hasRestoredFolderRef.current = false;
      hasRestoredProductRef.current = false;
      return;
    }

    const snapshot = readOpenReleaseDialogState();
    const shouldUseSnapshot = !!snapshot && snapshot.accessType === accessType;
    restoreSnapshotRef.current = shouldUseSnapshot ? snapshot : null;
    shouldRestoreRef.current = shouldUseSnapshot;
    hasRestoredFolderRef.current = false;
    hasRestoredProductRef.current = false;

    const normalizedCurrentReleaseId = currentReleaseId?.trim();
    const normalizedSavedReleaseId = snapshot?.selectedReleaseId?.trim();
    setSelectedReleaseId(normalizedCurrentReleaseId || normalizedSavedReleaseId || null);
  }, [isOpen, currentReleaseId, accessType]);

  useEffect(() => {
    if (accessType !== "ACC") {
      return;
    }

    if (!isOpen || !shouldRestoreRef.current) {
      return;
    }

    const snapshot = restoreSnapshotRef.current;
    if (!snapshot?.selectedHubProjectId) {
      return;
    }

    if (selectedHubProject?.id === snapshot.selectedHubProjectId) {
      return;
    }

    projectPicker.selectHubProjectById(snapshot.selectedHubProjectId);
  }, [accessType, isOpen, projectPicker, selectedHubProject]);

  useEffect(() => {
    if (accessType !== "ACC") {
      return;
    }

    if (!isOpen || !shouldRestoreRef.current || hasRestoredFolderRef.current) {
      return;
    }

    const snapshot = restoreSnapshotRef.current;
    if (!snapshot?.selectedFolderId) {
      hasRestoredFolderRef.current = true;
      return;
    }

    if (snapshot.selectedHubProjectId && selectedHubProject?.id !== snapshot.selectedHubProjectId) {
      return;
    }

    if (selectedFolderId === snapshot.selectedFolderId) {
      hasRestoredFolderRef.current = true;
      return;
    }

    const folderNode = findNodeById(treeNodes, snapshot.selectedFolderId);
    if (!folderNode) {
      return;
    }

    hasRestoredFolderRef.current = true;
    void handleFolderSelect(snapshot.selectedFolderId);
  }, [accessType, isOpen, selectedHubProject, selectedFolderId, treeNodes, handleFolderSelect]);

  useEffect(() => {
    if (accessType !== "ACC") {
      return;
    }

    if (!isOpen || !shouldRestoreRef.current || hasRestoredProductRef.current) {
      return;
    }

    const snapshot = restoreSnapshotRef.current;
    if (!snapshot) {
      hasRestoredProductRef.current = true;
      shouldRestoreRef.current = false;
      return;
    }

    if (snapshot.selectedFolderId && selectedFolderId !== snapshot.selectedFolderId) {
      return;
    }

    if (isLoadingIndProjects) {
      return;
    }

    if (snapshot.expandedProductId) {
      const productExists = indProjects.some((product) => product.id === snapshot.expandedProductId);
      if (!productExists) {
        hasRestoredProductRef.current = true;
        shouldRestoreRef.current = false;
        return;
      }

      if (!expandedProductIds.includes(snapshot.expandedProductId)) {
        void handleToggleProduct(snapshot.expandedProductId);
        return;
      }

      const releases = productReleasesByProductId[snapshot.expandedProductId] || [];
      const hasSavedRelease = releases.some((release) => release.id === snapshot.selectedReleaseId);
      if (hasSavedRelease) {
        setSelectedReleaseId(snapshot.selectedReleaseId);
      }
    }

    hasRestoredProductRef.current = true;
    shouldRestoreRef.current = false;
  }, [
    isOpen,
    accessType,
    selectedFolderId,
    isLoadingIndProjects,
    indProjects,
    expandedProductIds,
    productReleasesByProductId,
    handleToggleProduct,
  ]);

  useEffect(() => {
    if (accessType !== "ACC") {
      return;
    }

    if (!selectedHubProject) {
      setTreeNodes([]);
      setSelectedFolderId(null);
      setIndProjects([]);
      setIndProjectsError(null);
      setIsLoadingIndProjects(false);
      setExpandedProductIds([]);
      setProductReleasesByProductId({});
      setProductReleaseLoadingByProductId({});
      setProductReleaseErrorByProductId({});
      setSelectedReleaseId(null);
      setSelectedCategory("ALL");
      setAccError(null);
      return;
    }

    setTreeNodes([]);
    setSelectedFolderId(null);
    setIndProjects([]);
    setIndProjectsError(null);
    setIsLoadingIndProjects(false);
    setExpandedProductIds([]);
    setProductReleasesByProductId({});
    setProductReleaseLoadingByProductId({});
    setProductReleaseErrorByProductId({});
    setSelectedReleaseId(null);
    setSelectedCategory("ALL");

    const hubId = ensurePrefixedB(selectedHubProject?.accountId);
    const projectId = ensurePrefixedB(selectedProjectId);

    setAccError(null);

    if (!hubId || !projectId) {
      setAccError(
        `Invalid hub/project identifiers (hub='${hubId}', project='${projectId}'). Cannot load top folders.`,
      );
      setTreeNodes([]);
      return;
    }

    let active = true;

    (async () => {
      try {
        const folders = await getTopFolders(hubId, projectId);
        if (!active) return;

        const nodes: FolderTreeNode[] = folders
          .filter((f) => f.type !== "items" && f.type !== "versions")
          .map((f) => toFolderTreeNode(f));

        const firstExpandableNode = nodes.find((node) => node.hasChildren);

        if (!firstExpandableNode) {
          setTreeNodes(nodes);
          setSelectedFolderId(null);
          setIndProjects([]);
          setIndProjectsError(null);
          setExpandedProductIds([]);
          setProductReleasesByProductId({});
          setProductReleaseLoadingByProductId({});
          setProductReleaseErrorByProductId({});
          setSelectedReleaseId(null);
          setSelectedCategory("ALL");
          return;
        }

        setTreeNodes(
          nodes.map((node) =>
            node.id === firstExpandableNode.id
              ? {
                  ...node,
                  loading: true,
                }
              : node,
          ),
        );
        setSelectedFolderId(null);
        setIndProjects([]);
        setIndProjectsError(null);
        setExpandedProductIds([]);
        setProductReleasesByProductId({});
        setProductReleaseLoadingByProductId({});
        setProductReleaseErrorByProductId({});
        setSelectedReleaseId(null);
        setSelectedCategory("ALL");

        try {
          const contents = await getFolderContents(projectId, firstExpandableNode.id);
          if (!active) return;

          const children = contents
            .filter((item) => item.type !== "items" && item.type !== "versions")
            .map((item) => toFolderTreeNode(item));

          setTreeNodes((prev) =>
            updateNodeInTree(prev, firstExpandableNode.id, (current) => ({
              ...current,
              loading: false,
              loaded: true,
              expanded: true,
              children,
            })),
          );
        } catch (e) {
          if (!active) return;

          const msg = (e as Error).message || String(e);
          setAccError(`Could not load folder contents: ${msg}`);
          setTreeNodes((prev) =>
            updateNodeInTree(prev, firstExpandableNode.id, (current) => ({
              ...current,
              loading: false,
            })),
          );
        }
      } catch (e) {
        if (!active) return;
        const msg = (e as Error).message || String(e);
        setAccError(`Could not load top folders: ${msg}`);
        setTreeNodes([]);
      }
    })();

    return () => {
      active = false;
    };
  }, [accessType, selectedHubProject, selectedProjectId]);

  useEffect(() => {
    if (accessType !== "PUBLIC") {
      setPublishers([]);
      setPublishersError(null);
      setIsLoadingPublishers(false);
      setSelectedPublisherId(null);
      return;
    }

    let active = true;
    setPublishers([]);
    setPublishersError(null);
    setIsLoadingPublishers(true);
    setSelectedPublisherId(null);
    setIndProjects([]);
    setIndProjectsError(null);
    setIsLoadingIndProjects(false);
    setExpandedProductIds([]);
    setProductReleasesByProductId({});
    setProductReleaseLoadingByProductId({});
    setProductReleaseErrorByProductId({});
    setSelectedReleaseId(null);
    setSelectedCategory("ALL");

    (async () => {
      try {
        const token = await getViewerAccessToken();
        if (!active) {
          return;
        }

        const publisherItems = await listPublishers(token.access_token);
        if (!active) {
          return;
        }

        setPublishers(publisherItems);
      } catch (error) {
        if (!active) {
          return;
        }

        setPublishers([]);
        setPublishersError((error as Error).message || "Could not load publishers.");
      } finally {
        if (active) {
          setIsLoadingPublishers(false);
        }
      }
    })();

    return () => {
      active = false;
    };
  }, [accessType]);

  function handleSelectRelease(releaseId: string) {
    if (selectedProductsAccessId && (accessType === "ACC" || accessType === "PUBLIC")) {
      const selectedReleaseData = {
        releaseId: releaseId.trim(),
        accessType,
        accessId: selectedProductsAccessId,
      };

      latestSelectedReleaseDataRef.current = selectedReleaseData;
      saveProductReleaseDataToLocalStorage(selectedReleaseData);

      const nextUrl = buildUrlWithProductReleaseData(selectedReleaseData);
      window.history.replaceState({}, "", nextUrl);
    }

    setSelectedReleaseId(releaseId);
  }

  const selectedReleaseData: ProductReleaseData | null = (() => {
    if (accessType !== "ACC" && accessType !== "PUBLIC") {
      return null;
    }

    const releaseId = selectedReleaseId?.trim();
    const accessId = selectedProductsAccessId?.trim();

    if (!releaseId || !accessId) {
      return null;
    }

    return {
      releaseId,
      accessType,
      accessId,
    };
  })();

  const selectedReleaseDetails: SelectedReleaseDetails | null = (() => {
    const selectedId = selectedReleaseId?.trim();
    if (!selectedId) {
      return null;
    }

    for (const [productId, releases] of Object.entries(productReleasesByProductId)) {
      const release = releases.find((item) => item.id === selectedId);
      if (!release) {
        continue;
      }

      const product = indProjects.find((item) => item.id === productId);
      if (!product) {
        return null;
      }

      return {
        product,
        release,
        isDefaultRelease: isMatchingDefaultRelease(product, release),
      };
    }

    return null;
  })();

  useEffect(() => {
    latestSelectedReleaseDataRef.current = selectedReleaseData;
  }, [selectedReleaseData]);

  const getLatestSelectedReleaseData = useCallback((): ProductReleaseData | null => {
    return latestSelectedReleaseDataRef.current;
  }, []);

  useEffect(() => {
    if (!selectedReleaseData || !selectedHubProject || !selectedFolderId) {
      return;
    }

    writeOpenReleaseDialogState({
      accessType,
      selectedHubProjectId: selectedHubProject.id,
      selectedFolderId,
      expandedProductId: expandedProductIds[0] || null,
      selectedReleaseId: selectedReleaseData.releaseId,
    });
  }, [selectedReleaseData, selectedHubProject, selectedFolderId, accessType, expandedProductIds]);

  async function handleToggleFolder(nodeId: string) {
    const selectedHubProject = projectPicker.selectedHubProject;
    const projectId = ensurePrefixedB(selectedHubProject?.projectId);
    if (!projectId) {
      return;
    }

    const node = findNodeById(treeNodes, nodeId);
    if (!node || !node.hasChildren) {
      return;
    }

    if (node.loaded) {
      setTreeNodes((prev) =>
        updateNodeInTree(prev, nodeId, (current) => ({
          ...current,
          expanded: !current.expanded,
        })),
      );
      return;
    }

    setTreeNodes((prev) =>
      updateNodeInTree(prev, nodeId, (current) => ({
        ...current,
        loading: true,
      })),
    );

    try {
      const contents = await getFolderContents(projectId, nodeId);
      const children = contents
        .filter((item) => item.type !== "items" && item.type !== "versions")
        .map((item) => toFolderTreeNode(item));

      setTreeNodes((prev) =>
        updateNodeInTree(prev, nodeId, (current) => ({
          ...current,
          loading: false,
          loaded: true,
          expanded: true,
          children,
        })),
      );
    } catch (e) {
      const msg = (e as Error).message || String(e);
      setAccError(`Could not load folder contents: ${msg}`);
      setTreeNodes((prev) =>
        updateNodeInTree(prev, nodeId, (current) => ({
          ...current,
          loading: false,
        })),
      );
    }
  }

  return {
    projectPicker,
    treeNodes,
    accError,
    publishers,
    isLoadingPublishers,
    publishersError,
    selectedPublisherId,
    selectedContextId,
    selectedFolderId,
    indProjects,
    isLoadingIndProjects,
    indProjectsError,
    expandedProductIds,
    productReleasesByProductId,
    productReleaseLoadingByProductId,
    productReleaseErrorByProductId,
    selectedReleaseId,
    selectedCategory,
    categoryOptions,
    filteredIndProjects,
    selectedReleaseData,
    selectedReleaseDetails,
    getLatestSelectedReleaseData,
    handleFolderSelect,
    handlePublisherSelect,
    handleToggleFolder,
    handleToggleProduct,
    handleSelectRelease,
    setSelectedCategory,
  };
}
