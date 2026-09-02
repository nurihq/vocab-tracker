// Configuration for Google OAuth and AWS Lambda Endpoints

export const CONFIG = {
  // Google OAuth 2.0 Web Client ID
  GOOGLE_CLIENT_ID: '719377736713-p1u6fp5epck9hjhhh9jeuopt9t8q1ebl.apps.googleusercontent.com',

  // Live AWS Lambda Function URLs
  API_ENDPOINTS: {
    profile: 'https://u5tqayw4k5zkibq55bubr7oxuq0riljr.lambda-url.us-east-1.on.aws/',
    languages: 'https://7cz2cnzcmdzowalvrfg76b2geu0gqmre.lambda-url.us-east-1.on.aws/',
    decks: 'https://5rd6ogkgak4e6335w6sm46aw4e0gkciz.lambda-url.us-east-1.on.aws/',
    words: 'https://q7aojvvzptfhse6ortbt2uh2ia0afszl.lambda-url.us-east-1.on.aws/'
  }
};
