import { VirtualMachine } from "./models/VirtualMachine";
import VirtualMachineDefault from './images/VirtualMachineDefault.svg';
import VirtualMachineWindows from './images/VirtualMachineWindows.svg';
import VirtualMachineLinux from './images/VirtualMachineLinux.svg';
import VirtualMachineRunning from './images/VirtualMachineRunning.svg';

export type operationCallback = (operationTitle: string, operationState:Promise<any>) => void;

export function formatDate(date:Date) : string {

    try {

        date.toISOString();
    }
    catch {

        var dateString = date.toString();
        var dateParsed = new Date(Date.parse(dateString));

        return formatDate(dateParsed);
    }
    
    return date.toLocaleString();
}

export function getVirtualMachineTypeImage(virtualMachine:VirtualMachine) : string {

    var image = VirtualMachineDefault;

    switch (virtualMachine.properties.osType) {
        case 'Windows':
                image = VirtualMachineWindows;
            break;
        case 'Linux':
                image = VirtualMachineLinux;
            break;
    }

    return image;
}

export function getVirtualMachineStateImage(virtualMachine:VirtualMachine) : string {

    var image = VirtualMachineRunning;

    return image;
}

export function getEnumName(e:any, v:any): string | undefined {
    for (var k in e) if (e[k] === v) return k;
    return undefined;
}

export function createGuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0, v = c === 'x' ? r : ((r & 0x3) | 0x8);
        return v.toString(16);
    });
}

declare global {

    export interface Array<T> {
        filterAsync(callbackfn: (value: T, index: number) => Promise<boolean>): Promise<T[]>;
    }
}

// eslint-disable-next-line no-extend-native
Array.prototype.filterAsync = async function<T>(this: T[], callbackfn: (value: T, index: number) => Promise<boolean>) : Promise<T[]> {        
    var result = await Promise.all(this.map((element, index) => callbackfn(element, index)))
    return this.filter((_, index) => result[index]);
}