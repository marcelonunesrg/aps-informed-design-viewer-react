import { create } from "zustand";
import type { ViewerMessageState } from "../types";

const initialState: ViewerMessageState = {
  status: "idle",
  error: null,
};

interface ViewerMessageStoreState extends ViewerMessageState {
  setViewerMessageState: (nextState: Partial<ViewerMessageState>) => void;
  resetViewerMessageState: () => void;
}

const useViewerMessageStore = create<ViewerMessageStoreState>((set) => ({
  ...initialState,
  setViewerMessageState: (nextState) => {
    set((state) => ({ ...state, ...nextState }));
  },
  resetViewerMessageState: () => {
    set(initialState);
  },
}));

export function setViewerMessageState(nextState: Partial<ViewerMessageState>): void {
  useViewerMessageStore.getState().setViewerMessageState(nextState);
}

export function resetViewerMessageState() {
  useViewerMessageStore.getState().resetViewerMessageState();
}

export function useViewerMessageState(): ViewerMessageState {
  const status = useViewerMessageStore((state) => state.status);
  const error = useViewerMessageStore((state) => state.error);

  return {
    status,
    error,
  };
}
