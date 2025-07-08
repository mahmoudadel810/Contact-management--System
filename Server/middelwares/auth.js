import jwt from "jsonwebtoken";
import userModel from "../DB/models/userModel.js";
import contactModel from "../DB/models/contactModel.js";


//==================================Authentication Middleware======================================

export const protect = async (req, res, next) => {
   try {
      const token = req.headers.authorization?.split(' ')[1]; // Bearer prefix f el env

      if (!token) {
         return res.status(401).json({
            success: false,
            message: "Access denied. No token provided."
         });
      }

      const decoded = jwt.verify(token, process.env.SIGNATURE);
      const user = await userModel.findById(decoded.id).select('-password');

      if (!user) {
         return res.status(401).json({
            success: false,
            message: "Invalid token or Expired"
         });
      }

      req.user = user;
      next();
   } catch (error) {
      return res.status(401).json({
         success: false,
         message: "Invalid token."
      });
   }
};


//==================================Authorization Middleware======================================

export const authorize = (...roles) => {
   return (req, res, next) => {
      if (!req.user) {
         return res.status(401).json({
            success: false,
            message: "Access denied."
         });
      }

      if (!roles.includes(req.user.role)) {
         return res.status(403).json({
            success: false,
            message: "Access denied not authorized"
         });
      }

      next();
   };
};


//==================================Contact Owner Validation======================================

export const isContactOwner = async (req, res, next) => {
   try {
      const contactId = req.params.id;
      const contact = await contactModel.findById(contactId);

      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found."
         });
      }

      // Allow if  admin or contact owner only 
      if (req.user.role === 'admin' || contact.user.toString() === req.user._id.toString()) {
         req.contact = contact;
         return next();
      }

      return res.status(403).json({
         success: false,
         message: "Access denied. You can only access your own contacts."
      });
   } catch (error) {
      return res.status(500).json({
         success: false,
         message: "Error validating contact ownership."
      });
   }
};

