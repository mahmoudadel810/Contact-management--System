import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import path from "path";
import { createServer } from "http";
import { errorHandler, notFound } from "../erorrHandler.js";
import connectDB from "../../DB/connection.js";
import * as AllRoutes from "../../modules/indexRoutes.js";
import { initializeSocket } from "../../service/socket.js";

export const initApp = () => {
  
   dotenv.config({ path: path.resolve('./config/.env'), debug: false, safe: true }); //won't run if not found

   
   connectDB();

   // Create Express app
   const app = express();
   const PORT = process.env.PORT || 3000;

   // 
   app.use(helmet());
   app.use(cors());
   app.use(express.json());
   app.use(compression({ level: 6 })); // 9=high,slow 0=low,fast 4-6=good

   // Main Routes 
   app.use(`/api/v1/users`, AllRoutes.userRoutes);
   app.use(`/api/v1/contacts`, AllRoutes.contactRoutes);

   //  HTTP server for Socket.io 
   const server = createServer(app); //ill return

   // Initialize Socket 
   const io = initializeSocket(server); //dont forget to return
   
   // Make Socket.io instance available to controllers
   app.locals.io = io;

   // check server
   app.get('/', (req, res) => {
      res.status(200).json({
         success: true,
         message: 'contact API is running!',
         timestamp: new Date().toISOString()
      });
   });
 

   // Health Check
   app.get('/api/v1/health', (req, res) => {
      res.status(200).json({
         success: true,
         message: 'Server is running and healthy!',
         timestamp: new Date().toISOString(),
         port: PORT,
         database: process.env.MONGO_URI.split('/').pop(),
         availableRoutes: [`/api/v1/users`, `/api/v1/contacts`],
         socket: {
            connectedUsers: io.engine.clientsCount || 0,
            totalRooms: Object.keys(io.sockets.adapter.rooms).length
         }
      });
   });

   // Error Handling 
   app.use(notFound);
   app.use(errorHandler);

   // Start server with Socket
   server.listen(PORT, () => {
      console.log(`Server is running on Port ${PORT} -----====!!!!`);
      console.log(`Socket.io is running and Ready , connected users now:  ${io.engine.clientsCount}`);
      
   });

   return { app, server, io };
};

