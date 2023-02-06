import * as crypto from 'crypto'
import { OAuthURLs, OAuthConstants } from "../utils";
import OAuth from "oauth-1.0a";
import axios from "axios";
import { URLSearchParams } from "url";
/*
    TYPE DEFINITIONS
*/
type TwitterConfig = {
    /** Obtained from Twitter developer portal under `Keys and tokens` for your application  
     * 
     * @required yes
     * @type string.
     *   
     * Avoid using empty string 
    */
    consumer_key: string

    /**Obtained from Twitter developer portal under `Keys and tokens` for your application 
     * 
     * @required yes
     * @type string.
     *   
     * Avoid using empty string 
    */
    consumer_secret: string

    /** Obtained from Twitter developer portal under `Keys and tokens` for your application
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

/**
 * Instance for Twitter OAuth1
 * 
 * @params { consumer_key, consumer_secret, callback_url }
 */
export class TwitterStrategy {
    private consumerKey
    private consumerSecret
    private callbackUrl
    private oauth
    private isClientCredsEmpty = false
    constructor(config: TwitterConfig) {
        if(Object.values(config).some(x => x === '')) {
            this.isClientCredsEmpty = true
        }
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

    /** 
     * @description Used to initiate authentication/authorization and return redirectUrl to authorize application access to twitter user
     * 
     * @param callback - Callback function => (error, result)
     * 
     */
    initiateAuthentication = async ( callback: Callback ) => {
        if(this.isClientCredsEmpty) {
            return callback({
                status: 400,
                data: {
                    error: OAuthConstants.TWITTER.MISSING_CLIENT_CREDS.ERROR,
                    error_description: OAuthConstants.TWITTER.MISSING_CLIENT_CREDS.ERROR_DESCRIPTION
                }
            }, null)
        }
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
                                error: OAuthConstants.TWITTER.OAUTH_CALLBACK_UNCONFIRMED.ERROR,
                                error_description: OAuthConstants.TWITTER.OAUTH_CALLBACK_UNCONFIRMED.ERROR_DESCRIPTION
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
                        data: {
                            error: error.response.data.errors[0]?.message,
                            error_description: `Complete error response ${error.response.data.errors}`
                        }
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

    /**
     * @description Uses the oauth_verifier token in exchange for user `oauth_token` and `oauth_token_secret`
     * 
     * @param accessTokenParams - oauth_token and oauth_verifier obtained after authorizing application
     * 
     * @param callback - callback function => (error, result)
     * 
     */
    getAccessTokens = async (accessTokenParams: AccessTokenParams, callback: Callback) => {
        if(this.isClientCredsEmpty) {
            return callback({
                status: 400,
                data: {
                    error: OAuthConstants.TWITTER.MISSING_CLIENT_CREDS.ERROR,
                    error_description: OAuthConstants.TWITTER.MISSING_CLIENT_CREDS.ERROR_DESCRIPTION
                }
            }, null)
        }

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
                        data: {
                            error: error.response.data.errors[0]?.message,
                            error_description: `Complete error response ${error.response.data.errors}`
                        }

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

// module.exports = { TwitterStrategy }