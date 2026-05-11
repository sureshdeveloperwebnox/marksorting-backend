declare const _default: () => {
    port: number;
    database: {
        url: string | undefined;
    };
    jwt: {
        secret: string | undefined;
        expiresIn: string | undefined;
        refreshSecret: string | undefined;
        refreshExpiresIn: string | undefined;
    };
    redis: {
        host: string | undefined;
        port: number;
        password: string | undefined;
    };
};
export default _default;
