import {Schema , model} from 'mongoose';

const userSchema = new Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    forgetCode: { type: String},
    isLoggedIn: { type: Boolean, default: false },
}, {
    timestamps: true,
});

const User = model("User", userSchema);
export default User;
