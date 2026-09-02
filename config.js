// Configuration for Google OAuth and AWS Lambda Endpoints

export const CONFIG = {
  // Google OAuth 2.0 Web Client ID
  // Replace with your generated Google Web Client ID from Google Cloud Console
  GOOGLE_CLIENT_ID: '719377736713-p1u6fp5epck9hjhhh9jeuopt9t8q1ebl.apps.googleusercontent.com',

  // AWS Lambda Function URLs (populated upon SAM deployment)
  API_ENDPOINTS: {
    profile: '',    // e.g. 'https://xxx.lambda-url.us-east-1.on.aws/'
    languages: '',  // e.g. 'https://xxx.lambda-url.us-east-1.on.aws/'
    decks: '',      // e.g. 'https://xxx.lambda-url.us-east-1.on.aws/'
    words: ''       // e.g. 'https://xxx.lambda-url.us-east-1.on.aws/'
  }
};
