import User from '../../db/models/user.model.js';
import jwt from 'jsonwebtoken';
import sendEmail from '../../utils/sendEmail.js';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';
import e from 'cors';

export const signUp = async (req, res, next) => {
    try {
       // Extract user data from request body
        const { name , email, password } = req.body;

        if(!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        //generate verification token
        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '7d' });

        const isEmailSent = await sendEmail({
            to: email,
            subject: "Verify your account",
            message: `<h1>Welcome ${name}</h1><p>Please verify your account by clicking the link below:</p><a href="http://localhost:${process.env.PORT}/auth/verify?token=${verificationToken}">Verify Account</a>
            <p>If you did not create this account, please ignore this email.</p>
            <p>Refresh Token by clicking the link below:</p><a href="http://localhost:${process.env.PORT}/auth/refresh?token=${refreshToken}">Refresh Token</a>`
        });

        if (!isEmailSent) {
            return res.status(500).json({ message: "Failed to send verification email" });
        }

        // hash the password
        const hashedPassword =  bcrypt.hashSync(password, +process.env.SALT);


        // Create new user
        const newUser = new User({
            name,
            email,
            password: hashedPassword
        });

        await newUser.save();

        res.status(201).json({ message: "User registered successfully. Please verify your email." });
    } catch (error) {
        next(error);
    }
}

export const verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({ message: "Verification token is required" });
        }

        // Verify the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user verification status
        user.isVerified = true;
        user.verificationToken = null; // Clear the token after verification
        await user.save();

        res.status(200).json({ message: "Email verified successfully" });
    } catch (error) {
        next(error);
    }
}

export const refreshToken = async (req, res, next) => {
    const {token} = req.query;

    if (!token) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded) {
        return res.status(401).json({ message: "Invalid token" });
    }

    const user = await User.findOne({ email: decoded.email });

    if (!user) {
        return res.status(404).json({ message: "User not found" });
    }

    if (user.isVerified) {
        return res.status(403).json({ message: "User already verified" });
    }

    // Generate a new access token
    const newAccessToken = jwt.sign({ email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });

    const isEmailSent = await sendEmail({
        to: user.email,
        subject: "New Access Token",
        message: `<h1>Hello ${user.name}</h1><p>Click the link below to get your new access token:</p><a href="http://localhost:${process.env.PORT}/auth/verify?token=${newAccessToken}">Get Access Token</a>`
    });

    if (!isEmailSent) {
        return res.status(500).json({ message: "Failed to send email" });
    }

    res.status(200).json({ message: "New access token sent to your email"});
}

export const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }

        const isPasswordValid = bcrypt.compareSync(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        }

        // Generate JWT token
        const token = jwt.sign({ email: user.email }, process.env.JWT_SECRET_LOGIN, { expiresIn: '1h' });

        // Update user's login status
        user.isLoggedIn = true;
        await user.save();

        res.status(200).json({ message: "Login successful", token });
    } catch (error) {
        next(error);
    }
}

export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Generate forget code
        const forgetCode = nanoid(6);
        // Send email with forget code
        const isEmailSent = await sendEmail({
            to: user.email,
            subject: "Password Reset",
            message: `<h1>Hello ${user.name}</h1><p>Your password forget code is: ${forgetCode}</p>`
        });

        if (!isEmailSent) {
            return res.status(500).json({ message: "Failed to send email" });
        }

        // Update user's forget code
        user.forgetCode = forgetCode;
        await user.save();

        res.status(200).json({ message: "Forget code sent to email" });
    } catch (error) {
        next(error);
    }
}

export const resetPassword = async (req, res, next) => {
    const { email, forgetCode, password } = req.body;

    if (!email || !forgetCode || !password) {
        return res.status(400).json({ message: "Email, forget code, and new password are required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        if (user.forgetCode !== forgetCode) {
            return res.status(400).json({ message: "Invalid forget code" });
        }

        // Hash the new password
        user.password = bcrypt.hashSync(password, +process.env.SALT);
        user.forgetCode = null; // Clear the forget code after reset
        await user.save();

        res.status(200).json({ message: "Password reset successfully" });
    } catch (error) {
        next(error);
    }
}

export const logout = async (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ message: "Email is required" });
    }

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update user's login status
        user.isLoggedIn = false;
        await user.save();

        res.status(200).json({ message: "Logout successful" });
    } catch (error) {
        next(error);
    }
}
