import mongoose, { Schema } from "mongoose";
import { ISession } from "../../helpers/typescript-helpers/interfaces";

const sessionSchema = new Schema({
  uid: { type: mongoose.Types.ObjectId, required: true },
});

export default mongoose.model<ISession>("Session", sessionSchema);
