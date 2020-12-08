import { Request, Response } from "express";
import { IUser } from "../../helpers/typescript-helpers/interfaces";

export const getAllInfo = (req: Request, res: Response) => {
  const user = req.user;
  res.status(200).send({
    email: (user as IUser).email,
    registrationDate: (user as IUser).registrationDate,
    id: (user as IUser)._id,
    calls: (user as IUser).calls,
    favourites: (user as IUser).favourites,
  });
};
