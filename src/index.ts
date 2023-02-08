import { TwitterStrategy } from './oauth-1/Twitter/TwitterStrategy'
import { LinkedinStrategy as LinkedinOAuth2} from './oauth-2/LinkedIn/LinkedinStrategy'
import { GithubOauth2 } from './oauth-2/Github/GithubOAuth2'

export const OAuth1 = {
    TwitterStrategy
}

export {
    LinkedinOAuth2,
    GithubOauth2
}

