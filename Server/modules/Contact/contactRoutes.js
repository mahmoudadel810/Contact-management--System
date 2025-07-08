import { Router } from "express";
import * as contactController from "./contactController.js";
import { 
   createContactValidator, 
   updateContactValidator, 
   contactIdValidator,
   contactQueryValidator 
} from "./contactValidations.js";
import { validation } from "../../middelwares/validation.js";
import { protect, authorize, isContactOwner } from "../../middelwares/auth.js";

const router = Router();


// .use all protected
router.use(protect);

// Get all contacts 
router.get('/getContacts', 
   validation({ query: contactQueryValidator }), 
   contactController.getAllContacts
);

// Create new contact 
router.post('/addContact', 
   validation({ body: createContactValidator }), 
   contactController.createContact
);

// Get single contact 
router.get('/getContact/:id', 
   validation({ params: contactIdValidator }), 
   contactController.getContactById
);

// Update contact 
router.put('/updateContact/:id', 
   validation({ params: contactIdValidator, body: updateContactValidator }), 
   isContactOwner,
   contactController.updateContact
);

// Delete contact - Owner or Admin only
router.delete('/deleteContact/:id', 
   validation({ params: contactIdValidator }), 
   isContactOwner,
   contactController.deleteContact
);

//realtime edit socket

// Lock contact for editing 
router.post('/lockContact/:id', 
   validation({ params: contactIdValidator }), 
   isContactOwner,
   contactController.lockContact
);

// Unlock 
router.post('/unlockContact/:id', 
   validation({ params: contactIdValidator }), 
   isContactOwner,
   contactController.unlockContact
);

export default router; 