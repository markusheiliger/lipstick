import { fetchJson } from "../Azure"
import { authScopeUser, authProvider, isMSA } from "../Auth"

export interface User {
    displayName: string;
    givenName: string;
    jobTitle: string;
    mail: string;
    surname: string;
    userPrincipalName: string;
    id: string;
}

export const fetchUser = async () => {

    if (isMSA()) {

        var account = authProvider.getAccount();
        
        return {

            displayName:  account.name,
            userPrincipalName: account.userName,
            id: account.accountIdentifier

        } as User;

    } else {

        return (await fetchJson(authScopeUser, 'https://graph.microsoft.com/v1.0/me')) as User;
    }
}