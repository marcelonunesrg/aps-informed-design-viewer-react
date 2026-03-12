import { useEffect, useMemo } from "react";
import { create } from "zustand";
import type { ProductReleaseData } from "../types";
import {
  buildUrlWithProductReleaseData,
  getProductReleaseDataFromLocalStorage,
  hasCompleteProductReleaseData,
  parseProductReleaseFromUrl,
  saveProductReleaseDataToLocalStorage,
  validateProductReleaseData,
} from "../utils/productReleaseStorage";

function getInitialReleaseData(): ProductReleaseData {
  const fromUrl = parseProductReleaseFromUrl(window.location);

  if (hasCompleteProductReleaseData(fromUrl)) {
    return fromUrl;
  }

  const fromStorage = getProductReleaseDataFromLocalStorage();
  if (hasCompleteProductReleaseData(fromStorage)) {
    const url = buildUrlWithProductReleaseData(fromStorage);
    window.history.replaceState({}, "", url);
    return fromStorage;
  }

  return {
    releaseId: "",
    accessId: "",
    accessType: "",
  };
}

interface ReleaseWorkflowState {
  releaseData: ProductReleaseData;
  activeReleaseData: ProductReleaseData | null;
  loadRequestId: number;
  releaseFormError: string | null;
  setReleaseData: (next: ProductReleaseData) => void;
  setActiveReleaseData: (next: ProductReleaseData | null) => void;
  setReleaseFormError: (next: string | null) => void;
  incrementLoadRequestId: () => void;
  updateReleaseData: (field: keyof ProductReleaseData, value: string) => void;
  submitReleaseData: (onSuccess?: () => void) => void;
  submitSpecificReleaseData: (releaseData: ProductReleaseData, onSuccess?: () => void) => void;
  persistCurrentUrlStateBeforeLogin: () => void;
  applyUrlReleaseData: () => void;
  initializeReleaseData: () => void;
}

const initialWorkflowState = {
  releaseData: {
    releaseId: "",
    accessId: "",
    accessType: "",
  },
  activeReleaseData: null,
  loadRequestId: 0,
  releaseFormError: null,
};

const useReleaseWorkflowStore = create<ReleaseWorkflowState>((set, get) => ({
  ...initialWorkflowState,
  setReleaseData: (next) => set({ releaseData: next }),
  setActiveReleaseData: (next) => set({ activeReleaseData: next }),
  setReleaseFormError: (next) => set({ releaseFormError: next }),
  incrementLoadRequestId: () => set((state) => ({ loadRequestId: state.loadRequestId + 1 })),
  updateReleaseData: (field, value) => {
    set((state) => ({
      releaseData: {
        ...state.releaseData,
        [field]: value,
      },
    }));
  },
  submitReleaseData: (onSuccess) => {
    const { releaseData } = get();

    try {
      validateProductReleaseData(releaseData);
      saveProductReleaseDataToLocalStorage(releaseData);
      const url = buildUrlWithProductReleaseData(releaseData);
      window.history.replaceState({}, "", url);

      set((state) => ({
        activeReleaseData: { ...releaseData },
        loadRequestId: state.loadRequestId + 1,
        releaseFormError: null,
      }));

      onSuccess?.();
    } catch (validationError) {
      set({ releaseFormError: (validationError as Error).message });
    }
  },
  submitSpecificReleaseData: (releaseData, onSuccess) => {
    try {
      validateProductReleaseData(releaseData);
      saveProductReleaseDataToLocalStorage(releaseData);
      const url = buildUrlWithProductReleaseData(releaseData);
      window.history.replaceState({}, "", url);

      set((state) => ({
        releaseData: { ...releaseData },
        activeReleaseData: { ...releaseData },
        loadRequestId: state.loadRequestId + 1,
        releaseFormError: null,
      }));

      onSuccess?.();
    } catch (validationError) {
      set({ releaseFormError: (validationError as Error).message });
    }
  },
  persistCurrentUrlStateBeforeLogin: () => {
    const fromUrl = parseProductReleaseFromUrl(window.location);

    if (hasCompleteProductReleaseData(fromUrl)) {
      saveProductReleaseDataToLocalStorage(fromUrl);
    }
  },
  applyUrlReleaseData: () => {
    const productReleaseFromUrl = parseProductReleaseFromUrl(window.location);

    if (!hasCompleteProductReleaseData(productReleaseFromUrl)) {
      return;
    }

    try {
      validateProductReleaseData(productReleaseFromUrl);
      saveProductReleaseDataToLocalStorage(productReleaseFromUrl);
      set((state) => ({
        activeReleaseData: productReleaseFromUrl,
        loadRequestId: state.loadRequestId + 1,
        releaseFormError: null,
      }));
    } catch (validationError) {
      set({ releaseFormError: (validationError as Error).message });
    }
  },
  initializeReleaseData: () => {
    set({ releaseData: getInitialReleaseData() });
  },
}));

export function resetReleaseWorkflowState(): void {
  useReleaseWorkflowStore.setState(initialWorkflowState);
}

export function useReleaseWorkflow() {
  const releaseData = useReleaseWorkflowStore((state) => state.releaseData);
  const activeReleaseData = useReleaseWorkflowStore((state) => state.activeReleaseData);
  const loadRequestId = useReleaseWorkflowStore((state) => state.loadRequestId);
  const releaseFormError = useReleaseWorkflowStore((state) => state.releaseFormError);
  const updateReleaseData = useReleaseWorkflowStore((state) => state.updateReleaseData);
  const submitReleaseData = useReleaseWorkflowStore((state) => state.submitReleaseData);
  const submitSpecificReleaseData = useReleaseWorkflowStore((state) => state.submitSpecificReleaseData);
  const persistCurrentUrlStateBeforeLogin = useReleaseWorkflowStore(
    (state) => state.persistCurrentUrlStateBeforeLogin,
  );
  const applyUrlReleaseData = useReleaseWorkflowStore((state) => state.applyUrlReleaseData);
  const initializeReleaseData = useReleaseWorkflowStore((state) => state.initializeReleaseData);

  const isComplete = useMemo(
    () => hasCompleteProductReleaseData(activeReleaseData),
    [activeReleaseData],
  );

  useEffect(() => {
    initializeReleaseData();
    applyUrlReleaseData();
  }, [initializeReleaseData, applyUrlReleaseData]);

  return {
    releaseData,
    activeReleaseData,
    loadRequestId,
    releaseFormError,
    isComplete,
    persistCurrentUrlStateBeforeLogin,
    submitReleaseData,
    submitSpecificReleaseData,
    updateReleaseData,
  };
}
