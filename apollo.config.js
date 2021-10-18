module.exports = {
  client: {
    service: {
      name: 'kausal-paths',
      url: process.env.DEFAULT_GRAPHQL_API_URL || 'http://localhost:8000/v1/graphql/'
    },
    includes: ['./components/**/*.js', './pages/**/*.js'],
  }
};
