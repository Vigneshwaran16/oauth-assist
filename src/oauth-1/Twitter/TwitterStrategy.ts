import * as crypto from 'crypto'
import { OAuthURLs, OAuthConstants } from "../utils";
import OAuth from "oauth-1.0a";
import axios from "axios";
import { URLSearchParams } from "url";
import { formatAxiosError} from "./utils"
/*
    TYPE DEFINITIONS
*/
type TwitterConfig = {
    consumer_key: string
    consumer_secret: string
    callback_url: string
}

type AccessTokenParams = {
    oauth_token: string
    oauth_verifier: string
}

type ReturnValue = {
    status: number
    data: object | string
}

type Callback = (error: ReturnValue | null, result: ReturnValue | null) => void

export class TwitterStrategy {
    private consumerKey
    private consumerSecret
    private callbackUrl
    private oauth
    
    constructor(config: TwitterConfig) {
        this.consumerKey = config.consumer_key
        this.consumerSecret = config.consumer_secret
        this.callbackUrl = config.callback_url
        this.oauth = new OAuth({
            consumer: {
                key: this.consumerKey,
                secret: this.consumerSecret
            },
            signature_method: 'HMAC-SHA1',
            hash_function: (base_string, key) => {
                return crypto.createHmac('sha1', key).update(base_string).digest('base64')
            }
        })
    }

    initiateAuthentication = async ( callback: Callback ) => {
        console.log('started')
        // Request Data that needs to signed before raising a Request to Twitter API 
        let reqData = {
            url: OAuthURLs.TWITTER.REQUEST_TOKEN,
            method: 'POST',
            data: {
                oauth_callback: this.callbackUrl
            }
        }

        let signedReqHeaders = this.oauth.toHeader(this.oauth.authorize(reqData)) 

        await axios.post(OAuthURLs.TWITTER.REQUEST_TOKEN, reqData.data, {
            params: {
                oauth_callback: this.callbackUrl
            },
            // NEEDS REFACTORING
            headers: {
                Authorization: `${signedReqHeaders.Authorization}`
            }
        }).then(
            ({ data }) => {
                const queryParams = new URLSearchParams(data)
                if(queryParams.has('oauth_callback_confirmed') && queryParams.get('oauth_callback_confirmed') === 'false') {
                    return callback({
                            status: 400,
                            data: OAuthConstants.TWITTER.OAUTH_CALLBACK_UNCONFIRMED
                        }, null)
                }
                const redirectUrl = OAuthURLs.TWITTER.AUTHENTICATE + `?${data}`
                callback(null, {
                    status: 200,
                    data: {
                        queryParams: Object.fromEntries([...queryParams]),
                        redirectUrl
                    }
                })
            }
        ).catch(
            (error) => {
                callback(
                    formatAxiosError(error),
                    null
                )
            }
        )
    }

    getAccessTokens = async (accessTokenParams: AccessTokenParams, callback: Callback) => {
        await axios.post(OAuthURLs.TWITTER.ACCESS_TOKEN, accessTokenParams, {
            params: accessTokenParams
        }).then(
            ({data}) => {
                const queryParams = new URLSearchParams(data)
                callback(null,{
                    status: 200,
                    data: Object.fromEntries([...queryParams])
                })
            }
        ).catch(
            (error) => {
                callback(
                    formatAxiosError(error),
                    null
                )
            }
        )
    }
}

// module.exports = { TwitterStrategy }