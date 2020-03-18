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
import { operationCallback } from "../Utilities";
import { BaseButton, IButtonProps } from "office-ui-fabric-react/lib/Button";
import { User } from "../models/User";
import { Environment, getEnvironmentOwnerId } from "../models/Environment";
import { ResourceOwnerFilter, getFavorites, setFavorite, isFavorite } from "../models/Resource";
import EnvironmentLogo from "../images/EnvironmentLogo.svg";
import { Tenant } from "../models/Tenant";

export interface IEnvironmentListProps {
    user: User,
    tenant: Tenant,
    environments:Environment[],
    resourceNameFilter?: string,
    resourceOwnerFilter: ResourceOwnerFilter,
    onFavoritesChanged?:() => void,
    onRenderSeperator?:(favorites:boolean) => JSX.Element,
    onLongRunningOperation?:operationCallback,
}

export interface IEnvironmentListState {
}

export class EnvironmentList extends React.Component<IEnvironmentListProps, IEnvironmentListState> {

    constructor(props:any) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _getDefaultState(): IEnvironmentListState {      
      return { }
    }
   
    render() {

        const cardStyles: IDocumentCardStyles = {
            root: { display: 'inline-block', marginRight: 20, marginBottom: 20, width: 320 }            
        };

        const titleStylesPrimary: IDocumentCardTitleStyles = {
            root: { paddingTop: 30 }
        }

        var favoritesMode = false;

        var labCards:any[] = this.props.environments
            .filter(this._applyEnvironmentFilter)
            .sort((a, b) => this._applyEnvironmentSort(a, b, getFavorites()))
            .map((environment, index) => {

                var seperator:any = null;

                if (index === 0) {
                    favoritesMode = isFavorite(environment);
                    seperator = this.props.onRenderSeperator ? this.props.onRenderSeperator(favoritesMode) : null;
                } else if (favoritesMode && !isFavorite(environment)) {
                    favoritesMode = false;
                    seperator = this.props.onRenderSeperator ? this.props.onRenderSeperator(favoritesMode) : null;
                }   

                var owner: IDocumentCardActivityPerson[] = [
                    { name: environment.properties.createdByUser, profileImageSrc: '' }
                ]

                return <>
                    {seperator} 
                    <DocumentCard 
                        key={environment.id} 
                        styles={cardStyles} 
                        type={DocumentCardType.normal}>                        
                        <DocumentCardImage height={100} imageFit={ImageFit.contain} imageSrc={EnvironmentLogo} />
                        <DocumentCardDetails>
                            <DocumentCardTitle 
                                title={environment.name}
                                shouldTruncate={true}
                                styles={titleStylesPrimary} />
                        </DocumentCardDetails>
                        <DocumentCardActions
                            actions={ this._getActions(environment) }
                        />
                        <DocumentCardActivity activity={''} people={owner} />
                    </DocumentCard>
                </>
            });

        return <div>{labCards}</div>
    }

    private _getActions = (environment:Environment): IButtonProps[] => {

        var environmentUrl = "https://portal.azure.com/#@" + this.props.tenant.tenantId + "/resource" + environment.properties.resourceGroupId;

        var actions:IButtonProps[] = [
            {
                iconProps: { iconName: 'OpenInNewWindow' },
                disabled: !environmentUrl,
                onClick: () => { window.open(environmentUrl, "_blank") },
            }
        ]

        var isMy = getEnvironmentOwnerId(environment) === this.props.user.id;

        if (this._isFavorite(environment)) {

            actions.push({
                iconProps: { iconName: 'Unfavorite' },
                onClick: this._handleAction.bind(this, environment, 'unfavorite')
            });

        } else {

            actions.push({
                iconProps: { iconName: 'FavoriteStarFill' },
                disabled: !isMy,
                onClick: this._handleAction.bind(this, environment, 'favorite')
            });
        }

        return actions;
    }

    private _isFavorite = (environment:Environment): boolean => {

        if (this.props.resourceOwnerFilter === ResourceOwnerFilter.my) {
            return isFavorite(environment);
        } else {
            setFavorite(environment, false);
        }

        return false;
    }

    private _applyEnvironmentSort = (a:Environment, b:Environment, favorites:string[]): number => {

        let compare = 0;

        if (a.id !== b.id) {
            let aFav = favorites.indexOf(a.id) >= 0;
            let bFav = favorites.indexOf(b.id) >= 0;
            if (aFav && !bFav) return -1;
            if (!aFav && bFav) return 1;
        }

        return compare;
    }

    private _applyEnvironmentFilter = (environment:Environment): boolean => {

        var match = false;

        if (this.props.resourceOwnerFilter === ResourceOwnerFilter.all) {
            match = true;
        } else {
            match = this.props.user.id === getEnvironmentOwnerId(environment);
        }

        if (match && this.props.resourceNameFilter) {

            match = environment.name.toUpperCase().includes(this.props.resourceNameFilter.toUpperCase());
        }

        return match;
    }

    private _handleAction = async (environment:Environment, action:string, event: React.MouseEvent<BaseButton>) : Promise<void> => {
        
        event.stopPropagation();
        event.preventDefault();

        switch (action) {
            case 'favorite':
                this._handleFavorite(environment, true);
                break;
            case 'unfavorite':
                this._handleFavorite(environment, false);
                break;
            default:
                console.log(action + ' is a not supported action');
                break;
        }
    }

    private _handleFavorite = (environment: Environment, isFavorite:boolean) => {
        setFavorite(environment, isFavorite);
        if (this.props.onFavoritesChanged) {
            this.props.onFavoritesChanged();
        } else { 
            this.forceUpdate(); 
        }
    }
  }