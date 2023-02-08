export const OAuth2URLs = Object.freeze({
    LINKEDIN: {
        REQUEST_AUTH_CODE: 'https://www.linkedin.com/oauth/v2/authorization',
        ACCESS_TOKEN: 'https://www.linkedin.com/oauth/v2/accessToken'
    }, 
    GITHUB: {
        AUTHORIZE: 'https://github.com/login/oauth/authorize',
        ACCESS_TOKEN: 'https://github.com/login/oauth/access_token'
    }
})

export const Constants = Object.freeze({
    GENERIC: {
        MISSING_CREDS: {
            ERROR: 'Missing client credentials',
            ERROR_DESCRIPTION: 'One or more client credentials are empty. Client credentials include `client_id`, `client_secret`, `redirect_uri`'
        },
        STATE_MISMATCH: {
            ERROR: 'State mismatch',
            ERROR_DESCRIPTION: 'State value when initiating authorization is different from the one received now. If you are sure about managing state value, set `handleState` to false in `initiateAuthorization()`'
        }
    }
})