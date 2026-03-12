import {
  accessIdQueryParam,
  accessTypeQueryParam,
  PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY,
  releaseIdQueryParam,
} from "../constants";
import type { ProductReleaseData } from "../types";
import {
  ensureStringQueryParam,
  ensureValidUuidQueryParam,
} from "./validation";

export function parseProductReleaseFromUrl(location: Location): ProductReleaseData {
  const params = new URLSearchParams(location.search || "");

  return {
    releaseId: params.get(releaseIdQueryParam),
    accessId: params.get(accessIdQueryParam),
    accessType: params.get(accessTypeQueryParam),
  };
}

export function buildUrlWithProductReleaseData(data: ProductReleaseData): string {
  const url = new URL(window.location.href);
  url.searchParams.set(releaseIdQueryParam, data.releaseId);
  url.searchParams.set(accessIdQueryParam, data.accessId);
  url.searchParams.set(accessTypeQueryParam, data.accessType);
  return url.toString();
}

export function validateProductReleaseData(data: ProductReleaseData): void {
  ensureValidUuidQueryParam(releaseIdQueryParam, data.releaseId);
  ensureStringQueryParam(accessIdQueryParam, data.accessId);
  ensureStringQueryParam(accessTypeQueryParam, data.accessType);
}

export function hasCompleteProductReleaseData(
  data: ProductReleaseData | null | undefined,
): data is ProductReleaseData {
  return Boolean(data?.releaseId && data?.accessId && data?.accessType);
}

export function saveProductReleaseDataToLocalStorage(data: ProductReleaseData): void {
  localStorage.setItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY, JSON.stringify(data));
}

export function getProductReleaseDataFromLocalStorage(): ProductReleaseData | null {
  const raw = localStorage.getItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as ProductReleaseData;
  } catch {
    localStorage.removeItem(PRODUCT_RELEASE_DATA_LOCAL_STORAGE_KEY);
    return null;
  }
}
