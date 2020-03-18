import { fetchJson } from "../Azure";
import { authScopeAzure } from "../Auth";
import { memoizeFunction } from "../Memoize";

export interface Lab {

    id:string;
    name:string;
    created:Date;
    subscriptionId:string;
    subscriptionName:string;
    properties: LabProperties;
}

export interface LabProperties {
    announcement: LabAnnouncement;
}

export interface LabAnnouncement {
    title: string;
    markdown: string;
    enabled: string;
    expired: boolean;
}

const fetchSubscriptionNameFunc = memoizeFunction((scope: string, url: string, jmespath?: string) => fetchJson(scope, url, jmespath));

export const fetchSubscriptionName = async (subscriptionId: string): Promise<string> => {
    return await fetchSubscriptionNameFunc(authScopeAzure, 'https://management.azure.com/subscriptions/' + subscriptionId + '?api-version=2019-06-01', 'displayName')
}

export const fetchLab = async (labId: string): Promise<Lab> => {
    var lab = (await fetchJson(authScopeAzure, 'https://management.azure.com' + labId + '?api-version=2018-09-15')) as Lab;
    console.log(lab);
    return lab;
}

export const fetchLabs = async (subscriptionId?:string): Promise<Lab[]> => {

    var labs:Lab[] = new Array<Lab>();

    if (subscriptionId) {

        var subscriptionLabs = (await fetchJson(authScopeAzure, 'https://management.azure.com/subscriptions/' + subscriptionId + '/resources?api-version=2019-08-01&$filter=resourceType eq \'Microsoft.DevTestLab/labs\'', 'value[*]')) as Lab[];
        
        var subscriptionLabsEnhanced = await Promise.all(subscriptionLabs.map(async (subscriptionLab) => {

            subscriptionLab.subscriptionId = subscriptionId;
            subscriptionLab.subscriptionName = await fetchSubscriptionName(subscriptionId);

            return subscriptionLab;
        }))

        labs.push.apply(labs, subscriptionLabsEnhanced);

    } else {

        var subscriptionIds = (await fetchJson(authScopeAzure, 'https://management.azure.com/subscriptions?api-version=2019-06-01', 'value[*].subscriptionId')) as string[];
        var subscriptionResults = await Promise.all(subscriptionIds.map(async (subscriptionId) => await fetchLabs(subscriptionId)));
        
        subscriptionResults.forEach(subscriptionResult => labs.push.apply(labs, subscriptionResult));
    }

    return labs;
}