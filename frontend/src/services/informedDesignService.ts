const informedDesignApiUrl =
  "https://developer.api.autodesk.com/industrialized-construction/informed-design/v1";

interface GetReleaseByIdParams {
  releaseId: string;
  accessId: string;
  accessType: string;
  accessToken: string;
}

export interface InformedDesignRelease {
  id: string;
  accessId: string;
  accessType: string;
  productId: string;
}

export interface InformedDesignPublisher {
  id: string;
  name: string;
}

export interface InformedDesignProduct {
  id: string;
  name: string;
  classification?: string;
  authoringApp?: string;
  defaultRelease?: string;
  thumbnailUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InformedDesignReleaseItem {
  id: string;
  name: string;
  releaseNumber?: string;
  state?: string;
  thumbnailUrl?: string;
  thumbnailObjectKey?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface GetProductDownloadUrlParams {
  productId: string;
  accessType: string;
  accessId: string;
  objectKey: string;
  accessToken: string;
}

function decodeRepeatedly(value: string): string {
  let currentValue = value;

  for (let index = 0; index < 4; index += 1) {
    try {
      const decodedValue = decodeURIComponent(currentValue);
      if (decodedValue === currentValue) {
        break;
      }
      currentValue = decodedValue;
    } catch {
      break;
    }
  }

  return currentValue;
}

function isHttpUrl(value?: string): boolean {
  if (!value) {
    return false;
  }

  return /^https?:\/\//i.test(value.trim());
}

function toThumbnailCandidate(value: unknown): string | undefined {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed || undefined;
  }

  if (value && typeof value === "object") {
    const objectValue = value as {
      url?: unknown;
      downloadUrl?: unknown;
      objectKey?: unknown;
      key?: unknown;
      path?: unknown;
    };

    const candidate =
      objectValue.url ||
      objectValue.downloadUrl ||
      objectValue.objectKey ||
      objectValue.key ||
      objectValue.path;

    if (typeof candidate === "string") {
      const trimmed = candidate.trim();
      return trimmed || undefined;
    }
  }

  return undefined;
}

export async function getReleaseById({
  releaseId,
  accessId,
  accessType,
  accessToken,
}: GetReleaseByIdParams): Promise<InformedDesignRelease> {
  const normalizedAccessId = decodeRepeatedly(accessId);

  const url = new URL(`${informedDesignApiUrl}/releases/${releaseId}`);
  url.search = new URLSearchParams({
    accessType,
    accessId: normalizedAccessId,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch release: ${response.statusText}`);
  }

  return (await response.json()) as InformedDesignRelease;
}

interface ListProductsParams {
  accessType: string;
  accessId: string;
  accessToken: string;
}

function toPublishers(payload: unknown): InformedDesignPublisher[] {
  const items = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.data ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.items ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.results ||
      [];

  return items
    .map((item) => {
      const value = item as {
        id?: string;
        publisherId?: string;
        name?: string;
        displayName?: string;
        title?: string;
        attributes?: {
          id?: string;
          publisherId?: string;
          name?: string;
          displayName?: string;
          title?: string;
        };
      };

      const id = value.id || value.publisherId || value.attributes?.id || value.attributes?.publisherId || "";
      const name =
        value.name ||
        value.displayName ||
        value.title ||
        value.attributes?.name ||
        value.attributes?.displayName ||
        value.attributes?.title ||
        id;

      return {
        id: id.trim(),
        name: (name || "").trim(),
      };
    })
    .filter((publisher) => Boolean(publisher.id));
}

export async function listPublishers(accessToken: string): Promise<InformedDesignPublisher[]> {
  const response = await fetch(`${informedDesignApiUrl}/publishers`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json, text/plain, */*",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch publishers: ${response.statusText}`);
  }

  const payload = await response.json();
  return toPublishers(payload);
}

interface ListReleasesParams {
  accessType: string;
  accessId: string;
  productId: string;
  accessToken: string;
}

function toProducts(payload: unknown): InformedDesignProduct[] {
  const items = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.data ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.items ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.results ||
      [];

  return items
    .map((item) => {
      const value = item as {
        id?: string;
        name?: string;
        displayName?: string;
        title?: string;
        productName?: string;
        classification?: string;
        category?: string;
        type?: string;
        authoringApp?: string;
        authoringApplication?: string;
        defaultRelease?: unknown;
        defaultReleaseId?: unknown;
        thumbnailUrl?: string;
        thumbnail?: string;
        imageUrl?: string;
        createdAt?: string;
        createdDate?: string;
        createTime?: string;
        updatedAt?: string;
        modifiedAt?: string;
        lastModifiedTime?: string;
        thumbnails?: Array<{
          thumbnail?: unknown;
          url?: unknown;
          objectKey?: unknown;
          key?: unknown;
          path?: unknown;
        }>;
        attributes?: {
          id?: string;
          name?: string;
          displayName?: string;
          title?: string;
          productName?: string;
          classification?: string;
          category?: string;
          type?: string;
          authoringApp?: string;
          authoringApplication?: string;
          defaultRelease?: unknown;
          defaultReleaseId?: unknown;
          thumbnailUrl?: string;
          thumbnail?: string;
          imageUrl?: string;
          createdAt?: string;
          createdDate?: string;
          createTime?: string;
          updatedAt?: string;
          modifiedAt?: string;
          lastModifiedTime?: string;
          thumbnails?: Array<{
            thumbnail?: unknown;
            url?: unknown;
            objectKey?: unknown;
            key?: unknown;
            path?: unknown;
          }>;
        };
      };

      const id = value.id || value.attributes?.id || "";
      const name =
        value.name ||
        value.displayName ||
        value.title ||
        value.productName ||
        value.attributes?.name ||
        value.attributes?.displayName ||
        value.attributes?.title ||
        value.attributes?.productName ||
        id;

      const authoringApp =
        value.authoringApp ||
        value.authoringApplication ||
        value.attributes?.authoringApp ||
        value.attributes?.authoringApplication ||
        undefined;

      const classification =
        value.classification ||
        value.category ||
        value.type ||
        value.attributes?.classification ||
        value.attributes?.category ||
        value.attributes?.type ||
        undefined;

      const thumbnailCandidate =
        toThumbnailCandidate(value.thumbnailUrl) ||
        toThumbnailCandidate(value.thumbnail) ||
        toThumbnailCandidate(value.imageUrl) ||
        toThumbnailCandidate(value.attributes?.thumbnailUrl) ||
        toThumbnailCandidate(value.attributes?.thumbnail) ||
        toThumbnailCandidate(value.attributes?.imageUrl);

      const thumbnailUrl = isHttpUrl(thumbnailCandidate) ? thumbnailCandidate : undefined;

      const createdAt =
        value.createdAt ||
        value.createdDate ||
        value.createTime ||
        value.attributes?.createdAt ||
        value.attributes?.createdDate ||
        value.attributes?.createTime ||
        undefined;

      const updatedAt =
        value.updatedAt ||
        value.modifiedAt ||
        value.lastModifiedTime ||
        value.attributes?.updatedAt ||
        value.attributes?.modifiedAt ||
        value.attributes?.lastModifiedTime ||
        undefined;

      const defaultReleaseRaw =
        value.defaultReleaseId ||
        value.defaultRelease ||
        value.attributes?.defaultReleaseId ||
        value.attributes?.defaultRelease ||
        undefined;

      let defaultRelease: string | undefined;
      if (typeof defaultReleaseRaw === "string" || typeof defaultReleaseRaw === "number") {
        defaultRelease = String(defaultReleaseRaw).trim();
      } else if (defaultReleaseRaw && typeof defaultReleaseRaw === "object") {
        const defaultReleaseObject = defaultReleaseRaw as {
          id?: unknown;
          releaseId?: unknown;
          number?: unknown;
          releaseNumber?: unknown;
          name?: unknown;
        };

        const candidate =
          defaultReleaseObject.id ||
          defaultReleaseObject.releaseId ||
          defaultReleaseObject.releaseNumber ||
          defaultReleaseObject.number ||
          defaultReleaseObject.name;

        if (typeof candidate === "string" || typeof candidate === "number") {
          defaultRelease = String(candidate).trim();
        }
      }

      return {
        id,
        name: (name || "").trim(),
        classification: classification?.trim(),
        authoringApp: authoringApp?.trim(),
        defaultRelease,
        thumbnailUrl,
        createdAt: createdAt?.trim(),
        updatedAt: updatedAt?.trim(),
      };
    })
    .filter((product) => Boolean(product.id));
}

export async function listProducts({ accessType, accessId, accessToken }: ListProductsParams): Promise<InformedDesignProduct[]> {
  const normalizedAccessId = decodeRepeatedly(accessId);

  const url = new URL(`${informedDesignApiUrl}/products`);
  url.search = new URLSearchParams({
    accessType,
    accessId: normalizedAccessId,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.statusText}`);
  }

  const payload = await response.json();
  return toProducts(payload);
}

function toReleases(payload: unknown): InformedDesignReleaseItem[] {
  const items = Array.isArray(payload)
    ? payload
    : (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.data ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.items ||
      (payload as { data?: unknown[]; items?: unknown[]; results?: unknown[] })?.results ||
      [];

  return items
    .map((item) => {
      const value = item as {
        id?: string;
        name?: string;
        displayName?: string;
        title?: string;
        releaseName?: string;
        releaseNumber?: string | number;
        number?: string | number;
        state?: string;
        status?: string;
        lifecycleState?: string;
        thumbnailUrl?: string;
        thumbnail?: string;
        imageUrl?: string;
        createdAt?: string;
        createdDate?: string;
        createTime?: string;
        updatedAt?: string;
        modifiedAt?: string;
        lastModifiedTime?: string;
        thumbnails?: Array<{
          thumbnail?: unknown;
          url?: unknown;
          objectKey?: unknown;
          key?: unknown;
          path?: unknown;
        }>;
        attributes?: {
          id?: string;
          name?: string;
          displayName?: string;
          title?: string;
          releaseName?: string;
          releaseNumber?: string | number;
          number?: string | number;
          state?: string;
          status?: string;
          lifecycleState?: string;
          thumbnailUrl?: string;
          thumbnail?: string;
          imageUrl?: string;
          createdAt?: string;
          createdDate?: string;
          createTime?: string;
          updatedAt?: string;
          modifiedAt?: string;
          lastModifiedTime?: string;
          thumbnails?: Array<{
            thumbnail?: unknown;
            url?: unknown;
            objectKey?: unknown;
            key?: unknown;
            path?: unknown;
          }>;
        };
      };

      const id = value.id || value.attributes?.id || "";
      const name =
        value.name ||
        value.displayName ||
        value.title ||
        value.releaseName ||
        value.attributes?.name ||
        value.attributes?.displayName ||
        value.attributes?.title ||
        value.attributes?.releaseName ||
        id;

      const releaseNumberRaw =
        value.releaseNumber ||
        value.number ||
        value.attributes?.releaseNumber ||
        value.attributes?.number;

      const stateRaw =
        value.state ||
        value.status ||
        value.lifecycleState ||
        value.attributes?.state ||
        value.attributes?.status ||
        value.attributes?.lifecycleState;

      const thumbnailValue =
        toThumbnailCandidate(value.thumbnailUrl) ||
        toThumbnailCandidate(value.thumbnail) ||
        toThumbnailCandidate(value.imageUrl) ||
        toThumbnailCandidate(value.thumbnails?.[0]?.thumbnail) ||
        toThumbnailCandidate(value.thumbnails?.[0]?.url) ||
        toThumbnailCandidate(value.thumbnails?.[0]?.objectKey) ||
        toThumbnailCandidate(value.thumbnails?.[0]?.key) ||
        toThumbnailCandidate(value.thumbnails?.[0]?.path) ||
        toThumbnailCandidate(value.attributes?.thumbnailUrl) ||
        toThumbnailCandidate(value.attributes?.thumbnail) ||
        toThumbnailCandidate(value.attributes?.imageUrl) ||
        toThumbnailCandidate(value.attributes?.thumbnails?.[0]?.thumbnail) ||
        toThumbnailCandidate(value.attributes?.thumbnails?.[0]?.url) ||
        toThumbnailCandidate(value.attributes?.thumbnails?.[0]?.objectKey) ||
        toThumbnailCandidate(value.attributes?.thumbnails?.[0]?.key) ||
        toThumbnailCandidate(value.attributes?.thumbnails?.[0]?.path);

      const normalizedThumbnailUrl = isHttpUrl(thumbnailValue) ? thumbnailValue : undefined;
      const thumbnailObjectKey = thumbnailValue && !isHttpUrl(thumbnailValue) ? thumbnailValue : undefined;

      const createdAt =
        value.createdAt ||
        value.createdDate ||
        value.createTime ||
        value.attributes?.createdAt ||
        value.attributes?.createdDate ||
        value.attributes?.createTime ||
        undefined;

      const updatedAt =
        value.updatedAt ||
        value.modifiedAt ||
        value.lastModifiedTime ||
        value.attributes?.updatedAt ||
        value.attributes?.modifiedAt ||
        value.attributes?.lastModifiedTime ||
        undefined;

      return {
        id,
        name: (name || "").trim(),
        releaseNumber: releaseNumberRaw != null ? String(releaseNumberRaw).trim() : undefined,
        state: stateRaw?.trim().toUpperCase(),
        thumbnailUrl: normalizedThumbnailUrl,
        thumbnailObjectKey,
        createdAt: createdAt?.trim(),
        updatedAt: updatedAt?.trim(),
      };
    })
    .filter((release) => Boolean(release.id));
}

export async function listProductReleases({
  accessType,
  accessId,
  productId,
  accessToken,
}: ListReleasesParams): Promise<InformedDesignReleaseItem[]> {
  const normalizedAccessId = decodeRepeatedly(accessId);

  const url = new URL(`${informedDesignApiUrl}/releases`);
  url.search = new URLSearchParams({
    accessType,
    accessId: normalizedAccessId,
    productId,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch releases: ${response.statusText}`);
  }

  const payload = await response.json();
  return toReleases(payload);
}

export async function getProductDownloadUrl({
  productId,
  accessType,
  accessId,
  objectKey,
  accessToken,
}: GetProductDownloadUrlParams): Promise<string> {
  const normalizedAccessId = decodeRepeatedly(accessId);

  const url = new URL(`${informedDesignApiUrl}/products/${encodeURIComponent(productId)}/download-url`);
  url.search = new URLSearchParams({
    accessType,
    accessId: normalizedAccessId,
    objectKey,
  }).toString();

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch thumbnail download URL: ${response.statusText}`);
  }

  const payload = (await response.json()) as { url?: string; downloadUrl?: string; signedUrl?: string };
  const resolvedUrl = payload.url || payload.downloadUrl || payload.signedUrl;

  if (!resolvedUrl) {
    throw new Error("Thumbnail download URL was not returned by API.");
  }

  return resolvedUrl;
}
