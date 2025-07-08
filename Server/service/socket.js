import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import userModel from "../DB/models/userModel.js";
import contactModel from "../DB/models/contactModel.js";


//==================================Socket Authentication Middleware======================================

const socketAuth = async (socket, next) => {
   try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
         return next(new Error("Authentication error: No token provided"));
      }

      const decoded = jwt.verify(token, process.env.SIGNATURE);
      const user = await userModel.findById(decoded.id).select('-password');

      if (!user) {
         return next(new Error("Authentication error: User not found"));
      }

      socket.user = user;
      next();
   } catch (error) {
      next(new Error("Authentication error: Invalid token"));
   }
};


//==================================Socket Service======================================

export const initializeSocket = (server) => {
   const io = new Server(server, {
      cors: {
         origin: "*", // Configure properly for production
         methods: ["GET", "POST"]
      }
   });

   // Apply authentication middleware
   io.use(socketAuth);

   //==================================Connection Handler======================================
   
   io.on('connection', (socket) => {
      console.log(`User ${socket.user.userName} (${socket.user.role}) connected with socket ID: ${socket.id}`);

      // Join user to their own room for targeted messaging
      socket.join(`user_${socket.user._id}`);
      
      // Send connection confirmation
      socket.emit('connected', {
         message: 'Successfully connected to real-time service',
         user: {
            id: socket.user._id,
            userName: socket.user.userName,
            role: socket.user.role
         }
      });

      //==================================Lock Contact Event======================================
      
      socket.on('lock_contact', async (data) => {
         try {
            const { contactId } = data;

            // Verify contact exists and user has permission
            const contact = await contactModel.findById(contactId);
            if (!contact) {
               socket.emit('error', { message: 'Contact not found' });
               return;
            }

            // Check if user can edit 
            if (socket.user.role !== 'admin' && contact.user.toString() !== socket.user._id.toString()) {
               socket.emit('error', { message: 'Access denied' });
               return;
            }

            // Check if already locked by another user
            if (contact.isEditing) {
               socket.emit('lock_failed', { 
                  contactId, 
                  message: 'Contact is already being edited by another user' 
               });
               return;
            }

            // Lock the contact
            await contactModel.findByIdAndUpdate(contactId, { isEditing: true });

            // Notify all users about the lock
            io.emit('contact_locked', {
               contactId,
               lockedBy: {
                  id: socket.user._id,
                  userName: socket.user.userName
               },
               timestamp: new Date()
            });

            // Confirm to the user who requested the lock
            socket.emit('lock_success', { contactId });

         } catch (error) {
            console.error('Error locking contact:', error);
            socket.emit('error', { message: 'Failed to lock contact' });
         }
      });

      //==================================Unlock Contact Event======================================
      
      socket.on('unlock_contact', async (data) => {
         try {
            const { contactId } = data;

            // Verify contact exists
            const contact = await contactModel.findById(contactId);
            if (!contact) {
               socket.emit('error', { message: 'Contact not found' });
               return;
            }

            // Check if user can unlock this contact
            if (socket.user.role !== 'admin' && contact.user.toString() !== socket.user._id.toString()) {
               socket.emit('error', { message: 'Access denied' });
               return;
            }

            // Unlock the contact
            await contactModel.findByIdAndUpdate(contactId, { isEditing: false });

            // Notify all users about the unlock
            io.emit('contact_unlocked', {
               contactId,
               unlockedBy: {
                  id: socket.user._id,
                  userName: socket.user.userName
               },
               timestamp: new Date()
            });

            // Confirm to the user who requested the unlock
            socket.emit('unlock_success', { contactId });

         } catch (error) {
            console.error('Error unlocking contact:', error);
            socket.emit('error', { message: 'Failed to unlock contact' });
         }
      });

      //==================================Get Contact Status Event======================================
      
      socket.on('get_contact_status', async (data) => {
         try {
            const { contactId } = data;

            const contact = await contactModel.findById(contactId).select('isEditing');
            if (!contact) {
               socket.emit('error', { message: 'Contact not found' });
               return;
            }

            socket.emit('contact_status', {
               contactId,
               isEditing: contact.isEditing
            });

         } catch (error) {
            console.error('Error getting contact status:', error);
            socket.emit('error', { message: 'Failed to get contact status' });
         }
      });

      //==================================Disconnect Handler======================================
      
      socket.on('disconnect', async () => {
         try {
            console.log(`User ${socket.user.userName} disconnected`);

            // Unlock any contacts that were being edited by this user
            await contactModel.updateMany(
               { user: socket.user._id, isEditing: true },
               { isEditing: false }
            );

            // Notify other users about unlocked contacts
            const unlockedContacts = await contactModel.find(
               { user: socket.user._id }
            ).select('_id');

            unlockedContacts.forEach(contact => {
               io.emit('contact_unlocked', {
                  contactId: contact._id,
                  unlockedBy: {
                     id: socket.user._id,
                     userName: socket.user.userName
                  },
                  reason: 'User disconnected ',
                  timestamp: new Date()
               });
            });

         } catch (error) {
            console.error('Error handling disconnect:', error);
         }
      });

   });

   return io;
};
