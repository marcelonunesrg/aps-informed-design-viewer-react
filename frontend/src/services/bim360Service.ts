import { getViewerAccessToken } from "./authService";

const BIM360_CLIENTS_URL = "https://developer.api.autodesk.com/bim360/admin/ui/v1/clients";


interface Bim360RawClient {
  id?: string;
  accountId?: string;
  projectId?: string;
  name?: string;
  accountName?: string;
  platform?: string;
  region?: string;
  imageUrl?: string;
  defaultUrl?: string;
}

export interface Bim360ClientItem {
  id: string;
  projectId?: string;
  name: string;
  accountName: string;
  imageUrl?: string;
  platform?: string;
  region?: string;
  accountId?: string;
}

type OnClientsPage = (pageItems: Bim360ClientItem[], accumulatedItems: Bim360ClientItem[]) => void;

function extractProjectId(defaultUrl?: string): string | undefined {
  if (!defaultUrl) {
    return undefined;
  }

  const match = defaultUrl.match(/\/projects\/([^/?#]+)/i);
  return match?.[1];
}

function normalizeProjectId(value?: string): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return undefined;
  }

  if (trimmed.startsWith("urn:")) {
    return undefined;
  }

  return trimmed;
}

function toClientItem(client: Bim360RawClient): Bim360ClientItem | null {
  const accountId = client.accountId?.trim();
  if (!accountId) {
    return null;
  }

  const projectId =
    normalizeProjectId(client.projectId) ||
    normalizeProjectId(client.id) ||
    normalizeProjectId(extractProjectId(client.defaultUrl));
  const id = projectId || accountId;

  const name = (client.name || id).trim();
  const accountName = (client.accountName || "-").trim();
  const imageUrl = client.imageUrl?.trim();
  const platform = client.platform?.trim();
  const region = client.region?.trim();

  return {
    id,
    projectId,
    name,
    accountName,
    imageUrl,
    platform,
    region,
    accountId,
  };
}

export async function getBim360Clients(limit = 50, onPage?: OnClientsPage): Promise<Bim360ClientItem[]> {
  const token = await getViewerAccessToken();

  const accumulated: Bim360ClientItem[] = [];
  let offset = 0;
  const maxPages = 200; // safety cap to avoid infinite loops

  for (let page = 0; page < maxPages; page++) {
    const search = new URLSearchParams({
      fields:
        "accountId,name,accountName,accountImageUrl,defaultUrl,classification,imageUrl,region,products,platform,mfaBlocked,jobNumber",
      "filter[classification]": "production,sample",
      limit: String(limit),
      offset: String(offset),
    });

    const response = await fetch(`${BIM360_CLIENTS_URL}?${search.toString()}`, {
      headers: {
        Authorization: `Bearer ${token.access_token}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Could not fetch clients: ${response.status} ${response.statusText}`);
    }

    const payload = (await response.json()) as
      | Bim360RawClient[]
      | { data?: Bim360RawClient[]; items?: Bim360RawClient[]; results?: Bim360RawClient[] };

    const clients = Array.isArray(payload)
      ? payload
      : payload.data || payload.items || payload.results || [];

    const items = clients.map(toClientItem).filter((i): i is Bim360ClientItem => Boolean(i));
    accumulated.push(...items);

    if (items.length > 0) {
      onPage?.(items, accumulated.slice());
    }

    if (items.length < limit) {
      // last page reached
      break;
    }

    offset += limit;
  }

  return accumulated;
}
