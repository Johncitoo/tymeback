import { Module } from '@nestjs/common';
import { TestController } from './test.controller';
import { CommunicationsModule } from '../communications/communications.module';

@Module({
  imports: [CommunicationsModule],
  controllers: [TestController],
})
export class TestModule {}
