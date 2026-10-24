import { Client } from 'typesense';

export class TypesenseConnection {
  private static instance: Client;

  private constructor() {}

  public static getInstance(): Client {
    if (!TypesenseConnection.instance) {
      const typesenseUrl = process.env.TYPESENSE_URL;
      const url = typesenseUrl ? new URL(typesenseUrl) : new URL('http://127.0.0.1:8108');

      const protocol = process.env.TYPESENSE_PROTOCOL || url.protocol.replace(':', '');
      const port = process.env.TYPESENSE_PORT
        ? parseInt(process.env.TYPESENSE_PORT, 10)
        : (url.port ? parseInt(url.port, 10) : (protocol === 'https' ? 443 : 8108));
      const host = process.env.TYPESENSE_HOST || url.hostname;

      TypesenseConnection.instance = new Client({
        nodes: [
          {
            host: host,
            port: port,
            protocol: protocol,
          },
        ],
        apiKey: process.env.TYPESENSE_API_KEY as string,
        connectionTimeoutSeconds: 2,
        numRetries: 3,
        retryIntervalSeconds: 1,
        healthcheckIntervalSeconds: 60,
        logLevel: process.env.NODE_ENV === 'production' ? 'error' : 'debug',
      });
    }

    return TypesenseConnection.instance;
  }
}
