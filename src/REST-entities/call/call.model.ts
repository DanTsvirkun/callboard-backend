import mongoose, { Schema } from "mongoose";
import { ICall } from "../../helpers/typescript-helpers/interfaces";

export const callSchema = new Schema({
  title: { type: String, required: true },
  imageUrls: { type: [String], required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  oldPrice: { type: Number, required: false },
  isOnSale: { type: Boolean, required: true },
  discountPercents: { type: Number, required: false },
  phone: { type: String, required: true },
  userId: { type: mongoose.Types.ObjectId, required: true },
});

export default mongoose.model<ICall>("Call", callSchema);
