import axios from "axios"
import { Constants, OAuth2URLs } from "../utils"
import * as qs from 'querystring'
const nanoid = require('nanoid/async')

// type NonEmptyString<T extends string> = "" extends T ? never : T
//https://docs.github.com/en/developers/apps/building-oauth-apps/scopes-for-oauth-apps


type GithubConfig = {
    client_id: string
    client_secret: string
    redirect_uri: string
}

type AuthorizationOptions = {
    login?: string
    scope?: string
    state?: string
    allow_signup?: string
    handleState: boolean
}

type AccessTokenOptions = {
    code: qs.ParsedUrlQuery | string
    state: qs.ParsedUrlQuery | string
}

type ReturnValue = {
    status: number
    data: object
}

type Callback = (error: ReturnValue | null, result: ReturnValue | null) => void

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

        callback(null, {
            status: 200,
            data: {
                authUrl: `${OAuth2URLs.GITHUB.AUTHORIZE}?${qs.stringify(reqParams)}`
            }
        })
    }

    getAccessToken = async (options: AccessTokenOptions, callback: Callback) => {
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
            if(this.state !== options.state) {
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
            ...options
        }
        
        await axios.post(
            OAuth2URLs.GITHUB.ACCESS_TOKEN,
            reqParams,
            {
                params: reqParams
            }
        ).then(
            ({data}) => {
                const queryParams = new URLSearchParams(data)
                callback(null,{
                    status: 200,
                    data: Object.fromEntries([...queryParams])
                })
            }
        ).catch(
            (error) => {

            }
        )
    }
}