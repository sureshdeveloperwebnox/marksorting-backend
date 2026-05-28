export declare enum DeviceType {
    WEB = "WEB",
    ANDROID = "ANDROID",
    IOS = "IOS"
}
export declare class RegisterPushTokenDto {
    token: string;
    device_type: DeviceType;
}
