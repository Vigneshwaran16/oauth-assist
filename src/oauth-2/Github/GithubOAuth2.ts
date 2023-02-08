import axios from "axios"
import { Constants, OAuth2URLs } from "../utils"
import * as qs from 'querystring'
const nanoid = require('nanoid/async')

// type NonEmptyString<T extends string> = "" extends T ? never : T

/**
 * Client credentials for Github OAuth2
 */
type GithubConfig = {
    /** Obtained from General tab in Github OAuth apps 
     * 
     * @required yes
     * @type string.
     * Avoid using empty string 
    */
     client_id: string

     /** Obtained from General tab in Github OAuth apps 
      * 
      * @required yes
      * @type string.
      * Avoid using empty string
     */
     client_secret: string
 
     /** Should be one of the authorized redirect URLs for your OAuth application
      * 
      * @required yes
      * @type string.
      * Use absolute URLs
      * 
     */
     redirect_uri: string
}

type AuthorizationOptions = {
    /** Suggests a specific account to use for signing in and authorizing the app.
     * 
     * @required no
     * @type string
     * 
     */
    login?: string

    /** For the list of available scopes, visit the official docs
     * @docs https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps
     * @required no
     * @type string.
     * Space separated scopes
     * 
    */
    scope?: string

    /** A random alphanumeric string used during authorization to ensure the response belongs to a request initiated by the same user
     * If you want to let the package manage state value, set `handleState` to true.
     * @required no
     * @type string
     * 
     */
    state?: string

    /** Whether or not unauthenticated users will be offered an option to sign up for GitHub during the OAuth flow.
     *
     * @required no
     * @type string 
     */
    allow_signup?: string

    /** If `yes`, the package will take care of generating and validating state value during authorization
     * 
     * @required yes
     * @type boolean.
     * 
    */
    handleState: boolean
}

type AccessTokenParams = {
    /** Authorization code sent from Github
     * 
     * @required true
     * @type string
     */
    code: string

    /** State value for the current OAuth flow sent from Github 
     * 
     * @required no
     * @type string
     */
    state?: string

    /** Additional format option to return user tokens in XML Format. If not set, the default return type will be `JSON`
     *  
     * @required no
     * @type boolean
     */
    returnAsXML?: boolean
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
 * Instance for Github OAuth2
 * 
 * @params { client_id, client_secret, redirect_uri }
 */
export class GithubOAuth2 {
    private clientId
    private clientSecret
    private redirectUri
    private state = ''
    private handleState = false
    private isClientCredsEmpty = false

    constructor(config: GithubConfig) {
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
    initiateAuthorization = async ( options: AuthorizationOptions, callback: Callback) => {
        if ( this.isClientCredsEmpty ) {
            return callback({
                status: 400,
                data: {
                    error: Constants.GENERIC.MISSING_CREDS.ERROR,
                    error_description: Constants.GENERIC.MISSING_CREDS.ERROR_DESCRIPTION
                }
            }, null)
        }

        let reqParams = JSON.parse(JSON.stringify(options))
        Object.keys(reqParams).forEach((key) => reqParams[key] === '' && delete reqParams[key]);

        reqParams['client_id'] = this.clientId
        reqParams['redirect_uri'] = this.redirectUri
        
        if(reqParams.handleState) {
            this.handleState = true
            this.state = await nanoid.nanoid()
            reqParams.state = this.state
        }

        delete reqParams['handleState'];
        
        callback(null, {
            status: 200,
            data: {
                authUrl: `${OAuth2URLs.GITHUB.AUTHORIZE}?${qs.stringify(reqParams)}`
            }
        })
    }

    /**
     * @description Used to obtain access_token of user in exchange for authorization code
     * 
     * @param authParams - `code` property obtained from authorization. 
     * Must also contain `state` property if `handleState` is set to true
     * If the response needs to be in XML format, set `returnAsXML` to true. Default: false
     *  
     * @param callback - callback function => (error, result)
    */
    getAccessToken = async (authParams: AccessTokenParams, callback: Callback) => {
        if ( this.isClientCredsEmpty ) {
            return callback({
                status: 400,
                data: {
                    error: Constants.GENERIC.MISSING_CREDS.ERROR,
                    error_description: Constants.GENERIC.MISSING_CREDS.ERROR_DESCRIPTION
                }
            }, null)
        }

        if( this.handleState ) {
            if(this.state !== authParams.state) {
                return callback({
                    status: 400,
                    data: {
                        error: Constants.GENERIC.STATE_MISMATCH.ERROR,
                        error_description: Constants.GENERIC.STATE_MISMATCH.ERROR_DESCRIPTION
                    }
                }, null)
            }
        }
        let reqParams = {
            client_id: this.clientId,
            client_secret: this.clientSecret,
            ...authParams
        }
        
        delete reqParams['returnAsXML']
        await axios.post(
            OAuth2URLs.GITHUB.ACCESS_TOKEN,
            reqParams,
            {
                params: reqParams,
                headers: {
                    'Accept': authParams?.returnAsXML ? 'application/xml' : 'application/json'
                }
            }
        ).then(
            ({data}) => {
                callback(null,{
                    status: 200,
                    data: data
                })
            }
        ).catch(
            (error) => {

            }
        )
    }
}