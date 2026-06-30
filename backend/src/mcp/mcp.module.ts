import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/user.entity';
import { OAuthClient, OAuthCode, OAuthToken } from './oauth.entities';
import { McpOAuthProvider } from './mcp-oauth.provider';

@Module({
  imports: [TypeOrmModule.forFeature([OAuthClient, OAuthCode, OAuthToken, User])],
  providers: [McpOAuthProvider],
  exports: [McpOAuthProvider],
})
export class McpModule {}
