import userModel from "../../DB/models/userModel.js";
import bcrypt from "bcryptjs";
import { tokenFunction } from "../../utils/tokenFunction.js";
import { errorHandler } from "../../utils/erorrHandler.js";
import { hashFunction, compareFunction } from "../../utils/hashFunction.js";




export const hardcodedUsers = async (req, res, next) =>
{
   try {
      const users = [
         { userName: 'user1', password: 'user1', role: 'admin' },  
         { userName: 'user2', password: 'user2', role: 'user' }   
      ];

      for (let user of users)
      {
         const hashedPassword = hashFunction({ payload: user.password, saltRounds: +process.env.SALT_ROUNDS });
         user.password = hashedPassword; 
      }
   
      await userModel.insertMany(users);
      res.status(201).json({
         success: true,
         message: "Users Added successfully",
         data: {
            admin: "user1/user1",
            user: "user2/user2"
         }
      });
   }
   catch (error)
   {
      errorHandler(error, req, res, next);
   }
}




//==================================Login======================================

export const login = async (req, res, next) => {
   const { userName, password } = req.body;

   if (!userName || !password) {
      return res.status(400).json({ success: false, message: "Please provide username and password" });
   }
   try {
      const user = await userModel.findOne({ userName }).select('+password');

      if (!user) {
         return res.status(401).json({ success: false, message: "Invalid Informations" });
      }
      const isMatch = compareFunction({ payload: password, referenceData: user.password });
      if (!isMatch) {
         return res.status(401).json({ success: false, message: "Invalid Informations" });
      }

      const token = tokenFunction({ payload: { id: user._id, role: user.role }, expiresIn: process.env.JWT_EXPIRES_IN });

      return res.status(200).json({
         success: true,
         message: "Login successful",
         token
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
}