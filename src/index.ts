import { TwitterStrategy } from './oauth-1/Twitter/TwitterStrategy'
import { LinkedinStrategy as LinkedinOAuth2} from './oauth-2/LinkedIn/LinkedinStrategy'
import { GithubOAuth2 } from './oauth-2/Github/GithubOAuth2'

export const OAuth1 = {
    TwitterStrategy
}

export {
    LinkedinOAuth2,
    GithubOAuth2
}

