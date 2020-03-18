import { fetchJson } from "../Azure"
import { authScopeAzure } from "../Auth"

export interface Tenant {
    id: string;
    tenantId: string;
    countryCode: string;
    displayName: string;
    domains: string[];
    tenantCategory: string;
}

export const fetchTenant = async (tenantId:string): Promise<Tenant> => {
    var tenants = await fetchTenants();
    return tenants.find((tenant) => tenant.tenantId === tenantId) || {} as Tenant;
}

export const fetchTenants = async (): Promise<Tenant[]> => {
    try {
        return (await fetchJson(authScopeAzure, "https://management.azure.com/tenants?api-version=2019-06-01", 'value[*]')) as Tenant[];
    } catch {
        return new Array<Tenant>();
    }
}