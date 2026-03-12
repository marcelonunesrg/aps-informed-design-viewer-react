import { getViewerAccessToken } from "./authService";

const PROJECT_API = "https://developer.api.autodesk.com/project/v1";
const DATA_API = "https://developer.api.autodesk.com/data/v1";

export interface AccFolderItem {
  id: string;
  name: string;
  type?: string;
  hasChildren?: boolean;
}

async function parseJson(response: Response) {
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `${response.status} ${response.statusText}`);
  }

  return response.json();
}

export async function getTopFolders(hubId: string, projectId: string): Promise<AccFolderItem[]> {
  const token = await getViewerAccessToken();

  const url = `${PROJECT_API}/hubs/${encodeURIComponent(hubId)}/projects/${encodeURIComponent(
    projectId,
  )}/topFolders`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json, text/plain, */*",
    },
  });

  const payload = await parseJson(res);

  const items: any[] = Array.isArray(payload) ? payload : payload.data || payload.items || payload.results || [];

  return items.map((it) => {
    const id = it.id || (it.attributes && it.attributes.id) || "";
    const name = (it.attributes && (it.attributes.displayName || it.attributes.name)) || it.name || id;
    const type = it.type || (it.attributes && it.attributes.type) || undefined;
    const hasChildren = Boolean(it.relationships && it.relationships.items) || undefined;

    return { id, name, type, hasChildren } as AccFolderItem;
  });
}

export async function getFolderContents(projectId: string, folderId: string): Promise<AccFolderItem[]> {
  const token = await getViewerAccessToken();

  const encoded = encodeURIComponent(folderId);
  const url = `${DATA_API}/projects/${encodeURIComponent(projectId)}/folders/${encoded}/contents`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token.access_token}`,
      Accept: "application/json, text/plain, */*",
    },
  });

  const payload = await parseJson(res);

  const items: any[] = Array.isArray(payload) ? payload : payload.data || payload.items || payload.results || [];

  return items
    .map((it) => {
      const id = it.id || (it.attributes && it.attributes.id) || it.relationships?.target?.data?.id || "";
      const name = (it.attributes && (it.attributes.displayName || it.attributes.name)) || it.name || id;
      const type = it.type || (it.attributes && it.attributes.type) || undefined;
      const hasChildren = Boolean(it.attributes && it.attributes.childCount) || undefined;

      return { id, name, type, hasChildren } as AccFolderItem;
    })
    .filter(Boolean);
}
