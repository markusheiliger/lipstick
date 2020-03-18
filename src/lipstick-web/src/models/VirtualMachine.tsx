import { fetchJson, postJson, deleteJson } from "../Azure";
import { authScopeAzure } from "../Auth";
import { fetchRdpFile } from "./RdpFile";
// eslint-disable-next-line
import { operationCallback } from "../Utilities";
import { Resource, ResourceIdentifier } from "./Resource";

export interface VirtualMachine extends Resource<VirtualMachineProperties> {
}

export interface VirtualMachineProperties {
    notes: string;
    ownerObjectId: string;
    ownerUserPrincipalName: string;
    createdByUserId: string;
    createdByUser: string;
    createdDate: Date;
    osType:string;
    computeId: string;
    lastKnownPowerState: string;
    provisioningState: string;
    allowClaim: boolean;
    fqdn: string;
    userName: string;
}

export const isVirtualMachineInFlight = (virtualMachine: VirtualMachine): boolean => {
    var inFlight = (!["Succeeded", "Failed"].includes(virtualMachine.properties.provisioningState) || !["Running", "Stopped", undefined].includes(virtualMachine.properties.lastKnownPowerState));
    if (inFlight) console.log("VirtualMachine " + virtualMachine.name + " is in flight (ProvisioningState: " + virtualMachine.properties.provisioningState + " / LastKnownPowerState: " + virtualMachine.properties.lastKnownPowerState + ")");
    return inFlight;
}

export function isVirtualMachineResource (resource: ResourceIdentifier): resource is VirtualMachine {
    return resource.type.toLowerCase().endsWith("/virtualmachines");
}

export const fetchVirtualMachine = async (virtualMachineId: string): Promise<VirtualMachine> => {

    return (await fetchJson(authScopeAzure, 'https://management.azure.com' + virtualMachineId + '?api-version=2018-10-15-preview')) as VirtualMachine;
}

export const fetchVirtualMachines = async (labId: string): Promise<VirtualMachine[]> => {

    // return (await fetchJson(authScopeAzure, 'https://management.azure.com' + labId + '/virtualmachines?$filter=properties/provisioningState ne \'Failed\'&api-version=2018-10-15-preview', 'value[*]')) as VirtualMachine[];
    return (await fetchJson(authScopeAzure, 'https://management.azure.com' + labId + '/virtualmachines?api-version=2018-10-15-preview', 'value[*]')) as VirtualMachine[];
}

export const startVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback) => {

    let promise = postJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/start/?api-version=2018-10-15-preview');

    if (operationCallback) operationCallback("Starting " + virtualMachine.name + " ...", promise);

    await promise;
}

export const stopVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback) => {

    let promise = postJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/stop/?api-version=2018-10-15-preview');

    if (operationCallback) operationCallback("Stopping " + virtualMachine.name + " ...", promise);

    await promise;
}

export const deleteVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback): Promise<void> => {

    let promise = deleteJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/?api-version=2018-09-15');

    if (operationCallback) operationCallback("Deleting " + virtualMachine.name + " ...", promise);

    await promise;
}

export const connectVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback) => {

    if (virtualMachine.properties.osType === "Windows") {
        
        let promise = fetchRdpFile(virtualMachine);

        if (operationCallback) operationCallback("connecting " + virtualMachine.name + " ...", promise);

        var rdpFile = await promise;
        var rdpBlob = new Blob([rdpFile.contents], {type: 'application/rdp'});
        var rdpElement = document.body.appendChild(document.createElement("a"));

        rdpElement.href = URL.createObjectURL(rdpBlob);
        rdpElement.download = virtualMachine.name + ".rdp";
        rdpElement.click();

    } else {
        
        var sshElement = document.body.appendChild(document.createElement("a"));

        sshElement.href = "ssh://" + virtualMachine.properties.userName + '@' + virtualMachine.properties.fqdn;
        sshElement.click();
    }
}

export const claimVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback) => {

    let promise =  postJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/claim/?api-version=2018-10-15-preview');

    if (operationCallback) operationCallback("Claiming " + virtualMachine.name + " ...", promise);

    await promise;
}

export const unclaimVirtualMachine = async (virtualMachine: VirtualMachine, operationCallback?:operationCallback) => {

    let promise =  postJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/unclaim/?api-version=2018-10-15-preview');
    
    if (operationCallback) operationCallback("Unclaiming " + virtualMachine.name + " ...", promise);

    await promise;
}

