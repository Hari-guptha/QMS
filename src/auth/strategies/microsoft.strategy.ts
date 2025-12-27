import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../../users/entities/user.entity';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../encryption/encryption.service';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private encryptionService: EncryptionService,
  ) {
    const clientID = configService.get('MICROSOFT_CLIENT_ID');
    const clientSecret = configService.get('MICROSOFT_CLIENT_SECRET');
    const callbackURL = configService.get('MICROSOFT_CALLBACK_URL');

    if (!clientID || !clientSecret || !callbackURL) {
      console.warn('Microsoft OAuth is not configured. Please set MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET, and MICROSOFT_CALLBACK_URL environment variables.');
    }

    super({
      clientID: clientID || 'dummy',
      clientSecret: clientSecret || 'dummy',
      callbackURL: callbackURL || 'http://localhost:3000/auth/microsoft/callback',
      scope: ['user.read'],
      tenant: 'common', // 'common' allows both personal and work/school accounts
    });
  }

  private decryptUser(user: any) {
    if (!user) return user;
    if (user.phone) user.phone = this.encryptionService.decrypt(user.phone);
    if (user.firstName) user.firstName = this.encryptionService.decrypt(user.firstName);
    if (user.lastName) user.lastName = this.encryptionService.decrypt(user.lastName);
    return user;
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<any> {
    const { id, displayName, emails, name } = profile;

    // Extract email
    const email = emails && emails[0]?.value;
    if (!email) {
      return done(new Error('No email found in Microsoft profile'), null);
    }

    // Extract name
    const firstName = name?.givenName || displayName?.split(' ')[0] || '';
    const lastName = name?.familyName || displayName?.split(' ').slice(1).join(' ') || '';

    // Find user by Microsoft ID first (if exists)
    let user = await this.prisma.user.findFirst({
      where: { microsoftId: id },
    });

    // If not found by Microsoft ID, check by email
    if (!user) {
      user = await this.prisma.user.findUnique({
        where: { email },
      });
    }

    if (user) {
      // Update Microsoft ID if not set (link existing account)
      if (!user.microsoftId) {
        // Verify no other user has this microsoftId (app-level uniqueness check)
        const existingMsUser = await this.prisma.user.findFirst({
          where: { microsoftId: id },
        });
        if (existingMsUser && existingMsUser.id !== user.id) {
          return done(new Error('This Microsoft account is already linked to another user'), null);
        }
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { microsoftId: id },
        });
      }
    } else {
      // Create new user with Microsoft account
      // Default role is AGENT, but can be changed by admin
      user = await this.prisma.user.create({
        data: {
          email,
          microsoftId: id,
          firstName: this.encryptionService.encrypt(firstName),
          lastName: this.encryptionService.encrypt(lastName),
          password: null, // No password for OAuth users
          role: UserRole.AGENT, // Default role
          isActive: true,
        },
      });
    }

    return done(null, this.decryptUser(user));
  }
}

