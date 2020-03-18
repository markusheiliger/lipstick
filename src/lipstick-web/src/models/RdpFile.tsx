import { VirtualMachine } from "./VirtualMachine";
import { postJson } from "../Azure";
import { authScopeAzure } from "../Auth";

export interface RdpFile {
    contents: string;
}

export const fetchRdpFile = async (virtualMachine: VirtualMachine) => {

    var rdpFile = (await postJson(authScopeAzure, 'https://management.azure.com' + virtualMachine.id + '/getRdpFileContents/?api-version=2018-10-15-preview')) as RdpFile;

    console.log(rdpFile);
    
    return rdpFile;
}
