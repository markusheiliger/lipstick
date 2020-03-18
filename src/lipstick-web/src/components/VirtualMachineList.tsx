import React from "react";

import {
    DocumentCard,
    DocumentCardTitle,
    IDocumentCardStyles,
    DocumentCardImage,
    DocumentCardDetails,
    IDocumentCardTitleStyles,
    DocumentCardType,
    DocumentCardActivity,
    IDocumentCardActivityPerson,
    DocumentCardActions
  } from 'office-ui-fabric-react/lib/DocumentCard';

import { ImageFit } from "office-ui-fabric-react/lib/Image";
import { VirtualMachine, startVirtualMachine, stopVirtualMachine, connectVirtualMachine, claimVirtualMachine, unclaimVirtualMachine, deleteVirtualMachine } from "../models/VirtualMachine";
import { formatDate, getVirtualMachineTypeImage, operationCallback } from "../Utilities";
import VirtualMachineError from '../images/VirtualMachineError.svg';
import VirtualMachineStopped from '../images/VirtualMachineStopped.svg';
import VirtualMachineRunning from '../images/VirtualMachineRunning.svg';
import VirtualMachineProgress from '../images/VirtualMachineProgress.svg';
import { BaseButton, IButtonProps, PrimaryButton, DefaultButton } from "office-ui-fabric-react/lib/Button";
import { User } from "../models/User";
import { ResourceOwnerFilter, getFavorites, setFavorite, isFavorite } from "../models/Resource";
import { Tenant } from "../models/Tenant";
import { Dialog, DialogType, DialogFooter } from "office-ui-fabric-react";

export interface IVirtualMachineListProps {
    user: User,
    tenant: Tenant,
    virtualMachines:VirtualMachine[],
    onMachineStateChanged:(virtualMachine:VirtualMachine) => void,
    onFavoritesChanged?:() => void,
    onRenderSeperator?:(favorites:boolean) => JSX.Element,
    onLongRunningOperation?:operationCallback,
    resourceOwnerFilter: ResourceOwnerFilter,
    resourceNameFilter?: string
}

export interface IVirtualMachineListState {
    deleteVirtualMachine?: VirtualMachine;
}

export class VirtualMachineList extends React.Component<IVirtualMachineListProps, IVirtualMachineListState> {

    constructor(props:any) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _style:any;

    private _getDefaultState(): IVirtualMachineListState {      
      return { }
    }

    async componentDidMount() {
        this._style = document.head.appendChild(document.createElement("style"));
        this._style.innerHTML = `
            .ms-DocumentCard.vmStopped .ms-Image ~ i { background-image: url(` + VirtualMachineStopped + `); }
            .ms-DocumentCard.vmRunning .ms-Image ~ i { background-image: url(` + VirtualMachineRunning + `); }
            .ms-DocumentCard.vmStarting .ms-Image ~ i { background-image: url(` + VirtualMachineProgress + `); }
            .ms-DocumentCard.vmStopping .ms-Image ~ i { background-image: url(` + VirtualMachineProgress + `); }
            .ms-DocumentCard.vmDeleting .ms-Image ~ i { background-image: url(` + VirtualMachineProgress + `); }
            .ms-DocumentCard.vmCorrupted .ms-Image ~ i { background-image: url(` + VirtualMachineError + `); }
            .ms-DocumentCard.vmFailed .ms-Image ~ i { background-image: url(` + VirtualMachineError + `); }
        `;
    }

    async componentWillUnmount() {
        if (this._style) (this._style as HTMLStyleElement).remove();
    }

   
    render() {

        const cardStyles: IDocumentCardStyles = {
            root: { display: 'inline-block', marginRight: 20, marginBottom: 20, width: 320 }            
        };

        const titleStylesPrimary: IDocumentCardTitleStyles = {
            root: { paddingTop: 30 }
        }

        var favoritesMode = false;

        var labCards:any[] = this.props.virtualMachines
            .filter(this._applyVirtualMachineFilter)
            .sort((a, b) => this._applyVirtualMachineSort(a, b, getFavorites()))
            .map((virtualMachine, index) => {

                var seperator:any = null;

                if (index === 0) {
                    favoritesMode = isFavorite(virtualMachine);
                    seperator = this.props.onRenderSeperator ? this.props.onRenderSeperator(favoritesMode) : null;
                } else if (favoritesMode && !isFavorite(virtualMachine)) {
                    favoritesMode = false;
                    seperator = this.props.onRenderSeperator ? this.props.onRenderSeperator(favoritesMode) : null;
                }                

                var owner: IDocumentCardActivityPerson[] = [
                    { name: virtualMachine.properties.createdByUser, profileImageSrc: '' }
                ]

                var virtualMachineTypeImage = getVirtualMachineTypeImage(virtualMachine);
                var virtualMachineClassName = virtualMachine.properties.provisioningState === 'Succeeded' 
                    ? 'vm' + (virtualMachine.properties.allowClaim ? 'Claimable' : virtualMachine.properties.lastKnownPowerState)
                    : 'vm' + virtualMachine.properties.provisioningState;

                return <>
                    {seperator}
                    <DocumentCard 
                        key={virtualMachine.id} 
                        styles={cardStyles} 
                        type={DocumentCardType.normal}
                        className={virtualMachineClassName}>
                        <DocumentCardImage height={100} imageFit={ImageFit.contain} imageSrc={virtualMachineTypeImage} />
                        <DocumentCardDetails>
                            <DocumentCardTitle 
                                title={virtualMachine.name}
                                shouldTruncate={true}
                                styles={titleStylesPrimary} />
                        </DocumentCardDetails>
                        <DocumentCardActions
                            actions={ this._getActions(virtualMachine) }
                        />
                        <DocumentCardActivity activity={'Created ' + formatDate(virtualMachine.properties.createdDate)} people={owner} />
                    </DocumentCard>                    
                </>
            });

        var deleteDialog = !this.state.deleteVirtualMachine ? <></> : <Dialog
            hidden={false}
            onDismiss={() => this._handleDelete(undefined)}
            dialogContentProps={{
                    type: DialogType.normal,
                    title: ('Delete ' + this.state.deleteVirtualMachine.name),
                    subText: 'Do you really want to delete this VM?'
                }}
            modalProps={{
                    isBlocking: true,
                    styles: { main: { maxWidth: 450 } }
                }}
            >
            <DialogFooter>
                <PrimaryButton onClick={() => this._handleDelete(this.state.deleteVirtualMachine)} text="Delete" />
                <DefaultButton onClick={() => this._handleDelete(undefined)} text="Cancel" />
            </DialogFooter>
        </Dialog>;

        return <div>
            {labCards}
            {deleteDialog}
        </div>;
    }

    private _getActions = (virtualMachine:VirtualMachine): IButtonProps[] => {

        var isHealthy = virtualMachine.properties.provisioningState === 'Succeeded';        
        if (!isHealthy) return [];

        if (virtualMachine.properties.allowClaim) {

            return [
                {
                    iconProps: { iconName: 'Pinned' },
                    onClick: this._handleAction.bind(this, virtualMachine, 'claim')
                }
            ]

        } else {
            
            var isMy = virtualMachine.properties.ownerObjectId === this.props.user.id;
            var isStopped = virtualMachine.properties.lastKnownPowerState === 'Stopped';
            var isRunning = virtualMachine.properties.lastKnownPowerState === 'Running';
            var virtualMachineUrl = "https://portal.azure.com/#@" + this.props.tenant.tenantId + "/resource" + virtualMachine.id;

            var actions:IButtonProps[] = [
                {
                    iconProps: { iconName: 'Remote' },
                    disabled: !isRunning,
                    onClick: this._handleAction.bind(this, virtualMachine, 'connect')
                },
                {
                    iconProps: { iconName: 'OpenInNewWindow' },
                    disabled: !virtualMachineUrl,
                    onClick: () => { window.open(virtualMachineUrl, "_blank") },
                },
                {
                    iconProps: { iconName: 'Play' },
                    disabled: (!isMy || !isStopped),
                    onClick: this._handleAction.bind(this, virtualMachine, 'start')
                },
                {
                    iconProps: { iconName: 'Stop' },
                    disabled: (!isMy || !isRunning),
                    onClick: this._handleAction.bind(this, virtualMachine, 'stop')
                },
                {
                    iconProps: { iconName: 'Unpin' },
                    disabled: (!isMy || !(isRunning || isStopped)),
                    onClick: this._handleAction.bind(this, virtualMachine, 'unclaim')
                },
                {
                    iconProps: { iconName: 'Delete' },
                    disabled: (!isMy || !(isRunning || isStopped)),
                    onClick: this._handleAction.bind(this, virtualMachine, 'delete')
                }
            ]

            if (this._isFavorite(virtualMachine)) {

                actions.push({
                    iconProps: { iconName: 'Unfavorite' },
                    onClick: this._handleAction.bind(this, virtualMachine, 'unfavorite')
                });

            } else {

                actions.push({
                    iconProps: { iconName: 'FavoriteStarFill' },
                    disabled: !isMy,
                    onClick: this._handleAction.bind(this, virtualMachine, 'favorite')
                });
            }

            return actions;
        }
    }

    private _isFavorite = (virtualMachine:VirtualMachine): boolean => {

        if (this.props.resourceOwnerFilter === ResourceOwnerFilter.my) {
            return isFavorite(virtualMachine);
        } else {
            setFavorite(virtualMachine, false);
        }

        return false;
    }

    private _applyVirtualMachineSort = (a:VirtualMachine, b:VirtualMachine, favorites:string[]): number => {

        let compare = 0;

        if (a.id !== b.id) {
            let aFav = favorites.indexOf(a.id) >= 0;
            let bFav = favorites.indexOf(b.id) >= 0;
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
        }

        return compare;
    }

    private _applyVirtualMachineFilter = (virtualMachine:VirtualMachine): boolean => {

        var match = false;

        if (this.props.resourceOwnerFilter === ResourceOwnerFilter.pool) {
        
            match = virtualMachine.properties.allowClaim;
        
        } else if (!virtualMachine.properties.allowClaim) {
        
            if (this.props.resourceOwnerFilter === ResourceOwnerFilter.all) {
                match = true;
            } else {
                match = this.props.user.id === virtualMachine.properties.ownerObjectId;
            }
        } 
        
        if (match && this.props.resourceNameFilter) {

            match = virtualMachine.name.toUpperCase().includes(this.props.resourceNameFilter.toUpperCase());
        }

        return match;
    }

    private _handleAction = async (virtualMachine:VirtualMachine, action:string, event: React.MouseEvent<BaseButton>) : Promise<void> => {
        
        event.stopPropagation();
        event.preventDefault();

        switch (action) {
            case 'start':
                this._handleStart(virtualMachine);
                break;
            case 'stop':
                this._handleStop(virtualMachine);
                break;
            case 'connect':
                this._handleConnect(virtualMachine);
                break;
            case 'claim':
                this._handleClaim(virtualMachine);
                break;
            case 'unclaim':
                this._handleUnclaim(virtualMachine);
                break;
            case 'favorite':
                this._handleFavorite(virtualMachine, true);
                break;
            case 'unfavorite':
                this._handleFavorite(virtualMachine, false);
                break;
            case 'delete':
                this._handleDelete(virtualMachine);
                break;
            default:
                console.log(action + ' is a not supported action');
                break;
        }
    }

    private _handleStart = async(virtualMachine: VirtualMachine) => {
        await startVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
        if (this.props.onMachineStateChanged) this.props.onMachineStateChanged(virtualMachine);
    }

    private _handleStop = async(virtualMachine: VirtualMachine) => {
        await stopVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
        if (this.props.onMachineStateChanged) this.props.onMachineStateChanged(virtualMachine);
    }

    private _handleDelete = async(virtualMachine?: VirtualMachine) => {
        if (!virtualMachine) {
            console.log("reset delete virtual machine");
            this.setState({deleteVirtualMachine: undefined});
        } else if (this.state.deleteVirtualMachine !== virtualMachine) {
            console.log("set delete virtual machine");
            this.setState({deleteVirtualMachine: virtualMachine});
        } else {
            await deleteVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
            this.setState({deleteVirtualMachine: undefined});            
        }
    }

    private _handleConnect = async(virtualMachine: VirtualMachine) => {
        await connectVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
    }

    private _handleClaim = async(virtualMachine: VirtualMachine) => {
        await claimVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
        if (this.props.onMachineStateChanged) this.props.onMachineStateChanged(virtualMachine);
    }

    private _handleUnclaim = async(virtualMachine: VirtualMachine) => {
        await unclaimVirtualMachine(virtualMachine, this.props.onLongRunningOperation);
        if (this.props.onMachineStateChanged) this.props.onMachineStateChanged(virtualMachine);
    }

    private _handleFavorite = (virtualMachine: VirtualMachine, isFavorite:boolean) => {
        setFavorite(virtualMachine, isFavorite);
        if (this.props.onFavoritesChanged) {
            this.props.onFavoritesChanged();
        } else { 
            this.forceUpdate(); 
        }
    }
  }