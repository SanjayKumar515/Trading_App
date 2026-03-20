import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import jwt from "jsonwebtoken";


const UserSchema = new mongoose.Schema( {
    email: {
        type: String,
        required: true,
        unique: true,
        match: [ /^[^@]+@[^@]+\.[^@]+$/,
            "Please add a valid email",
        ]

    },
    password: {
        type: String,
    },
    name: {
        type: String,
        maxlength: 50,
        minlength: 3,
    },
    login_pin: {
        type: String,
        maxlength: 4,
        minlength: 4,
    },
    phone_number: {
        type: String,
        match: [ /^[6-9]\d{9}$/, "Please enter a valid phone number" ],
        unique: true,
        sparse: true
    },
    date_of_birth: Date,
    biometricKey: String,

    gender: {
        type: String,
        enum: [ 'male', 'female', 'other' ]
    },
    wrong_pin_attempts: {
        type: Number,
        default: 0,
    },
    blocked_until_password: {
        type: Date,
        default: null,
    },
    balance: {
        type: Number,
        default: 50000,
    },


}, { timestamps: true } );