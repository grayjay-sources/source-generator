

source.isLoggedIn = function (): boolean {
  return plugin.state.authenticated;
};

source.login = function (username: string, password: string) {
  log('login called for user: ' + username);
  // Implement login logic
  plugin.state.authenticated = true;
};

source.logout = function () {
  log('logout called');
  plugin.state.authenticated = false;
  plugin.state.authToken = '';
};
