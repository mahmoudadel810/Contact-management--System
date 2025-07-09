import contactModel from "../../DB/models/contactModel.js";
import userModel from "../../DB/models/userModel.js";
import { errorHandler } from "../../utils/erorrHandler.js";
import { paginationHelper, buildSearchQuery, buildPaginationResponse } from "../../utils/pagination.js";


//==================================Create Contact======================================

export const createContact = async (req, res, next) => {
   try {
      const { name, phone, address, notes } = req.body;
      const userId = req.user._id;

      
      const newContact = new contactModel({
         name,
         phone,
         address,
         notes,
         user: userId
      });

      const savedContact = await newContact.save();

      
      await userModel.findByIdAndUpdate(userId, {
         $push: { contacts: savedContact._id }
      });

      res.status(201).json({
         success: true,
         message: "Contact created successfully",
         data: savedContact
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Get All Contacts======================================

export const getAllContacts = async (req, res, next) => {
   try {
      const { page = 1, limit = 5, search = "", sortBy = "createdAt", sortOrder = "desc" } = req.query;

      // Build search query 
      const searchQuery = buildSearchQuery({
         search,
         searchFields: ["name", "phone", "address"],
         user: req.user
      });

      
      const totalCount = await contactModel.countDocuments(searchQuery);

      const pagination = paginationHelper({
         page,
         limit,
         totalCount,
         search
      });

      // Build sort object
      const sortObject = {};
      sortObject[sortBy] = sortOrder === 'desc' ? -1 : 1;

      //quert 3shan 
      const contacts = await contactModel.find(searchQuery)
         .populate('user', 'userName role')
         .sort(sortObject)
         .skip(pagination.skip)
         .limit(pagination.limit)
         .lean();

      const response = buildPaginationResponse({
         data: contacts,
         pagination,
         message: `${totalCount} contacts found`
      });

      res.status(200).json(response);
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Get Single Contact======================================

export const getContactById = async (req, res, next) => {
   try {
      const contactId = req.params.id;
      const contact = await contactModel.findById(contactId).populate('user', 'userName role');

      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found"
         });
      }

      // Check if user can access
      if (req.user.role !== 'admin' && contact.user._id.toString() !== req.user._id.toString()) {
         return res.status(403).json({
            success: false,
            message: "Access denied. You can only access your own contacts."
         });
      }

      res.status(200).json({
         success: true,
         message: "Contact retrieved successfully",
         data: contact
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Update Contact======================================

export const updateContact = async (req, res, next) => {
   try {
      const contactId = req.params.id;
      const updates = req.body;

      // Check if contact exists and get its current state
      const contact = await contactModel.findById(contactId);
      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found. It may have been deleted while you were editing."
         });
      }

      // Check if contact is locked by another user
      if (contact.isEditing && contact.user.toString() !== req.user._id.toString()) {
         return res.status(423).json({
            success: false,
            message: "Contact is currently being edited by another user"
         });
      }

      const updatedContact = await contactModel.findByIdAndUpdate(
         contactId,
         { ...updates, isEditing: false },
         { new: true, runValidators: true }
      ).populate('user', 'userName role');

      // Double-check that update was successful
      if (!updatedContact) {
         return res.status(404).json({
            success: false,
            message: "Contact was deleted while you were editing. Your changes could not be saved."
         });
      }

      res.status(200).json({
         success: true,
         message: "Contact updated successfully",
         data: updatedContact
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Delete Contact======================================

export const deleteContact = async (req, res, next) => {
   try {
      const contactId = req.params.id;

      // First find the contact to check if it's locked
      const contact = await contactModel.findById(contactId);

      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found"
         });
      }

      // CRITICAL: Prevent deletion of locked contacts
      if (contact.isEditing) {
         return res.status(423).json({
            success: false,
            message: "Cannot delete contact: Contact is currently being edited by another user. Please wait for the editing session to finish."
         });
      }

      // Proceed with deletion
      const deletedContact = await contactModel.findByIdAndDelete(contactId);

      // Remove contact from user's contacts array
      await userModel.findByIdAndUpdate(deletedContact.user, {
         $pull: { contacts: contactId }
      });

      // Notify all connected users about the deletion via Socket.io
      // We'll import the socket instance if available
      if (req.app && req.app.locals.io) {
         req.app.locals.io.emit('contact_deleted', {
            contactId,
            deletedBy: {
               id: req.user._id,
               userName: req.user.userName
            },
            timestamp: new Date()
         });
      }

      res.status(200).json({
         success: true,
         message: "Contact deleted successfully"
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Lock Contact for Editing======================================

export const lockContact = async (req, res, next) => {
   try {
      const contactId = req.params.id;

      const contact = await contactModel.findByIdAndUpdate(
         contactId,
         { isEditing: true },
         { new: true }
      );

      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found"
         });
      }

      res.status(200).json({
         success: true,
         message: "Contact locked for editing",
         data: { contactId, isEditing: true }
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
};


//==================================Unlock Contact======================================

export const unlockContact = async (req, res, next) => {
   try {
      const contactId = req.params.id;

      const contact = await contactModel.findByIdAndUpdate(
         contactId,
         { isEditing: false },
         { new: true }
      );

      if (!contact) {
         return res.status(404).json({
            success: false,
            message: "Contact not found"
         });
      }

      res.status(200).json({
         success: true,
         message: "Contact unlocked",
         data: { contactId, isEditing: false }
      });
   } catch (error) {
      errorHandler(error, req, res, next);
   }
}; 