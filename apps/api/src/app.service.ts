import { Injectable } from '@nestjs/common';

export interface HealthStatus {
  status: 'ok';
  service: string;
  uptime: number;
  timestamp: string;
}

@Injectable()
export class AppService {
  private readonly serviceName = process.env.SERVICE_NAME ?? '@api';

  getHello(): string {
    return `${this.serviceName} is running`;
  }

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      service: this.serviceName,
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }
}
