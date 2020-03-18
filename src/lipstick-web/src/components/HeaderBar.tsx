import React from 'react';

import { UserInfo } from './UserInfo';
import { FontIcon } from 'office-ui-fabric-react/lib/Icon';
import { IBreadcrumbItem, Breadcrumb } from 'office-ui-fabric-react/lib/Breadcrumb';
import { Link, useParams, useHistory } from "react-router-dom";

export interface IHeaderBarProps {
    onSignOut: () => void;
    tenantId: string;
}

export const HeaderBar: React.FunctionComponent<IHeaderBarProps> = (props) => {

    let history = useHistory();
    let { resourceName } = useParams();

    var items: IBreadcrumbItem[] = [
        { text: 'Lipstick', key: 'app', href: '/', onClick: _onBreadcrumbItemClicked }
    ];

    if (resourceName) {
        items.push({ text: resourceName, key: 'lab' })
    }

    function _onBreadcrumbItemClicked(ev?: React.MouseEvent<HTMLElement, MouseEvent>, item?: IBreadcrumbItem): void {
        if (item) history.push(item.href);        
    }

    return <div className="header">
        <Link to="/" className="logo" >
            <FontIcon iconName="TestBeaker" />
        </Link>
        <span className="title">
            <Breadcrumb items={items} />
        </span>
        <UserInfo onSignOut={props.onSignOut} tenantId={props.tenantId} />
    </div>;
}

