import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import AzureAD, { AuthenticationState } from 'react-aad-msal';
import { authProvider } from './Auth';
import { Error403 } from './views/Error403';


ReactDOM.render(
    <AzureAD provider={authProvider} forceLogin={true}>
    {
        ({login, logout, authenticationState, error, accountInfo}) => {
            if (authenticationState === AuthenticationState.Authenticated) {
                var tenantIdRegex = /(\{){0,1}[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}(\}){0,1}/gi;
                var tenantIdMatch = tenantIdRegex.exec(accountInfo.account.environment);
                var tenantId = tenantIdMatch ? tenantIdMatch[0] : '00000000-0000-0000-0000-000000000000';
                console.log(accountInfo);
                console.log(authProvider);
                return <App onSignOut={logout} tenantId={tenantId} />
            } else if (authenticationState === AuthenticationState.Unauthenticated) {
                return <Error403 error={error} />
            }
        }
    }
    </AzureAD>, 
    document.getElementById('root')
);
 
// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
