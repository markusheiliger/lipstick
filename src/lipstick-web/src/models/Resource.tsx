import { fetchJson } from "../Azure";
import { authScopeAzure } from "../Auth";
import { memoizeFunction } from "../Memoize";

export enum ResourceTypeFilter {
    machine,
    environment
}

export enum ResourceOwnerFilter {
    my,
    all,
    pool
}

export interface ResourcePermissions {
    id: string;
    actions: string[];
}

export interface ResourceIdentifier {
    id: string;
    type: string;
}

export interface Resource<P> extends ResourceIdentifier {
    name: string;
    properties:P;
}

const fetchPermissionsFunc = memoizeFunction((scope: string, url: string, jmespath?: string) => fetchJson(scope, url, jmespath));

export const fetchPermissions = async (resource: ResourceIdentifier) => {
    var permissions = (await fetchPermissionsFunc(authScopeAzure, 'https://management.azure.com' + resource.id + '/providers/microsoft.authorization/permissions?api-version=2018-01-01-preview', 'value[*].actions[] | {actions: @}')) as ResourcePermissions;
    permissions.id = resource.id;
    return permissions;
}

export const isActionAllowed = async (resource: ResourceIdentifier, action?:string) => {
    var permissions = await fetchPermissions(resource);
    return permissions.actions.includes(action || '*') || permissions.actions.includes("*");
}

export const getFavorites = () : string[] =>  {
    let favoritesJson = localStorage.getItem("VirtualMachineFavorites") || '[]';
    return JSON.parse(favoritesJson) as string[];
}

export const isFavorite = (resource: ResourceIdentifier) => {
    return getFavorites().indexOf(resource.id) >= 0;
}

export const hasFavorites = (resources: ResourceIdentifier[]) => {
    if (resources.length === 0) return false;
    let favoriteIds = getFavorites();
    let favoriteResources = resources.filter(resource => favoriteIds.indexOf(resource.id) >= 0);    
    return favoriteResources.length > 0
}

export const setFavorite = (resource: ResourceIdentifier, isFavorite:boolean) => {
    let favorites = getFavorites().filter((resourceId) => resourceId !== resource.id);
    if (isFavorite) favorites.push(resource.id); 
    localStorage.setItem("VirtualMachineFavorites", JSON.stringify(favorites));    
}
