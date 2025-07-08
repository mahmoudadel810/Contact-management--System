import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
   username: {
      type: String,
      required: true,
      unique: true
   },
   password: {
      type: String,
      required: true
   },
   role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user'
   },
   contacts: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contact'
   }]
});

const userModel = mongoose.model('User', userSchema);

export default userModel;