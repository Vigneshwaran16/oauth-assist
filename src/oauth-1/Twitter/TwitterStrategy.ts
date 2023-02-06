import * as crypto from 'crypto'
import { OAuthURLs, OAuthConstants } from "../utils";
import OAuth from "oauth-1.0a";
import axios from "axios";
import { URLSearchParams } from "url";
/*
    TYPE DEFINITIONS
*/
type TwitterConfig = {
    /** Obtained from Linkedin developer portal under application credentials 
     * 
     * @required yes
     * @type string.
     *   
     * Avoid using empty string 
    */
    consumer_key: string

    /** Obtained from Linkedin developer portal under application credentials 
     * 
     * @required yes
     * @type string.
     *   
     * Avoid using empty string 
    */
    consumer_secret: string

    /** Obtained from Linkedin developer portal under application credentials 
     * 
     * @required yes
     * @type string.
     *   
     * Use absolute URLs 
    */
    callback_url: string
}

type AccessTokenParams = {
    /**
     * Obtained from Twitter once an user logs in and authorizes your application
     * 
     * @required yes
     * @type string 
    */
    oauth_token: string
    
    /**
     * Obtained from Twitter once an user logs in and authorizes your application
     * 
     * @required yes
     * @type string 
    */
    oauth_verifier: string
}

type ReturnValue = {
    status: number
    data: object
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
                            data: {
                                error: OAuthConstants.TWITTER.OAUTH_CALLBACK_UNCONFIRMED
                            }
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
                if(error.response) {
                    callback({
                        status: error.response.status,
                        data: error.response.data
                    }, null)
                } else if(error.request) {
                    callback({
                        status: 400,
                        data: error.request?.res?.statusMessage || 'Bad Request'
                    }, null)
                } else {
                    callback({
                        status: 500,
                        data: {
                            error: 'Something went wrong',
                            errorDescription: 'Please try again later!.'
                        }
                    }, null)
                }
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
                if(error.response) {
                    callback({
                        status: error.response.status,
                        data: error.response.data
                    }, null)
                } else if(error.request) {
                    callback({
                        status: 400,
                        data: error.request?.res?.statusMessage || 'Bad Request'
                    }, null)
                } else {
                    callback({
                        status: 500,
                        data: {
                            error: 'Something went wrong',
                            errorDescription: 'Please try again later!.'
                        }
                    }, null)
                }
            }
        )
    }
}

// module.exports = { TwitterStrategy }