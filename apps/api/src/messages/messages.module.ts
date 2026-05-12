import { Module, forwardRef } from '@nestjs/common';

import { SocketModule } from '../socket/socket.module';
import { MessagesController } from './messages.controller';
import { ConversationsController } from './conversations.controller';

@Module({
  imports: [forwardRef(() => SocketModule)],
  controllers: [MessagesController, ConversationsController],
})
export class MessagesModule {}
