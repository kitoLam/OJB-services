// () wrap cái ({}) để js hiểu ta muốn trả về 1 obj chứ đây không phải là 1 biểu thức cả đống code bên dưới
export interface  EnvConfig {
  readonly db: {
    readonly host: string,
    readonly port: number,
    readonly username: string,
    readonly password: string,
    readonly databaseName: string,

  },
  readonly minio: {
    readonly endPoint: string,
    readonly port: number,
    readonly useSSL: boolean,
    readonly accessKey: string,
    readonly secretKey: string,
    readonly bucket: {
      readonly testCase: string
    }
  }
}

export const envConfig = () : EnvConfig => ({
  db: {
    host: process.env.DB_HOST || '',
    databaseName: process.env.DB_NAME || '',
    password: process.env.DB_PASSWORD || '',
    port: Number(process.env.DB_HOST) || 3306,
    username: process.env.DB_USERNAME || ''
  },
  minio: {
    endPoint: `${process.env.MINIO_ENDPOINT}`,
    port: Number(`${process.env.MINIO_PORT}`),
    useSSL: `${process.env.MINIO_USE_SSL}` == 'true',
    accessKey: `${process.env.MINIO_ACCESS_KEY}`,
    secretKey: `${process.env.MINIO_SECRET_KEY}`,
    bucket: {
      testCase: `${process.env.MINIO_BUCKET_TEST_CASES}`
    }
  }
})
