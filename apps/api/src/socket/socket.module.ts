import { Module, forwardRef } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [forwardRef(() => SessionsModule)],
  providers: [SocketGateway],
  exports: [SocketGateway],
})
export class SocketModule {}
