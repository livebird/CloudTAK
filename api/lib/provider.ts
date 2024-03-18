import Config from './config.js';

export enum AuthProviderAccess {
    ADMIN = 'admin',
    AGENCY = 'agency',
    USER = 'user'
}

class AuthProvider {
    config: Config;

    constructor(config: Config) {
        this.config = config;
    }

    login(username: string, password: string) {

    }
}
