// () wrap cái ({}) để js hiểu ta muốn trả về 1 obj chứ đây không phải là 1 biểu thức cả đống code bên dưới
export interface  EnvConfig {
  readonly db: {
    readonly host: string,
    readonly port: number,
    readonly username: string,
    readonly password: string,
    readonly databaseName: string,

  }
}

export const envConfig = () : EnvConfig => ({
  db: {
    host: process.env.DB_HOST || '',
    databaseName: process.env.DB_NAME || '',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_HOST) || 3306,
    username: process.env.DB_USERNAME || ''
  }
})
