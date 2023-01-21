type LinkedInConfig = {
    client_id: string,
    redirect_uri: string,
    scope: string[],
    state: string
}

type ReturnValue = {
    status: number
    data: object | string
}

type Callback = (error: ReturnValue | null, result: ReturnValue | null) => void

export class LinkedinStrategy {
    private clientId
    private redirectUri
    private scope
    private state
    
    constructor(config: LinkedInConfig) {
        this.clientId = config.client_id
        this.redirectUri = config.redirect_uri
        this.scope = config.scope
        this.state = config.state
    }

    initiateAuthentication = async (callback: Callback) => {

    }

    requestAccessToken = async (callback: Callback) => {

    }
}