import React from "react";
import * as Markdown from "markdown-it";
import $ from "jquery";

import { VirtualMachineList } from "../components/VirtualMachineList";
import { VirtualMachine, fetchVirtualMachines, deleteVirtualMachine, isVirtualMachineResource, isVirtualMachineInFlight, claimVirtualMachine } from "../models/VirtualMachine";
import { CommandBar, ICommandBarItemProps } from 'office-ui-fabric-react/lib/CommandBar';
import { getEnumName, operationCallback, createGuid, getVirtualMachineTypeImage } from "../Utilities";
import { Spinner } from 'office-ui-fabric-react/lib/Spinner';
import { ResourceTypeFilter, ResourceOwnerFilter, isActionAllowed, ResourceIdentifier } from "../models/Resource";
import { Environment, fetchEnvironments, deleteEnvironment, isEnvironmentResource } from "../models/Environment";
import { EnvironmentList } from "../components/EnvironmentList";
import { SearchBox, MessageBar, Link, Dialog, DialogType, List, DialogFooter, PrimaryButton, DefaultButton } from "office-ui-fabric-react";
import { User, fetchUser } from "../models/User";
import { Tenant, fetchTenant } from "../models/Tenant";
import { Lab, fetchLab } from "../models/Lab";
import { Image, ImageFit } from 'office-ui-fabric-react/lib/Image';
import EnvironmentLogo from "../images/EnvironmentLogo.svg";

export interface ILabViewProps {

    labId:string;
    tenantId:string;
}

export interface ILabViewState {

    operation?:string;
    user?: User;
    tenant?: Tenant;
    lab: Lab;

    resourceFilter?: string;
    resourceType: ResourceTypeFilter,
    resourceOwner: ResourceOwnerFilter,
    resourceTrash: ResourceIdentifier[],
    
    virtualMachines:VirtualMachine[],
    environments:Environment[],

    announcementVisible: boolean,
    cleanupVisible: boolean    
}

export class LabView extends React.Component<ILabViewProps, ILabViewState> {

    constructor(props) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _timer:any = null;
    private _markdown = new Markdown({
        html: true,
        linkify: true
    });

    private _getDefaultState():ILabViewState {
        return {
            operation: undefined,
            user: undefined,
            tenant: undefined,
            lab: {} as Lab,
            resourceFilter: undefined,
            resourceType: ResourceTypeFilter.machine,
            resourceOwner: ResourceOwnerFilter.my,
            resourceTrash: new Array<ResourceIdentifier>(),
            virtualMachines: new Array<VirtualMachine>(),
            environments: new Array<Environment>(),            
            announcementVisible: false,
            cleanupVisible: false
        }
    };

    componentDidMount() {
        this._refresh(true);
    }

    componentWillUnmount() {
        clearTimeout(this._timer);
    }

    private _refresh = async (autoRefresh?:boolean) => {

        var promises:any[] = [
            this.state.user ? Promise.resolve<User>(this.state.user) : fetchUser(),
            this.state.tenant ? Promise.resolve<Tenant>(this.state.tenant) : fetchTenant(this.props.tenantId),
            fetchLab(this.props.labId),
            fetchVirtualMachines(this.props.labId),
            fetchEnvironments(this.props.labId)
        ];

        var results = await Promise.all(promises);

        this.setState({
            user: results[0],
            tenant: results[1],
            lab: results[2],
            virtualMachines: results[3],
            environments: results[4]
        }, this._refreshExtended);
        
        if (autoRefresh) {

            var resfreshDelay = 10; // default refresh delay in sec

            try {
                clearTimeout(this._timer);
                if (this.state.virtualMachines.some(virtualMachine => isVirtualMachineInFlight(virtualMachine))) resfreshDelay = 5; // shortened refresh delay because of inflight vms
            }
            finally {
                console.log('Next refresh in ' + resfreshDelay + ' sec');
                this._timer = setTimeout(() => this._refresh(true), resfreshDelay * 1000);
            }
        }
    }

    private _refreshExtended = async() => {

        var resourceTrash:ResourceIdentifier[] = [];

        var resourceTrashPromises:any[] = [
            this.state.virtualMachines.filterAsync(async (virtualMachine) => { return virtualMachine.properties.provisioningState === "Failed" && (virtualMachine.properties.allowClaim || await isActionAllowed(virtualMachine)); }),
            this.state.environments.filterAsync(async (environment) => { return environment.properties.provisioningState === "Failed" && await isActionAllowed(environment); })
        ];
        
        (await Promise.all(resourceTrashPromises)).forEach(result => resourceTrash.push(...result));

        this.setState({resourceTrash})
    }

    render() {
        
        var seperatorPrefix:string = getEnumName(ResourceOwnerFilter, this.state.resourceOwner) || '';
        var contentSection = <></>;
        
        if (this.state.operation || !this.state.user || !this.state.tenant) {

            contentSection = <Spinner label={this.state.operation || ''} />;
        }
        else if (this.state.resourceType === ResourceTypeFilter.machine && this.state.virtualMachines.length !== 0) {

            contentSection = <VirtualMachineList 
                user={this.state.user}
                tenant={this.state.tenant}
                virtualMachines={this.state.virtualMachines} 
                onMachineStateChanged={this._onMachineStateChanged}
                onFavoritesChanged={() => this.forceUpdate() }
                onRenderSeperator={(favorite:boolean) => this._renderSeperator(seperatorPrefix, favorite ? "(Favorites)" : undefined)} 
                onLongRunningOperation={this._onLongRunningOperation}
                resourceNameFilter={this.state.resourceFilter}
                resourceOwnerFilter={this.state.resourceOwner} />;
        }
        else if (this.state.resourceType === ResourceTypeFilter.environment && this.state.environments.length !== 0) {

            contentSection = <EnvironmentList 
                user={this.state.user}
                tenant={this.state.tenant}
                environments={this.state.environments} 
                onFavoritesChanged={() => this.forceUpdate()}
                onRenderSeperator={(favorite:boolean) => this._renderSeperator(seperatorPrefix, favorite ? "(Favorites)" : undefined)} 
                onLongRunningOperation={this._onLongRunningOperation}
                resourceNameFilter={this.state.resourceFilter}
                resourceOwnerFilter={this.state.resourceOwner} />;
        }

        return (
            <>
                <CommandBar
                    className="commands"
                    items={this._getCommandBarItems(false)}
                    farItems={this._getCommandBarItems(true)}
                />
                {this._renderCleanup()}
                {this._renderAnnouncement()}
                <div className="content">
                    {contentSection}
                </div>
            </>
        );

    }

    private _renderCleanup = () => {

        if (this.state.resourceTrash.length > 0) {

            return <MessageBar>
                Your lab contains failed resources <Link onClick={() => this.setState({cleanupVisible: true})}>clean up</Link>
                <Dialog
                    hidden={!this.state.cleanupVisible}
                    onDismiss={() => this.setState({cleanupVisible: false})}
                    className="announcement"
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: 'Clean up failed resources'
                    }}
                    modalProps={{
                        isBlocking: false
                    }}
                    >
                    <List 
                        items={this.state.resourceTrash.filter(resource => isVirtualMachineResource(resource)) as VirtualMachine[]} 
                        onRenderCell={this._renderCleanupMachine} 
                        className="cleanupList" />
                    <List 
                        items={this.state.resourceTrash.filter(resource => isEnvironmentResource(resource)) as Environment[]} 
                        onRenderCell={this._renderCleanupEnvironment} 
                        className="cleanupList" />
                    <DialogFooter>
                        <PrimaryButton onClick={() => this._handleCleanup(this.state.resourceTrash)} text="Delete" />
                        <DefaultButton onClick={() => this.setState({cleanupVisible: false})} text="Cancel" />
                    </DialogFooter>
                </Dialog>
            </MessageBar>
        }

        return <></>;
    }

    private _renderCleanupMachine = (virtualMachine?: VirtualMachine) => {

        if (virtualMachine) {

            var virtualMachineTypeImage = getVirtualMachineTypeImage(virtualMachine);

            return (
                <div className="cleanupItem">
                    <Image src={virtualMachineTypeImage} width={50} height={50} imageFit={ImageFit.cover} />
                    <div className="cleanupItemContent">
                        <div>{virtualMachine.name}</div>
                        <div>{virtualMachine.properties.notes}</div>
                    </div>
                </div>
            );
        }

        return <></>;
    }

    private _renderCleanupEnvironment = (environment?: Environment) => {

        if (environment) {

            return (
                <div className="cleanupItem">
                    <Image src={EnvironmentLogo} width={50} height={50} imageFit={ImageFit.cover} />
                    <div className="cleanupItemContent">
                        <div>{environment.name}</div>
                        <div>{environment.properties.armTemplateDisplayName}</div>
                    </div>
                </div>
            );
        }

        return <></>;
    }

    private _renderAnnouncement = () => {

        console.log(this.state.lab);

        if (!this.state.operation   && this.state.lab.properties 
                                    && this.state.lab.properties.announcement 
                                    && this.state.lab.properties.announcement.enabled === "Enabled"
                                    && !this.state.lab.properties.announcement.expired) {

            let announcement = $('<div />',{html:this._markdown.render(this.state.lab.properties.announcement.markdown)});                                        

            return <MessageBar>
                {this.state.lab.properties.announcement.title}
                <Link onClick={() => this.setState({announcementVisible: true})}> show</Link>
                <Dialog
                    hidden={!this.state.announcementVisible}
                    onDismiss={() => this.setState({announcementVisible: false})}
                    className="announcement"
                    dialogContentProps={{
                        type: DialogType.normal,
                        title: this.state.lab.properties.announcement.title
                    }}
                    modalProps={{
                        isBlocking: false
                    }}
                    >
                    <div dangerouslySetInnerHTML={{ __html: announcement.html() }} />
                </Dialog>
            </MessageBar>
        }

        return <></>;
    }

    private _renderSeperator = (prefix:string, suffix?:string): any => {
        return <div key={createGuid()}>
            <br/>
            <span className="uppercase">{prefix}</span>
            <span> - </span> 
            <span className="capitalize">{getEnumName(ResourceTypeFilter, this.state.resourceType)}s</span>
            <span> {suffix}</span>
            <hr/>
        </div>;
    }

    private _handleCleanup = async (resources:ResourceIdentifier[]) => {

        var claimableVirtualMachines = resources.filter(resource => isVirtualMachineResource(resource))
                                                .map(resource => resource as VirtualMachine)
                                                .filter(virtualMachine => virtualMachine.properties.allowClaim);
        
        await Promise.all(claimableVirtualMachines.map(virtualMachine => claimVirtualMachine(virtualMachine)));

        // eslint-disable-next-line
        await Promise.all(resources.map(resource => {
            if (isVirtualMachineResource(resource)) {                
                return deleteVirtualMachine(resource);
            } else if (isEnvironmentResource(resource)) {
                return deleteEnvironment(resource);
            }
        }));

        this.setState({cleanupVisible: false});
    }

    private _onLongRunningOperation:operationCallback = (operationTitle:string, operationState: Promise<void>) => {
        this.setState({operation: operationTitle});
        operationState.finally(() => this.setState({operation: undefined}));
    }

    private _onMachineStateChanged = (virtualMachine:VirtualMachine) => {
        this._refresh();
        if (this.state.resourceOwner === ResourceOwnerFilter.pool && !this._existClaimableVirtualMachine()) {
            this.setState({resourceOwner: ResourceOwnerFilter.my}); // no need to stay on the pool view - user picked the last claimable VM
        }
    }

    private _existClaimableVirtualMachine = () => {
        return (this.state.virtualMachines.findIndex((virtualMachine: VirtualMachine) => virtualMachine.properties.allowClaim) >= 0);
    }

    private _getCommandBarItems = (farItems:boolean):ICommandBarItemProps[] => {
        if (farItems) {

            var labUrl = this.state.user ? "https://portal.azure.com/#@" + (this.state.tenant ? this.state.tenant.tenantId : this.props.tenantId) + "/resource" + this.props.labId : undefined;

            return [
                {
                    key: 'browse',
                    text: 'Browse',
                    iconProps: { iconName: 'OpenInNewWindow' },
                    disabled: !labUrl,
                    onClick: () => { window.open(labUrl, "_blank") },
                },
                {
                    key: 'search',
                    onRender: () => <SearchBox className="searchBox" iconProps={{ iconName: 'Filter' }} placeholder="Filter" onChange={(_, resourceFilter) => this.setState({resourceFilter})} />
                },
                {
                    key: 'my',
                    text: 'My',
                    iconProps: { iconName: 'contact' },
                    disabled: (this.state.resourceOwner === ResourceOwnerFilter.my),
                    onClick: () => { this._toggelResourceOwner(ResourceOwnerFilter.my) }
                },
                {
                    key: 'all',
                    text: 'All',
                    iconProps: { iconName: 'people' },
                    disabled: (this.state.resourceOwner === ResourceOwnerFilter.all),
                    onClick: () => { this._toggelResourceOwner(ResourceOwnerFilter.all) }
                },
                {
                    key: 'pool',
                    text: 'Pool',
                    iconProps: { iconName: 'buildqueue' },
                    disabled: (this.state.resourceOwner === ResourceOwnerFilter.pool || this.state.resourceType === ResourceTypeFilter.environment),
                    onClick: () => { this._toggelResourceOwner(ResourceOwnerFilter.pool) }
                }
            ];

        } else {

            return [
                {
                    key: 'machines',
                    text: 'Machines',
                    iconProps: { iconName: 'TVMonitor' },
                    disabled: (this.state.resourceType === ResourceTypeFilter.machine),
                    onClick: () => { this._toggleResourceType(ResourceTypeFilter.machine) }
                },
                {
                    key: 'environments',
                    text: 'Environments',
                    iconProps: { iconName: 'WebAppBuilderFragment' },
                    disabled: (this.state.resourceType === ResourceTypeFilter.environment),
                    onClick: () => { this._toggleResourceType(ResourceTypeFilter.environment) }
                },
                {
                    key: 'seperator',
                    onRender: () => <div className="seperator" />
                },
                {
                    key: 'refresh',
                    text: 'Refresh',
                    iconProps: { iconName: 'refresh' },
                    onClick: () => { this._refresh() }
                },
                {
                    key: 'create',
                    text: 'Create',
                    iconProps: { iconName: 'CirclePlus' },
                    onClick: () => { alert('not yet implemented') }
                }
            ];
        }
    }

    private _toggelResourceOwner = (resourceOwner:ResourceOwnerFilter) => {
        this.setState({resourceOwner});
    }

    private _toggleResourceType = (resourceType: ResourceTypeFilter) => {
        this.setState({resourceType})
    }
}
