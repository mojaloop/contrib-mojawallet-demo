const withCSS = require('@zeit/next-css');

module.exports = withCSS({
    publicRuntimeConfig: {
        // REACT_APP_USERS_API_URL: process.env.REACT_APP_USERS_API_URL || 'http://localhost:3001/'

        REACT_APP_USERS_API_URL: process.env.REACT_APP_USERS_API_URL || 'localhost:3001',
        REACT_APP_GRANT_URL: process.env.REACT_APP_GRANT_URL || 'localhost:4445/oauth2/auth?client_id=frontend-service&state=loginflow&response_type=code&redirect_uri=http://localhost:3000/callback',
        HYDRA_REDIRECT_URI: process.env.HYDRA_REDIRECT_URI || 'http://localhost/callback',
        REACT_APP_LOGIN_GRANT_URL: process.env.REACT_APP_LOGIN_GRANT_URL || 'localhost:4445/oauth2/auth?client_id=frontend-service&state=loginflow&response_type=code&redirect_uri=http://localhost/callback',
        HYDRA_CLIENT_ID: process.env.HYDRA_CLIENT_ID || 'frontend-service',
        PUSHER_KEY: process.env.PUSHER_KEY || null
    }
});
