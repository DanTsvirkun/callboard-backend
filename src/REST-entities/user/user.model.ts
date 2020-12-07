import mongoose, { Schema } from "mongoose";
import { callSchema } from "../call/call.model";
import { IUser } from "../../helpers/typescript-helpers/interfaces";

const userSchema = new Schema({
  email: { type: String, required: true },
  passwordHash: { type: String, required: true },
  calls: { type: [callSchema], required: true },
  favourites: { type: [callSchema], required: true },
  registrationDate: { type: String, required: true },
  originUrl: { type: String, required: false },
});

export default mongoose.model<IUser>("User", userSchema);
