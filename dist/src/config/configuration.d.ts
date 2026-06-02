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
    firebase: {
        projectId: string | undefined;
        clientEmail: string | undefined;
        privateKey: string | undefined;
    };
    mail: {
        host: string;
        port: number;
        user: string | undefined;
        pass: string | undefined;
        fromName: string;
    };
    app: {
        frontendUrl: string;
    };
    whatsapp: {
        apiToken: string | undefined;
        instanceId: string | undefined;
        baseUrl: string;
        apiUrl: string | undefined;
        documentEndpoint: string;
        messageEndpoint: string;
    };
};
export default _default;
