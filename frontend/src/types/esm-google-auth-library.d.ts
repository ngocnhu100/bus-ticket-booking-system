declare module 'https://esm.sh/google-auth-library@9.14.1?target=es2022&bundle' {
  export class OAuth2Client {
    constructor(options: {
      clientId?: string
      clientSecret?: string
      redirectUri?: string
    })

    getToken(options: { code: string; redirect_uri?: string }): Promise<{
      tokens?: {
        id_token?: string
      }
    }>
  }
}
