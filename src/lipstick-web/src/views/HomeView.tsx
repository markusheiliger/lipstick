import React from "react";
import { LabList } from "../components/LabList";
import { Lab, fetchLabs } from "../models/Lab";
import { User, fetchUser } from "../models/User";
import { Tenant, fetchTenant } from "../models/Tenant";
import { Spinner } from "office-ui-fabric-react/lib/Spinner";
import { CommandBar, ICommandBarItemProps, SearchBox } from "office-ui-fabric-react";

export interface IHomeViewProps {
    subscriptionId?:string;
    tenantId:string;
}

export interface IHomeViewState {
    operation?:string;
    user?: User;
    tenant?: Tenant;
    labs: Lab[];
    resourceFilter?: string;
}

export class HomeView extends React.Component<IHomeViewProps, IHomeViewState> {

    constructor(props) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _getDefaultState():IHomeViewState {
        return {
            operation: undefined,
            user: undefined,
            tenant: undefined,
            labs: new Array<Lab>(),
        }
    };

    componentDidMount() {
        this._refresh();
    }

    private _refresh = async () => {

        var promises:any[] = [
            this.state.user ? Promise.resolve<User>(this.state.user) : fetchUser(),
            this.state.tenant ? Promise.resolve<Tenant>(this.state.tenant) : fetchTenant(this.props.tenantId),
            fetchLabs(this.props.subscriptionId)
        ];

        var results = await Promise.all(promises);

        this.setState({
            user: results[0],
            tenant: results[1],
            labs: results[2],
        })
    }

    render() {

        var contentSection = <></>;

        if (this.state.operation || !this.state.user || !this.state.tenant) {

            contentSection = <Spinner label={this.state.operation || ''} />;
        }
        else 
        {
            contentSection = <LabList 
                user={this.state.user} 
                tenant={this.state.tenant}
                labs={this.state.labs}
                resourceNameFilter={this.state.resourceFilter} />
        }

        return (
            <>
                <CommandBar
                    className="commands"
                    items={this._getCommandBarItems(false)}
                    farItems={this._getCommandBarItems(true)}
                />
                <div className="content">
                    {contentSection}
                </div>
            </>
        );
    }

    private _getCommandBarItems = (farItems:boolean):ICommandBarItemProps[] => {
        if (farItems) {

            return [

                {
                    key: 'search',
                    onRender: () => <SearchBox className="searchBox" iconProps={{ iconName: 'Filter' }} placeholder="Filter" onChange={(_, resourceFilter) => this.setState({resourceFilter})} />
                },
                {
                    key: 'my',
                    text: 'My',
                    iconProps: { iconName: 'contact' },
                    disabled: true
                },
                {
                    key: 'all',
                    text: 'All',
                    iconProps: { iconName: 'people' },
                    disabled: true
                },
                {
                    key: 'pool',
                    text: 'Pool',
                    iconProps: { iconName: 'buildqueue' },
                    disabled: true
                }
            ];

        } else {

            return [
                {
                    key: 'machines',
                    text: 'Machines',
                    iconProps: { iconName: 'TVMonitor' },
                    disabled: true
                },
                {
                    key: 'environments',
                    text: 'Environments',
                    iconProps: { iconName: 'WebAppBuilderFragment' },
                    disabled: true
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
                    disabled: true
                }
            ];
        }
    }
}