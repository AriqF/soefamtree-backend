
export interface JWTAccount {
    id: number;
    email: string;
    is_admin: boolean;
    admin_auth_index: number;
}

export interface SuccessAuthResponse {
    token: string;
    exp: number;
    is_admin: boolean;
    admin_auth_index: number;
}