import { getToken } from "./Auth";
import { search } from "jmespath";

export const fetchJson = async (scope:string, url:string, jmespath?:string) => {

    var retry = false;

    while (true) {
        
        console.log("==> GET " + url);

        try {

            var response = await fetch(url, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Authorization': 'Bearer ' + await getToken(scope, retry)
                }
            });

        } finally {

            console.log("<== GET " + url);
        }

        if (response.status === 403 && !retry) {

            retry = true;

        } else {
            
            var json = await response.json();    

            // console.log("=== JSON (" + url + ") " + JSON.stringify(json));

            if (jmespath) {
                return search(json, jmespath);
            } else {
                return json;
            }
        }
    }
}

export const deleteJson = async (scope: string, url:string) => {
    
    var retry = false;

    while (true) {

        console.log("==> DELETE " + url);

        var response = await fetch(url, {
            method: 'DELETE',
            mode: 'cors',
            headers: {
                'Authorization': 'Bearer ' + await getToken(scope, retry)
            }
        });

        console.log("<== DELETE " + url);

        if (response.status === 403 && !retry) {
            retry = true;
        } else {
            break;
        }
    }
}

export const postJson = async (scope: string, url:string, body?:any, jmespath?:string) => {

    var retry = false;

    while (true) {

        console.log("==> POST " + url);

        var requestBody:string = '';

        if (body) {
            if (typeof body === 'object' || body !== null) {
                requestBody = JSON.stringify(body);
            } else {
                requestBody = body as string;
            }
        }

        var response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Authorization': 'Bearer ' + await getToken(scope, retry)
            },
            body: requestBody
        });

        console.log("<== POST " + url);

        if (response.status === 403 && !retry) {

            retry = true;

        } else {

            if (isJsonResponse(response)) {

                var json = await response.json();    

                if (jmespath) {
                    return search(json, jmespath);
                } else {
                    return json;
                }

            } else {

                break;
            }
        }
    }
}

const isJsonResponse = (response:Response) => {

    const contentType = response.headers.get("content-type");

    return (contentType && contentType.indexOf("application/json") !== -1);
}