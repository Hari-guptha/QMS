import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-microsoft';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../../users/entities/user.entity';

@Injectable()
export class MicrosoftStrategy extends PassportStrategy(Strategy, 'microsoft') {
  constructor(
    private configService: ConfigService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
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

    // Find user by Microsoft ID or email
    let user = await this.userRepository.findOne({
      where: [{ microsoftId: id }, { email }],
    });

    if (user) {
      // Update Microsoft ID if not set
      if (!user.microsoftId) {
        user.microsoftId = id;
        await this.userRepository.save(user);
      }
    } else {
      // Create new user with Microsoft account
      // Default role is AGENT, but can be changed by admin
      user = this.userRepository.create({
        email,
        microsoftId: id,
        firstName,
        lastName,
        password: null, // No password for OAuth users
        role: UserRole.AGENT, // Default role
        isActive: true,
      });
      user = await this.userRepository.save(user);
    }

    return done(null, user);
  }
}

