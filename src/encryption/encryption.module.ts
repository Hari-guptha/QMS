import { Module, Global, OnModuleInit } from '@nestjs/common';
import { EncryptionService } from './encryption.service';
import { setEncryptionService } from './transformers';

@Global()
@Module({
  providers: [EncryptionService],
  exports: [EncryptionService],
})
export class EncryptionModule implements OnModuleInit {
  constructor(private encryptionService: EncryptionService) {}

  onModuleInit() {
    // Initialize the encryption service for transformers
    setEncryptionService(this.encryptionService);
  }
}

