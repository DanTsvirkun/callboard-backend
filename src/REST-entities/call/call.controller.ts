import { Request, Response } from "express";
import { ICall, IUser } from "../../helpers/typescript-helpers/interfaces";
import { uploadImage } from "../../helpers/function-helpers/multer-config";
import CallModel from "./call.model";
import UserModel from "../user/user.model";

export const postCall = async (req: Request, res: Response) => {
  const user = req.user;
  const callObj: ICall = req.body;
  const callImages = req.files;
  if (req.fileValidationError) {
    return res.status(415).send({ message: req.fileValidationError });
  }
  if (req.files.length > 5) {
    return res
      .status(400)
      .send({ message: "Only 5 and less images are allowed" });
  }
  if (!req.files.length) {
    return res.status(400).send({ message: "No image provided" });
  }
  const imageUrls: string[] = [];
  for (const image of callImages as Express.Multer.File[]) {
    const imageUrl = await uploadImage(image);
    imageUrls.push(imageUrl as string);
  }
  const call = await CallModel.create({
    ...callObj,
    imageUrls,
    price: Number(callObj.price),
    isOnSale: false,
    userId: (user as IUser)._id,
  });
  (user as IUser).calls.push(call);
  (user as IUser).save();
  return res.status(201).send({
    ...callObj,
    imageUrls,
    price: Number(callObj.price),
    isOnSale: false,
    userId: (user as IUser)._id,
    id: call._id,
  });
};

export const addToFavourites = async (req: Request, res: Response) => {
  const user = req.user;
  const { callId } = req.params;
  const callToAdd = await CallModel.findById(callId);
  if (!callToAdd) {
    return res.status(404).send({ message: "Call not found" });
  }
  if (
    (user as IUser).favourites.find((call) => call._id.toString() === callId)
  ) {
    return res.status(403).send({ message: "Already in favourites" });
  }
  (user as IUser).favourites.push(callToAdd);
  await (user as IUser).save();
  return res.status(200).send({ newFavourites: (user as IUser).favourites });
};

export const removeFromFavourites = async (req: Request, res: Response) => {
  const user = req.user;
  const { callId } = req.params;
  const callToRemove = await CallModel.findById(callId);
  if (!callToRemove) {
    return res.status(404).send({ message: "Call not found" });
  }
  if (
    !(user as IUser).favourites.find((call) => call._id.toString() === callId)
  ) {
    return res.status(403).send({ message: "Not in favourites" });
  }
  const updatedUser = await UserModel.findByIdAndUpdate(
    (req.user as IUser)._id,
    {
      $pull: { favourites: { _id: callId } },
    },
    { new: true }
  );
  console.log((updatedUser as IUser).favourites);
  return res
    .status(200)
    .send({ newFavourites: (updatedUser as IUser).favourites });
};
