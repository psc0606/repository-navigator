import * as vscode from 'vscode';
import axios from 'axios';
import { YunxiaoConfig } from './configuration';


export interface Namespace {
    avatarUrl: string;
    fullPath: string;
    id: number;
    kind: string;
    name: string;
    nameWithNamespace: string;
    parentId: number;
    path: string;
    pathWithNamespace: string;
    visibility: boolean
    webUrl: string;
}

export interface PageCursor {
    x_total: number;
    x_page: number;
    x_total_pages: number;
}

export interface Repository {
    accessLevel: string;
    archived: boolean;
    avatarUrl: string;
    createdAt: string;
    creatorId: number;
    demoProject: boolean;
    description: string;
    encrypted: boolean;
    id: number;
    lastActivityAt: string;
    name: string;
    nameWithNamespace: string;
    namespaceId: number;
    path: string;
    pathWithNamespace: string;
    repositorySize: string;
    starCount: number;
    starred: boolean;
    updatedAt: string;
    visibility: string;
    webUrl: string;
}

export async function listNamespaces(
    parentId: string,
    page: number,
    perPage: number,
    search: string,
    orderBy: string,
    sort: string
): Promise<{ namespaces: Namespace[], pageCursor: PageCursor }> {
    const domain = YunxiaoConfig.domain;
    const organizationId = YunxiaoConfig.organizationId;
    const token = YunxiaoConfig.token;
    const url = `https://${domain}/oapi/v1/codeup/organizations/${organizationId}/namespaces`;
    const params = {
        parentId,
        page,
        perPage,
        search,
        orderBy,
        sort,
    };

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-yunxiao-token': token,
            },
            params,
        });
        const namespaces: Namespace[] = response.data.map((item: any) => ({
            ...item, // Include additional fields if necessary
        }));
        // total number
        const x_total = parseInt(response.headers['x-total'], 10) || 0;
        // current page
        const x_page = parseInt(response.headers['x-page'], 10) || 1;
        // total page number
        const x_total_pages = parseInt(response.headers['x-total-pages'], 10) || 0;
        const pageCursor: PageCursor = {
            x_total,
            x_page,
            x_total_pages
        };
        return { namespaces, pageCursor };
    } catch (error) {
        console.error('Error fetching namespaces:', error);
        throw error;
    }
}

export async function listNamespacesAll(
    parentId: string,
    search: string,
    orderBy: string,
    sort: string,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
): Promise<Namespace[]> {
    let page = 1;
    let namespaces: Namespace[] = [];
    let pageCursor: PageCursor = { x_total: 0, x_page: 0, x_total_pages: 1 };
    do {
        const increment = Math.floor((1 / pageCursor?.x_total_pages) * 100) || 1;
        if (progress) {
            progress.report({ message: `page ${page}...`, increment: increment });
        }
        const data = await listNamespaces(parentId, page, 20, search, orderBy, sort);
        namespaces.push(...data.namespaces);
        pageCursor = data.pageCursor;
        page += 1;
    } while (pageCursor && page <= pageCursor.x_total_pages);
    return namespaces;
}

// Ynxiao new api for list repositories, but it cannot list repositories by group.
// So we need to use the old api to list repositories by group.
export async function listRepositories(
    page: number,
    perPage: number,
    orderBy: string,
    sort: string,
    search: string,
    archived: boolean
): Promise<{ repositories: Repository[], pageCursor: PageCursor }> {
    const domain = YunxiaoConfig.domain;
    const organizationId = YunxiaoConfig.organizationId;
    const token = YunxiaoConfig.token;
    const url = `https://${domain}/oapi/v1/codeup/organizations/${organizationId}/repositories`;
    const params = {
        page,
        perPage,
        orderBy,
        sort,
        search,
        archived,
    };

    try {
        const response = await axios.get(url, {
            headers: {
                'Content-Type': 'application/json',
                'x-yunxiao-token': token,
            },
            params,
        });
        const repositories: Repository[] = response.data.map((item: any) => ({
            ...item, // Include additional fields if necessary
        }));
        // total number
        const x_total = parseInt(response.headers['x-total'], 10) || 0;
        // current page
        const x_page = parseInt(response.headers['x-page'], 10) || 1;
        // total page number
        const x_total_pages = parseInt(response.headers['x-total-pages'], 10) || 0;
        const pageCursor: PageCursor = {
            x_total,
            x_page,
            x_total_pages
        };
        return { repositories, pageCursor };
    } catch (error) {
        console.error('Error fetching repositories:', error);
        throw error;
    }
}

export async function listRepositoriesAll(
    orderBy: string,
    sort: string,
    search: string,
    archived: boolean,
    progress?: vscode.Progress<{ message?: string; increment?: number }>,
): Promise<Repository[]> {
    let page = 1;
    let pageCursor: PageCursor = { x_total: 0, x_page: 0, x_total_pages: 1 };
    let repositories: Repository[] = [];
    do {
        const increment = Math.floor((1 / pageCursor?.x_total_pages) * 100) || 1;
        if (progress) {
            progress.report({ message: `page ${page}...`, increment: increment });
        }
        const data = await listRepositories(page, 20, orderBy, sort, search, archived);
        repositories.push(...data.repositories);
        pageCursor = data.pageCursor;
        page += 1;
    } while (pageCursor && page <= pageCursor.x_total_pages);
    return repositories;
}

// Example usage
// (async () => {
//     try {
//         const data = await listNamespaces(
//             'your-parent-id',
//             1,
//             10,
//             'search-term',
//             'orderBy-field',
//             'asc'
//         );
//         console.log(data);
//     } catch (error) {
//         console.error('Failed to fetch namespaces:', error);
//     }
// })();