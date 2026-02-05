import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from './user.model';
import { IUser } from './user.types';
import { ApiError } from '../../common/utils/ApiError';


export class AuthService {
  private generateTokens(user: IUser) {
    const accessToken = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async register(data: Partial<IUser>) {
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
        throw new ApiError(400, 'Email already in use');
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash!, salt);

    const user = await User.create({
        ...data,
        passwordHash,
    });

    
    const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationToken = verificationToken;
    user.verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await user.save();

    try {
        const { sendVerificationEmail } = await import('../../modules/notification/notification.queue');
        await sendVerificationEmail(user.email, user.name, verificationToken);
    } catch (error) {
        await User.deleteOne({ _id: user._id });
        throw new ApiError(500, 'Failed to send verification email. Please try again.');
    }

    return { user };
  }

  async login(email: string, password: string) {
    const user = await User.findOne({ email });
    if (!user) {
        throw new ApiError(401, 'Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
        throw new ApiError(401, 'Invalid credentials');
    }

    if (!user.isVerified) {
        throw new ApiError(403, 'Please verify your email to log in');
    }

    const tokens = this.generateTokens(user);
    
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    return { user, tokens };
  }

  async refreshToken(token: string) {
    try {
        const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
        const user = await User.findById(decoded.userId);

        if (!user || !user.refreshTokens.includes(token)) {
            throw new ApiError(401, 'Invalid refresh token');
        }

        // Remove old refresh token
        user.refreshTokens = user.refreshTokens.filter(t => t !== token);
        
        const tokens = this.generateTokens(user);
        user.refreshTokens.push(tokens.refreshToken);
        await user.save();

        return { user, tokens };
    } catch (error) {
        throw new ApiError(401, 'Invalid refresh token');
    }
  }

  async verifyEmail(email: string, token: string) {
    const user = await User.findOne({
        email,
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired verification code');
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiry = undefined;
    
    // Issue tokens immediately after verification
    const tokens = this.generateTokens(user);
    user.refreshTokens.push(tokens.refreshToken);
    await user.save();

    try {
        const { sendWelcomeEmail } = await import('../../modules/notification/notification.queue');
        await sendWelcomeEmail(user.email, user.name);
    } catch (e) {
        console.error('Failed to queue welcome email', e);
    }

    return { user, tokens };
  }

  async logout(userId: string, token: string) {
     if (userId && token) {
         await User.updateOne({ _id: userId }, { $pull: { refreshTokens: token } });
     }
  }
}

export const authService = new AuthService();
