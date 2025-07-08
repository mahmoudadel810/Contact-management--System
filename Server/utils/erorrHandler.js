import jwt from "jsonwebtoken";
import userModel from "../models/userModel.js";
import contactModel from "../models/contactModel.js";


export const errorHandler = (err, req, res, next) => {
    const statusCode = res.statusCode ? res.statusCode : 500;
    res.status(statusCode);
    res.json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? null : err.stack,
    });
};

