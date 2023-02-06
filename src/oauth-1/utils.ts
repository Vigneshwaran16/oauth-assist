export const OAuthURLs = Object.freeze({
    TWITTER: {
        REQUEST_TOKEN: 'https://api.twitter.com/oauth/request_token',
        AUTHENTICATE: 'https://api.twitter.com/oauth/authenticate',
        ACCESS_TOKEN: 'https://api.twitter.com/oauth/access_token'
    }
})

export const OAuthConstants = Object.freeze({
    TWITTER: {
        OAUTH_CALLBACK_UNCONFIRMED: {
            ERROR: 'Callback is not confirmed by Twitter',
            ERROR_DESCRIPTION: 'This is a verification step mandated by Twitter. Considering properly setting redirect/callback URLs in twitter developer portal for your application. For further details, look into Twitter OAuth official docs'
        },
        MISSING_CLIENT_CREDS: {
            ERROR: 'Missing client credentials',
            ERROR_DESCRIPTION: 'One or more client credentials are empty. Client credentials include `consumer_key`, `consumer_secret`, `callback_url`'
        }
    }
})