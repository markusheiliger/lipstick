import { Resource, ResourceIdentifier } from "./Resource";
import { fetchJson, deleteJson } from "../Azure";
import { authScopeAzure } from "../Auth";

export interface Environment extends Resource<EnvironmentProperties>{
}

export interface EnvironmentProperties {
    armTemplateDisplayName: string;
    resourceGroupId: string;
    createdByUser: string;
    provisioningState: string
}

export function isEnvironmentResource (resource: ResourceIdentifier): resource is Environment {
    return resource.type.toLowerCase().endsWith("/environments");
}

export const fetchEnvironment = async (environmentId: string): Promise<Environment> => {

    return (await fetchJson(authScopeAzure, 'https://management.azure.com' + environmentId + '?api-version=2018-10-15-preview')) as Environment;
}

export const fetchEnvironments = async (labId: string): Promise<Environment[]> => {

    // return (await fetchJson(authScopeAzure, 'https://management.azure.com' + labId + '/users/@all/Environments?$filter=properties/provisioningState ne \'Failed\'&api-version=2018-10-15-preview', 'value[*]')) as Environment[];
    return (await fetchJson(authScopeAzure, 'https://management.azure.com' + labId + '/users/@all/Environments?&api-version=2018-10-15-preview', 'value[*]')) as Environment[];
}

export const getEnvironmentOwnerId = (environment:Environment): string => {

    var environmentOwnerRegex = /(?:\/users\/)((\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1})/gi;
    var environmentOwnerMatch = environmentOwnerRegex.exec(environment.id);

    return environmentOwnerMatch ? environmentOwnerMatch[1] : '00000000-0000-0000-0000-000000000000';
}

export const deleteEnvironment = async (environment:Environment): Promise<void> => {

    await deleteJson(authScopeAzure, 'https://management.azure.com' + environment.id + '?api-version=2018-09-15');
}