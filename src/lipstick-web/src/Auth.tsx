import { MsalAuthProvider, LoginType, Configuration, AuthenticationParameters } from 'react-aad-msal';
 
const authenticationConfiguration: Configuration = {
  auth: {
    authority: 'https://login.microsoftonline.com/common',
    clientId: '[your client id goes here]',
    postLogoutRedirectUri: window.location.origin,
    redirectUri: window.location.origin,
    validateAuthority: false,
    navigateToLoginRequestUrl: true,
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false
  }
};
 
export const authScopeAzure:string = 'https://management.core.windows.net//user_impersonation';
export const authScopeUser:string = 'https://graph.microsoft.com/User.Read';
export const authScopeProfile:string = 'https://graph.microsoft.com/User.Read';

const authenticationParameters: AuthenticationParameters = {
  scopes: [
    // 'user_impersonation',
    'openid',
    // authScopeAzure,
    // authScopeUser,
  ]
}

export const authProvider = new MsalAuthProvider(authenticationConfiguration, authenticationParameters, LoginType.Redirect)

export const getToken = async (scope:string, reAuth?:boolean) => {

    console.log(authProvider.UserAgentApplication.getAccount());

    if (reAuth) { await authProvider.acquireTokenSilent(authenticationParameters); }

    var authParameters:AuthenticationParameters = { scopes: [ scope ]};
    var authResponse = await authProvider.acquireTokenSilent(authParameters);

    console.log('TOKEN (' + (authParameters.scopes || []).join(' | ') + ' | ' + authResponse.expiresOn + ') ' + authResponse.accessToken);

    return authResponse.accessToken;
}

export const isMSA = () => {

  const msaIssuerId:string = "9188040d-6c67-4c5b-b112-36a304b66dad";

  return authProvider.getAccount().idToken.iss.indexOf(msaIssuerId) > -1;
}