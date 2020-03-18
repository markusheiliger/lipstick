import React from "react";
import { Lab } from "../models/Lab";
import LabLogo from "../images/LabLogo.svg";

import {
    DocumentCard,
    DocumentCardTitle,
    IDocumentCardStyles,
    DocumentCardImage,
    DocumentCardDetails,
    IDocumentCardTitleStyles,
    DocumentCardType
  } from 'office-ui-fabric-react/lib/DocumentCard';

import { ImageFit } from "office-ui-fabric-react/lib/Image";
import { User } from "../models/User";
import { Tenant } from "../models/Tenant";

export interface ILabListProps {
    user: User,
    tenant: Tenant,
    labs:Lab[],
    resourceNameFilter?: string
}

export interface ILabListState {
    
}

export class LabList extends React.Component<ILabListProps, ILabListState> {

   constructor(props:any) {
        super(props);
        this.state = this._getDefaultState();
    }

    private _getDefaultState(): ILabListState {      
      return { }
    }

    async componentDidMount() {
    }

    render() {

        const cardStyles: IDocumentCardStyles = {
            root: { display: 'inline-block', marginRight: 20, marginBottom: 20, width: 320 }            
        };

        const titleStylesPrimary: IDocumentCardTitleStyles = {
            root: { paddingTop: 30 }
        }

        const titleStylesSecondary: IDocumentCardTitleStyles = {
            root: { paddingTop: 0 }
        }

        var labCards:any[] = this.props.labs
            .filter(this._applyLabFilter)
            .map(lab => {

            var link = window.origin + lab.id;

            return <DocumentCard 
                key={lab.id} 
                styles={cardStyles} 
                type={DocumentCardType.normal}
                onClickHref={link}
                >
                <DocumentCardImage height={100} imageFit={ImageFit.contain} imageSrc={LabLogo} />
                <DocumentCardDetails>
                    <DocumentCardTitle 
                        title={lab.name}
                        shouldTruncate={true}
                        styles={titleStylesPrimary} />
                    <DocumentCardTitle 
                        title={lab.subscriptionName} 
                        shouldTruncate={true} 
                        showAsSecondaryTitle={true}
                        styles={titleStylesSecondary} />
                </DocumentCardDetails>
            </DocumentCard>
        });

        return <div>{labCards}</div>
    }

    private _applyLabFilter = (lab:Lab): boolean => {

        var match = true;

        if (this.props.resourceNameFilter) {
            match = lab.name.toUpperCase().includes(this.props.resourceNameFilter.toUpperCase());
        } 

        return match;
    }
  }