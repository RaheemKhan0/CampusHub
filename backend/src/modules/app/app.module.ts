import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthGuard, AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from 'src/lib/betterauth';
import { APP_GUARD } from '@nestjs/core';
import { ServerModule } from '../server/server.module';
import { ChannelModule } from '../channels/channels.module';
import { MessagesModule } from '../messages/messages.module';
import { DegreeModule } from '../degrees/degree.module';

@Module({
  imports: [
    AuthModule.forRoot(auth),
    ServerModule,
    ChannelModule,
    MessagesModule,
    DegreeModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],
})
export class AppModule {}
