import React from 'react';
import AccessDenied from '../images/AccessDenied.svg';

export interface IError403Props {
    error?:any;
}

export const Error403: React.FunctionComponent<IError403Props> = (props) => {

    return (
        <img src={AccessDenied} alt="Access Denied" />
    );
}