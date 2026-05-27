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
    s3: {
        folderName: string | undefined;
        bucketName: string | undefined;
        region: string | undefined;
        accessKey: string | undefined;
        secretAccessKey: string | undefined;
        baseUrl: string | undefined;
    };
};
export default _default;
