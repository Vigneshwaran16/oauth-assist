import axios from 'axios'
const nanoid = require('nanoid/async')
import { URLSearchParams } from "url";
import * as qs from 'querystring'
import { OAuth2URLs, Constants } from '../utils';

/*
Add check for missing required fields
*/
// type NonEmpty<T extends string> = "" extends T ? never : T

/**
 * Client credentials for Linkedin OAuth2
 */
type LinkedInConfig = {
    /** Obtained from Linkedin developer portal under application credentials 
     * 
     * @required yes
     * @type string.
     * Avoid using empty string 
    */
    client_id: string,

    /** Obtained from Linkedin developer portal under application credentials 
     * 
     * @required yes
     * @type string.
     * Avoid using empty string
    */
    client_secret: string,

    /** Should be one of the authorized redirect URLs for your app in developer platform
     * 
     * @required yes
     * @type string.
     * Use absolute URLs
     * 
    */
    redirect_uri: string,
}

type AuthorizationOptions = {
    /** For the list of available scopes, visit the official docs
     * @docs https://learn.microsoft.com/en-us/linkedin/shared/authentication/getting-access  
     * @type string.
     * Space separated scopes
     * 
     * @example GOOD: "r_liteprofile r_emailaddress"
     * @example BAD: "r_liteprofiler_emailaddress"
    */
    scope: string,
    /** If `yes`, the package will take care of generating and validating state value during authorization
     * 
     * @required yes
     * @type boolean.
     * Avoid using empty string
    */
    handleState: boolean
    /** A random alphanumeric string used during authorization to ensure the response belongs to a request initiated by the same user
     * If you want to let the package manage state value, set `handleState` to true.
     * @required no
     * @type string
     * 
     */
    state?: string ,
}

type AccessTokenParams = {
    code: string
    state?: string
}

type ReturnValue = {
    status: number
    data: object
}

/**
 * @description  Callback function 
 * 
 * @param error
 * Error object with status and data properties
 * 
 * @param result
 * Result object with status and data properties
*/
type Callback = (error: ReturnValue | null, result: ReturnValue | null) => void

/**
 * Instance for Linkedin OAuth2
 * 
 * @params { client_id, client_secret, redirect_uri }
 */
export class LinkedinStrategy {
    private clientId
    private clientSecret
    private redirectUri
    private state = ''
    private handleState = false
    private isClientCredsEmpty = false
    
    constructor(config: LinkedInConfig) {
        if(Object.values(config).some(x => x === '')) {
            this.isClientCredsEmpty = true
        }
        this.clientId = config.client_id
        this.clientSecret = config.client_secret
        this.redirectUri = config.redirect_uri
    }

    /**
     * @description Returns the authorization url for user authentication/authorization
     * 
     * @param options - Additional parameters to be sent
     *  
     * @param callback - callback function => (error, result)
    */
    initiateAuthentication = async (options: AuthorizationOptions, callback: Callback) => {
        if(this.isClientCredsEmpty) {
            return callback({
                status: 400,
                data: {
                    error: Constants.LINKEDIN.MISSING_CREDS.ERROR,
                    error_description: Constants.LINKEDIN.MISSING_CREDS.ERROR_DESCRIPTION,
                }
            }, null)
        }
        let reqParams = JSON.parse(JSON.stringify(options))
        Object.keys(reqParams).forEach((key) => reqParams[key] === '' && delete reqParams[key])

        reqParams['client_id'] = this.clientId;
        reqParams['redirect_uri'] = this.redirectUri;
        reqParams['response_type'] = 'code'

        if(reqParams.handleState) {
            this.handleState = true
            this.state = await nanoid.nanoid()
            reqParams.state = this.state
        }

        const authUrl = `${OAuth2URLs.LINKEDIN.REQUEST_AUTH_CODE}?${qs.stringify(reqParams)}`
        callback(null, {
            status: 200,
            data: {
                authUrl
            }
        })  
    }

    /**
     * @description Used to obtain access_token of user in exchange for authorization code
     * 
     * @param authParams - `code` property obtained from authorization. (Must also contain `state` property if `handleState` is set to true)
     *  
     * @param callback - callback function => (error, result)
    */
    requestAccessToken = async (authParams: AccessTokenParams, callback: Callback) => {
        if(this.isClientCredsEmpty) {
            return callback({
                status: 400,
                data: {
                    error: Constants.LINKEDIN.MISSING_CREDS.ERROR,
                    error_description: Constants.LINKEDIN.MISSING_CREDS.ERROR_DESCRIPTION
                }
            }, null)
        }

        if(this.handleState) {
            if( this.state !== authParams.state)
                return callback({
                    status: 400,
                    data: {
                        error: Constants.LINKEDIN.STATE_MISMATCH.ERROR,
                        error_description: Constants.LINKEDIN.STATE_MISMATCH.ERROR_DESCRIPTION
                    }
                }, null)
        }

        const reqParams = {
            grant_type: 'authorization_code',
            redirect_uri: this.redirectUri,
            client_id: this.clientId,
            client_secret: this.clientSecret,
            ...authParams
        }

        await axios.post(
            OAuth2URLs.LINKEDIN.ACCESS_TOKEN,
            reqParams,
            {
                params: reqParams,
                headers: {
                    "Content-Type": "x-www-form-urlencoded"
                }
            }
        ).then(
            ({data}) => {
                const queryParams = new URLSearchParams(data)
                callback(null, {
                    status: 200,
                    data: Object.fromEntries([...queryParams])
                })
            }
        ).catch(
            (error) => {
                if(error.response) {
                    callback({
                        status: error.response.status,
                        data: error.response.data
                    }, null)
                } else if(error.request) {
                    callback({
                        status: 400,
                        data: {
                            error: error.request?.res?.statusMessage || 'Bad Request',
                            error_description: 'Please try again later!'
                        }
                    }, null)
                } else {
                    callback({
                        status: 500,
                        data: {
                            error: 'Something went wrong',
                            error_description: 'Please try again later!.'
                        }
                    }, null)
                }
            }
        )
    }
}