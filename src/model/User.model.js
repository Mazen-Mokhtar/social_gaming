import { model, Schema } from "mongoose";
import validator from "validator"
import { messageSystem } from "../utils/messages/index.js";
import CryptoJS from "crypto-js";
import bcrypt from "bcrypt"
import Friend from "./friend.model.js";
const userSchema = new Schema(
    {
        userName:
        {
            type: String,
            minlength: 2,
            maxlnegth: 20,
            required: true
        },
        email:
        {
            type: String,
            unique: true,
            required: true,
            validate:
            {
                validator: validator.isEmail,
                message: messageSystem.errors.email.invalid
            }
        },
        password:
        {
            type: String,
            minlength: 8,
            required: function () {
                return this.provider == "system"
            },
            validate: {
                validator: validator.isStrongPassword,
                message: messageSystem.errors.password.weak
            }
        },
        phone:
        {
            type: String,
            required: function () {
                return this.provider == "system"
            }
        },
        DOB: {
            type: Date,
            required: function () {
                return this.provider == "system"
            }
        },
        gender:
        {
            type: String,
            enum: ["male", "female"],
            required: function () {
                return this.provider == "system"
            }
        },
        role:
        {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        profileImage:
        {
            type: { secure_url: String, public_id: String }
        },
        coverImage:
        {
            type: { secure_url: String, public_id: String }
        },
        confirmEmail:
        {
            type: Boolean,
            default: false
        },
        isOnline: {
            type: Boolean,
            default: false
        },
        verification: {
            type: Boolean,
            default: false
        },
        isDeleted:
        {
            type: Boolean,
            default: false
        },
        deletedAt:
        {
            type: Date
        },
        resetCode: {
            type: String
        },
        resetCodeExpire:
        {
            type: Date
        },
        attempts: { type: Number },
        attemptExpire:
        {
            type: Date
        },
        friends: [{ type: Schema.Types.ObjectId, ref: "User" }],
        viewYourProfile: [{ type: Schema.Types.ObjectId, ref: "User" }],
        blocked: [
            { type: Schema.Types.ObjectId, ref: "User" }
        ],
        provider: { type: String, enum: ["system", "google"], default: "system" }
    }, {
    toJSON: {
        virtuals: true,
        transform: (doc, ret) => {

            if (ret.DOB) { ret.DOB = ret.DOB.toLocaleDateString("en-GB") }
            return ret
        }
    }
})
userSchema.virtual("age").get(function () {
    const today = new Date()
    const userDate = new Date(this.DOB);
    let age = today.getFullYear() - userDate.getFullYear();
    if (today.getMonth() <= userDate.getMonth() && today.getDate() < userDate.getDate()) {
        age--;
    }
    return age
})
userSchema.pre("save", async function (next) {
    if (this.isModified("phone")) {
        this.phone = CryptoJS.AES.encrypt(this.phone, process.env.PHONE)
    }
    if (this.isModified("password")) {
        this.password = await bcrypt.hash(this.password, parseInt(process.env.SALT))
    }
    next();
})
userSchema.pre("remove", async function () {
    await Friend.deleteMany({ senderId: this._id, resverId: this._id })
    next()
})
userSchema.methods.realPhone = function () {
    return CryptoJS.AES.decrypt(this.phone, process.env.PHONE).toString(CryptoJS.enc.Utf8);
}
userSchema.methods.comparePassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

const User = model("User", userSchema);
export default User;