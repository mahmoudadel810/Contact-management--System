import mongoose from "mongoose";


import mongoose from "mongoose";

const contactSchema = new mongoose.Schema({
   name: {
      type: String,
      required: true,
      trim: true
   },
   phone: {
      type: String,
      required: true,
      trim: true
   },
   address: {
      type: String,
      required: true,
      trim: true
   },
   notes: {
      type: String,
      trim: true
   },
   isEditing: {
      type: Boolean,
      default: false
   },
   user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
   }
});

const contactModel = mongoose.model('Contact', contactSchema);

export default contactModel;