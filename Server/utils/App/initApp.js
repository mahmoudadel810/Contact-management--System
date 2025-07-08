import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import path from "path";
import { errorHandler, notFound } from "../erorrHandler.js";
import connectDB from "../../DB/connection.js";
import * as AllRoutes from "../../modules/indexRoutes.js";



export const initApp = () =>
{
   dotenv.config({ path: path.resolve('./config/.env') });
   
   const app = express();
   const PORT = process.env.PORT || 3000;
   const Base_Url = process.env.BASE_URL || 'http://localhost:3000';
   connectDB();
//====================================================
   app.use(helmet());
   //NOTE - Middelwares
   app.use(cors());
   app.use(express.json());
//====================================================
   //NOTE - Routes
   // app.use(`/${Base_Url}/api/v1/users`, AllRoutes.userRoutes);
   // app.use(`/${Base_Url}/api/v1/contacts`, AllRoutes.contactRoutes);
//====================================================
   //NOTE - Parsing
   app.use(express.json());
   app.use(compression(6));  //9high,slow 0 low,fast 4-6 good
//====================================================
   //check if the server is running
   app.get('/api/v1/health', (req, res) =>
   {
      res.status(200).json({
         success: true,
         message: 'Saknly API is running!',
         timestamp: new Date().toISOString(),
         availableRoutes: [`/${Base_Url}/api/v1/users`, `/${Base_Url}/api/v1/contacts`]
      });
      
      //====================================================
         //NOTE - Error Handling
         app.use(notFound);
         app.use(errorHandler);
   });
//====================================================
   //NOTE - Server
   app.listen(PORT, () =>
   {
      console.log(`Server is running on Port ${PORT} -----====!!!!`);
   });
//====================================================


   return app;
}



























dotenv.config();

const app = express();

app.use(cors());
app.use(helmet());
app.use(express.json());